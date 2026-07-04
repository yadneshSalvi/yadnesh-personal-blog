"""Part 13: /chat gains an optional per-request budget, and that is the
whole HTTP diff of the capstone. The structured summary rides the
complete event (no new endpoint needed: the wire IS the integration
surface), and the eval suite lives in evals/, outside the server
entirely. Everything else is Part 9's machinery, untouched."""

import asyncio
import mimetypes
import shutil
import uuid
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Literal

from claude_agent_sdk import (
    fork_session,
    get_session_info,
    rename_session,
)
from fastapi import FastAPI, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field

from app import eventlog, hub
from app.approvals import answer, resolve
from app.events import sse
from app.runner import cancel_request, start_request
from app.sessions import conversations, history
from app.workspaces import (
    create_workspace,
    safe_filename,
    workspace_path,
)

SAMPLE_DATA = Path("sample_data")
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # a CSV bigger than this deserves a database

RESTART_APOLOGY = (
    "The server restarted while this run was in flight. Everything up to "
    "the last logged event was replayed; the rest is gone."
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await eventlog.init()
    yield
    await eventlog.close()


app = FastAPI(lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    workspace_id: str | None = None
    session_id: str | None = None  # the memory switch: absent = fresh start
    mode: Literal["ask", "plan"] = "ask"  # plan = propose before touching anything
    thinking: bool = False  # extended thinking: a visible, billed scratchpad
    # Part 13: the prepaid meter, per request. None = unmetered. gt=0
    # because a zero budget is a run that can't start, which is Stop.
    budget_usd: float | None = Field(default=None, gt=0, le=5.0)


class RenameRequest(BaseModel):
    title: str


class DecisionRequest(BaseModel):
    decision: Literal["allow", "deny"]
    always: bool = False  # "don't ask again for this tool" (this conversation)


class AnswersRequest(BaseModel):
    # Keyed by the question text, valued by the chosen label(s), exactly
    # the shape AskUserQuestion wants back in its updated_input.
    answers: dict[str, str | list[str]]


@app.post("/workspaces")
async def new_workspace() -> dict:
    return {"workspace_id": create_workspace()}


@app.post("/workspaces/{workspace_id}/files")
async def upload_file(workspace_id: str, file: UploadFile) -> dict:
    workspace = workspace_path(workspace_id)
    name = safe_filename(file.filename or "")
    data = await file.read()
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File too large; the cap is 5 MB.")
    (workspace / name).write_bytes(data)
    return {"filename": name, "size": len(data)}


@app.post("/workspaces/{workspace_id}/sample-data")
async def load_sample_data(workspace_id: str) -> dict:
    workspace = workspace_path(workspace_id)
    names = sorted(p.name for p in SAMPLE_DATA.glob("*.csv"))
    for name in names:
        shutil.copyfile(SAMPLE_DATA / name, workspace / name)
    return {"filenames": names}


@app.get("/workspaces/{workspace_id}/files/{file_path:path}")
async def serve_file(workspace_id: str, file_path: str) -> FileResponse:
    workspace = workspace_path(workspace_id)
    target = (workspace / file_path).resolve()
    # The traversal guard again, GET-shaped: whatever the URL says, the
    # resolved file must still live inside this conversation's workspace.
    if not (target.is_relative_to(workspace.resolve()) and target.is_file()):
        raise HTTPException(status_code=404, detail="No such file.")
    media_type, _ = mimetypes.guess_type(target.name)
    return FileResponse(target, media_type=media_type or "application/octet-stream")


@app.get("/conversations")
async def list_conversations() -> dict:
    return {"conversations": conversations()}


@app.get("/conversations/{workspace_id}/{session_id}")
async def get_conversation(workspace_id: str, session_id: str) -> dict:
    try:
        return history(workspace_id, session_id)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Unknown conversation.")


@app.patch("/conversations/{workspace_id}/{session_id}")
async def rename_conversation(workspace_id: str, session_id: str, request: RenameRequest) -> dict:
    workspace = workspace_path(workspace_id)
    rename_session(session_id, request.title, directory=str(workspace))
    return {"title": request.title}


@app.post("/conversations/{workspace_id}/{session_id}/fork")
async def fork_conversation(workspace_id: str, session_id: str) -> dict:
    """Branch the analysis: a NEW session that inherits the whole history,
    while the original stays untouched. No model call, no cost; the SDK
    copies the diary and hands back a fresh id. The desk is shared."""
    workspace = workspace_path(workspace_id)
    info = get_session_info(session_id, directory=str(workspace))
    base = (info and (info.custom_title or info.first_prompt)) or "Analysis"
    result = fork_session(session_id, directory=str(workspace), title=f"{base} (branch)")
    return {"session_id": result.session_id, "workspace_id": workspace_id}


@app.post("/approvals/{approval_id}/decision")
async def decide(approval_id: str, request: DecisionRequest) -> dict:
    """The human's half of the bridge: resolve the Future a gate() is
    parked on. 404 means the card is stale (decided, timed out, or the
    run it belonged to is over)."""
    if not resolve(approval_id, request.decision, request.always):
        raise HTTPException(status_code=404, detail="No such pending approval.")
    return {"approval_id": approval_id, "decision": request.decision}


@app.post("/questions/{question_id}/answers")
async def answer_question(question_id: str, request: AnswersRequest) -> dict:
    """The human's half of the question bridge: same Future pattern as
    approvals, friendlier cargo. 404 means the question expired (answered,
    timed out, or its run is over)."""
    if not answer(question_id, request.answers):
        raise HTTPException(status_code=404, detail="No such pending question.")
    return {"question_id": question_id}


@app.post("/chat")
async def chat(request: ChatRequest) -> dict:
    """Start a run. Note what this does NOT return: a stream. The agent's
    lifetime now belongs to the worker; this response is a claim ticket."""
    workspace_id = request.workspace_id or create_workspace()
    workspace = workspace_path(workspace_id)
    request_id = uuid.uuid4().hex
    start_request(
        request_id, workspace, workspace_id, request.session_id,
        request.message, request.mode, request.thinking, request.budget_usd,
    )
    return {
        "request_id": request_id,
        "workspace_id": workspace_id,
        "stream_url": f"/stream/{request_id}",
    }


@app.post("/chat/{request_id}/cancel")
async def cancel(request_id: str) -> dict:
    """The real Stop button: interrupt the worker's client. The turn ends
    with a receipt in the log, not a severed pipe."""
    if not await cancel_request(request_id):
        raise HTTPException(status_code=404, detail="No such running request.")
    return {"request_id": request_id, "status": "stopping"}


@app.get("/stream/{request_id}")
async def stream(request_id: str, request: Request) -> StreamingResponse:
    """The dumb pipe: replay-then-follow. It knows nothing about agents;
    it reads a log and drains a queue. Open it twice, close it, reopen
    it mid-run: the worker never notices."""
    # A reconnecting browser sends the last SSE id it saw; replay resumes
    # from there instead of repeating the whole run.
    last_id = request.headers.get("last-event-id", "")
    after = int(last_id.rsplit(":", 1)[-1]) if ":" in last_id else 0

    async def frames():
        queue = hub.subscribe(request_id)  # subscribe FIRST, replay second:
        try:                               # no gap for an event to fall through
            last = after
            replayed = await eventlog.replay(request_id, after)
            for seq, event in replayed:
                last = seq
                yield sse(event, event_id=f"{request_id}:{seq}")
            if not hub.is_live(request_id):
                # The whole story is already in the log. If it never got
                # its ending (server restart mid-run), say so honestly.
                if not replayed and after == 0:
                    yield sse({"type": "error", "message": "Unknown request id."})
                elif not any(e["type"] in ("complete", "error") for _, e in replayed):
                    yield sse({"type": "error", "message": RESTART_APOLOGY})
                return
            while True:
                try:
                    item = await asyncio.wait_for(queue.get(), timeout=10)
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"  # Part 7's trick, same job:
                    continue                 # fail fast on a dead socket
                if item is None:
                    return  # the worker hung up the hub; the log has the rest
                seq, event = item
                if seq <= last:
                    continue  # already replayed; at-least-once, deduped by seq
                last = seq
                yield sse(event, event_id=f"{request_id}:{seq}")
        finally:
            hub.unsubscribe(request_id, queue)

    return StreamingResponse(frames(), media_type="text/event-stream")

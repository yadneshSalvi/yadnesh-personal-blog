"""Part 7: approvals. The scissors come off: bypassPermissions is gone,
risky tool calls pause on a human Approve/Deny click, and the denial goes
back into the loop as information."""

import asyncio
import mimetypes
import shutil
from pathlib import Path
from typing import Literal

from claude_agent_sdk import (
    ClaudeAgentOptions,
    ClaudeSDKClient,
    fork_session,
    get_session_info,
    rename_session,
)
from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

from app.approvals import ApprovalBridge, resolve
from app.events import sse, translate
from app.tools import beanline_server
from app.sessions import conversations, history
from app.workspaces import (
    create_workspace,
    safe_filename,
    with_artifacts,
    workspace_path,
)

MODEL = "claude-haiku-4-5"
SAMPLE_DATA = Path("sample_data")
MAX_UPLOAD_BYTES = 5 * 1024 * 1024  # a CSV bigger than this deserves a database

# The house rules, appended to the claude_code preset: keep Claude Code's
# battle-tested tool instructions, add only what makes this product OURS.
ANALYST_PROMPT = """You are the Beanline data analyst. House rules for every answer:

- When a chart would help, create it with matplotlib and save it as a PNG file
  in the working directory (plt.savefig(..., dpi=150), never plt.show()).
- Write your findings to report.md: a one-line headline, the key numbers as a
  markdown table, then a short interpretation. Create or overwrite it each turn.
- Keep the chat reply brief: the main numbers and the files you produced.
  Prefer tables over prose for numbers.
- Company-wide numbers live in the Beanline database: use the query_database
  tool for them. Files on your desk are user uploads, not the source of truth.
- Every number you state must come from a query result or script output.
  Never do arithmetic in your head, not even totals."""


def build_options(workspace: Path, session_id: str | None, gate) -> ClaudeAgentOptions:
    """Part 7: bypassPermissions is GONE. Reads and the read-only database
    tools are auto-approved by name; everything else (Bash, Write) routes
    through the gate, which is a human with two buttons."""
    return ClaudeAgentOptions(
        cwd=str(workspace),
        tools=["Read", "Glob", "Grep", "Bash", "Write"],
        mcp_servers={"beanline": beanline_server},
        allowed_tools=[
            "Read", "Glob", "Grep",
            "mcp__beanline__query_database", "mcp__beanline__get_schema",
        ],
        can_use_tool=gate,
        model=MODEL,
        include_partial_messages=True,
        system_prompt={"type": "preset", "preset": "claude_code", "append": ANALYST_PROMPT},
        resume=session_id,
    )


app = FastAPI()
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


class RenameRequest(BaseModel):
    title: str


class DecisionRequest(BaseModel):
    decision: Literal["allow", "deny"]
    always: bool = False  # "don't ask again for this tool" (this conversation)


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
    stream it belonged to is gone)."""
    if not resolve(approval_id, request.decision, request.always):
        raise HTTPException(status_code=404, detail="No such pending approval.")
    return {"approval_id": approval_id, "decision": request.decision}


@app.post("/chat")
async def chat(request: ChatRequest) -> StreamingResponse:
    workspace_id = request.workspace_id or create_workspace()
    workspace = workspace_path(workspace_id)

    # One outbound queue per request. The agent worker fills it with
    # translated events; the approval gate injects its cards into the same
    # queue; frames() drains it. Two producers, one belt.
    queue: asyncio.Queue = asyncio.Queue()
    bridge = ApprovalBridge(workspace_id, queue)
    client = ClaudeSDKClient(
        options=build_options(workspace, request.session_id, bridge.gate)
    )

    async def run_agent() -> None:
        try:
            await client.connect()
            await client.query(request.message)
            stream = with_artifacts(translate(client.receive_response()), workspace)
            async for event in stream:
                await queue.put(event)
        except Exception as exc:  # noqa: BLE001 - failures become wire events
            await queue.put({"type": "error", "message": str(exc)})
        finally:
            await client.disconnect()
            await queue.put(None)  # end of turn

    async def frames():
        worker = asyncio.create_task(run_agent())
        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=10)
                except asyncio.TimeoutError:
                    # A parked agent writes nothing, and a silent stream is
                    # how a dead client goes unnoticed: this server only
                    # learns the browser is gone when a write fails. The
                    # keepalive is a comment frame (SSE parsers skip it)
                    # whose real job is to fail early on a closed socket.
                    yield ": keepalive\n\n"
                    continue
                if event is None:
                    break
                if event["type"] == "session_start":
                    event = {**event, "workspace_id": workspace_id}
                yield sse(event)
        finally:
            # Client hung up (or the turn ended): a pending card would park
            # the agent forever, so every unresolved Future becomes a deny.
            bridge.deny_all()
            if not worker.done():
                worker.cancel()

    return StreamingResponse(frames(), media_type="text/event-stream")

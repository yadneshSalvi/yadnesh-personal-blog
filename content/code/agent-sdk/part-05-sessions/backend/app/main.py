"""Part 5: sessions. The analyst remembers, conversations get a sidebar,
and any analysis can be branched. All of it from the SDK's own diary."""

import mimetypes
import shutil
from pathlib import Path

from claude_agent_sdk import (
    ClaudeAgentOptions,
    fork_session,
    get_session_info,
    query,
    rename_session,
)
from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

from app.events import sse, translate
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
  Prefer tables over prose for numbers."""


def build_options(workspace: Path, session_id: str | None) -> ClaudeAgentOptions:
    """Part 4's options plus one line: resume. Hand the SDK a session id
    and the new turn starts with the whole diary already in its head."""
    return ClaudeAgentOptions(
        cwd=str(workspace),
        tools=["Read", "Glob", "Grep", "Bash", "Write"],
        permission_mode="bypassPermissions",
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


@app.post("/chat")
async def chat(request: ChatRequest) -> StreamingResponse:
    workspace_id = request.workspace_id or create_workspace()
    workspace = workspace_path(workspace_id)
    stream = query(prompt=request.message, options=build_options(workspace, request.session_id))
    events = with_artifacts(translate(stream), workspace)

    async def frames():
        async for event in events:
            if event["type"] == "session_start":
                event = {**event, "workspace_id": workspace_id}
            yield sse(event)

    return StreamingResponse(frames(), media_type="text/event-stream")

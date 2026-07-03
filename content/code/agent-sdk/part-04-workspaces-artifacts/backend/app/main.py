"""Part 4: workspaces and artifacts. Every conversation gets its own desk,
you bring your own files, and the analyst hands back deliverables."""

import mimetypes
import shutil
from pathlib import Path

from claude_agent_sdk import ClaudeAgentOptions, query
from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

from app.events import sse, translate
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


def build_options(workspace: Path) -> ClaudeAgentOptions:
    """Part 1's options, now built per request: the cwd is the conversation's
    own desk, and the system prompt gives the agent its job description."""
    return ClaudeAgentOptions(
        cwd=str(workspace),
        tools=["Read", "Glob", "Grep", "Bash", "Write"],
        permission_mode="bypassPermissions",
        model=MODEL,
        include_partial_messages=True,
        system_prompt={"type": "preset", "preset": "claude_code", "append": ANALYST_PROMPT},
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


@app.post("/chat")
async def chat(request: ChatRequest) -> StreamingResponse:
    workspace_id = request.workspace_id or create_workspace()
    workspace = workspace_path(workspace_id)
    stream = query(prompt=request.message, options=build_options(workspace))
    events = with_artifacts(translate(stream), workspace)

    async def frames():
        async for event in events:
            if event["type"] == "session_start":
                event = {**event, "workspace_id": workspace_id}
            yield sse(event)

    return StreamingResponse(frames(), media_type="text/event-stream")

"""Part 2: the analyst behind HTTP, narrating its work as server-sent events."""

from claude_agent_sdk import ClaudeAgentOptions, query
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.events import translate

MODEL = "claude-haiku-4-5"

OPTIONS = ClaudeAgentOptions(
    cwd="workspace",
    tools=["Read", "Glob", "Grep", "Bash", "Write"],
    permission_mode="bypassPermissions",
    model=MODEL,
    include_partial_messages=True,
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


@app.post("/chat")
async def chat(request: ChatRequest) -> StreamingResponse:
    stream = query(prompt=request.message, options=OPTIONS)
    return StreamingResponse(translate(stream), media_type="text/event-stream")

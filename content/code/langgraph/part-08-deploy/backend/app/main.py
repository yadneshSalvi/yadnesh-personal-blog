import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from app.graph import graph

app = FastAPI()

FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", FRONTEND_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str
    thread_id: str


class ChatResponse(BaseModel):
    reply: str


@app.get("/")
def health_check():
    return {"status": "ok"}


import json
from fastapi.responses import StreamingResponse


def sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


async def token_stream(message: str, thread_id: str):
    inputs = {"messages": [HumanMessage(content=message)]}
    config = {"configurable": {"thread_id": thread_id}}
    async for event in graph.astream_events(inputs, config, version="v2"):
        kind = event["event"]
        if kind == "on_chat_model_stream":
            token = event["data"]["chunk"].content
            if token:
                yield sse({"type": "token", "content": token})
        elif kind == "on_tool_start":
            yield sse({
                "type": "tool_start",
                "name": event["name"],
                "args": event["data"]["input"],
            })
        elif kind == "on_tool_end":
            result = event["data"]["output"].content
            yield sse({
                "type": "tool_end",
                "name": event["name"],
                "result": result,
            })
    yield sse({"type": "done"})


@app.post("/chat")
async def chat(request: ChatRequest):
    return StreamingResponse(
        token_stream(request.message, request.thread_id),
        media_type="text/event-stream",
    )


class StoredMessage(BaseModel):
    role: str
    content: str


@app.get("/threads/{thread_id}/messages")
async def thread_messages(thread_id: str) -> list[StoredMessage]:
    config = {"configurable": {"thread_id": thread_id}}
    snapshot = await graph.aget_state(config)
    messages = snapshot.values.get("messages", [])
    return [
        StoredMessage(role="user" if m.type == "human" else "assistant", content=m.content)
        for m in messages
        if m.type in ("human", "ai") and m.content
    ]

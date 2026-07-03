from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_core.messages import HumanMessage
from app.graph import graph

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    reply: str


@app.get("/")
def health_check():
    return {"status": "ok"}


import json
from fastapi.responses import StreamingResponse


def sse(payload: dict) -> str:
    return f"data: {json.dumps(payload)}\n\n"


async def token_stream(message: str):
    inputs = {"messages": [HumanMessage(content=message)]}
    async for event in graph.astream_events(inputs, version="v2"):
        if event["event"] == "on_chat_model_stream":
            token = event["data"]["chunk"].content
            if token:
                yield sse({"type": "token", "content": token})
    yield sse({"type": "done"})


@app.post("/chat")
async def chat(request: ChatRequest):
    return StreamingResponse(
        token_stream(request.message),
        media_type="text/event-stream",
    )

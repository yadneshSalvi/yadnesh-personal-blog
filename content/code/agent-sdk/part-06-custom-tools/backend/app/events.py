"""The SSE event vocabulary: defined once in Part 2, only ever extended.

Every event on the wire is one JSON object with a "type" field, framed as
a server-sent event (`data: {...}\n\n`). The translator maps the SDK's
message stream onto that vocabulary.

New in Part 4: translate() yields the event dicts themselves, and sse()
framing moved to the edge of the server. The server grew its own consumers
of events (the artifact watcher enriches the stream before it ships), and
they'd rather not parse JSON they themselves produced.

New in Part 6: flatten() unwraps MCP content blocks, because custom tool
results arrive as [{"type": "text", ...}] lists, not plain strings.
"""

import json
from collections.abc import AsyncIterator

from claude_agent_sdk import (
    AssistantMessage,
    Message,
    ResultMessage,
    StreamEvent,
    SystemMessage,
    ToolResultBlock,
    ToolUseBlock,
    UserMessage,
)

# A tool can return an enormous payload (Read on a 2,000-line file). The
# wire narrates the work; it doesn't haul the data. Clip what we forward.
MAX_TOOL_RESULT_CHARS = 2_000


def sse(event: dict) -> str:
    """Frame one event dict as a server-sent event."""
    return f"data: {json.dumps(event)}\n\n"


def flatten(content: object) -> object:
    """Custom (MCP) tool results arrive as a list of content blocks, e.g.
    [{"type": "text", "text": "..."}]. Unwrap the text so badges read like
    output instead of JSON. Built-in tools pass through untouched."""
    if isinstance(content, list):
        texts = [
            block["text"]
            for block in content
            if isinstance(block, dict) and block.get("type") == "text"
        ]
        if texts:
            return "\n".join(texts)
    return content


def clip(content: object) -> str:
    text = content if isinstance(content, str) else json.dumps(content, default=str)
    if len(text) <= MAX_TOOL_RESULT_CHARS:
        return text
    return text[:MAX_TOOL_RESULT_CHARS] + f"\n… clipped {len(text) - MAX_TOOL_RESULT_CHARS} chars"


async def translate(messages: AsyncIterator[Message]) -> AsyncIterator[dict]:
    """Map SDK messages onto the wire vocabulary, one event dict at a time."""
    try:
        async for message in messages:
            if isinstance(message, SystemMessage) and message.subtype == "init":
                yield {"type": "session_start", "session_id": message.data["session_id"]}

            elif isinstance(message, StreamEvent):
                delta = message.event.get("delta", {})
                if delta.get("type") == "text_delta":
                    yield {"type": "text_delta", "text": delta["text"]}

            elif isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, ToolUseBlock):
                        yield {
                            "type": "tool_use_start",
                            "tool_id": block.id,
                            "tool_name": block.name,
                            "tool_input": block.input,
                        }

            elif isinstance(message, UserMessage) and isinstance(message.content, list):
                for block in message.content:
                    if isinstance(block, ToolResultBlock):
                        yield {
                            "type": "tool_result",
                            "tool_id": block.tool_use_id,
                            "content": clip(flatten(block.content)),
                            "is_error": bool(block.is_error),
                        }

            elif isinstance(message, ResultMessage):
                yield {
                    "type": "complete",
                    "usage": message.usage,
                    "total_cost_usd": message.total_cost_usd,
                    "duration_ms": message.duration_ms,
                }
    except Exception as exc:  # noqa: BLE001 - anything broken becomes a wire event
        yield {"type": "error", "message": str(exc)}

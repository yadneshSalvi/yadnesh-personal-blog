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

New in Part 9: sse() can stamp a frame with an SSE `id:` field. The JSON
vocabulary itself needed zero changes to become durable; the sequence
number rides the envelope, not the parcel.

New in Part 10: thinking_delta joins the belt (the translator skipped
thinking since Part 2; today it stops skipping), and two tool names get
NO badge events at all: AskUserQuestion and ExitPlanMode are represented
by richer parcels the gate emits (question_request, plan_proposed), so
their raw tool_use/tool_result pairs would render as noise under the
cards that already tell the story.

New in Part 11: tool_use_start can carry parent_tool_id, the id of the
delegation call whose subagent made it. Not a new event type: one
optional field, and old clients that ignore it keep working.
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

# Tool calls whose story is told by a gate-emitted card instead of a badge.
CARD_BACKED_TOOLS = {"AskUserQuestion", "ExitPlanMode"}


def sse(event: dict, event_id: str | None = None) -> str:
    """Frame one event dict as a server-sent event. The optional id is
    SSE's own bookmark field: browsers remember the last one they saw
    and send it back as Last-Event-ID when they reconnect."""
    head = f"id: {event_id}\n" if event_id else ""
    return head + f"data: {json.dumps(event)}\n\n"


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
    hidden: set[str] = set()  # ids of card-backed calls; hide their results too
    try:
        async for message in messages:
            if isinstance(message, SystemMessage) and message.subtype == "init":
                yield {"type": "session_start", "session_id": message.data["session_id"]}

            elif isinstance(message, StreamEvent):
                delta = message.event.get("delta", {})
                if delta.get("type") == "text_delta":
                    yield {"type": "text_delta", "text": delta["text"]}
                # Part 10: the scratchpad streams too. Note the field name:
                # a thinking delta carries its text in delta["thinking"].
                elif delta.get("type") == "thinking_delta":
                    yield {"type": "thinking_delta", "text": delta["thinking"]}

            elif isinstance(message, AssistantMessage):
                for block in message.content:
                    if isinstance(block, ToolUseBlock):
                        if block.name in CARD_BACKED_TOOLS:
                            hidden.add(block.id)  # the gate already emitted the card
                            continue
                        event = {
                            "type": "tool_use_start",
                            "tool_id": block.id,
                            "tool_name": block.name,
                            "tool_input": block.input,
                        }
                        # Part 11: a subagent's messages carry the id of the
                        # delegation call that spawned them. Forward it and
                        # the UI can nest the colleague's work under it.
                        if message.parent_tool_use_id:
                            event["parent_tool_id"] = message.parent_tool_use_id
                        yield event

            elif isinstance(message, UserMessage) and isinstance(message.content, list):
                for block in message.content:
                    if isinstance(block, ToolResultBlock):
                        if block.tool_use_id in hidden:
                            continue
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

"""Part 9: the worker. Running the agent and watching the agent, decoupled.

Until now the agent lived inside one HTTP response: whoever POSTed
/chat held the only pipe, and when that pipe died, so did everything
downstream of it. Now the agent runs in a background task that talks to
the log and the hub, and NOBODY holds a pipe to it. The kitchen keeps
cooking even if the waiter changes shifts.

This file also inherits build_options() and the house prompt from
main.py: the worker owns the client, so it owns the client's options.
main.py is HTTP surface now, nothing else.
"""

import asyncio
from dataclasses import dataclass
from pathlib import Path

from claude_agent_sdk import ClaudeAgentOptions, ClaudeSDKClient

from app import eventlog, hub
from app.approvals import ApprovalBridge
from app.events import translate
from app.guardrails import build_hooks
from app.tools import beanline_server
from app.workspaces import with_artifacts

MODEL = "claude-haiku-4-5"

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
    return ClaudeAgentOptions(
        cwd=str(workspace),
        tools=["Read", "Glob", "Grep", "Bash", "Write"],
        mcp_servers={"beanline": beanline_server},
        allowed_tools=[
            "Read", "Glob", "Grep",
            "mcp__beanline__query_database", "mcp__beanline__get_schema",
        ],
        can_use_tool=gate,
        hooks=build_hooks(workspace.name, workspace),
        model=MODEL,
        include_partial_messages=True,
        system_prompt={"type": "preset", "preset": "claude_code", "append": ANALYST_PROMPT},
        resume=session_id,
    )


@dataclass
class RunningRequest:
    """One live run: the task doing the work, the client that can
    interrupt it, and the bridge holding its unanswered cards."""
    task: asyncio.Task
    client: ClaudeSDKClient
    bridge: ApprovalBridge


# Every run currently in flight. This dict is ALSO doing invisible,
# load-bearing work: asyncio holds only weak references to tasks, so a
# create_task() result nobody stores can be garbage-collected mid-run.
# Keeping the task here is what keeps it alive.
RUNNING: dict[str, RunningRequest] = {}


def start_request(
    request_id: str,
    workspace: Path,
    workspace_id: str,
    session_id: str | None,
    message: str,
) -> None:
    """Spawn the worker for one run and return immediately."""
    seq = 0

    async def emit(event: dict) -> None:
        """The single sink for this run. Log first (the truth), then
        broadcast (the courtesy). Every event gets the next seq."""
        nonlocal seq
        seq += 1
        await eventlog.append(request_id, seq, event)
        hub.publish(request_id, seq, event)

    bridge = ApprovalBridge(workspace_id, emit)
    client = ClaudeSDKClient(
        options=build_options(workspace, session_id, bridge.gate)
    )

    async def run() -> None:
        try:
            await client.connect()
            await client.query(message)
            stream = with_artifacts(translate(client.receive_response()), workspace)
            async for event in stream:
                if event["type"] == "session_start":
                    event = {**event, "workspace_id": workspace_id}
                await emit(event)
        except Exception as exc:  # noqa: BLE001 - failures become logged events
            await emit({"type": "error", "message": str(exc)})
        finally:
            bridge.deny_all()  # a card nobody can answer anymore is a deny
            try:
                await client.disconnect()
            finally:
                hub.close_request(request_id)
                RUNNING.pop(request_id, None)

    hub.open_request(request_id)
    RUNNING[request_id] = RunningRequest(
        task=asyncio.create_task(run()), client=client, bridge=bridge
    )


async def cancel_request(request_id: str) -> bool:
    """The real Stop button. interrupt() tells the SDK to abandon the
    turn; the stream then ends with a normal ResultMessage, so even a
    stopped turn gets a receipt in the log. False = nothing to stop."""
    running = RUNNING.get(request_id)
    if running is None:
        return False
    running.bridge.deny_all()  # unpark the agent if it's waiting on a card
    await running.client.interrupt()
    return True

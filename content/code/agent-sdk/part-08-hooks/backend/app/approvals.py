"""Part 7: the approval bridge. A gated tool call parks on an asyncio.Future
and the agent genuinely pauses; a human's POST resolves the Future and the
callback returns the verdict to the SDK. An event goes out, a Future waits."""

import asyncio
import uuid

from claude_agent_sdk import (
    PermissionResultAllow,
    PermissionResultDeny,
    ToolPermissionContext,
)

APPROVAL_TIMEOUT_SECONDS = 120

DENIED_MESSAGE = (
    "The user denied this tool call. Do not retry the same call; adjust "
    "your approach, or explain what you would need it for."
)
TIMEOUT_MESSAGE = (
    "Nobody answered the approval request in time. Stop this line of work "
    "and summarize what you were doing and why."
)

# Every unresolved card in the whole app, keyed by approval_id. The decision
# endpoint resolves Futures it finds here; each Future belongs to exactly
# one paused can_use_tool callback somewhere up the stack.
PENDING: dict[str, asyncio.Future] = {}

# "Approve and don't ask again": tool names the human has waved through,
# per workspace. The desk is the conversation, so forks share this too.
ALWAYS_ALLOWED: dict[str, set[str]] = {}


class ApprovalBridge:
    """Per-request glue between the SDK's permission callback and the wire.

    The gate() method is handed to ClaudeAgentOptions as can_use_tool. It
    emits approval events into this request's outbound queue and blocks on
    a Future until POST /approvals/{id}/decision (or a timeout, or stream
    teardown) resolves it.
    """

    def __init__(self, workspace_id: str, queue: asyncio.Queue) -> None:
        self.workspace_id = workspace_id
        self.queue = queue
        self.issued: set[str] = set()

    async def gate(
        self, tool_name: str, tool_input: dict, ctx: ToolPermissionContext
    ) -> PermissionResultAllow | PermissionResultDeny:
        if tool_name in ALWAYS_ALLOWED.get(self.workspace_id, set()):
            return PermissionResultAllow()

        approval_id = uuid.uuid4().hex
        future: asyncio.Future = asyncio.get_running_loop().create_future()
        PENDING[approval_id] = future
        self.issued.add(approval_id)
        await self.queue.put({
            "type": "approval_request",
            "approval_id": approval_id,
            "tool_id": ctx.tool_use_id,  # matches the badge's tool_use_start
            "tool_name": tool_name,
            "tool_input": tool_input,
        })

        reason = "user"
        try:
            decision, always = await asyncio.wait_for(
                future, timeout=APPROVAL_TIMEOUT_SECONDS
            )
        except asyncio.TimeoutError:
            decision, always, reason = "deny", False, "timeout"
        finally:
            PENDING.pop(approval_id, None)
            self.issued.discard(approval_id)

        if decision == "allow" and always:
            ALWAYS_ALLOWED.setdefault(self.workspace_id, set()).add(tool_name)
        await self.queue.put({
            "type": "approval_resolved",
            "approval_id": approval_id,
            "decision": decision,
            "reason": reason,
        })
        if decision == "allow":
            return PermissionResultAllow()
        return PermissionResultDeny(
            message=TIMEOUT_MESSAGE if reason == "timeout" else DENIED_MESSAGE
        )

    def deny_all(self) -> None:
        """Stream teardown: a Future nobody can resolve anymore would park
        the agent forever. Deny everything this request still has open."""
        for approval_id in list(self.issued):
            future = PENDING.get(approval_id)
            if future is not None and not future.done():
                future.set_result(("deny", False))


def resolve(approval_id: str, decision: str, always: bool) -> bool:
    """Resolve a pending approval from the HTTP side. False if it's gone
    (already decided, timed out, or the stream died)."""
    future = PENDING.get(approval_id)
    if future is None or future.done():
        return False
    future.set_result((decision, always))
    return True

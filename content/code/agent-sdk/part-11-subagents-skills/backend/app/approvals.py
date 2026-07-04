"""Part 7: the approval bridge. A gated tool call parks on an asyncio.Future
and the agent genuinely pauses; a human's POST resolves the Future and the
callback returns the verdict to the SDK. An event goes out, a Future waits.

Part 9 made the bridge emit through the worker's sink, so its events land
in the durable log like everything else.

Part 10 teaches the same gate two new tool names. AskUserQuestion parks on
a Future exactly like an approval (the pattern pays rent a second time);
the answers ride back to the model through updated_input. ExitPlanMode
doesn't park at all: the gate captures the plan, tells the model to stop,
and lets the human decide in their own time, as a later turn."""

import asyncio
import uuid

from claude_agent_sdk import (
    PermissionResultAllow,
    PermissionResultDeny,
    ToolPermissionContext,
)

APPROVAL_TIMEOUT_SECONDS = 120
QUESTION_TIMEOUT_SECONDS = 300  # a question invites reading; give it room

DENIED_MESSAGE = (
    "The user denied this tool call. Do not retry the same call; adjust "
    "your approach, or explain what you would need it for."
)
TIMEOUT_MESSAGE = (
    "Nobody answered the approval request in time. Stop this line of work "
    "and summarize what you were doing and why."
)
UNANSWERED_MESSAGE = (
    "Nobody answered your question in time. Stop and summarize what you "
    "wanted to ask and why the answer matters; do not guess."
)
PLAN_CAPTURED_MESSAGE = (
    "The client captured your proposed plan and will show it to the user. "
    "Stop here; do not start implementing. The user will respond in a "
    "later message."
)

# Every unresolved card in the whole app, keyed by approval_id. The decision
# endpoint resolves Futures it finds here; each Future belongs to exactly
# one paused can_use_tool callback somewhere up the stack.
PENDING: dict[str, asyncio.Future] = {}

# Same contract for unanswered questions, keyed by question_id. Two dicts,
# not one: a decision endpoint that can accidentally answer a question (or
# vice versa) is a bug you'd meet in production.
PENDING_QUESTIONS: dict[str, asyncio.Future] = {}

# "Approve and don't ask again": tool names the human has waved through,
# per workspace. The desk is the conversation, so forks share this too.
ALWAYS_ALLOWED: dict[str, set[str]] = {}


class ApprovalBridge:
    """Per-request glue between the SDK's permission callback and the wire.

    The gate() method is handed to ClaudeAgentOptions as can_use_tool. It
    emits approval events through the worker's sink (log + broadcast) and
    blocks on a Future until POST /approvals/{id}/decision (or a timeout,
    or the run being cancelled) resolves it.
    """

    def __init__(self, workspace_id: str, emit) -> None:
        self.workspace_id = workspace_id
        self.emit = emit
        self.issued: set[str] = set()
        self.open_questions: set[str] = set()

    async def gate(
        self, tool_name: str, tool_input: dict, ctx: ToolPermissionContext
    ) -> PermissionResultAllow | PermissionResultDeny:
        # Part 10: two built-ins get their own protocols instead of a card.
        if tool_name == "AskUserQuestion":
            return await self.ask_user(tool_input, ctx)
        if tool_name == "ExitPlanMode":
            return await self.capture_plan(tool_input)

        if tool_name in ALWAYS_ALLOWED.get(self.workspace_id, set()):
            return PermissionResultAllow()

        approval_id = uuid.uuid4().hex
        future: asyncio.Future = asyncio.get_running_loop().create_future()
        PENDING[approval_id] = future
        self.issued.add(approval_id)
        await self.emit({
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
        await self.emit({
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

    async def ask_user(
        self, tool_input: dict, ctx: ToolPermissionContext
    ) -> PermissionResultAllow | PermissionResultDeny:
        """The Part 7 bridge, reused verbatim for a friendlier cargo: the
        agent asked a structured question, so park it on a Future until
        the human picks their chips. The answers return to the model via
        updated_input; the CLI formats them into the tool result itself."""
        question_id = uuid.uuid4().hex
        future: asyncio.Future = asyncio.get_running_loop().create_future()
        PENDING_QUESTIONS[question_id] = future
        self.open_questions.add(question_id)
        await self.emit({
            "type": "question_request",
            "question_id": question_id,
            "tool_id": ctx.tool_use_id,
            "questions": tool_input.get("questions", []),
        })

        reason = "user"
        try:
            answers = await asyncio.wait_for(
                future, timeout=QUESTION_TIMEOUT_SECONDS
            )
        except asyncio.TimeoutError:
            answers, reason = None, "timeout"
        finally:
            PENDING_QUESTIONS.pop(question_id, None)
            self.open_questions.discard(question_id)

        await self.emit({
            "type": "question_resolved",
            "question_id": question_id,
            "answers": answers,
            "reason": reason,
        })
        if answers is None:
            return PermissionResultDeny(message=UNANSWERED_MESSAGE)
        return PermissionResultAllow(
            updated_input={**tool_input, "answers": answers}
        )

    async def capture_plan(self, tool_input: dict) -> PermissionResultDeny:
        """Plan mode's exit ramp. The plan arrives as the tool call's own
        input; emit it as a first-class event, then DENY the tool with a
        message that reads like a receipt. No Future here: implementing
        is a decision for a later turn, not a paused one."""
        await self.emit({
            "type": "plan_proposed",
            "plan_id": uuid.uuid4().hex,
            "markdown": tool_input.get("plan", ""),
        })
        return PermissionResultDeny(message=PLAN_CAPTURED_MESSAGE, interrupt=False)

    def deny_all(self) -> None:
        """Cancellation or worker teardown: a Future nobody can resolve
        anymore would park the agent forever. Deny everything this run
        still has open, unanswered questions included."""
        for approval_id in list(self.issued):
            future = PENDING.get(approval_id)
            if future is not None and not future.done():
                future.set_result(("deny", False))
        for question_id in list(self.open_questions):
            future = PENDING_QUESTIONS.get(question_id)
            if future is not None and not future.done():
                future.set_result(None)  # "no answer" is the honest verdict


def resolve(approval_id: str, decision: str, always: bool) -> bool:
    """Resolve a pending approval from the HTTP side. False if it's gone
    (already decided, timed out, or the stream died)."""
    future = PENDING.get(approval_id)
    if future is None or future.done():
        return False
    future.set_result((decision, always))
    return True


def answer(question_id: str, answers: dict) -> bool:
    """Resolve a pending question with the human's picks. Same contract
    as resolve(): False means the question is gone."""
    future = PENDING_QUESTIONS.get(question_id)
    if future is None or future.done():
        return False
    future.set_result(answers)
    return True

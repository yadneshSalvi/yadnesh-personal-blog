"""Part 8: hooks. The layer that sees every tool call, deterministically.

Part 7's approvals decide about the risky calls and are blind to everything
auto-approved. Hooks run before all of that and after all of it: a PreToolUse
tripwire blocks rm with no human awake, PostToolUse/PostToolUseFailure write
the audit log, and UserPromptSubmit injects desk facts into every prompt.

One verified gotcha shapes this file: a call denied by a PreToolUse hook
never runs, so PostToolUse and PostToolUseFailure never fire for it. The
tripwire files its own incident report.
"""

import json
from datetime import datetime, timezone
from pathlib import Path

from claude_agent_sdk import HookContext, HookMatcher

# One append-only file for the whole server: every conversation, every tool
# call, one JSON line each. The file is the feature.
AUDIT_LOG = Path("audit.jsonl")

# Long tool results would bloat the log; the audit narrates, it doesn't haul.
MAX_AUDIT_CHARS = 400

BLOCKED_RM_REASON = (
    "Blocked by policy: rm is never allowed in this workspace. If something "
    "needs to go, move it into a .trash/ folder and say so in your reply."
)


def audit(workspace_id: str, outcome: str, tool: str | None,
          tool_use_id: str | None, detail: dict) -> None:
    """Append one fact to the audit log. outcome: ok | failed | blocked."""
    record = {
        "ts": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "workspace_id": workspace_id,
        "outcome": outcome,
        "tool": tool,
        "tool_use_id": tool_use_id,
        **detail,
    }
    with AUDIT_LOG.open("a") as f:
        f.write(json.dumps(record, default=str) + "\n")


def snip(value: object) -> str:
    text = value if isinstance(value, str) else json.dumps(value, default=str)
    return text[:MAX_AUDIT_CHARS]


def build_hooks(workspace_id: str, workspace: Path) -> dict:
    """The hook registrations for one request. Note the matchers: the
    tripwire watches Bash only; the audit pair match everything."""

    async def block_rm(input_data: dict, tool_use_id: str | None,
                       context: HookContext) -> dict:
        # Word-level match, not startswith: the model likes compound
        # commands ("echo done && rm sales.csv"), verified live.
        command = input_data.get("tool_input", {}).get("command", "")
        if "rm" not in command.split():
            return {}
        audit(workspace_id, "blocked", input_data.get("tool_name"),
              tool_use_id, {"input": {"command": command}})
        return {
            "hookSpecificOutput": {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": BLOCKED_RM_REASON,
            }
        }

    async def record_success(input_data: dict, tool_use_id: str | None,
                             context: HookContext) -> dict:
        audit(workspace_id, "ok", input_data.get("tool_name"), tool_use_id,
              {"input": input_data.get("tool_input"),
               "result": snip(input_data.get("tool_response"))})
        return {}

    async def record_failure(input_data: dict, tool_use_id: str | None,
                             context: HookContext) -> dict:
        audit(workspace_id, "failed", input_data.get("tool_name"), tool_use_id,
              {"input": input_data.get("tool_input"),
               "error": snip(input_data.get("error"))})
        return {}

    async def inject_desk_facts(input_data: dict, tool_use_id: str | None,
                                context: HookContext) -> dict:
        files = sorted(p.name for p in workspace.iterdir() if p.is_file())
        today = datetime.now().strftime("%A, %B %d, %Y")
        listing = ", ".join(files[:20]) if files else "none yet"
        return {
            "hookSpecificOutput": {
                "hookEventName": "UserPromptSubmit",
                "additionalContext": (
                    f"Desk facts from the server: today is {today}. "
                    f"Files in the working directory: {listing}."
                ),
            }
        }

    return {
        "PreToolUse": [HookMatcher(matcher="Bash", hooks=[block_rm])],
        "PostToolUse": [HookMatcher(hooks=[record_success])],
        "PostToolUseFailure": [HookMatcher(hooks=[record_failure])],
        "UserPromptSubmit": [HookMatcher(hooks=[inject_desk_facts])],
    }

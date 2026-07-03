"""Part 5: the diary the SDK has kept since Part 1, finally read.

The SDK writes every conversation to a JSONL file, sharded by working
directory. Since Part 4 gave each conversation its own workspace as cwd,
each workspace folder has its own shard. So the sidebar is a walk over
OUR workspaces, asking the SDK about each one. No database, no index
file: the workspaces folder and the SDK's own session store are the
only sources of truth.
"""

from claude_agent_sdk import get_session_messages, list_sessions

from app.workspaces import WORKSPACES_ROOT, artifact_kind, snapshot, workspace_path


def conversations() -> list[dict]:
    """Every conversation on this server, newest first.

    NEVER call list_sessions() without directory= here: unscoped, it
    returns every session on the machine, including the developer's own
    Claude Code history. The workspaces folder is our scope.
    """
    rows = []
    if not WORKSPACES_ROOT.is_dir():
        return rows
    for ws in WORKSPACES_ROOT.iterdir():
        if not ws.is_dir():
            continue
        for s in list_sessions(directory=str(ws)):
            # first_prompt, not summary: the summary drifts to whatever the
            # LATEST turn was about, so two-turn chats kept renaming
            # themselves mid-conversation. The first question is the
            # stable name (until the user renames it).
            rows.append({
                "session_id": s.session_id,
                "workspace_id": ws.name,
                "title": s.custom_title or s.first_prompt or "Untitled analysis",
                "last_modified": s.last_modified,  # epoch milliseconds
            })
    rows.sort(key=lambda r: r["last_modified"], reverse=True)
    return rows


def _text_of(block: dict) -> str | None:
    return block.get("text") if block.get("type") == "text" else None


def history(workspace_id: str, session_id: str) -> dict:
    """One conversation replayed into the UI's block model, plus the desk.

    The diary stores raw API messages; the UI wants ChatMessage turns.
    Same three rules as the client's applyEvent, run over the past:
    text extends the turn, tool_use opens a block, tool_result completes
    it by id. Thinking blocks are skipped until Part 10 renders them.
    """
    workspace = workspace_path(workspace_id)
    messages: list[dict] = []
    turn: dict | None = None  # the open assistant turn

    def close_turn():
        nonlocal turn
        if turn and turn["blocks"]:
            messages.append(turn)
        turn = None

    for m in get_session_messages(session_id, directory=str(workspace)):
        content = m.message.get("content")
        if m.type == "user":
            if isinstance(content, str):
                close_turn()
                messages.append({"role": "user", "text": content})
                continue
            for block in content or []:
                if block.get("type") == "tool_result" and turn:
                    for b in turn["blocks"]:
                        if b.get("id") == block.get("tool_use_id"):
                            raw = block.get("content")
                            b["result"] = raw if isinstance(raw, str) else ""
                            b["isError"] = bool(block.get("is_error"))
                            b["done"] = True
                elif _text_of(block) is not None:
                    close_turn()
                    messages.append({"role": "user", "text": block["text"]})
        elif m.type == "assistant":
            turn = turn or {"role": "assistant", "blocks": [], "status": "done"}
            for block in content or []:
                if _text_of(block) is not None:
                    turn["blocks"].append({"type": "text", "text": block["text"]})
                elif block.get("type") == "tool_use":
                    turn["blocks"].append({
                        "type": "tool_use", "id": block["id"], "name": block["name"],
                        "input": block.get("input", {}), "done": False,
                    })
    close_turn()

    files = [
        {"path": path, "kind": artifact_kind(path), "size": stamp[1]}
        for path, stamp in sorted(snapshot(workspace).items())
    ]
    return {"messages": messages, "files": files}

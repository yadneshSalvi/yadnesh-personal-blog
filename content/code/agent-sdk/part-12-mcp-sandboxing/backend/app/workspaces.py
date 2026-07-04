"""Part 4: per-conversation workspaces, and the artifacts that appear on them.

A workspace is the agent's desk for one conversation: a folder under
workspaces/ named by a server-generated id. Nothing about its name or its
path ever comes from the client.
"""

import mimetypes
import shutil
import uuid
from collections.abc import AsyncIterator
from pathlib import Path

from fastapi import HTTPException

WORKSPACES_ROOT = Path("workspaces")

# Part 11: the skills every desk starts with. The folder ships with the
# backend; create_workspace() copies it to where the SDK looks for
# project skills: <cwd>/.claude/skills/<name>/SKILL.md.
SKILLS_SOURCE = Path("skills")


def create_workspace() -> str:
    """Mint a new desk. The id is the server's choice, never the client's.

    Part 11: every new desk gets the house skills installed under
    .claude/skills/. The workspace is the agent's project directory, so
    project-scoped discovery (setting_sources=["project"]) finds them.
    """
    workspace_id = uuid.uuid4().hex
    workspace = WORKSPACES_ROOT / workspace_id
    workspace.mkdir(parents=True)
    if SKILLS_SOURCE.is_dir():
        shutil.copytree(SKILLS_SOURCE, workspace / ".claude" / "skills")
    return workspace_id


def workspace_path(workspace_id: str) -> Path:
    """Resolve an id to its folder, refusing anything that isn't one of ours."""
    path = WORKSPACES_ROOT / workspace_id
    if not (len(workspace_id) == 32 and workspace_id.isalnum() and path.is_dir()):
        raise HTTPException(status_code=404, detail="Unknown workspace.")
    return path


def safe_filename(raw: str) -> str:
    """Refuse anything that isn't a plain filename.

    The attack this blocks is one line long: an upload named
    "../../app/main.py" would land outside the workspace and overwrite
    this very server. Never trust a client-supplied path.
    """
    if not raw or "/" in raw or "\\" in raw or raw in {".", ".."} or raw.startswith("."):
        raise HTTPException(status_code=400, detail=f"Rejected filename: {raw!r}")
    return raw


def artifact_kind(name: str) -> str:
    """A coarse label the UI can render on: image, markdown, or file."""
    mime, _ = mimetypes.guess_type(name)
    if mime and mime.startswith("image/"):
        return "image"
    if name.endswith(".md"):
        return "markdown"
    return "file"


def snapshot(workspace: Path) -> dict[str, tuple[int, int]]:
    """Every file on the desk right now: path -> (mtime_ns, size).

    Part 11 nuance: skip anything under a dotted directory too, or the
    SKILL.md we install under .claude/ would show up in the artifacts
    panel as if the agent had produced it.
    """
    return {
        str(p.relative_to(workspace)): (p.stat().st_mtime_ns, p.stat().st_size)
        for p in workspace.rglob("*")
        if p.is_file()
        and not any(part.startswith(".") for part in p.relative_to(workspace).parts)
    }


async def with_artifacts(
    events: AsyncIterator[dict], workspace: Path
) -> AsyncIterator[dict]:
    """Watch the desk while the turn runs.

    After every tool result (and once more before the receipt), any file
    that is new or changed since the last look becomes an artifact_update
    event. We diff the filesystem instead of asking the model what it made:
    the disk doesn't forget, exaggerate, or hallucinate filenames.
    """
    seen = snapshot(workspace)

    def changed() -> list[dict]:
        nonlocal seen
        current = snapshot(workspace)
        updates = [
            {"type": "artifact_update", "path": path, "kind": artifact_kind(path), "size": stamp[1]}
            for path, stamp in sorted(current.items())
            if seen.get(path) != stamp
        ]
        seen = current
        return updates

    async for event in events:
        if event["type"] == "complete":
            for update in changed():
                yield update
        yield event
        if event["type"] == "tool_result":
            for update in changed():
                yield update

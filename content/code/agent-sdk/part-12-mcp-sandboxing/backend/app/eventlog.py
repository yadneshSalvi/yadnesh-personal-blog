"""Part 9: the flight recorder. Every event of every run, on disk.

One SQLite table, written through aiosqlite so appends never block the
event loop. This is the ONLY thing SQLite does in this series: sessions
stay SDK-native (Part 5's rule). The log answers one question the wire
never could: "what has this run said so far?", which is all a stream
needs to become survivable.
"""

import json
from pathlib import Path

import aiosqlite

DB_PATH = Path("events.db")

# The one migration, by hand. seq restarts at 1 for every request, so
# (request_id, seq) is the natural primary key, and "replay from where I
# left off" is a WHERE clause.
SCHEMA = """
CREATE TABLE IF NOT EXISTS events (
    request_id TEXT NOT NULL,
    seq        INTEGER NOT NULL,
    type       TEXT NOT NULL,
    payload    TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    PRIMARY KEY (request_id, seq)
);
"""

_db: aiosqlite.Connection | None = None


async def init() -> None:
    global _db
    _db = await aiosqlite.connect(DB_PATH)
    await _db.execute(SCHEMA)
    await _db.commit()


async def close() -> None:
    if _db is not None:
        await _db.close()


async def append(request_id: str, seq: int, event: dict) -> None:
    """One event, one row. Committed before anyone gets to see it: the
    log is the source of truth, the broadcast is a courtesy copy."""
    await _db.execute(
        "INSERT INTO events (request_id, seq, type, payload) VALUES (?, ?, ?, ?)",
        (request_id, seq, event["type"], json.dumps(event)),
    )
    await _db.commit()


async def replay(request_id: str, after_seq: int = 0) -> list[tuple[int, dict]]:
    """Everything this run has said after a given point, in order."""
    cursor = await _db.execute(
        "SELECT seq, payload FROM events WHERE request_id = ? AND seq > ? ORDER BY seq",
        (request_id, after_seq),
    )
    rows = await cursor.fetchall()
    return [(seq, json.loads(payload)) for seq, payload in rows]

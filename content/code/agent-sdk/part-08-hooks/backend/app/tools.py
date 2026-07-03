"""Part 6: the analyst's first custom tools, served by an MCP server that
lives inside this process. No subprocess, no network; a function call away.

The tool runs in the SERVER's process, not the agent's. The database path
is resolved once, here, against the backend's own working directory; no
per-conversation cwd ever changes what the tool can reach."""

import sqlite3
from pathlib import Path

from claude_agent_sdk import create_sdk_mcp_server, tool

DB_PATH = Path("data/beanline.db").resolve()
MAX_ROWS = 200

# The description is a prompt: the model READS it to decide when to reach
# for this tool and how to shape its SQL. Table names, column names, and
# the read-only warning all live here so no question has to guess them.
QUERY_DESCRIPTION = """Run one read-only SQL query against Beanline's live sales database (SQLite).

Tables:
  stores(store_id, name, city, opened)
  products(product_id, name, category, unit_price)
  sales(date, store_id, product_id, units, revenue)  -- one row per product per store per day

Prefer SQL aggregation (SUM, GROUP BY) over selecting raw rows. Results are
capped at 200 rows. The connection is read-only: INSERT, UPDATE, DELETE, and
schema changes fail with an error."""


@tool("query_database", QUERY_DESCRIPTION, {"sql": str})
async def query_database(args: dict) -> dict:
    try:
        con = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
        try:
            cursor = con.execute(args["sql"])
            columns = [c[0] for c in cursor.description or []]
            rows = cursor.fetchmany(MAX_ROWS)
            clipped = cursor.fetchone() is not None
        finally:
            con.close()
    except sqlite3.Error as exc:
        return {
            "content": [{"type": "text", "text": f"SQL error: {exc}"}],
            "isError": True,
        }
    header = "| " + " | ".join(columns) + " |"
    divider = "| " + " | ".join("---" for _ in columns) + " |"
    body = ["| " + " | ".join(str(v) for v in row) + " |" for row in rows]
    note = [f"({MAX_ROWS}-row cap reached; aggregate instead)"] if clipped else []
    table = "\n".join([header, divider, *body, *note]) if columns else "(no rows)"
    return {"content": [{"type": "text", "text": table}]}


@tool(
    "get_schema",
    "Return the Beanline database schema: every CREATE TABLE and CREATE INDEX "
    "statement, verbatim. Call this before writing SQL if you are unsure of "
    "a column name.",
    {},
)
async def get_schema(args: dict) -> dict:
    con = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    try:
        statements = [
            row[0]
            for row in con.execute(
                "SELECT sql FROM sqlite_master WHERE sql IS NOT NULL ORDER BY name"
            )
        ]
    finally:
        con.close()
    return {"content": [{"type": "text", "text": ";\n".join(statements) + ";"}]}


beanline_server = create_sdk_mcp_server(
    name="beanline", tools=[query_database, get_schema]
)

# Part 6: Custom Tools: Give the Analyst a Database

📖 Read along: [Claude Agent SDK in Production, Part 6](https://yadneshsalvi.com/blog/agent-sdk-6-custom-tools)

🎬 See it run: **[demo.mp4](demo.mp4)** — a short screen recording of exactly what this part delivers.

Act II opens. Beanline's live numbers move out of desk CSVs into a real SQLite database, and the analyst gets its first **custom tools** to query it: an MCP server that lives inside the FastAPI process, with read-only enforcement built into the tool instead of promised in the prompt. What's new:

- `backend/data/build_beanline_db.py` — builds `beanline.db` from the sample CSVs, deterministically (same seeded rows, now with types, keys, and indexes)
- `backend/app/tools.py` — `@tool query_database(sql)` (SQLite opened `file:...?mode=ro`; INSERT fails with a real error) and `@tool get_schema()`, wrapped by `create_sdk_mcp_server(name="beanline", ...)`
- `backend/app/main.py` — `mcp_servers={"beanline": beanline_server}` on the options; two new house rules (use the database for company numbers; never do arithmetic in your head)
- `backend/app/events.py` — `flatten()`: MCP tool results arrive as content-block lists, not strings; unwrap them before they ride the wire
- `backend/probe_naming.py` — a runnable probe that shows the `mcp__beanline__query_database` name is load-bearing (misspell it in an allow list and hit the permission wall)
- `frontend/lib/toolLabel.ts` — friendly badge labels for `mcp__*` tools

## Run it

Backend (terminal 1):

```bash
cd backend
uv sync
uv run python data/build_beanline_db.py   # once: builds data/beanline.db
uv run uvicorn app.main:app --reload
```

Frontend (terminal 2):

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open http://localhost:3000 and ask, with a completely empty desk: "What was total revenue in March 2026?" The analyst answers from the database through its new tool. Then try "Add a sale to the database" and watch read-only enforcement do its job.

Auth works like Part 1: your Claude subscription login, or `ANTHROPIC_API_KEY` in the environment.

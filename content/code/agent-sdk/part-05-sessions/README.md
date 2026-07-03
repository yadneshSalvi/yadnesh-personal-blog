# Part 5: Sessions: The Analyst Remembers

📖 Read along: [Claude Agent SDK in Production, Part 5](https://yadneshsalvi.com/blog/agent-sdk-5-sessions)

🎬 See it run: **[demo.mp4](demo.mp4)** — a short screen recording of exactly what this part delivers.

Act I closes with conversation memory for zero new infrastructure. The SDK has written a JSONL diary for every conversation since Part 1; now the app finally reads it: `resume` gives the analyst memory ("Now chart *that store's* weekly numbers" works), the SDK's own session utilities power a conversations sidebar with rename and Duplicate chat (fork), and history replays through the same block model the live stream uses. What's new:

- `backend/app/sessions.py` — the sidebar walk (`list_sessions(directory=...)` per workspace; never unscoped, which would list every session on the machine) and `history()`, which replays a session's raw messages into the UI's block model
- `backend/app/main.py` — `resume=session_id` on the options (the memory switch, one line), plus `GET /conversations`, `GET/PATCH /conversations/{ws}/{sid}`, and `POST .../fork` (offline `fork_session`: new id, inherited history, no model call)
- `frontend/components/Sidebar.tsx` — the conversations rail: New analysis, open, rename (pencil), Duplicate chat (branch icon)
- `frontend/lib/api.ts` — conversation calls
- `frontend/app/page.tsx` — sends `session_id` with every message, collects the `session_start` echo, replays history, splits a replayed desk into file chips and artifacts, and fixes a toast timer bug the demo recording exposed

## Run it

Backend (terminal 1):

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

Frontend (terminal 2):

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Open http://localhost:3000, load the sample data, ask "Which store grew fastest between January and June?", then follow up with "Now chart that store's weekly numbers." It knows.

Auth works like Part 1: your Claude subscription login, or `ANTHROPIC_API_KEY` in the environment.

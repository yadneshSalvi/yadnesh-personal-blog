# Part 9: Durable Streams: Survive the Refresh

📖 Read along: [Claude Agent SDK in Production, Part 9](https://yadneshsalvi.com/blog/agent-sdk-9-durable-streams)

🎬 See it run: **[demo.mp4](demo.mp4)** — a short screen recording of exactly what this part delivers.

Until now the agent's lifetime was chained to one HTTP response: refresh mid-analysis and the work finished server-side with nobody listening. This part decouples running the agent from watching it. `POST /chat` returns a claim ticket (`request_id` + `stream_url`) in milliseconds; the agent runs in a background worker that writes every event to a SQLite log and broadcasts to whoever is subscribed; `GET /stream/{request_id}` is a dumb pipe that replays the log, then follows live. Refresh mid-run and the whole turn comes back, including a pending approval card. The Stop button finally stops the worker (`client.interrupt()`), and even a stopped turn gets a receipt. What's new:

- `backend/app/eventlog.py` — the flight recorder: one SQLite table (`request_id`, `seq`, `type`, `payload`) via aiosqlite, one hand-written migration, no ORM. Sessions stay SDK-native; SQLite is the event log only
- `backend/app/hub.py` — the in-process broadcast hub: one worker publishes, N subscribers follow; subscribe-first-replay-second closes the gap an event could fall through
- `backend/app/runner.py` — the worker: `asyncio.create_task` + the `RUNNING` dict that keeps it alive (asyncio holds only weak references to tasks), `emit()` = log first, broadcast second, and `cancel_request()` = the real Stop button
- `backend/app/main.py` — `POST /chat` returns the ticket, `GET /stream/{id}` does replay-then-follow with SSE `id:` fields and `Last-Event-ID` resume, `POST /chat/{id}/cancel` interrupts the worker
- `frontend` — the fetch-reader retires; `EventSource` owns the stream (automatic reconnection for free), a `sessionStorage` ticket survives the refresh, and a seq-based dedup guard turns at-least-once delivery into exactly-once rendering

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

Open http://localhost:3000, load the sample data, ask for a long analysis, and hit refresh while the badges are still spinning: the turn replays instantly and the live tail continues. Ask for a chart, wait for the approval card, refresh, and the card comes back still waiting for your click. The stream is also just a GET, so you can watch any run from a terminal:

```bash
curl -N localhost:8000/stream/<request_id>
```

Auth works like Part 1: your Claude subscription login, or `ANTHROPIC_API_KEY` in the environment.

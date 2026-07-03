# Part 7: Approvals: The Human in the Loop

📖 Read along: [Claude Agent SDK in Production, Part 7](https://yadneshsalvi.com/blog/agent-sdk-7-approvals)

🎬 See it run: **[demo.mp4](demo.mp4)** — a short screen recording of exactly what this part delivers.

The scissors come off. `bypassPermissions` is deleted: reads and the read-only database tools ride an allow list, and every mutating tool call (Bash, Write) pauses mid-turn on an `asyncio.Future` until a human clicks Approve or Deny in the UI. Denials go back to the model as instructions, so a refused agent adapts instead of retrying. What's new:

- `backend/app/approvals.py` — the bridge: `gate()` (the `can_use_tool` callback) emits an `approval_request` event, parks a Future in `PENDING`, and waits (120s timeout, deny-on-timeout); `deny_all()` for stream teardown; the per-workspace `ALWAYS_ALLOWED` set behind "don't ask again"
- `backend/app/main.py` — `query()` replaced by `ClaudeSDKClient` (the callback needs its live channel), a per-request queue merging translator events with approval events, `POST /approvals/{id}/decision`, and a 10-second SSE keepalive comment whose real job is detecting dead clients while the agent is parked
- `frontend/components/ApprovalCard.tsx` — the inline card: full tool input, Approve/Deny, "don't ask again for this tool in this conversation"
- `frontend/lib/types.ts`, `app/page.tsx` — `approval_request` / `approval_resolved` parcels and their two `applyEvent` rules (born pending, resolved in place by id)

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

Open http://localhost:3000 and ask for any chart. When the card appears, try **Deny** first: the analyst delivers the numbers as a table anyway. Then say "Alright, chart it." and approve.

Auth works like Part 1: your Claude subscription login, or `ANTHROPIC_API_KEY` in the environment.

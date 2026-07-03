# Part 8: Hooks: Guardrails and Audit Trails

📖 Read along: [Claude Agent SDK in Production, Part 8](https://yadneshsalvi.com/blog/agent-sdk-8-hooks)

🎬 See it run: **[demo.mp4](demo.mp4)** — a short screen recording of exactly what this part delivers.

Part 7's approvals decide about risky calls and are blind to everything auto-approved. Hooks are the layer that sees every tool call, deterministically: a `PreToolUse` tripwire blocks `rm` before any human is asked (the deny reason goes to the model, which adapts), every tool call lands in an append-only `audit.jsonl`, and a `UserPromptSubmit` hook injects desk facts (file list, today's date) into each prompt. Approvals are judgment; hooks are law. What's new:

- `backend/app/guardrails.py` — the whole part: `build_hooks()` returns the per-request hook registrations (tripwire on `Bash`, audit pair matching everything, desk-facts injector), `audit()` appends one JSON line per fact (`ok` / `failed` / `blocked`), and the tripwire files its own audit line because a hook-denied call never fires `PostToolUse` or `PostToolUseFailure` (verified)
- `backend/app/main.py` — one new line in `build_options`: `hooks=build_hooks(...)`. The wire vocabulary, the approval bridge, and the frontend are untouched; a hook denial arrives as an ordinary `tool_result` with `is_error`

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

Open http://localhost:3000, load the sample data, and ask the analyst to delete a file with `rm`: the badge fails instantly with the policy reason, no card, no human. Then check `backend/audit.jsonl`; the attempt is on the record, along with every other tool call:

```bash
grep '"blocked"' backend/audit.jsonl
```

Auth works like Part 1: your Claude subscription login, or `ANTHROPIC_API_KEY` in the environment.

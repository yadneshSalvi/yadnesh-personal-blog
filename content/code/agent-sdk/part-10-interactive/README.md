# Part 10: Plan Mode, Questions, and Thinking You Can Read

📖 Read along: [Claude Agent SDK in Production, Part 10](https://yadneshsalvi.com/blog/agent-sdk-10-interactive)

🎬 See it run: **[demo.mp4](demo.mp4)** — a short screen recording of exactly what this part delivers.

Everything before this part polices what the agent may do; this part improves what it decides to do with a vague request. The analyst learns to negotiate: a **Plan first** toggle runs the request in `permission_mode="plan"` (read-only exploration, then a plan card with Implement/Refine buttons instead of side effects), the built-in **AskUserQuestion** tool pauses a run on structured questions rendered as option chips, and an **extended thinking** toggle streams the model's scratchpad into a collapsed drawer. All three ride machinery from earlier parts: the questions park on Part 7's `asyncio.Future` bridge, the three new event types (`plan_proposed`, `question_request`/`question_resolved`, `thinking_delta`) ride Part 2's envelope, and Part 9's log makes them replayable, so a pending question card survives a page refresh. What's new:

- `backend/app/runner.py` — `build_options(mode, thinking)`: `AskUserQuestion` joins `tools=` (gated, not allow-listed), `ExitPlanMode` joins only in plan runs, `thinking` is explicit both ways, and the house rules gain an ask-first rule that took three measured drafts
- `backend/app/approvals.py` — the gate routes two new tool names: `ask_user()` parks on a Future and returns the human's picks via `PermissionResultAllow(updated_input=...)`; `capture_plan()` emits `plan_proposed` and denies `ExitPlanMode` with a receipt message (deciding is a later turn)
- `backend/app/events.py` — `thinking_delta` stops being skipped (the text lives in `delta["thinking"]`), and the raw `AskUserQuestion`/`ExitPlanMode` tool calls are suppressed in favor of the richer cards
- `backend/app/main.py` — `ChatRequest` gains `mode` and `thinking`; `POST /questions/{id}/answers` is the human half of the question bridge
- `frontend` — `QuestionCard` (chips, multi-select, Send answers), `PlanCard` (markdown + Implement/Refine, buttons write the next message), `ThinkingDrawer` (collapsed scratchpad), and mode/thinking toggles in the composer

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

Open http://localhost:3000, load the sample data, and ask something underspecified: "Compare revenue for two of our stores." The analyst queries the store list first, then asks which two with chips it wrote itself; your picks resume the paused run. Flip **Plan first** and ask for a report: the analyst explores read-only and hands you a plan card; "Implement this plan" runs it as a normal approvals-mode turn. Flip **Thinking on** for a hard question and click the "Thought for N words" drawer to read the scratchpad. Refresh while a question card is pending: it comes back, still waiting.

Auth works like Part 1: your Claude subscription login, or `ANTHROPIC_API_KEY` in the environment.

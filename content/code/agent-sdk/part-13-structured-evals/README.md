# Part 13: Trust, but Verify: Structured Outputs, Budgets, and Evals

📖 Read along: [Claude Agent SDK in Production, Part 13](https://yadneshsalvi.com/blog/agent-sdk-13-structured-evals)

🎬 See it run: **[demo.mp4](demo.mp4)** — a short screen recording of exactly what this part delivers.

The capstone before deployment: we make the analyst *provably* good. Three mechanisms, escalating in strength. **Structured outputs** (`output_format` with a json_schema from a Pydantic `AnalysisSummary`) make every run end with a machine-readable summary on `ResultMessage.structured_output`, validated with `model_validate` and rendered as a card under the prose answer; this is the event vocabulary's final extension (`complete` gains `structured_output` and `stop_reason`). **Budgets** (`max_budget_usd`, a per-request field on `ChatRequest`) turn the cost ritual from watching into enforcing: a run that crosses the line stops with subtype `error_max_budget_usd` and a graceful "budget exhausted" receipt. And an **eval suite** (`evals/`) turns "seems fine" into a pass rate: cases keyed to the deterministic Beanline ground truth, an async runner against the *real* agent (concurrent, budget-capped per attempt), and an LLM-as-judge that returns a structured verdict (structured outputs eating their own dog food). What's new:

- `backend/app/summary.py` — the `AnalysisSummary` Pydantic model (headline, key_metrics, caveats, chart_paths); the contract, in one place
- `backend/app/runner.py` — `output_format` (schema from the model) and `max_budget_usd` (from the request) on `ClaudeAgentOptions`
- `backend/app/events.py` — the `complete` event gains `structured_output` (validated) and `stop_reason`; the `StructuredOutput` tool call gets no badge (its story is the receipt)
- `backend/app/main.py` — `ChatRequest` gains `budget_usd`
- `backend/app/sessions.py` — history replay maps a `StructuredOutput` call to the turn's summary
- `frontend/` — `types.ts` mirrors the summary; `SummaryCard.tsx` renders it; `page.tsx` shows the card and a "budget exhausted" receipt, and the composer gets a Budget $ field
- `backend/evals/` — `cases.yaml` (7 questions, SQL-verified expected facts, plus a duplicate-row and a share-of-total canary), `run.py` (the async runner + pass-rate table), `judge.py` (LLM-as-judge, structured verdict)

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

Open http://localhost:3000, load the sample data, and ask: "Which store had the highest revenue in March 2026, and by how much did it beat the runner-up?" The prose answer arrives with a **summary card** under it. Then set the **Budget $** field to `0.02` and ask for "a full performance report on Beanline, every store, every product, every month" and watch it stop gracefully with "budget exhausted".

## Run the eval suite

From `backend/` (with the database built):

```bash
uv run python -m evals.run --attempts 3
```

It runs every case in `evals/cases.yaml` against the real agent, grades each answer with the LLM judge, and prints a pass-rate table (a JSON copy lands in `evals/runs/`). To reproduce the regression story from the post: delete the "never do arithmetic in your head" line from `ANALYST_PROMPT` in `backend/app/runner.py`, re-run, and watch the pass rate drop.

Auth works like Part 1: your Claude subscription login, or `ANTHROPIC_API_KEY` in the environment. The eval suite makes real agent calls; a full 8-case, 3-attempt run costs roughly $1.50 in agent spend plus a dime for the judge on `claude-haiku-4-5`.

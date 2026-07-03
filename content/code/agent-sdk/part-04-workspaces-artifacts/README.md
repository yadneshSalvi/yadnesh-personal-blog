# Part 4: Workspaces and Artifacts

📖 Read along: [Claude Agent SDK in Production, Part 4](https://yadneshsalvi.com/blog/agent-sdk-4-workspaces-artifacts)

🎬 See it run: **[demo.mp4](demo.mp4)** — a short screen recording of exactly what this part delivers.

Every conversation gets its own desk, you bring your own files, and the analyst hands back deliverables. The backend grows workspace endpoints (server-minted ids, multipart upload with a size cap and filename sanitization, a traversal-guarded file server) and an artifact watcher that diffs the workspace after every tool result instead of trusting the model to report its files. The system prompt enters with a real job: the `claude_code` preset plus appended house rules that make the agent save charts as PNGs and write findings to `report.md`. What's new:

- `backend/app/workspaces.py` — workspace creation and lookup, `safe_filename` (the `../` attack, rejected in one line), the mtime+size snapshot, and `with_artifacts`, the stream stage that emits `artifact_update` events
- `backend/app/main.py` — `POST /workspaces`, `POST /workspaces/{id}/files`, `POST /workspaces/{id}/sample-data`, `GET /workspaces/{id}/files/{path}`, per-request `ClaudeAgentOptions` with `cwd` pointed at the conversation's workspace and `system_prompt` = preset + `ANALYST_PROMPT`
- `backend/app/events.py` — `translate()` now yields event dicts; `sse()` framing moved to the edge of the server
- `backend/sample_data/` — the Beanline CSVs, served by the "Load sample data" button
- `frontend/components/ArtifactsPanel.tsx` — the right-hand panel: file list plus preview (image, markdown, or plain text)
- `frontend/components/UploadZone.tsx` — drag-and-drop or click-to-browse
- `frontend/lib/api.ts` — the workspace API client, errors shaped for toasts
- `frontend/components/Toast.tsx` — grew a success tone; uploads get receipts, not only complaints
- `frontend/app/page.tsx` — workspace plumbing (lazy desk creation, the `session_start` echo), file chips, and `artifact_update` handling

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

Open http://localhost:3000, click "load the Beanline sample data" (or drop your own CSVs), and ask for a chart.

Auth works like Part 1: your Claude subscription login, or `ANTHROPIC_API_KEY` in the environment.

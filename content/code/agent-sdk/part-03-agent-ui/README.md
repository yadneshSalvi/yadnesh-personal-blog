# Part 3: The Agent UI

📖 Read along: [Claude Agent SDK in Production, Part 3](https://yadneshsalvi.com/blog/agent-sdk-3-agent-ui)

🎬 See it run: **[demo.mp4](demo.mp4)** — a short screen recording of exactly what this part delivers.

The Part 2 event stream gets its real client: a Next.js chat UI where the answer types itself out, every tool call appears as a live badge that resolves in place, and long turns show a working clock instead of a dead spinner. The backend is byte-for-byte Part 2's — that's the event vocabulary paying rent. What's new:

- `frontend/lib/types.ts` — the wire events and the block model: an assistant turn is a sequence of text and tool blocks
- `frontend/lib/readSse.ts` — fetch-reader SSE parsing as an async generator
- `frontend/lib/toolLabel.ts` — friendly labels for tool badges
- `frontend/components/ToolBadge.tsx` — collapsed one-liner with spinner/check/cross, click to expand input and result
- `frontend/components/Markdown.tsx` — `react-markdown` + `remark-gfm`, styled for the app
- `frontend/components/Toast.tsx` — a small self-built toast for stream failures
- `frontend/app/page.tsx` — the chat page: block rendering, working-elapsed indicator, Stop via `AbortController`, auto-scroll, empty state with sample questions

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

Open http://localhost:3000 and click one of the sample questions.

Auth works like Part 1: your Claude subscription login, or `ANTHROPIC_API_KEY` in the environment.

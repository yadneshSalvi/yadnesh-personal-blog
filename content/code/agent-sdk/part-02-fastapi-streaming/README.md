# Part 2: The FastAPI Bridge and the Event Vocabulary

📖 Read along: [Claude Agent SDK in Production, Part 2](https://yadneshsalvi.com/blog/agent-sdk-2-fastapi-streaming)

🎬 See it run: **[demo.mp4](demo.mp4)** — a short screen recording of exactly what this part delivers.

The Part 1 terminal agent goes behind HTTP. `POST /chat` streams the whole run as server-sent events: the six-type envelope vocabulary (`session_start`, `text_delta`, `tool_use_start`, `tool_result`, `complete`, `error`) that every later part extends and no later part changes. What's here:

- `backend/app/events.py` — the wire vocabulary: `sse()` framing, the SDK-to-envelope translator, and the tool-result clip
- `backend/app/main.py` — FastAPI app: CORS for the (future) frontend, `POST /chat` returning a `StreamingResponse`, token-level streaming via `include_partial_messages`
- `backend/workspace/` — the Beanline CSVs, same as Part 1

## Run it

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload
```

Then watch a whole agent run stream, live:

```bash
curl -N -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Which store had the highest total revenue in March?"}'
```

Auth works like Part 1: your Claude subscription login, or `ANTHROPIC_API_KEY` in the environment.

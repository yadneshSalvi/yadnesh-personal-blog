# Part 5: Streaming Responses

📖 Read along: [LangGraph from Scratch, Part 5](https://yadneshsalvi.com/blog/langgraph-5-streaming)

🎬 See it run: **[demo.mp4](demo.mp4)** — a short screen recording of exactly what this part delivers.

What changed since Part 4:

- Backend: `/chat` returns a `StreamingResponse` that yields one SSE envelope per token, read off `graph.astream_events(...)` — the graph itself is untouched
- The wire format: `data: {"type": "token", "content": "..."}` envelopes framed by a blank line, closed by `{"type": "done"}` (designed so Part 6's tool events need no parser rewrite)
- Frontend: `res.body.getReader()` + a buffer that splits on `\n\n` and keeps the unfinished tail, a blinking caret, auto-scroll, and a Stop button backed by an `AbortController`

## Run it

Same two terminals as Part 4. Watch the raw stream first:

```bash
curl -N -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "explain recursion in one sentence"}'
```

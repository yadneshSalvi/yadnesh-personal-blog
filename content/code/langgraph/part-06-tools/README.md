# Part 6: Giving the Bot Tools

📖 Read along: [LangGraph from Scratch, Part 6](https://yadneshsalvi.com/blog/langgraph-6-tools)

What changed since Part 5:

- `backend/app/tools.py` — a safe `calculator` (an `ast` walker with an operator whitelist; never `eval`) and Tavily `web_search`
- `graph.py` — `llm.bind_tools(tools)`, a `ToolNode`, and `tools_condition` conditional edges: the ReAct loop (reason → act → observe → repeat)
- `main.py` — two new envelope types on the same SSE belt: `tool_start` and `tool_end`
- `page.tsx` — a `Message` union with a `tool` role and a dashed-border `ToolCallBubble` that shows `running…` → `→ result`

## Run it

You need a second key now: `TAVILY_API_KEY` (free tier at [tavily.com](https://tavily.com)) in `backend/.env` next to your LLM key. Without it the server refuses to boot — that's the deliberate break in the post.

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # both keys
uvicorn app.main:app --reload
```

Frontend as in Part 4, then ask: *"What is 23 × 17, and what's the population of Tokyo?"* — watch it run both tools before answering.

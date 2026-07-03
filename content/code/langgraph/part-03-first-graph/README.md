# Part 3: Your First LangGraph

📖 Read along: [LangGraph from Scratch, Part 3](https://yadneshsalvi.com/blog/langgraph-3-first-graph)

🎬 See it run: **[demo.mp4](demo.mp4)** — a short screen recording of exactly what this part delivers.

What changed since Part 2:

- `backend/app/graph.py` — a real LangGraph: a `State` holding the conversation, one `llm` node that calls the model, edges from `START` to it and on to `END`
- `/chat` no longer echoes: it runs your message through the graph and returns a genuine model reply
- `load_dotenv()` at the top of `graph.py` reads your API key from `backend/.env`

This repo's code uses OpenAI (`gpt-5.4-mini`). For Anthropic, swap the import and two lines in `graph.py` exactly as shown in the post.

## Run it

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # paste your real key
uvicorn app.main:app --reload
```

```bash
curl -X POST http://localhost:8000/chat -H "Content-Type: application/json" -d '{"message": "explain recursion in one sentence"}'
```

From this part on, every message makes one real API call (a fraction of a cent each).

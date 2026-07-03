# Part 2: FastAPI Fundamentals

📖 Read along: [LangGraph from Scratch, Part 2](https://yadneshsalvi.com/blog/langgraph-2-fastapi-basics)

What changed since Part 1:

- `main.py` moved into a package: `backend/app/main.py` (launch command is now `uvicorn app.main:app --reload`)
- `POST /chat` accepts `{"message": "..."}` and echoes it back
- `ChatRequest` / `ChatResponse` Pydantic models validate both directions (typo a field name and you get a precise 422, not a 500)
- `CORSMiddleware` welcomes `http://localhost:3000` ahead of Part 4's frontend

## Run it

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Try it:

```bash
curl -X POST http://localhost:8000/chat -H "Content-Type: application/json" -d '{"message": "hello"}'
# → {"reply":"you said: hello"}
```

Also open http://localhost:8000/docs — the interactive docs page FastAPI writes for you.

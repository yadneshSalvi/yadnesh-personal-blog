# Part 1: Installation & Setup

📖 Read along: [LangGraph from Scratch, Part 1](https://yadneshsalvi.com/blog/langgraph-1-setup)

This part is mostly about getting your machine ready, so there is very little code — that's the point. By the end you have two running servers and zero features:

- `backend/main.py` — an 8-line FastAPI server answering `{"status": "ok"}` on `GET /`
- `frontend/` — an untouched `create-next-app` scaffold (TypeScript, Tailwind, App Router)
- `backend/.env.example` — where your LLM API key will live (copy to `.env`)
- `frontend/.env.local.example` — tells the browser code where the backend lives (copy to `.env.local`)

## Run it

Backend (note: Part 1 runs `main.py` from `backend/` directly; the `app/` package arrives in Part 2):

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
# → http://localhost:8000 says {"status":"ok"}
```

Frontend, in a second terminal:

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
# → http://localhost:3000 shows the Next.js welcome page
```

No AI yet, on purpose. The API key you create in this part isn't read until Part 3.

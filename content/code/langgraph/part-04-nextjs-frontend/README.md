# Part 4: The Next.js Frontend

📖 Read along: [LangGraph from Scratch, Part 4](https://yadneshsalvi.com/blog/langgraph-4-nextjs-frontend)

🎬 See it run: **[demo.mp4](demo.mp4)** — a short screen recording of exactly what this part delivers.

What changed since Part 3 (the backend didn't change by a single line):

- `frontend/app/page.tsx` — the whole chat UI: message bubbles, a controlled input, one `fetch` to `POST /chat`, a "Thinking..." indicator, and an honest error banner
- shadcn/ui installed: `components/ui/button.tsx`, `input.tsx`, `card.tsx` (copied into the project, yours to edit)

## Run it

Backend (terminal 1):

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # paste your real key
uvicorn app.main:app --reload
```

Frontend (terminal 2):

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
# → chat at http://localhost:3000
```

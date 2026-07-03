# Part 8: Deploying to the Internet

📖 Read along: [LangGraph from Scratch, Part 8](https://yadneshsalvi.com/blog/langgraph-8-deploy)

What changed since Part 7:

- `backend/requirements.txt` — the pinned dependency list the server installs from
- `backend/Dockerfile` — python:3.12-slim, install requirements, copy code, run uvicorn on 8080
- `backend/.dockerignore` — keeps `.venv` and `.env` (your secrets) out of the image entirely
- `backend/fly.toml` — one always-awake machine (`auto_stop_machines = "off"`, `min_machines_running = 1`, 512MB) so the in-memory conversations survive idle hours
- `main.py` — CORS now reads `FRONTEND_ORIGIN` from the environment, so the same code welcomes localhost in dev and your Vercel URL in production

## Deploy order (it matters)

1. **Backend first**: `fly launch --no-deploy`, then `fly secrets set OPENAI_API_KEY=... TAVILY_API_KEY=...`, then `fly deploy`. Copy the `https://your-app.fly.dev` URL.
2. **Frontend**: push to GitHub, import in Vercel with **Root Directory = `frontend`** and env var `NEXT_PUBLIC_API_BASE_URL` = your Fly URL.
3. **Close the loop**: `fly secrets set FRONTEND_ORIGIN=https://your-app.vercel.app` (auto-redeploys and fixes the CORS error you'll see until you do).

## Test the image locally

```bash
cd backend
docker build -t langgraph-chatbot .
docker run --rm -p 8080:8080 \
  -e OPENAI_API_KEY=sk-... -e TAVILY_API_KEY=tvly-... langgraph-chatbot
# → http://localhost:8080/docs
```

Note: Fly retired its free tier (~$5 trial credit, then a 512MB shared machine is ~$3/month). Set a hard spending cap on your LLM dashboard before sharing the link.

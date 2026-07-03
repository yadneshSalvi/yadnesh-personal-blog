# LangGraph from Scratch

Companion code for the 8-part series **[LangGraph from Scratch](https://yadneshsalvi.com/series/langgraph-fastapi-nextjs)**: building a streaming AI chatbot with tools and memory, from an empty folder to a public URL, using FastAPI, LangGraph, and Next.js.

Every folder below is the **complete, runnable project as it exists at the end of that part**. You can `cd` into any part and run it without assembling anything from earlier parts. All code was tested end to end against real APIs before publishing.

| Part | Folder | What you build | Read along |
|---|---|---|---|
| 1 | [`part-01-setup`](part-01-setup) | Two running servers, zero features | [Installation & Setup](https://yadneshsalvi.com/blog/langgraph-1-setup) |
| 2 | [`part-02-fastapi-basics`](part-02-fastapi-basics) | `/chat` echoes, validates, documents itself | [FastAPI Fundamentals](https://yadneshsalvi.com/blog/langgraph-2-fastapi-basics) |
| 3 | [`part-03-first-graph`](part-03-first-graph) | A one-node LangGraph answers with a real LLM | [Your First LangGraph](https://yadneshsalvi.com/blog/langgraph-3-first-graph) |
| 4 | [`part-04-nextjs-frontend`](part-04-nextjs-frontend) | A real chat UI wired to the backend | [The Next.js Frontend](https://yadneshsalvi.com/blog/langgraph-4-nextjs-frontend) |
| 5 | [`part-05-streaming`](part-05-streaming) | Tokens stream over SSE, with a Stop button | [Streaming Responses](https://yadneshsalvi.com/blog/langgraph-5-streaming) |
| 6 | [`part-06-tools`](part-06-tools) | A calculator + web search the bot calls on its own | [Giving the Bot Tools](https://yadneshsalvi.com/blog/langgraph-6-tools) |
| 7 | [`part-07-memory`](part-07-memory) | Conversation memory, threads, and a sidebar | [Conversation Memory](https://yadneshsalvi.com/blog/langgraph-7-memory) |
| 8 | [`part-08-deploy`](part-08-deploy) | Dockerfile + Fly + Vercel deploy config | [Deploying to the Internet](https://yadneshsalvi.com/blog/langgraph-8-deploy) |

## Running any part

Each part's own `README.md` has the exact steps, but the shape is always the same.

**Backend** (Parts 2+; Part 1 uses `uvicorn main:app` from `backend/`):

```bash
cd part-0N-*/backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env               # paste your real key(s) in
uvicorn app.main:app --reload
```

**Frontend** (Parts 4+):

```bash
cd part-0N-*/frontend
npm install
cp .env.local.example .env.local
npm run dev
```

## Keys you need

- **OpenAI** (or Anthropic) API key from Part 3 on — set a hard spending cap first; the series shows how in [Part 1](https://yadneshsalvi.com/blog/langgraph-1-setup#get-a-key-to-a-language-model).
- **Tavily** API key from Part 6 on — free tier at [tavily.com](https://tavily.com).

Keys go in `backend/.env` (gitignored). Never commit them.

## Versions

Pinned in each part's `requirements.txt` — the exact versions the series was written and tested against: Python 3.11+, FastAPI 0.136.3, LangGraph 1.2.5, LangChain 1.3.9, Next.js 16.2.9, Node 22.

## Troubleshooting

- `command not found: uvicorn` → your venv isn't active. `source .venv/bin/activate`.
- `CERTIFICATE_VERIFY_FAILED` on the Tavily tool (macOS, python.org installs) → run the `Install Certificates.command` that ships with your Python, or `pip install certifi` and set `SSL_CERT_FILE=$(python -m certifi)`.
- The code uses OpenAI (`gpt-5.4-mini`). For Anthropic, swap two lines in `app/graph.py` as shown in [Part 3](https://yadneshsalvi.com/blog/langgraph-3-first-graph#the-one-station-that-does-the-thinking).

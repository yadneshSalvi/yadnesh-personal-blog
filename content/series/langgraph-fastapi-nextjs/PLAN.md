# Series Plan — A Complete Beginner's Guide to LangGraph (with FastAPI and Next.js)

> Internal planning document. Not served by the blog (the post loader only scans `content/posts/*.mdx`).
> Last updated: 2026-05-26

---

## 1. Overview

### What we're building (across the whole series)

A streaming AI chatbot with **tools** and **conversation memory**, built from scratch:

- **Backend:** Python 3.12 + FastAPI + LangGraph + LangChain
- **Frontend:** Next.js 16 (App Router) + Tailwind CSS 4 + shadcn/ui
- **LLM:** Reader chooses OpenAI (`gpt-5.4-mini`) or Anthropic (`claude-haiku-4-5`) — every code snippet shows both via tabs.
- **State:** In-memory through Part 6, then LangGraph's built-in checkpointer in Part 7. Postgres/Redis/Celery are explicitly out of scope for this beginner series (mentioned only in the closing "where next" section).

### Audience

A developer who can write a basic Python function and a basic React component, has used `pip` and `npm` before, but has never touched FastAPI, Next.js App Router, or LangGraph. Same audience as Vincent Loy's *Django Beginner's Guide* — assumes the language, teaches the framework.

### Tone (matches the reference site)

- Warm, encouraging, written in the **second person** ("we'll", "you'll").
- One concept introduced at a time.
- Every part ends with the reader having **something working** they can show off.
- Heavy use of screenshots (terminal output, browser, the chat UI growing across parts).
- Code blocks have **filenames** and are short — multi-step changes are shown as small diffs, not 200-line dumps.
- **No condescension and no "obviously".** If something isn't obvious, we explain it or link out.

### Beginner concept handling

The reader has *some* programming background but won't know every primitive we use. Two-layer approach:

1. **Inline `<Callout type="info">` boxes** for short clarifications (1–3 sentences).
   Example: *"`async def` defines a coroutine — a function that can pause and let other work run while it waits for I/O. [More on async →](/concepts#async-await)"*
2. **A single shared "Concepts" page** at `/blog/langgraph-concepts` that all parts link to via fragment URLs. Acts as a glossary for the heavier ideas (async/await, TypedDict, JSX, fetch, ReadableStream, SSE, ReAct, tool-calling, checkpointers).

This keeps the main tutorial text moving forward; readers who already know a concept just skim past the callout.

---

## 2. Series infrastructure design (blog changes)

The blog currently has no concept of a series. Below is the minimum set of changes to support this series cleanly without overengineering. **Single series for now**, but designed so a second series ("Build an MCP server", whatever) drops in without refactoring.

### 2.1 Frontmatter additions (in each part's MDX file)

```yaml
series: langgraph-fastapi-nextjs   # slug, matches content/series/<slug>.mdx
seriesPart: 1                      # ordinal, 1-indexed
```

That's it. Two extra fields. Both optional — posts that omit them stay standalone.

### 2.2 Series metadata file

New file: `content/series/langgraph-fastapi-nextjs.mdx`

```yaml
---
slug: langgraph-fastapi-nextjs
name: "A Complete Beginner's Guide to LangGraph"
tagline: "Build a streaming AI chatbot with FastAPI and Next.js, from zero."
heroImage: /series/langgraph/hero.png
createdAt: "2026-05-26T00:00:00.000Z"
updatedAt: "2026-05-26T00:00:00.000Z"
---

(MDX body — the long-form series introduction, who it's for, what we'll build,
prerequisites, the "you'll need an API key" section. Rendered as the top of
the series landing page.)
```

Co-locating in `content/series/` mirrors how `content/posts/` already works and keeps authoring uniform.

### 2.3 URL structure

| URL | Page | Notes |
|---|---|---|
| `/series` | List of all series (currently 1) | Optional; can defer until series #2 exists |
| `/series/langgraph-fastapi-nextjs` | Series landing page | Hero, intro MDX, ordered list of parts with summaries |
| `/blog/langgraph-1-setup` | Part 1 (existing URL pattern) | Unchanged; renders new series UI when `series` is set |

Individual post URLs stay flat (`/blog/<slug>`) so links to specific parts stay short and don't change later if the series slug ever does.

### 2.4 File/component layout

```
content/
  posts/
    langgraph-1-setup.mdx
    langgraph-2-fastapi-basics.mdx
    langgraph-3-first-graph.mdx
    langgraph-4-nextjs-frontend.mdx
    langgraph-5-streaming.mdx
    langgraph-6-tools.mdx
    langgraph-7-memory.mdx
    langgraph-8-deploy.mdx
    langgraph-concepts.mdx           # the shared concepts glossary
  series/
    langgraph-fastapi-nextjs.mdx     # series metadata + intro

src/
  app/
    series/
      [slug]/
        page.tsx                     # NEW — series landing
    blog/
      [slug]/
        page.tsx                     # EDIT — render series UI if post is in a series
  components/
    series/
      SeriesNav.tsx                  # NEW — prev/next at bottom of each part
      SeriesToc.tsx                  # NEW — full ordered list of parts (used on series page + collapsible at top of each part)
      SeriesBadge.tsx                # NEW — "Part 3 of 8" pill, shown near post title
      SeriesCard.tsx                 # NEW — card for the homepage "Series" row
  lib/
    series.ts                        # NEW — series data loading

public/
  series/
    langgraph/
      hero.png
      part-1-fastapi-docs.png
      part-4-first-chat.png
      ... (etc.)
```

### 2.5 `lib/series.ts` API (proposed)

```ts
export type SeriesMeta = {
  slug: string;
  name: string;
  tagline?: string;
  heroImage?: string;
  createdAt: string;
  updatedAt: string;
};

export type SeriesPart = {
  postSlug: string;     // matches content/posts/<slug>.mdx
  part: number;
  title: string;
  subtitle?: string;
  readingTime?: number;
};

export type Series = SeriesMeta & {
  parts: SeriesPart[];
  intro: React.ReactNode;   // compiled MDX from content/series/<slug>.mdx
};

export function getAllSeriesSlugs(): string[];
export function getSeriesBySlug(slug: string): Promise<Series | null>;

// Used by /blog/[slug]/page.tsx to render series UI on individual posts
export function getSeriesContextForPost(postSlug: string): {
  series: SeriesMeta;
  part: number;
  totalParts: number;
  prev?: SeriesPart;
  next?: SeriesPart;
} | null;
```

Implementation notes:
- `getSeriesContextForPost` scans `content/posts/*.mdx` once (cached in module scope), groups by `series`, sorts by `seriesPart`, returns prev/next.
- Sorting fallback: if two posts have the same `seriesPart` (author mistake), warn at build time but don't crash.

### 2.6 Components — UX sketches

**`<SeriesBadge>`** — small pill, sits between post subtitle and metadata row:
```
[ Series · A Complete Beginner's Guide to LangGraph · Part 3 of 8 ]
```
Clickable, links to `/series/<slug>`.

**`<SeriesToc>`** — collapsible by default at top of each part; expanded by default on the series landing page:
```
A Complete Beginner's Guide to LangGraph
  1. Installation & setup            ← read
  2. FastAPI fundamentals            ← read
  3. Your first LangGraph            ← you are here
  4. The Next.js frontend
  5. Streaming responses
  ...
```

**`<SeriesNav>`** — sits at the very bottom of each part, before the footer:
```
← Part 2: FastAPI fundamentals        Part 4: The Next.js frontend →
```
Each side is a card with the part number, title, and short summary.

**`<SeriesCard>`** — used on the homepage "Tutorial Series" row. Hero image, name, tagline, part count, "Start →" CTA.

### 2.7 Homepage integration

On the existing blog landing page, add a **Tutorial Series** section **above** the individual posts list, rendering `<SeriesCard>` for each series. Visually distinct from one-off posts.

If there's only one series, the section is still worth showing — it reframes the blog as "I write here *and* I teach in depth."

### 2.8 What I'm intentionally NOT building

- **No "in progress" badges / scheduled publishing.** If a part isn't ready, don't push it; the series shows whatever parts exist.
- **No per-part comments / discussion threads.** Out of scope for this blog.
- **No automatic part numbering.** Author writes `seriesPart: 3` explicitly — predictable, no accidental renumbering on file rename.
- **No "estimated total reading time for the series".** Sum of parts on the series page only, not surfaced elsewhere.
- **No tags-based grouping.** Tags and series are orthogonal; a post can have both, or just one.

### 2.9 Build & search

- `scripts/build-search-index.js` will need a small update to optionally include `series` and `seriesPart` in the indexed metadata so search results can show *"Part 3 — Your first LangGraph"*. Low priority; do it when we write the search update.
- No new build step; everything is read at build time the same way posts already are.

### 2.10 Estimate

~4–6 hours of focused work to land the series infra, including:
- Frontmatter extension + types
- `lib/series.ts`
- 4 components
- 1 new route (`/series/[slug]`)
- Edits to `/blog/[slug]/page.tsx` and the homepage
- Light styling

I'll bring this back as its own approval-gated plan before writing any TypeScript. The breakdown below assumes it's already in place.

---

## 3. Tutorial breakdown

8 parts. Each part has a goal a beginner can taste at the end. The user always has a runnable app when they finish — never a "we'll fix this in the next part, trust me" cliffhanger.

### Pacing guideline

| Part | Working result at the end | Reading time |
|---|---|---|
| 1 | Two empty-but-running servers (`http://localhost:8000`, `http://localhost:3000`) | 12–15 min |
| 2 | Backend echoes JSON back over HTTP, viewable in `/docs` | 10–12 min |
| 3 | Backend replies with a real LLM answer (curl from terminal) | 18–22 min |
| 4 | Working chat UI in the browser, end-to-end | 18–22 min |
| 5 | Tokens stream into the UI as they're generated | 15–18 min |
| 6 | The bot can do math and search the web | 22–28 min |
| 7 | The bot remembers what you said earlier; "New chat" works | 18–22 min |
| 8 | The whole thing is live on the public internet | 15–18 min |

Total: ~2h45m of reading; probably 6–10 hours of hands-on work for a real beginner.

---

### Part 1 — Installation & setup

**Slug:** `langgraph-1-setup` &nbsp;·&nbsp; **Reading:** 12–15 min &nbsp;·&nbsp; **Screenshots:** ~8

**Why this part exists:** Get the reader from "I have a laptop" to "two empty servers are running on my machine." The Django guide spends a whole post here for good reason — environment problems kill 70% of beginners before they ever see the framework.

**Sections (H2/H3):**
- *Before you start* — what we're going to build (with a screenshot of the finished Part 8 chat); what you need (laptop, terminal comfort, willingness to fail).
- *Install Python 3.12 (or newer)* — macOS, Linux, Windows. Verify with `python3 --version`.
- *Install Node.js 22 LTS* — same three OSes. Verify with `node --version`.
- *Create the project folder* — `mkdir langgraph-chatbot && cd langgraph-chatbot`.
- *Set up the backend* — `python3 -m venv .venv`, activate it, `pip install fastapi 'uvicorn[standard]' langgraph langchain langchain-openai langchain-anthropic python-dotenv`, then a minimal `main.py` that just exposes `GET /` returning `{"status": "ok"}`.
- *Set up the frontend* — `npx create-next-app@latest frontend` with the standard options (TypeScript yes, Tailwind yes, App Router yes, no Turbopack flag — explain why we keep defaults).
- *Get an LLM API key* — tabs for OpenAI (platform.openai.com → API keys → create) and Anthropic (console.anthropic.com → Settings → API Keys). Explain that this costs money but pennies; recommend setting a $5 hard limit.
- *Set up your `.env` files* — backend `.env` for the API key; frontend `.env.local` for `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`. Explain why frontend env vars need the `NEXT_PUBLIC_` prefix.
- *Run both servers* — `uvicorn main:app --reload` in one terminal, `npm run dev` in the other. Browse to both URLs, see the welcome screens. Celebrate.

**Code introduced:** Maybe 15 lines of Python total. The Next.js scaffold is generated by the CLI — we don't write it.

**Beginner callouts in this part:**
- What a virtual environment is and why we use one.
- What `--reload` does.
- Why we picked uvicorn (and what an ASGI server is, one line).
- Why we picked App Router over Pages Router.
- What an API key is and the "treat it like a password" warning (boxed in `<Callout type="warning">`).

**Forward references made:** "We'll wire the frontend to the backend in Part 4 — for now they're independent."

**Things explicitly NOT covered yet:** `uv`, Poetry, Docker, anything about routing, anything about React.

---

### Part 2 — FastAPI fundamentals

**Slug:** `langgraph-2-fastapi-basics` &nbsp;·&nbsp; **Reading:** 10–12 min &nbsp;·&nbsp; **Screenshots:** ~5 (mostly `/docs`)

**Why this part exists:** Get the reader fluent in the request-shaping primitives we'll need in Part 3, *without* mentioning LangGraph yet. This part is "FastAPI for someone who's never seen it." Skippable for readers who already know FastAPI — we say so up front.

**Sections (H2/H3):**
- *What FastAPI gives you* — auto docs, type-driven validation, async by default. One screenshot of `/docs` from Part 1.
- *Splitting `main.py`* — introduce a `backend/app/` folder, move things into `app/main.py`. Briefly explain why we organize things even when we have one file.
- *Your first real endpoint* — `POST /chat` that takes `{"message": "..."}` and returns `{"reply": "you said: ..."}`. Echo only — no LLM yet.
- *Pydantic models* — define `ChatRequest` and `ChatResponse` as Pydantic classes. Show how `/docs` updates to reflect the schemas. *This is the moment FastAPI clicks for people.*
- *Async/await — a quick tour* — explain `async def`, link out to the concepts page for the deeper "why."
- *CORS — letting the frontend talk to the backend* — add the `CORSMiddleware`, explain what CORS is in plain English (one paragraph), allow `http://localhost:3000`.
- *Try it from your terminal* — `curl -X POST localhost:8000/chat -H 'Content-Type: application/json' -d '{"message": "hello"}'`. See the echo come back.

**Code introduced:** ~40 lines of Python, well-commented inline.

**Beginner callouts:**
- What Pydantic is in one sentence + link to concepts page.
- What ASGI vs WSGI means (one liner).
- Why CORS exists.
- What `Content-Type: application/json` does in a request header.

**Forward references:** "In the next part we'll replace the echo with a real LLM response."

**Things explicitly NOT covered yet:** dependency injection (`Depends`), routers (we still use a single file), background tasks, streaming.

---

### Part 3 — Your first LangGraph

**Slug:** `langgraph-3-first-graph` &nbsp;·&nbsp; **Reading:** 18–22 min &nbsp;·&nbsp; **Screenshots:** ~6 + 1 Mermaid diagram of the graph

**Why this part exists:** This is the *core* part of the series — the moment the reader sees what LangGraph actually is. Take this slow.

**Sections (H2/H3):**
- *What is LangGraph (and how is it different from LangChain)?* — one paragraph each. "LangChain is the library for talking to LLMs; LangGraph is a way of structuring multi-step LLM workflows as a graph of nodes."
- *The three concepts you need to know* — **State**, **Nodes**, **Edges**. Mermaid diagram of the simplest possible graph: `START → llm → END`.
- *Defining the state* — a `TypedDict` with `messages: Annotated[list[AnyMessage], add_messages]`. Explain `TypedDict`, link to concepts. Explain `Annotated` + `add_messages` in plain English ("this tells LangGraph to *append* to the list each time a node returns messages, instead of overwriting it").
- *Writing the LLM node* — a plain Python function that takes state, calls the LLM, returns the updated state. **Code shown in two tabs: OpenAI and Anthropic.**
- *Building the graph* — `StateGraph(...)`, `.add_node(...)`, `.add_edge(...)`, `.compile()`. Show the Mermaid output `graph.get_graph().draw_mermaid()` produces.
- *Calling it from FastAPI* — replace the echo body of `POST /chat` with `graph.invoke({"messages": [HumanMessage(content=req.message)]})` and return the last assistant message.
- *Try it* — `curl` the endpoint, see a real LLM reply. Screenshot of the terminal showing the response.

**Code introduced:** ~70 lines of Python. New file: `backend/app/graph.py`.

**Beginner callouts:**
- What `TypedDict` is.
- What `Annotated` does and why LangGraph uses it as a reducer signal.
- The difference between `HumanMessage`, `AIMessage`, `SystemMessage`.
- API cost reassurance: "this single call costs roughly $0.0001 — you'd need a thousand chats to spend a dollar."

**Forward references:** "Right now `/chat` waits for the whole response before returning anything. In Part 5 we'll stream tokens as they're generated."

**Things explicitly NOT covered yet:** conditional edges, multiple nodes, tools, persistence.

---

### Part 4 — The Next.js frontend

**Slug:** `langgraph-4-nextjs-frontend` &nbsp;·&nbsp; **Reading:** 18–22 min &nbsp;·&nbsp; **Screenshots:** ~8 (UI growing)

**Why this part exists:** The first part where the reader has a real *product*. By the end they're typing in a browser and getting LLM replies back. Huge motivational milestone.

**Sections (H2/H3):**
- *What we'll build* — screenshot of the final Part 4 UI (simple list + input).
- *Tour of the App Router project* — `app/page.tsx`, `app/layout.tsx`, `app/globals.css`. One paragraph each, no deep dive.
- *Install shadcn/ui* — `npx shadcn@latest init`, add `button`, `input`, `card`. Explain in one line what shadcn is.
- *Designing the chat state* — `useState` for `messages: { role: 'user'|'assistant', content: string }[]` and `input: string`. Type it with a small TypeScript interface.
- *Building the message list* — a component that maps over messages and renders each in a styled bubble. Tailwind classes shown but not overexplained.
- *Building the input* — text input + submit button, with `onSubmit` handler.
- *Wiring `fetch` to the backend* — async submit handler that POSTs to `${NEXT_PUBLIC_API_BASE_URL}/chat`, awaits the JSON, appends the assistant reply to state.
- *Loading & error states* — a `loading` boolean, an error toast (just an alert div for now), the input disabled while loading.
- *Try it end-to-end* — type something, watch the reply appear. Screenshot of the working UI with a real conversation.

**Code introduced:** ~120 lines of TypeScript across 2–3 files.

**Beginner callouts:**
- `'use client'` directive — when do you need it (when you use hooks/state).
- The browser's `fetch` API in one paragraph; link to concepts.
- Why we use `NEXT_PUBLIC_API_BASE_URL` not a hardcoded URL.
- Why state lives in the page component and not somewhere fancy (we'll keep it simple).

**Forward references:** "In Part 5 we'll replace the spinner with words streaming in as the LLM generates them."

**Things explicitly NOT covered yet:** server components, server actions, AI SDK's `useChat`, any state library, persistence across reloads.

---

### Part 5 — Streaming responses

**Slug:** `langgraph-5-streaming` &nbsp;·&nbsp; **Reading:** 15–18 min &nbsp;·&nbsp; **Screenshots:** ~5 + 1 short screen recording GIF if possible

**Why this part exists:** Streaming is what makes an LLM app feel *alive*. Also a great chance to teach Server-Sent Events without the complexity of pub/sub infrastructure.

**Sections (H2/H3):**
- *Why streaming matters* — short, with a side-by-side GIF of non-streamed (slow, awkward) vs streamed (smooth).
- *Two ways to stream* — SSE vs WebSockets, why SSE wins for one-way LLM output (one paragraph, link to concepts).
- *Streaming from LangGraph* — `async for chunk in graph.astream_events(...)`. Show the event shape (`on_chat_model_stream`, etc.) and which one we care about.
- *Streaming from FastAPI* — change `POST /chat` to return `StreamingResponse(generator(), media_type="text/event-stream")` with a tiny async generator that yields `data: <token>\n\n` for each token.
- *Reading SSE in the frontend* — instead of `await response.json()`, use `response.body.getReader()` and decode chunks. Update the latest message's `content` as tokens arrive.
- *A "Stop" button* — wire up an `AbortController`, pass its signal to `fetch`, cancel on click. Show how the backend sees the cancellation (Uvicorn logs the disconnect).
- *Polish: auto-scroll to bottom* — small effect with a ref.

**Code introduced:** ~50 lines added across backend and frontend (mostly replacing existing code, not adding new files).

**Beginner callouts:**
- What an SSE message looks like on the wire (`data: ...\n\n`) — one line.
- What `ReadableStream` and the reader API are.
- Why we use `AbortController` instead of just ignoring the response.

**Forward references:** "In Part 6 we'll give the bot tools — and you'll see how to render *intermediate* events like 'using calculator tool' in the UI."

**Things explicitly NOT covered yet:** Redis pub/sub or message queues (we don't need them — the streaming response goes straight back over the same HTTP connection), retries on disconnect.

---

### Part 6 — Giving the bot tools

**Slug:** `langgraph-6-tools` &nbsp;·&nbsp; **Reading:** 22–28 min &nbsp;·&nbsp; **Screenshots:** ~7 + 1 Mermaid diagram of the new graph

**Why this part exists:** Tools are the difference between a chatbot and an *agent*. This is the part the reader will brag about. It's also the most conceptually dense — we give it space.

**Sections (H2/H3):**
- *What is tool calling?* — one paragraph. The LLM doesn't run code; it asks the application to run code on its behalf and tells it what arguments to use.
- *Our two tools* — a `calculator` (safe `eval` over a tiny grammar — we'll write it carefully and explain why we don't use Python `eval`), and a `web_search` (Tavily free tier — show the signup, link to alternative DuckDuckGo).
- *Defining a tool with LangChain's `@tool` decorator* — show one tool implementation in full.
- *A new graph shape* — Mermaid: `START → llm → (conditional) → tools → llm → ... → END`. Explain the loop: LLM may decide to call a tool, the tool runs, the result goes back to the LLM, the LLM may decide to call another tool or to finalize.
- *Binding tools to the LLM* — `llm.bind_tools([calculator, web_search])`. Explain what this *does* (it makes the LLM aware tools exist and emit tool-call requests).
- *The ToolNode* — `from langgraph.prebuilt import ToolNode`. We use the prebuilt one rather than writing our own.
- *The conditional edge* — `add_conditional_edges("llm", tools_condition, {"tools": "tools", END: END})`. Walk through what `tools_condition` returns.
- *Updating the streaming events* — now there's a new event type to handle: `on_tool_start` and `on_tool_end`. Show how we send these to the frontend as a different SSE event type.
- *Rendering tool calls in the UI* — a small `<ToolCallBubble>` component that shows "🛠 Using `calculator(2+2)`" → "→ result: 4". Subtle styling, distinct from user/assistant bubbles.
- *Try it* — ask "what is 23 * 17 plus the population of Tokyo?", watch both tools fire in sequence. Screenshot.

**Code introduced:** ~100 lines of Python (one new file `tools.py`), ~40 lines of TypeScript.

**Beginner callouts:**
- The ReAct loop, briefly.
- Why we never `exec` LLM output.
- What "binding" tools to an LLM means under the hood (it adds them to the API request as the `tools` parameter).
- The cost note: tool calls multiply LLM calls; show how many tokens a tool-heavy conversation might use.

**Forward references:** "In Part 7 we'll make the bot remember past conversations so you can pick up where you left off."

**Things explicitly NOT covered yet:** MCP servers, custom tool schemas with Pydantic, parallel tool execution (LangGraph does it automatically, mention it in a callout but don't dive in).

---

### Part 7 — Conversation memory

**Slug:** `langgraph-7-memory` &nbsp;·&nbsp; **Reading:** 18–22 min &nbsp;·&nbsp; **Screenshots:** ~6

**Why this part exists:** Reader can now have an actual conversation, not just a one-shot Q&A. Also introduces the *concept* of persistence without forcing a database on them.

**Sections (H2/H3):**
- *The problem* — show in screenshots: ask "my name is Alex", then "what's my name?". Bot has no idea. Explain why.
- *Threads — the unit of memory* — every conversation has an ID; that ID is the key memory hangs on.
- *LangGraph's checkpointer* — `InMemorySaver`. One line to add. Pass `{"configurable": {"thread_id": <id>}}` to every graph call.
- *Generating thread IDs* — on the frontend, on first message, generate a UUID and store it in component state (and `localStorage` for survival across reloads).
- *Wiring the thread ID end-to-end* — request now includes `thread_id`; backend passes it into the graph config.
- *Try it* — name yourself, then ask the bot to recall it. Now ask a math question that depends on earlier context.
- *A "New chat" button* — generates a new thread ID, clears the message list. Old thread is still in memory; we just stopped pointing at it.
- *(Stretch) A simple sidebar of past threads* — read all thread IDs from `localStorage`, list them as buttons that swap the active thread. We rebuild the message list by reading from the checkpointer.
- *The caveat: `InMemorySaver` dies on restart* — pointer to Part 8 / future work where we'd swap in `SqliteSaver` or `PostgresSaver`.

**Code introduced:** ~30 lines of Python, ~80 lines of TypeScript for the sidebar.

**Beginner callouts:**
- What a checkpointer *is* (a key-value store the graph reads/writes its state to, keyed by thread ID).
- What `localStorage` is (and that it's per-browser, per-origin — not shared across devices).
- The trade-off of in-memory vs persistent storage.

**Forward references:** "In Part 8 we'll deploy this to the internet so you can share it. If you want to keep memory across server restarts, the closing section points to where to learn about `SqliteSaver` and `PostgresSaver`."

**Things explicitly NOT covered yet:** auth (so multiple users don't see each other's threads), summarization of long histories, server-side thread storage with a database, search across threads.

---

### Part 8 — Deploying to the internet

**Slug:** `langgraph-8-deploy` &nbsp;·&nbsp; **Reading:** 15–18 min &nbsp;·&nbsp; **Screenshots:** ~8 (lots of dashboards)

**Why this part exists:** "I built it" feels different from "I shipped it." This is the victory lap.

**Sections (H2/H3):**
- *Two deployments* — frontend (Vercel) and backend (we'll pick one of: Fly.io, Render, Railway).
- *Why we split them* — the frontend is static-friendly and CDN-distributed; the FastAPI process needs to be a long-lived server (and stream).
- *Prep the backend for production* — pin dependencies (`requirements.txt`), add a `Procfile` or `fly.toml`, set the CORS origin to your future Vercel URL.
- *Deploy the backend* — step-by-step for the chosen platform, including setting `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` as secrets.
- *Get your backend URL* — copy it.
- *Push the frontend to GitHub* — quick walkthrough if the reader hasn't done it yet.
- *Connect to Vercel* — import repo, set `NEXT_PUBLIC_API_BASE_URL` to the backend URL, click Deploy.
- *Update CORS* — go back to backend env, add the production Vercel URL.
- *Try it from your phone* — screenshot of the chat working on mobile.
- *Where to go from here* — closing section. Bullet list of next steps and what each unlocks:
  - **Swap `InMemorySaver` for `SqliteSaver` or `PostgresSaver`** — memory survives restarts.
  - **Add auth (Clerk / NextAuth)** — separate users.
  - **Move heavy work to a background queue (Celery / RQ)** — link out to the reference architecture as the "graduate" version.
  - **Add more tools** — MCP servers, custom tools, vector search.
  - **Try a different LLM** — local with Ollama, the other commercial one.

**Code introduced:** Mostly config files (Procfile / fly.toml / requirements.txt). Maybe 30 lines total.

**Beginner callouts:**
- The difference between *build-time* and *runtime* env vars (this trips Next.js newcomers).
- Why API keys must never be set on the frontend (`NEXT_PUBLIC_*` is shipped to the browser).
- The "the LLM bill is now metered by the public internet" warning — recommend setting a hard spending cap on the LLM provider dashboard.

**Forward references:** None — this is the end. The closing list IS the forward reference.

**Things explicitly NOT covered:** custom domains, observability (LangSmith / Sentry), CI/CD pipelines, monitoring.

---

## 4. The shared "Concepts" page

**Slug:** `langgraph-concepts` (lives in `content/posts/` so the existing post route serves it)
**Reading:** ~10 min if read end-to-end, but designed to be jumped into via fragment URLs.

A single MDX file with `<h2 id="...">` anchors for every concept linked from any part. Each section is 2–4 short paragraphs — enough to genuinely understand it, not a treatise.

**Anchors I currently know we'll need:**
- `#virtual-environments`
- `#async-await`
- `#asgi-vs-wsgi`
- `#cors`
- `#typed-dict`
- `#annotated-reducers`
- `#use-client`
- `#jsx`
- `#fetch-api`
- `#readable-stream`
- `#sse`
- `#abort-controller`
- `#react-pattern`
- `#tool-calling`
- `#checkpointers`
- `#local-storage`
- `#build-time-vs-runtime-env-vars`

The page also opens with a one-paragraph "How to read this" so a reader who lands here from a callout knows it's a reference, not a tutorial.

---

## 5. Recurring decisions for the whole series

These are conventions the reader sees over and over — picking them up front keeps the parts consistent.

| Decision | Choice | Why |
|---|---|---|
| Repo layout in the tutorial | Single repo, two folders: `backend/` and `frontend/` | Simplest mental model; matches reference project |
| Python package manager | `pip` + `venv` (mention `uv` in a sidebar) | Universally installed; `uv` adds a setup step beginners stumble over |
| Frontend package manager | `npm` | Comes with Node; no flag wars |
| Type checking on the frontend | Yes (default `create-next-app` TS) | Catches a class of bugs the reader would otherwise hit |
| LLM provider snippets | Tabs: **OpenAI** (default tab) and **Anthropic** | Reader picks once in Part 1 and sticks |
| Code block format | `filename="backend/app/main.py"` on every snippet | Matches existing blog convention |
| Diff vs full rewrites | Full file shown when it's ≤30 lines; otherwise add/remove with `// ← new` style comments | Beginners get lost in diffs |
| Screenshot frame | macOS-style (default for the author); add an OS note if a Windows path differs | Reader's OS may differ; we handle the cases we know break |
| Models named in code | `gpt-5.4-mini` / `claude-haiku-4-5` | User's stated choice; cheap, fast, currently latest in each line |
| Hero image per part | Yes — a single screenshot of "what you'll have built by the end of this part" | Sets the goal visually before the reader starts |

---

## 6. Open questions for you

Things I'd like your input on before I start writing posts or building infra. None are blockers for the breakdown itself — just choices we'll need at some point.

1. **Series name** — I've been writing it as "A Complete Beginner's Guide to LangGraph (with FastAPI and Next.js)" to echo the reference style. Alternatives:
   - *"LangGraph from Scratch: A Streaming Chatbot in FastAPI and Next.js"* (more outcome-focused)
   - *"Build a Streaming AI Agent — A Beginner's Series in LangGraph, FastAPI, and Next.js"* (more discoverable, longer)

2. **Backend hosting choice for Part 8** — Fly.io, Render, or Railway? All three work; pick one to write step-by-step for. My lean is **Fly.io** (generous free tier, supports long-lived processes well, has good docs). Could also write for **Render** which is even simpler but slower to cold-start.

3. **Web search tool in Part 6** — Tavily (best for LLM use, free tier requires a quick signup) or DuckDuckGo via the `duckduckgo-search` Python lib (no signup, less LLM-friendly results). I'd lean Tavily for output quality.

4. **Calculator tool implementation** — Two options:
   - A safe AST-based evaluator (we write 20 lines that handle `+ - * / ^ ( )` and reject everything else). Reinforces a real-world skill (never `eval` LLM output).
   - Use `numexpr` or similar library. Easier, less educational.
   - I lean toward the AST version with the explanation — it's exactly the kind of "respect the security boundary" moment a beginner tutorial should normalize.

5. **Authoring cadence** — write all 8 parts before publishing any, or release weekly as each is finished? The series page can show "upcoming" placeholders if you want the latter, but I'd suggest writing 1–2 first as a quality bar then publishing the rest as they land.

6. **Code repo for the reader** — should we publish a companion GitHub repo (`yadneshsalvi/langgraph-tutorial`) with one branch per completed part (`part-1-setup`, `part-2-fastapi-basics`, ...)? Hugely valuable for readers who get stuck or want to skip ahead, but it's its own maintenance burden. The reference Django guide does this and it's heavily used.

7. **Should Part 1 include a `git init` and "commit at the end of each part" habit?** I think yes — it's a "real developer" reflex worth normalizing, and lets readers easily back out if they break something. ~5 extra lines per part.

8. **shadcn vs raw Tailwind** in Part 4 — shadcn gives nicer components for free but adds an install step and a 5-minute learning curve. I'd lean shadcn (matches the reference project, looks professional out of the box). Could also do raw Tailwind to keep the dependency surface tiny.

---

## 7. Suggested order of work

1. Approve / revise this plan (you).
2. Build the series infrastructure (PRs described in §2). I'll bring a separate implementation plan before coding.
3. Write Part 1 as the **quality reference** — full screenshots, every callout, every tab. Get feedback, lock the tone.
4. Write Parts 2–8 in order, batching reviews every 2 parts.
5. Write the Concepts page in parallel with Parts 2–3 (it gets populated as the parts that link to it are drafted).
6. Public launch: announce on whatever channels you use, post the series-landing URL.

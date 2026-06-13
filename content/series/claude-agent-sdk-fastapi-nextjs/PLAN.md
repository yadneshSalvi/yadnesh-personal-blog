# Series Plan — Agent SDK from Scratch: Build an AI Data Analyst with Claude's Agent SDK, FastAPI and Next.js

> Internal planning document. Not served by the blog (the post loader only scans `content/posts/*.mdx`).
> Created 2026-06-12 — after analyzing the production reference app
> (`~/code/afgi/agent_private_credit4/agent_private_credit`) and the current Claude Agent SDK docs
> (`claude-agent-sdk` v0.2.x, June 2026). The four structural decisions in §6.1 were made by Yadnesh
> on 2026-06-12; remaining open questions in §6.2.

---

## 1. Overview

### What we're building (across the whole series)

An **AI data analyst** you run on your own machine and talk to in the browser. You drop a CSV
into its workspace, ask a question in plain English, and watch it read your files, write and run
its own Python, and hand you back a chart and a written report — with every step streaming live
into the UI.

- **Backend:** Python 3.13 + FastAPI + **Claude Agent SDK** (`claude-agent-sdk`)
- **Frontend:** Next.js 16 (App Router) + Tailwind CSS 4
- **LLM:** Anthropic only — the Agent SDK is Anthropic's product. Default model
  `claude-haiku-4-5` (a `MODEL` constant, one line to upgrade to `claude-sonnet-4-6`).
- **State:** The SDK's built-in session storage (JSONL on disk) through Part 11; SQLite arrives
  in Part 12 for the durable event log. No Postgres, no Docker, no Redis anywhere in the series.

The core insight the series sells: **the Agent SDK is the engine inside Claude Code, exposed as a
Python library.** You don't build an agent loop, tool executor, or context manager — you get
Read/Write/Bash/Glob/Grep/WebSearch and the whole think-act-observe loop for free, and the series
is about putting a product around that engine.

### Two audiences, two acts

Unlike the LangGraph series (pure beginner), this one explicitly serves two readers:

- **Act I — Build the product (Parts 1–9, beginner).** Same audience as the LangGraph series:
  can write a Python function and a React component, never touched FastAPI/Next.js/the SDK.
  Ends with a complete, working analyst: uploads, streaming tool activity, artifacts panel,
  conversation memory.
- **Act II — Make it production-grade (Parts 10–13, intermediate).** The patterns a real
  production app uses (drawn directly from the reference app): custom tools via in-process MCP,
  human-in-the-loop tool approvals, durable streams that survive a page refresh, subagents and
  skills.

Every Act II part opens with a one-line jump-in instruction ("Start from the `part-9-sessions`
branch of the companion repo") so an intermediate dev can skip Act I entirely. The series landing
page gets a short "Two ways to read this series" section making the same offer.

### How this relates to the LangGraph series

Sibling series, same blog, deliberately different altitude:

- **LangGraph from Scratch** = build the engine yourself (state, nodes, edges, your own tool
  loop, your own checkpointer).
- **Agent SDK from Scratch** = drop in a crate engine and build the car around it.

Both use FastAPI + Next.js + SSE, so the web-plumbing lessons rhyme on purpose — a reader who
finishes either series will recognize half the moves in the other. Part 3 and Part 4 link to the
LangGraph series for the gentler from-zero FastAPI/SSE treatment rather than re-teaching it at
full length (see §5 for the pacing consequence). The series share the blog's series
infrastructure (§2).

### Tone

Identical to the LangGraph series and governed by **WRITING-STYLE.md** (the house style guide —
hooks, voice, banned words, comics, the pre-publish checklist). This plan only adds the
series-specific material the style guide needs: the analogy bank extension (§5.2) and the comic
seed table (§5.3).

### Beginner concept handling

Same two-layer approach as the LangGraph series:

1. **Inline `<Callout type="info">` boxes** for 1–3 sentence clarifications.
2. **A shared "Concepts" page** at `/blog/agent-sdk-concepts` (frontmatter `kind: reference`),
   linked via fragment URLs.

This series' concepts page is **self-contained**: it covers the SDK/agent concepts plus the
handful of generic web concepts the series needs (async/await, SSE, EventSource). Three or four
entries will overlap with the future `langgraph-concepts` page; each overlapping entry stays
short and cross-links to its sibling once both exist. Self-containment beats a publication-order
dependency between the two series.

---

## 2. Series infrastructure (blog changes)

**Inherit everything from the LangGraph plan §2** — frontmatter (`series`, `seriesPart`,
`kind: reference`, `imageDark`), `content/series/<slug>/index.mdx` metadata files, URL structure,
`lib/series.ts`, the four series components, the content-pipeline prerequisites (rehype-slug,
CodeBlock restyle, `<Figure>`, heading anchors), and the homepage strip. The infrastructure is
series-agnostic by design; whichever series ships first builds it, and this one drops in.

Deltas specific to this series:

### 2.1 No `<CodeTabs>` requirement

The LangGraph plan's `<CodeTabs>` (OpenAI/Anthropic provider tabs) is irrelevant here — the
Agent SDK is single-provider. Every code block is a plain single-variant block. If this series
ships first, `<CodeTabs>` drops out of the prerequisite list and gets built with the LangGraph
series instead.

### 2.2 Act grouping in the series TOC (small optional extension)

Thirteen parts is a long flat list. Add an optional `stages` array to the series `index.mdx`
frontmatter:

```yaml
stages:
  - { name: "Act I — Build the product", from: 1, to: 9 }
  - { name: "Act II — Make it production-grade", from: 10, to: 13 }
```

`SeriesToc` renders each stage as a mono uppercase hairline divider (the design system's existing
kicker vocabulary — no new visual language). When `stages` is absent, the list stays flat, so the
LangGraph series is unaffected. ~30 minutes of work; degrade gracefully if cut.

### 2.3 Files

```
content/
  posts/
    agent-sdk-1-setup.mdx … agent-sdk-13-subagents-skills.mdx
    agent-sdk-concepts.mdx           # kind: reference
  series/
    claude-agent-sdk-fastapi-nextjs/
      PLAN.md                        # this file — ignored by the loader
      index.mdx                      # series metadata + intro (incl. "Two ways to read")
public/
  series/
    agent-sdk/
      hero.png / hero-dark.png
      part-8-artifacts-panel.png
      … (etc.)
  images/series/agent-sdk/part-N/…   # figures, comics, covers per WRITING-STYLE §8–10
```

Series cover: code-drawn SVG composition per WRITING-STYLE §10, icon row **Anthropic ·
FastAPI · Next.js** from `public/icons/` (no LangGraph icon, obviously). The series dessert
shot — chat on the left, artifacts panel on the right showing a revenue chart and a written
report — doubles as the hero.

---

## 3. Tutorial breakdown

13 parts in two acts. Same rules as the LangGraph series: every part ends with something
runnable, never a "trust me" cliffhanger; the reader can always name the capability they gained.

### Pacing

| Part | Act | Working result at the end | Reading time |
|---|---|---|---|
| 1 | I | Both servers run; a 5-line script gets a real answer from the SDK | 12–15 min |
| 2 | I | A terminal agent that reads your CSVs and runs its own Python to answer questions | 18–22 min |
| 3 | I | `POST /chat` returns the agent's answer over HTTP | 12–15 min |
| 4 | I | The agent's text *and tool calls* stream as SSE events, watchable with `curl -N` | 18–22 min |
| 5 | I | A browser chat UI with token-by-token streaming | 18–22 min |
| 6 | I | Live tool badges ("Reading sales.csv…", "Running Bash…") + markdown answers | 15–18 min |
| 7 | I | Per-conversation workspaces; drag a CSV in, ask about it | 15–18 min |
| 8 | I | Charts and reports the agent produced open in an artifacts side panel | 18–22 min |
| 9 | I | The analyst remembers the conversation; sessions sidebar; "New analysis" button | 15–18 min |
| 10 | II | The agent queries a real SQLite database through your custom tool | 18–22 min |
| 11 | II | Risky commands pause and wait for your Approve/Deny click | 22–28 min |
| 12 | II | Refresh mid-response and the stream picks up exactly where it left off | 22–28 min |
| 13 | II | A reviewer subagent checks the numbers; a Skill enforces house report style | 18–22 min |

Act I ≈ 2h30m reading; Act II ≈ 1h25m; total ≈ 4h. Hands-on, probably 10–14 hours for a real
beginner doing all thirteen.

### The event vocabulary (defined once, used everywhere)

Part 4 establishes the SSE envelope — `data: {"type": ...}\n\n` — and the rest of the series only
ever *adds event types*, never changes the parser. This is the same extensibility lesson the
LangGraph series teaches, taken further:

| `type` | Introduced | Payload |
|---|---|---|
| `session_start` | Part 4 | `session_id` (+ `workspace_id` from Part 7) |
| `text_delta` | Part 4 | `text` |
| `tool_use_start` | Part 4 | `tool_id`, `tool_name`, `tool_input` |
| `tool_result` | Part 4 | `tool_id`, `content`, `is_error` |
| `complete` | Part 4 | `usage`, `total_cost_usd`, `duration_ms` |
| `error` | Part 4 | `message` |
| `artifact_update` | Part 8 | `path`, `kind`, `size` |
| `approval_request` / `approval_resolved` | Part 11 | `approval_id`, `tool_name`, `tool_input` / `decision` |
| *(SSE `id:` field — sequence numbers)* | Part 12 | enables replay + `Last-Event-ID` |

This table mirrors the production reference app's wire format almost name-for-name — deliberate,
so the series graduates a reader into reading real production code.

---

### Part 1 — Setup: two servers and a five-line agent

**Slug:** `agent-sdk-1-setup` · **Reading:** 12–15 min · **Screenshots:** ~7

**Why this part exists:** Environment problems kill beginners before frameworks do. But unlike
the LangGraph series, setup here ends with a *taste of the product*: the SDK answering a real
question in five lines, because `claude-agent-sdk` ships the whole engine (the Claude Code CLI is
bundled inside the pip package — nothing else to install).

**Sections:**
- *What you're going to build* — the dessert shot: the finished Part 13 analyst with chat,
  tool badges, and an open artifacts panel. One paragraph on the two acts and who should start
  where.
- *What the Agent SDK actually is* — the engine inside Claude Code as a Python library. One
  paragraph, link to `#agent-sdk-vs-messages-api` on the concepts page. (The full comparison
  waits for Part 2 where the reader can *see* it.)
- *Install Python 3.13 and uv* — uv chosen over pip/venv (§6.2 has the rationale and the open
  question); one callout with the pip+venv equivalents for readers who insist.
- *Install Node.js 22 LTS* — verify versions at writing time.
- *Create the project* — `mkdir ai-analyst && cd ai-analyst`, `uv init backend`,
  `uv add claude-agent-sdk fastapi 'uvicorn[standard]' python-dotenv`.
- *Get your Anthropic API key* — console walkthrough; "treat it like a password" warning box;
  recommend a $5 hard limit. Callout: as of mid-2026 Anthropic also lets Claude subscription
  plans cover Agent SDK usage via a separate credit — verify current state at writing time and
  show whichever path is cheapest for readers.
- *Hello, agent* — `hello_agent.py`: `query(prompt="What's 144 * 89?")`, iterate messages, print
  text. Five lines. Run it, get an answer. Frame what just happened: no model wiring, no message
  list management — that's the SDK's job.
- *Scaffold the frontend* — `npx create-next-app@latest frontend` (TypeScript, Tailwind, App
  Router defaults), run it, see the welcome page. We won't touch it again until Part 5; say so.
- *Make it a git repo* — `.gitignore` covering `.venv/`, `node_modules/`, `.env*`,
  `workspaces/`; first commit. Every part ends with a commit from here on.

**Code introduced:** ~10 lines of Python.

**Beginner callouts:** what uv is (and the pip equivalent); what an API key is; why the frontend
env story waits until Part 5; the "tested with" pinned version block (§5.1).

**Forward references:** "Right now the agent can think but has no hands. Next part we hand it
your file system — carefully."

**NOT covered yet:** options of any kind, tools, FastAPI, anything about the frontend.

---

### Part 2 — Meet the agent: it reads files and writes its own code

**Slug:** `agent-sdk-2-first-agent` · **Reading:** 18–22 min · **Screenshots:** ~8

**Why this part exists:** This is the series' core revelation, the equivalent of the LangGraph
series' Part 3 — except the lesson is inverted: instead of "here's how to build the loop," it's
"the loop already exists; here's how to *watch* it think." Take it slow. Everything later is
plumbing around what this part shows.

**Sections:**
- *The agent loop you didn't write* — think → act → observe → repeat, one diagram (this is one
  of the two "must be beautiful" SVGs). Link `#agent-loop`.
- *Give it a workspace* — create `workspace/` with the sample dataset (§5.1: three CSVs from the
  fictional coffee chain **Beanline** — `stores.csv`, `products.csv`, `sales.csv`; download link
  + the deterministic generator script in the companion repo).
- *ClaudeAgentOptions* — first real configuration: `cwd="workspace"`,
  `allowed_tools=["Read", "Glob", "Grep", "Bash", "Write"]`,
  `permission_mode="bypassPermissions"`, `model=MODEL`.
- *Break it on purpose (the permission wall)* — run first **without** `permission_mode` and
  watch the agent get denied tool access. Read the refusal together. Plain-English tour of
  permission modes (`#permission-modes`), then the honest scary callout: `bypassPermissions`
  means *the agent can run any shell command you can*. We accept that for now because `cwd` is a
  sandbox folder and the tool list is short — **and Part 11 exists because this is not okay for
  real apps.** This warning is a series-long arc; it gets a styled recurring callout ("Running
  with scissors — until Part 11").
- *Ask a real question* — "Which Beanline store had the highest revenue in March, and by how
  much?" Watch the terminal: the agent Globs the folder, Reads headers, writes a pandas snippet,
  runs it with Bash, answers. Screenshot of the full trace. This is the dessert moment of Act I's
  first half.
- *Anatomy of the message stream* — what `query()` actually yields: `SystemMessage` (init,
  carries `session_id` — plant the seed for Part 9), `AssistantMessage` containing `TextBlock`
  and `ToolUseBlock`, tool results coming back as `UserMessage` with `ToolResultBlock`, and the
  final `ResultMessage` with `usage` and `total_cost_usd`. One annotated trace figure mapping
  real output to types.
- *The cost ritual* — print `ResultMessage.total_cost_usd` after every run, a habit every later
  part keeps. First data point: this multi-tool analysis cost about a cent on Haiku.
- *Look at what it left behind* — `ls ~/.claude/projects/` and find the session JSONL. We don't
  use it yet; we just notice the SDK has been keeping a diary. (Foreshadows Part 9.)

**Code introduced:** ~40 lines of Python (`analyst.py`), evolving the Part 1 script.

**Beginner callouts:** `async for` over an async iterator; what each built-in tool does (one
table); why the agent *writing its own pandas* beats us writing pandas for every possible
question — that's the entire pitch of agents, in one callout; cost reassurance with real numbers.

**Forward references:** "The agent lives in your terminal. Next we put it behind a URL."

**NOT covered yet:** `ClaudeSDKClient` (the bigger sibling gets introduced in Part 11 — `query()`
carries us through Act I), custom tools, system prompts, sessions, streaming protocols.

---

### Part 3 — The FastAPI bridge

**Slug:** `agent-sdk-3-fastapi-bridge` · **Reading:** 12–15 min · **Screenshots:** ~5

**Why this part exists:** Get the agent behind HTTP with the minimum viable FastAPI — endpoint,
Pydantic models, CORS. Brisker than the LangGraph series' FastAPI part because this audience
includes intermediates; the part opens by saying "if FastAPI is brand new and this pace feels
steep, Part 2 of the LangGraph series teaches it from zero" with a link. Skippable for FastAPI
veterans — we say so up front.

**Sections:**
- *Why a server at all* — one paragraph: browsers can't (and must never) hold your API key or
  spawn the SDK.
- *App structure* — `backend/app/main.py`, run with `uv run uvicorn app.main:app --reload`.
- *`POST /chat`, blocking version* — `ChatRequest {message}` / `ChatResponse {reply, cost_usd}`;
  the endpoint runs the Part 2 loop to completion, accumulates the final text, returns JSON. An
  async endpoint calling an async SDK — point out the fit.
- *Pydantic in five minutes* — schemas, validation, and the `/docs` payoff screenshot.
- *CORS* — `CORSMiddleware` for `http://localhost:3000`, plain-English paragraph, link out.
- *Try it* — `curl -X POST localhost:8000/chat -d '{"message": "Top product by revenue?"}'`.
  Real answer over HTTP. Note the wait: the whole analysis ran before the first byte came back —
  *name* the problem (60-second silences), set up Part 4.
- *The amnesia demo* — curl a follow-up ("And the second best?") and watch it not know what
  you're talking about. Every `query()` is a fresh session. One sentence: "Part 9 fixes this;
  until then each message stands alone — which works surprisingly well for one-shot analysis
  questions, because the *files* are the memory."

**Code introduced:** ~45 lines of Python.

**Beginner callouts:** ASGI in one line; why the endpoint is `async def`; what 422 responses
mean (Pydantic rejecting bad payloads).

**Forward references:** streaming (Part 4), memory (Part 9).

**NOT covered yet:** streaming, sessions, auth, routers/dependency injection.

---

### Part 4 — Streaming: watch the agent think over HTTP

**Slug:** `agent-sdk-4-streaming` · **Reading:** 18–22 min · **Screenshots:** ~6 + 1 pipeline diagram

**Why this part exists:** An agent that disappears for a minute feels broken; an agent you can
watch feels alive. This part designs the **event vocabulary** (§3 table) that the next nine parts
extend — the single most load-bearing design decision in the series, and we say so.

**Sections:**
- *The 60-second silence* — side-by-side GIF: blocking vs streaming for the same question.
- *SSE in one screen* — `data: {...}\n\n`, why not WebSockets (one-way traffic, plain HTTP),
  link `#sse`. Readers of the LangGraph series will recognize the conveyor belt of labeled
  parcels; the analogy carries over verbatim (§5.2).
- *Designing the envelope* — the §3 event table, types `session_start` / `text_delta` /
  `tool_use_start` / `tool_result` / `complete` / `error`. The teachable moment: we're
  designing for event types we haven't invented yet (artifacts in Part 8, approvals in Part 11),
  and the parser will never change.
- *Mapping SDK messages to events* — a translator generator: `SystemMessage(init)` →
  `session_start`; `ToolUseBlock` → `tool_use_start`; `ToolResultBlock` → `tool_result`;
  `ResultMessage` → `complete`. This section is where the Part 2 message anatomy pays rent.
- *Block-level first* — `StreamingResponse(translate(query(...)), media_type="text/event-stream")`.
  Tool events arrive live; text still lands in paragraph-sized chunks. Run with `curl -N`,
  watch events scroll. Already dramatic.
- *Then token-level* — `include_partial_messages=True`; handle `StreamEvent` deltas →
  `text_delta` per token. One callout on what partial messages are (`#partial-messages`).
- *The streaming pipeline diagram* — SDK subprocess → async generator → StreamingResponse →
  browser. The second "must be beautiful" SVG.

**Code introduced:** ~70 lines of Python (`app/events.py` for envelope dataclasses + translator,
edits to `main.py`).

**Beginner callouts:** async generators (`yield` inside `async def`); what `curl -N` does; the
SSE wire format on one line; why we send JSON envelopes instead of bare text.

**Forward references:** "Right now the only consumer is curl. Time to build the real one."

**NOT covered yet:** EventSource (Part 12 — and why we start with `fetch` instead gets one
honest sentence here), reconnection, interrupts.

---

### Part 5 — The chat UI

**Slug:** `agent-sdk-5-chat-ui` · **Reading:** 18–22 min · **Screenshots:** ~8 (UI growing)

**Why this part exists:** First moment the project looks like a product. By the end the reader
types into a browser and watches tokens stream in.

**Sections:**
- *What we'll build* — screenshot of the finished Part 5 UI.
- *Tour of the App Router project* — `page.tsx`, `layout.tsx`, `globals.css`; one paragraph
  each. `NEXT_PUBLIC_API_BASE_URL` in `.env.local`, and why the prefix matters.
- *Message state* — `useState` with `{ id, role, content }[]`; small TypeScript interfaces.
  (Deliberately *not* the block model yet — see Part 6's refactor, which is the point.)
- *Message list and input* — map + bubbles, controlled input, submit handler. Tailwind shown,
  not over-explained. No component library — matches the reference app and keeps the series
  dependency-light (§6.2).
- *Reading the stream* — `fetch` POST, `response.body.getReader()`, `TextDecoder`, split on
  `\n\n`, `JSON.parse` each `data:` line, switch on `type`. Handle `text_delta` (append to the
  last assistant message) and `complete`/`error`; everything else `console.log` — open the
  console and *see* the tool events you're ignoring (forward pull to Part 6).
- *Loading and error states* — disabled input, an inline error row, the working indicator
  ("Working… 12s" — a counter that production apps show because agent turns are *long*; this is
  an agent-specific UI lesson the LangGraph series doesn't have).
- *Try it end-to-end* — ask about Beanline revenue, watch words arrive. Payoff screenshot.

**Code introduced:** ~130 lines of TypeScript across 2–3 files.

**Beginner callouts:** `'use client'`; ReadableStream + reader in one paragraph (link
`#readable-stream`); why buffering partial SSE lines matters (chunks split mid-line — show the
bug, then the fix; this is the part's deliberate break).

**Forward references:** "Open your console: the agent has been telling you about every file it
read and every command it ran. Next part we put that on screen."

**NOT covered yet:** tool rendering, markdown, uploads, stop button, sessions.

---

### Part 6 — Watching it work: tool activity in the UI

**Slug:** `agent-sdk-6-tool-activity` · **Reading:** 15–18 min · **Screenshots:** ~7

**Why this part exists:** Tool visibility is what separates "chatbot UI" from "agent UI" — the
defining UX of this whole product category (Claude Code, Cursor, the reference app). It also
forces the right data model.

**Sections:**
- *The string model breaks* — our `content: string` can't represent "wrote some text, then ran
  Bash, then wrote more text." The agent's turn is a *sequence of blocks*. Small honest refactor:
  `blocks: ({type:'text'} | {type:'tool_use'})[]` per assistant message. (This mirrors the SDK's
  own content blocks and the reference app's architecture — say so.)
- *Routing events into blocks* — `text_delta` appends to the last text block or opens one;
  `tool_use_start` pushes a tool block with `isLoading: true`; `tool_result` completes it by
  `tool_id`.
- *The tool badge* — collapsed one-liner: spinner + "Bash — `python analyze.py`" → click to
  expand input/result; error state styling when `is_error`. One component, ~50 lines.
- *Friendly tool labels* — a tiny `toolLabel(name, input)` map: Read → "Reading sales.csv",
  Bash → "Running a command". Small touch, huge perceived quality.
- *Markdown answers* — `react-markdown` + `remark-gfm` for the text blocks; the analyst's tables
  and headers finally render. One callout on not over-engineering code highlighting yet.
- *A Stop button* — `AbortController`, signal into `fetch`, cancel on click. Honest caveat
  callout: this closes the *pipe*; the SDK may finish its current tool call server-side before
  noticing. The real interrupt is a Part 12 fix (`client.interrupt()`), and we name that debt
  explicitly.
- *Auto-scroll* — small ref + effect.
- *Try it* — ask a multi-step question, watch badges appear and resolve in sequence, then the
  markdown answer. Screenshot is the part's hero.

**Code introduced:** ~120 lines of TypeScript (block model refactor, `ToolBadge`, markdown).

**Beginner callouts:** discriminated unions in TypeScript (one box); why we key tool blocks by
`tool_id` and not array position; `react-markdown` in one line.

**Forward references:** "Your analyst can only see the CSVs *we* put in its folder. Next: let
users bring their own data."

**NOT covered yet:** thinking blocks (one-line mention: the SDK can stream extended thinking;
we skip rendering it — listed in §6.2 as a possible stretch), per-tool custom renderers
(reference app pattern, mentioned in Part 13's "where next").

---

### Part 7 — Workspaces: bring your own data

**Slug:** `agent-sdk-7-workspaces` · **Reading:** 15–18 min · **Screenshots:** ~6

**Why this part exists:** A real analyst works on *your* files. This part introduces the
workspace-per-conversation pattern (straight from the reference app) and is the quiet foundation
for artifacts (Part 8) and sessions (Part 9).

**Sections:**
- *One folder per conversation* — the workspace concept: the agent's desk. Backend
  `workspaces/{workspace_id}/` created on demand; `cwd` now points at the request's workspace
  instead of the shared folder. The sandbox story from Part 2 gets *stronger* (each conversation
  is isolated), worth one callout.
- *The upload endpoint* — `POST /workspaces` (create, returns id) and
  `POST /workspaces/{id}/files` (multipart `UploadFile`, size cap, filename sanitization — the
  security callout writes itself: never trust a client-supplied path; show the `../` attack in
  one line and block it).
- *Wiring the chat request* — `ChatRequest` gains `workspace_id`; `session_start` event now
  echoes it back; first message with no id auto-creates one.
- *The upload UI* — drop zone + file chips above the input; list files from
  `GET /workspaces/{id}/files`. Keep it plain.
- *Seed data for the impatient* — a "Load sample data" button that copies the Beanline CSVs in,
  so every later screenshot works without hunting for a CSV.
- *Try it* — upload your own CSV (or the sample), ask "what's interesting in this data?",
  watch the agent explore files it has never seen. This part's small magic: *no schema, no
  config — it just reads them.*

**Code introduced:** ~70 lines of Python (workspace storage helpers, two endpoints), ~80 lines of
TypeScript (uploader, chips).

**Beginner callouts:** multipart form data in one paragraph; `UploadFile` streaming to disk; why
we generate workspace ids server-side (UUIDs, never client-chosen).

**Forward references:** "The agent can read your files. Next part it starts leaving deliverables
behind."

**NOT covered yet:** file *download*/serving (Part 8 needs it and introduces it), quota/cleanup
(one "where next" line), multi-user isolation (auth is out of series scope, §6.2).

---

### Part 8 — Artifacts: charts and reports you can open

**Slug:** `agent-sdk-8-artifacts` · **Reading:** 18–22 min · **Screenshots:** ~8

**Why this part exists:** This is the series dessert shot — the moment the analyst hands you a
chart and a written report instead of a wall of chat text. It's also where the system prompt
finally enters the series, with a real job to do.

**Sections:**
- *Tell the agent it's an analyst* — `system_prompt` appears now, when it has work to do:
  `{"type": "preset", "preset": "claude_code", "append": ANALYST_PROMPT}` — keep Claude Code's
  battle-tested tool instructions, append our house rules: save every chart as PNG via
  matplotlib, write findings to `report.md`, prefer tables over prose for numbers. Callout
  explains preset-vs-plain-string (`#system-prompt-presets`) and why production apps append
  rather than replace.
- *`uv add matplotlib` (in the workspace's reach)* — pragmatic note on the agent's Python
  environment: the Bash tool runs in the backend's env, so the backend's deps are the agent's
  deps. One honest callout about what that implies (and that real products use sandboxes —
  "where next" material).
- *Detecting what the agent made* — snapshot workspace file mtimes before the turn, diff after
  each tool result, emit `artifact_update` events. ~25 lines. (The reference app does exactly
  this; say so.) The envelope design from Part 4 absorbs the new type with zero parser changes —
  collect the payoff explicitly.
- *Serving workspace files* — `GET /workspaces/{id}/files/{path}` with mime-type guessing and
  the path-traversal guard from Part 7 reused.
- *The artifacts panel* — right-hand side panel listing artifacts as they appear (mono
  filenames, live badge); click to view: `<img>` for PNGs, `react-markdown` for `.md`,
  `<pre>` fallback. A "panel slides open when the first artifact lands" touch.
- *Try it* — "Chart monthly revenue by store and write up what you see." Watch tool badges fire,
  the panel light up with `revenue.png` and `report.md`, open both. **This screenshot is the
  series hero image.**
- *Break it on purpose* — ask for a chart when matplotlib isn't installed; read the agent's
  traceback-driven self-correction in the tool results (it usually pip-installs or adapts — an
  honest look at agent resilience and its limits).

**Code introduced:** ~60 lines of Python, ~110 lines of TypeScript (panel + viewers).

**Beginner callouts:** mime types in one line; why we diff the filesystem instead of asking the
agent to announce its files (reliability — never trust the model to self-report); prompt-writing
guidance in one box (specific, testable instructions beat vibes).

**Forward references:** "Ask a follow-up about the chart and the analyst has no idea what chart
you mean. The amnesia from Part 3 stops being funny — next part, memory."

**NOT covered yet:** PDF/notebook viewers, artifact versioning, downloading artifacts as a
bundle.

---

### Part 9 — Sessions: the analyst remembers

**Slug:** `agent-sdk-9-sessions` · **Reading:** 15–18 min · **Screenshots:** ~6

**Why this part exists:** Closes Act I. Conversation memory with **zero new infrastructure** —
the SDK has been writing session files since Part 1, and now we finally use them. The contrast
with the LangGraph series (where memory meant building checkpointer plumbing) is the point: one
option, `resume`.

**Sections:**
- *The diary the SDK kept* — back to `~/.claude/projects/`: the JSONL files, one per session,
  one message per line. Open one in the editor and read it together. Link `#sessions-and-jsonl`.
- *Capturing the session id* — we've been emitting it in `session_start` since Part 4 (collect
  the foreshadow); frontend stores it in state, sends it back as `session_id` on the next
  message; backend passes `resume=session_id` into `ClaudeAgentOptions`.
- *Try it* — "Which store grew fastest?" → "Now chart *that store's* weekly numbers." It knows.
  The single most satisfying two-message demo in the series.
- *New analysis* — button: clear messages, drop the session id and workspace id; fresh desk,
  fresh diary.
- *A sessions sidebar* — the honest scope discussion: the SDK stores *transcripts*, not an index.
  We keep a small `sessions.json` (id, title from the first user message, workspace_id,
  updated_at) the backend appends to on each `complete`. `GET /sessions` lists it; clicking an
  entry restores the session id + workspace and replays history. History replay needs a
  `GET /sessions/{id}/messages` endpoint reading the SDK's JSONL into our block model — ~40
  lines, and *this* is the part's deliberate scope splurge (it was the stretch goal in the
  LangGraph series too; here it's affordable because the transcript already exists on disk).
- *The caveat ritual* — `sessions.json` is a toy index (no concurrency safety, no search);
  Part 12 replaces it with SQLite. Memory itself survives restarts though — the JSONL is disk,
  not RAM. Contrast with the LangGraph series' `InMemorySaver` arc in one callout.
- *Act I curtain* — capabilities recap of the entire act: a complete AI data analyst, built in
  nine parts. "What's left? The gap between *works on my machine* and *production*. That's
  Act II."

**Code introduced:** ~70 lines of Python (sessions index + history endpoint), ~70 lines of
TypeScript (sidebar).

**Beginner callouts:** `resume` vs `continue_conversation` (one box, `#resume-vs-continue`);
where the JSONL lives and how `cwd` affects the storage path (gotcha: each workspace gets its own
project dir — exactly why we keep our own index); sessions are per-machine (no cloud sync —
that's what databases are for).

**Forward references:** Act II overture — the four production patterns, one line each.

**NOT covered yet:** forking sessions, transcript compaction, multi-user anything.

---

### Part 10 — Custom tools: give the analyst a database

**Slug:** `agent-sdk-10-custom-tools` · **Reading:** 18–22 min · **Screenshots:** ~6
**Act II jump-in:** "Clone the companion repo at `part-9-sessions` and you're exactly here."

**Why this part exists:** Act II opener. Built-in tools read files; real analysts query systems.
The `@tool` decorator + in-process MCP server is the SDK's extension mechanism and the gateway
drug to the whole MCP ecosystem.

**Sections:**
- *Why a custom tool at all* — Beanline's "live" data lives in `beanline.db` (SQLite — provided
  builder script), not CSVs. The agent *could* Bash its way in with `sqlite3`, and that's worth
  showing (it works! agents are resourceful!) — then the case for a proper tool: schema
  awareness, guardrails, and the read-only enforcement Bash can't give you.
- *Your first `@tool`* — `query_database(sql)`: docstring-quality description (the model *reads*
  it — tool descriptions are prompts, the part's key insight), simple `{"sql": str}` schema,
  opens SQLite in read-only mode (`file:...?mode=ro` — the security beat), returns rows as a
  markdown table in `content`.
- *An MCP server inside your process* — `create_sdk_mcp_server(name="beanline", tools=[...])`,
  `mcp_servers={"beanline": server}` in options. One diagram: external MCP servers (stdio,
  subprocess) vs in-process SDK servers (a function call). Link `#mcp`.
- *The naming convention* — `mcp__beanline__query_database`; add to `allowed_tools`; the
  `mcp__server__*` wildcard. This trips everyone — give it its own H3 and a deliberate break
  (misspell the tool name, watch the agent not see the tool, fix it).
- *A second tool for shape contrast* — `get_schema()` with no arguments returning the table DDL,
  so the agent stops guessing column names. Two tools is a *pattern*; one is a trick.
- *Tool badge polish* — friendly label for the new tools in the Part 6 `toolLabel` map; SQL
  shown in the expanded badge with `<pre>`.
- *Try it* — "Compare Q1 vs Q2 revenue from the database and chart the difference" — custom tool
  + Bash + matplotlib + artifact panel, all four systems firing together. Screenshot.

**Code introduced:** ~90 lines of Python (`app/tools.py`, db builder script), ~10 lines of
TypeScript.

**Beginner callouts:** what MCP is in two sentences (`#mcp`); in-process vs external servers and
when you'd want each; "tool descriptions are prompts"; why read-only enforcement lives in the
*tool*, not the prompt.

**Forward references:** "Our agent now touches a database with no oversight, running with
Part 2's scissors. Time to take them away."

**NOT covered yet:** external/third-party MCP servers (one pointer), tool annotations, structured
output.

---

### Part 11 — Permissions and approvals: the human in the loop

**Slug:** `agent-sdk-11-approvals` · **Reading:** 22–28 min · **Screenshots:** ~7 + 1 sequence diagram

**Why this part exists:** Pays off the series-long "running with scissors" arc, and it's the
single most valuable production pattern in the reference app: risky tool calls pause the agent
mid-turn and wait for a human click. Conceptually the densest part of the series — it gets the
most space and the sequence diagram.

**Sections:**
- *The incident that motivates it* — open with the demo: ask the agent to "clean up old files"
  and watch it cheerfully construct an `rm` command. Nothing bad happens (sandbox), but the
  reader feels it. [ANECDOTE slot: an agent/automation doing something destructive with
  confidence — WRITING-STYLE §6 shape.]
- *Meet `ClaudeSDKClient`* — `query()`'s bigger sibling: a connected client with `connect()`,
  `query()`, `receive_response()`, `interrupt()`. We switch now because the permission callback
  and interrupts need a live two-way channel. Migration is ~10 lines; show the diff.
- *The `can_use_tool` callback* — the SDK calls *your async function* before a gated tool runs;
  you return `PermissionResultAllow` or `PermissionResultDeny`. Demote `Bash`/`Write`/`Edit`
  from `allowed_tools`; drop `bypassPermissions`. The scissors come off the table — make the
  callout where the Part 2 warning finally resolves.
- *The bridge: an event out, a Future in* — the part's architectural heart, with the sequence
  diagram: callback fires → emit `approval_request` SSE event → create `asyncio.Future` in a
  pending dict → **the agent is now genuinely paused** → user clicks → `POST
  /approvals/{id}/decision` resolves the Future → callback returns → tool runs (or doesn't).
  Link `#futures-and-events`.
- *The approval card* — new event types in the Part 4 vocabulary (`approval_request`,
  `approval_resolved`); frontend renders an inline card: tool name, command preview,
  Approve / Deny buttons; resolves into a badge either way.
- *Timeouts and disconnects* — a Future nobody resolves leaks a paused agent forever:
  `asyncio.wait_for` with a deny-on-timeout, and deny-all on stream teardown. Production
  pragmatics the reference app handles; we do the honest minimum.
- *Always-allow* — "Approve and don't ask again for `Read`": a per-session allowlist checked
  before emitting the request. Ten lines, big UX win, and it teaches that permission policy is
  *your* code — the SDK just asks.
- *Try it* — re-run the cleanup demo: the agent proposes `rm`, the card appears, you press Deny,
  and the agent — this is the magic — *acknowledges the denial and finds another way*. The
  denial goes back into the loop as information.

**Code introduced:** ~110 lines of Python, ~80 lines of TypeScript.

**Beginner callouts:** `asyncio.Future` in one box (a promise someone else resolves); why the
callback must not block the event loop; permission UX philosophy in three lines (gate by
blast-radius, not by tool count — Read is safe, Bash is not).

**Forward references:** "One thing still embarrasses us: refresh the page mid-analysis and
everything vanishes. Next: streams that survive."

**NOT covered yet:** `PreToolUse`/`PostToolUse` hooks (one callout naming them as the *other*
interception point, link to concepts page), full RBAC/auth.

---

### Part 12 — Durable streams: survive the refresh

**Slug:** `agent-sdk-12-durable-streams` · **Reading:** 22–28 min · **Screenshots:** ~6 + 1 architecture diagram

**Why this part exists:** The deepest architecture lesson in the series and the reference app's
production streaming design taught at tutorial scale: decouple *running the agent* from
*watching the agent*. Also pays the two debts the series has been carrying: the fake Stop button
(Part 6) and the toy `sessions.json` (Part 9).

**Sections:**
- *Break it first* — mid-analysis, hit refresh. Gone. The agent finished its work server-side;
  nobody was listening. Name the root cause: the agent's lifetime is chained to one HTTP
  response.
- *The decoupling* — `POST /chat` now just *starts* a background task and returns
  `{request_id, stream_url}`; the agent runs in an `asyncio.create_task` worker, writing events
  to a log and broadcasting to whoever's subscribed. `GET /stream/{request_id}` is a dumb pipe:
  replay-then-follow. Architecture diagram (worker → SQLite event log → broadcast hub →
  N subscribers).
- *SQLite enters* — `events` table (`request_id`, `seq`, `type`, `payload`) and a `sessions`
  table replacing `sessions.json`. `aiosqlite`, two migrations by hand, no ORM — keep the
  teaching surface small (§6.2 decision).
- *Sequence numbers and the `id:` field* — every SSE message gets `id: {request_id}:{seq}`;
  replay = `WHERE seq > last_seen`. The event vocabulary from Part 4 needed *zero* changes to
  become durable — collect that design payoff explicitly.
- *Switching to EventSource* — the right tool now that the stream is a GET: automatic
  reconnection with `Last-Event-ID` sent for free. Honest one-box comparison with the
  fetch-reader we've used since Part 5 (and why we taught that first: POST bodies, visible
  parsing). Refresh survival = `sessionStorage` keeps `request_id`, reconnect with
  `?last_event_id=`. Dedup guard on the client.
- *A real Stop button* — the worker holds the `ClaudeSDKClient`; `POST /chat/{request_id}/cancel`
  calls `client.interrupt()`. The Part 6 caveat resolves; the agent actually stops.
- *Try it* — start a long analysis, refresh mid-stream: events replay and the live tail
  continues. Then the show-off: open a second tab, watch the *same* analysis stream in both.
  Screenshot of the pair.

**Code introduced:** ~150 lines of Python (worker, event log, hub, cancel), ~60 lines of
TypeScript (EventSource migration).

**Beginner callouts:** `asyncio.create_task` lifetime gotchas (keep a reference!); SSE
auto-reconnect semantics; at-least-once delivery and why the client dedups; "this is the same
shape as production systems backed by Postgres + Redis — SQLite is the training wheels, the
*architecture* is the lesson."

**Forward references:** "The analyst is robust now. Last part: making it *better at its job*."

**NOT covered yet:** multi-process scaling (the hub is in-process — one honest callout),
horizontal deployment.

---

### Part 13 — Subagents and skills: the analyst grows a team

**Slug:** `agent-sdk-13-subagents-skills` · **Reading:** 18–22 min · **Screenshots:** ~6

**Why this part exists:** The capstone — two highest-leverage quality mechanisms the SDK gives
you for free, and the series' closing argument that you now understand the same machinery Claude
Code itself runs on. Ends with the series retrospective and the "where to go from here" map.

**Sections:**
- *The trust problem* — the analyst is confident, fast… and occasionally wrong. You could prompt
  it to "double-check," or you could give it a colleague whose *only job* is checking.
- *Subagents* — `agents={"reviewer": AgentDefinition(description=..., prompt=..., tools=["Read",
  "Glob", "Grep", "Bash"])}`; the main agent delegates via the agent tool; the reviewer
  re-derives key numbers in a fresh context and reports discrepancies. Why fresh context is the
  feature (no anchoring on the original's reasoning) — link `#subagents`.
- *Watching delegation* — subagent activity arrives in the same message stream; surface it with
  a "Reviewer" variant of the tool badge. Try it: introduce a deliberate data trap (a duplicated
  March row in the sample data — planted in the builder script for exactly this moment), watch
  the reviewer catch what the analyst missed.
- *Skills* — the other axis: not *who* works, but *how*. A skill = a markdown playbook the agent
  loads on demand. Write `.claude/skills/beanline-report/SKILL.md` (house report format:
  required sections, chart conventions, tone), enable `setting_sources=["project"]` + `Skill` in
  `allowed_tools`. Before/after screenshots: free-form report vs house-style report. The
  insight: **skills are knowledge you'd otherwise stuff into every prompt** — link `#skills`.
- *Prompt vs tool vs skill vs subagent* — the part's synthesis: a one-table decision guide for
  where a given improvement belongs. This table is the series' graduation exam.
- *Series retrospective* — what you built, act by act; the full event vocabulary table now
  complete; the reference-app comparison ("the production app this series is based on adds
  Postgres, auth, plan mode — you can now read its code").
- *Where to go from here* — each with one line on what it unlocks:
  - **Deploy it** — frontend on Vercel; the backend needs a **long-lived server with a real
    disk** (Fly.io / a VPS): the SDK spawns a CLI subprocess and writes sessions to disk, so
    serverless platforms break it — the same lesson as the LangGraph series, for an even more
    physical reason. (A possible future bonus part — §6.2.)
  - **Postgres + real auth** — multi-user, the reference app's path.
  - **Hooks** (`PreToolUse`/`PostToolUse`) — audit logs, guardrails, output rewriting.
  - **External MCP servers** — the public ecosystem (GitHub, Slack, Playwright…).
  - **Extended thinking, plan mode, `AskUserQuestion`** — three reference-app features, one
    sentence each.
  - **Sandboxing the Bash tool** — containers/microVMs; why production agents don't run on the
    host.

**Code introduced:** ~60 lines of Python (agent definition + skill file), ~30 lines of
TypeScript.

**Beginner callouts:** subagent cost note (delegation multiplies tokens — show the
`total_cost_usd` delta honestly); skills vs RAG in two sentences; `setting_sources` and what
else it loads (and why we kept it off until now — explicitness over magic).

**Forward references:** None — the "where next" list is the ending.

---

## 4. The shared "Concepts" page

**Slug:** `agent-sdk-concepts` (in `content/posts/`, frontmatter `kind: reference` — excluded
from listings, included in search). Same mechanics as the LangGraph concepts page: one `h2` per
concept, 2–4 short paragraphs each, served by `rehype-slug` IDs + hover anchors.

**Anchors:**

- `#agent-loop` — think/act/observe; what "agentic" actually means
- `#agent-sdk-vs-messages-api` — the 10-lines-vs-100 story; when to use which
- `#built-in-tools` — the toolbox tour
- `#permission-modes` — default / acceptEdits / plan / bypassPermissions
- `#can-use-tool` — the permission callback contract
- `#hooks` — PreToolUse/PostToolUse et al. (referenced, not taught)
- `#sessions-and-jsonl` — where transcripts live, resume mechanics
- `#resume-vs-continue` — the two continuation options
- `#system-prompt-presets` — preset + append vs plain string
- `#mcp` — the protocol, external vs in-process servers, `mcp__server__tool` naming
- `#subagents` — fresh-context delegation
- `#skills` — playbooks on demand
- `#partial-messages` — StreamEvent and token-level streaming
- `#async-await` / `#async-generators` — Python side (short; cross-link langgraph-concepts when it exists)
- `#sse` / `#readable-stream` / `#event-source` — the three transport concepts, including
  fetch-reader vs EventSource trade-offs
- `#futures-and-events` — asyncio.Future as a "promise someone else resolves"
- `#cost-and-tokens` — how agent turns are billed; reading `usage`

Opens with the same one-paragraph "How to read this" note as its sibling.

---

## 5. Recurring decisions for the whole series

### 5.1 Conventions table

| Decision | Choice | Why |
|---|---|---|
| Repo layout | Single repo: `backend/` + `frontend/`; `backend/workspaces/` gitignored | Matches reference app; simplest mental model |
| Python tooling | **uv** (`uv init`, `uv add`, `uv run`) — pip+venv equivalents in one Part 1 callout | 2026 default, kills venv-activation pain, matches the production app; divergence from the LangGraph series is deliberate (§6.2) |
| Frontend packages | npm, no UI component library | Matches reference app; fewer moving parts than shadcn for this UI |
| Model | `MODEL = "claude-haiku-4-5"` constant; one callout on upgrading to `claude-sonnet-4-6` for better analyses | Cheapest current model; agentic loops multiply tokens, so default cheap |
| The cost ritual | Every part prints/streams `total_cost_usd`; parts quote real costs | Cost-awareness is an agent-specific skill; ResultMessage makes it free |
| Provider tabs | None — single-provider series | The SDK is Anthropic-only; `<CodeTabs>` not used |
| Event vocabulary | One envelope format (§3 table), defined Part 4, only ever extended | The series' central design lesson; mirrors the reference app |
| Permission arc | `bypassPermissions` + sandbox cwd (Parts 2–10, with a recurring styled warning) → real permissions in Part 11 | A deliberate series-long tension with a named payoff |
| SDK entry point | `query()` for Act I; `ClaudeSDKClient` from Part 11 | Simplest thing that works, upgraded exactly when its features (callback, interrupt) are needed |
| Sample data | **Beanline**, a fictional specialty-coffee chain: `stores.csv`, `products.csv`, `sales.csv` (+ `beanline.db` in Part 10); deterministic generator script in companion repo; one planted data flaw for Part 13 | Relatable domain, rich enough for real questions, no licensing issues |
| Persistence ladder | SDK JSONL (free, Part 9) → `sessions.json` (toy index, Part 9) → SQLite (Part 12) | Each step introduced when its predecessor visibly fails; no Postgres/Docker in series |
| Code blocks | ≤25 lines, `filename="..."` meta, runnable as shown against pinned versions | WRITING-STYLE §7 |
| "Tested with" block | Top of Part 1 + companion README: Python 3.13.x, Node 22.x LTS, Next.js 16.x, `claude-agent-sdk` pinned at writing time | SDK is 0.2.x and moves fast — version pinning matters *more* here than in the LangGraph series |
| Screenshots | Same fixed combo as the LangGraph series (light browser, dark terminal) | One blog, one look |
| Companion repo | `yadneshsalvi/claude-agent-sdk-tutorial`, one branch per part (`part-1-setup` … `part-13-subagents-skills`) | Act II jump-in depends on it; frozen branches, low maintenance |
| Hero image per part | "What you'll have at the end of this part" screenshot | Same as sibling series |
| Windows | Recommend WSL2 up front in Part 1 with a short callout | The SDK spawns a CLI subprocess; verify native-Windows behavior at writing time, but WSL2 is the safe recommendation |

### 5.2 Analogy bank (extends WRITING-STYLE §7 for this series)

Consistent across all 13 parts; where one breaks down, say where.

| Concept | Analogy |
|---|---|
| Agent SDK vs Messages API | Hiring a contractor vs supervising every nail yourself |
| The agent loop | An intern with a toolbox who keeps working until the job's done |
| Built-in tools | The agent's hands |
| `cwd` / workspace | The agent's desk — one desk per client engagement |
| Permission modes | How much you trust a new employee: shadowing → supervised → keys to the building |
| `can_use_tool` + approval card | The manager's sign-off stamp |
| Sessions / JSONL | The agent's diary — it writes one whether or not you read it |
| `resume` | Handing the diary back open at the right page |
| SSE envelopes | Labeled parcels on one conveyor belt (carried over from the LangGraph series verbatim) |
| Custom tools / MCP server | A new tool on the agent's belt, with the safety guard built into the tool |
| Event log + replay | The flight recorder — you can replay the whole flight |
| Decoupled worker / stream | The kitchen keeps cooking even if the waiter changes shifts |
| Subagents | Calling in a specialist who hasn't seen your working (fresh eyes) |
| Skills | The employee handbook — read when relevant, not recited daily |

### 5.3 Comic seeds (per WRITING-STYLE §9 — Yad in every strip; the joke encodes the concept)

| Part | Seed |
|---|---|
| 1 | Yad proudly introduces his new "analyst" — a laptop in a tiny tie. It answers `144 × 89` and Yad frames the terminal output like a diploma |
| 2 | Yad asks for average revenue; the agent vanishes into a filing cabinet and emerges with the answer plus three charts nobody asked for |
| 3 | The agent in a box with a mail slot; an entire conversation conducted through one envelope at a time ("HTTP," says the label) |
| 4 | Yad watching the agent's office through a window: sticky notes going up in real time vs the closed door labeled "PLEASE WAIT 60s" |
| 5 | Gorgeous storefront, velvet rope, grand opening — the back office is one extension cord into a terminal |
| 6 | The agent wearing a body cam; Yad on the couch with popcorn watching "READING SALES.CSV" like a police procedural |
| 7 | Yad hands over a shoebox of crumpled receipts; the agent gravely accepts it like a briefcase: "I'll need a desk." |
| 8 | The agent slides a bound report across the desk. Yad: "I asked where the file was." Agent: "Page 12, with charts." |
| 9 | The agent flips through a labeled diary mid-conversation: "Ah yes — Tuesday. You prefer bar charts." Yad, touched and slightly scared |
| 10 | The agent picking a database's lock with a pandas crowbar; Yad hands it a keycard labeled READ-ONLY instead |
| 11 | Agent holds up a sign: "MAY I RUN rm -rf?" Yad spit-takes coffee onto the DENY button |
| 12 | Power cut mid-report. Lights back on. The agent continues mid-sentence from the flight recorder. Yad checks if *he* lost his place |
| 13 | Tiny hard-hatted reviewer-clone hands the analyst a sticky note: "March is in here twice." The analyst, deflated: "…recalculating." |

---

## 6. Decisions

### 6.1 Resolved (by Yadnesh, 2026-06-12)

1. **Series app: the data-analyst agent** (over a general Claude-Code-style workbench or a plain
   chat assistant). Upload CSVs/docs, agent analyzes with Bash+Python, produces charts and
   reports as artifacts. Closest to the production reference app's spirit; most product-like
   demo.
2. **Act II scope: approvals + durable streams + subagents/skills**, with custom tools as the
   Act II opener. **No dedicated deployment part** — deployment lives in Part 13's "where to go
   from here" (and §6.2.5 leaves the door open for a bonus part).
3. **Series slug: `claude-agent-sdk-fastapi-nextjs`** (folder renamed from
   `claude_agents_sdk-fastapi-nextjs` to match the official package name and the blog's slug
   convention).
4. **Persistence: SDK-native + SQLite where needed.** No Postgres, no Docker. SQLite enters only
   in Part 12 for the event log (and absorbs the sessions index).

### 6.2 Open — need sign-off before writing Part 1

1. **Series name.** Proposal: **"Agent SDK from Scratch: Build an AI Data Analyst with Claude,
   FastAPI and Next.js."** Short form for kickers/nav: *Agent SDK from Scratch*. Mirrors the
   sibling series' naming ("X from Scratch"); outcome ("AI data analyst") is the hook.
   Alternatives considered: "Build Your Own AI Analyst" (loses the SDK-teaching promise),
   "Claude Agent SDK from Scratch" (long for kickers).
2. **uv vs pip.** This plan picks **uv** (modern default, matches the production app, removes
   venv friction) — a deliberate divergence from the LangGraph series' pip+venv choice. If
   cross-series consistency matters more than currency, flip this; the cost is one section
   rewrite in Part 1 plus every `uv run` snippet.
3. **Sample dataset skin.** Proposal: **Beanline**, the fictional coffee chain (§5.1), with a
   deterministic generator script and one planted data flaw for Part 13's reviewer demo. Easy to
   swap domains (e-commerce, SaaS metrics) before Part 2 is drafted; painful after.
4. **Publication order vs the LangGraph series.** Both series share the blog infrastructure
   (LangGraph PLAN §2). Whichever ships first pays the infra cost (~7–10 h, minus `<CodeTabs>`
   if this one goes first). Decide which series leads — it changes nothing in this plan except
   which prerequisites are already done.
5. **Bonus deployment part (Part 14?).** Deselected from Act II scope, but the material is
   strong (the SDK's subprocess + disk model makes "why serverless breaks" *very* concrete).
   Option: ship the series, gauge demand, write it as a bonus. No structural cost either way.
6. **Thinking-block rendering.** Skipped in Part 6 (one mention + concepts link). If extended
   thinking ends up visually compelling in spikes, it could become a Part 6 stretch section.
   Default: out.

---

## 7. Known risks — verify at writing time

The SDK is young (0.2.x) and fast-moving; this section is the difference between a plan and a
disappointment. Before drafting each part, re-verify against the pinned SDK version:

1. **Message shapes.** The exact form of tool results in the stream (`UserMessage` +
   `ToolResultBlock`), `SystemMessage(init)` payload, and `StreamEvent` delta structure — Part 2
   and Part 4 assert these in figures. **Run the spike script first** (§8 step 2).
2. **`can_use_tool` constraints.** Verify on the pinned version whether the callback requires
   `ClaudeSDKClient`/streaming input (the plan assumes yes — it's *why* Part 11 introduces the
   client). If `query()` supports it, Part 11's client motivation shifts to interrupts alone.
3. **Bundled CLI claim.** Part 1 promises "pip install and done — no Node needed for the
   backend." Confirm the bundled-CLI story on a clean machine (and on WSL2) before publishing.
4. **Billing.** The subscription-credit option for SDK usage (announced for mid-June 2026) —
   confirm before Part 1's API-key section ships.
5. **Model ids and pricing.** `claude-haiku-4-5` / `claude-sonnet-4-6` and the per-part cost
   figures — re-quote at writing time.
6. **Session JSONL location/format.** Part 9 reads the SDK's transcript files directly for
   history replay. The format is undocumented-ish — pin it, test it, and keep the parsing
   defensive (skip-unknown-lines), with the companion repo as the safety net.
7. **Reader-machine safety.** Parts 2–10 run `bypassPermissions` against a sandbox cwd. The
   recurring warning callout is non-negotiable; have someone adversarial review its wording
   before Part 2 ships.

---

## 8. Suggested order of work

1. **Resolve §6.2** (series name, uv, dataset skin, publication order) — one short review pass.
2. **Spike before prose.** A throwaway `spike/` script against the pinned SDK exercising every
   assertion in §7: message shapes, partial messages, resume, `can_use_tool` + Future bridge,
   interrupt, subagent stream events, JSONL readability. Half a day; de-risks eleven parts.
3. **Build the series infrastructure** if the LangGraph series hasn't already (its PLAN §2,
   minus `<CodeTabs>`, plus the `stages` extension from §2.2 here). Separate approval-gated
   implementation plan, per the house process.
4. **Build the Beanline dataset + companion repo** (`claude-agent-sdk-tutorial`): generator
   script, the planted flaw, `part-1-setup` branch.
5. **Write Part 1 as the quality reference** — full screenshots, every callout, comic, cover.
   Lock tone against WRITING-STYLE §11 checklist. Then Part 2, which is the series' real bar
   (the message-anatomy figures are the hardest assets in Act I).
6. **Write Parts 3–9 in order**, batching reviews every 2 parts; publish weekly once Parts 1–2
   are done (same cadence policy as the sibling series). Push each part's branch as it lands.
7. **Write the Concepts page in parallel with Parts 2–4** (they generate most of the anchors).
8. **Act II (Parts 10–13)** after Act I ships in full — its parts depend on reader feedback
   about pacing, and the `part-9-sessions` branch must be rock-solid before Act II advertises
   jumping in from it.
9. **Launch ritual per part** + a series-landing announcement once Act I is complete.

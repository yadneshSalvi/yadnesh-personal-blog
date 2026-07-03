# Series Plan — Claude Agent SDK in Production: Build an AI Data Analyst with FastAPI and Next.js

> Internal planning document. Not served by the blog (the post loader only scans `content/posts/*.mdx`).
> Created 2026-06-12 against `claude-agent-sdk` 0.2.x and the production reference app
> (`~/code/afgi/agent_private_credit4/agent_private_credit`).
> **Revised 2026-07-03** by Yadnesh + Claude: re-verified against `claude-agent-sdk` **0.2.110**
> (June 24, 2026) and the live docs at code.claude.com; restructured now that the LangGraph
> series (8 parts + companion repo + all blog infrastructure) has shipped. Decisions from this
> revision are logged in §6.1. The original 13-part two-act beginner plan is superseded by the
> 14-part three-act intermediate-first plan below.

---

## 1. Overview

### What we're building (across the whole series)

An **AI data analyst** you run on your own machine — and, by the end, on a real server. You
drop a CSV into its workspace, ask a question in plain English, and watch it read your files,
write and run its own Python, and hand you back a chart and a written report — with every step
streaming live into the UI, every risky command waiting for your approval, and every run
surviving a page refresh.

- **Backend:** Python 3.13 + FastAPI + **Claude Agent SDK** (`claude-agent-sdk`, pinned 0.2.x —
  re-pin at writing time)
- **Frontend:** Next.js 16 (App Router) + Tailwind CSS 4
- **LLM:** Anthropic only — the Agent SDK is Anthropic's product. Default model
  `claude-haiku-4-5` (a `MODEL` constant, one line to upgrade to `claude-sonnet-5`).
- **State:** The SDK's built-in session storage + session utilities through Part 8; SQLite
  arrives in Part 9 for the durable event log. No Postgres, no Docker, no Redis anywhere in
  the series.
- **Deployment (Part 14):** a Hetzner VM, for real — tested by actually deploying the finished
  app before the part ships.

The core insight the series sells: **the Agent SDK is the engine inside Claude Code, exposed as
a Python library.** You don't build an agent loop, tool executor, or context manager — you get
Read/Write/Bash/Glob/Grep/WebSearch and the whole think-act-observe loop for free. The series is
about putting a *product* around that engine, and then making that product production-grade:
guardrails, durability, interactivity, evals, deployment.

### Audience: intermediate-first

This is the deliberate difference from the LangGraph series (pure beginner). This series assumes
the reader either:

- **finished the LangGraph series** (the happy path — every basic concept this series skips has
  a specific LangGraph part to point at), or
- **can already write a FastAPI endpoint and a React component** and has seen SSE once.

The contract: **we never re-teach what the sibling series teaches; we link to the exact part
instead.** The standing pointer map (used throughout, verbatim targets):

| When we need… | We point to… |
|---|---|
| Python/Node environment setup from zero | LangGraph Part 1: Installation & Setup |
| FastAPI from zero (endpoints, Pydantic, `/docs`, CORS) | LangGraph Part 2: FastAPI Fundamentals |
| Next.js + chat UI from zero (`'use client'`, state, fetch) | LangGraph Part 4: The Next.js Frontend |
| SSE / streaming from zero (wire format, fetch-reader parsing) | LangGraph Part 5: Streaming Responses |
| What tools are / why agents need them | LangGraph Part 6: Giving the Bot Tools |
| Threads/memory as a concept | LangGraph Part 7: Conversation Memory |
| PaaS deployment (Vercel + Fly.io) | LangGraph Part 8: Deploying to the Internet |

Each part that leans on a pointer says so in its first section ("If X is new to you, LangGraph
Part N teaches it from zero — this part assumes it"). The series landing page gets a short
"Do the LangGraph series first?" section making the same offer: no, if you know FastAPI + React;
yes, if you want the gentler on-ramp.

### Three acts

- **Act I — Build the product (Parts 1–5).** Brisk. The complete working analyst: agent behind
  HTTP, streaming UI with tool activity, workspaces + artifacts, session memory. Compressed from
  what would be nine beginner parts by pointing basics at the sibling series.
- **Act II — Guardrails and durability (Parts 6–9).** The safety-and-robustness ladder drawn
  from the production reference app: custom tools, human-in-the-loop approvals, hooks
  (programmatic guardrails + audit), durable streams that survive a refresh.
- **Act III — Advanced capabilities and shipping (Parts 10–14).** Plan mode + AskUserQuestion +
  extended thinking, subagents + skills, the external MCP ecosystem + sandboxing, structured
  outputs + budgets + evals, and a real deployment to a Hetzner VM.

> **Companion repo convention (follow WRITING-STYLE §13):** like `langgraph-from-scratch`, this
> series ships a public repo with **ONE FOLDER PER PART** (not branches), each folder the
> complete runnable end-of-part project, tested for real before publishing. Posts wire
> partial-update fences with `repo=`/`lines=` meta (GitHub icon + in-place "View full file" with
> highlights), synced into the blog via `npm run sync:code`. Every part gets a short **demo
> video** (shot-scraper storyboard, human pacing per §13's rubric, MP4 + poster + `preload="none"`
> via `<DemoVideo>`) and ends with the **Recap + Quiz** ritual.

### How this relates to the LangGraph series

Sibling series, same blog, deliberately different altitude:

- **LangGraph from Scratch** = build the engine yourself (state, nodes, edges, your own tool
  loop, your own checkpointer).
- **Claude Agent SDK in Production** = drop in a crate engine and build the car around it —
  then take the car through inspection and put it on the road.

Both use FastAPI + Next.js + SSE, so the web-plumbing lessons rhyme on purpose. The pointer map
above is the load-bearing link between them; it's also why this series can run 14 parts without
bloating — none of them re-teach plumbing.

### Tone

Identical to the LangGraph series and governed by **WRITING-STYLE.md** (hooks, voice, banned
words, comics, demo videos, Recap + Quiz, the pre-publish checklist). This plan only adds the
series-specific material the style guide needs: the analogy bank extension (§5.2) and the comic
seed table (§5.3).

### Concept handling

Same two-layer approach as the LangGraph series:

1. **Inline `<Callout type="info">` boxes** for 1–3 sentence clarifications.
2. **A shared "Concepts" page** at `/blog/agent-sdk-concepts` (frontmatter `kind: reference`),
   linked via fragment URLs (§4).

Because the audience is intermediate, generic web concepts (async/await, SSE, EventSource) get
*short* entries that mostly link to the LangGraph series; the SDK/agent concepts get the full
treatment.

---

## 2. Series infrastructure (blog changes)

**Everything is already built.** The LangGraph series shipped first (resolving the old §6.2.4
open question) and paid the entire infrastructure cost. This series inherits, with zero new
work required:

- Frontmatter (`series`, `seriesPart`, `kind: reference`, `imageDark`), `content/series/<slug>/index.mdx`
  metadata files, `lib/series.ts`, URL structure.
- Series components: `SeriesToc`, series landing pages, the **series chapter sidebar**
  (`SeriesNav`, left rail with current-part highlight + "Coming soon" placeholders) and the
  collapsible **"On this page"** right rail — both shipped 2026-07-03.
- Content pipeline: rehype-slug + heading anchors, CodeBlock restyle, `<Figure>`,
  `<ZoomableImage>`, `<Callout>`, `<Recap>`, `<Quiz>`, `<DemoVideo>`, the FullFile feature
  (`repo=`/`lines=` fence meta + `npm run sync:code`), search indexing, per-post OG cards.
- Homepage/blog listing integration (`seriesToListItem`).

Deltas specific to this series:

### 2.1 Act grouping in the series TOC (small pending extension)

Fourteen parts is a long flat list. Add an optional `stages` array to the series `index.mdx`
frontmatter:

```yaml
stages:
  - { name: "Act I — Build the product", from: 1, to: 5 }
  - { name: "Act II — Guardrails and durability", from: 6, to: 9 }
  - { name: "Act III — Advanced capabilities and shipping", from: 10, to: 14 }
```

`SeriesToc` (and ideally `SeriesNav`, the chapter sidebar) render each stage as a mono uppercase
hairline divider — the design system's existing kicker vocabulary, no new visual language. When
`stages` is absent the list stays flat, so the LangGraph series is unaffected. ~30–45 minutes of
work; degrade gracefully if cut.

### 2.2 No `<CodeTabs>`

Single-provider series; every code block is a plain single-variant block. (LangGraph series
never built it either — moot.)

### 2.3 Files

```
content/
  posts/
    agent-sdk-1-first-agent.mdx … agent-sdk-14-deploy-hetzner.mdx
    agent-sdk-concepts.mdx           # kind: reference
  series/
    claude-agent-sdk-fastapi-nextjs/
      PLAN.md                        # this file — ignored by the loader
      index.mdx                      # series metadata + intro (incl. pointer-map section)
public/
  videos/agent-sdk/part-N-demo.mp4 + part-N-poster.jpg   # per WRITING-STYLE §13
  images/series/agent-sdk/part-N/…   # figures, comics, covers per WRITING-STYLE §8–10
```

Series cover: code-drawn SVG composition per WRITING-STYLE §10, icon row **Anthropic ·
FastAPI · Next.js** from `public/icons/`. The series dessert shot — chat on the left with an
approval card resolved, artifacts panel on the right showing a revenue chart and a written
report — doubles as the hero.

Companion repo: **`yadneshsalvi/claude-agent-sdk-in-production`** — one folder per part
(`part-01-first-agent/` … `part-14-deploy-hetzner/`), each a complete runnable project, plus
per-part `demo.mp4` and README "Read along" + "See it run" lines, mirroring
`langgraph-from-scratch` exactly.

---

## 3. Tutorial breakdown

14 parts in three acts. Same rules as the LangGraph series: every part ends with something
runnable, never a "trust me" cliffhanger; the reader can always name the capability they gained.

### Pacing

| Part | Act | Working result at the end | Reading time |
|---|---|---|---|
| 1 | I | A terminal agent that reads your CSVs and runs its own Python to answer questions | 15–18 min |
| 2 | I | The agent's text *and tool calls* stream as SSE events over HTTP, watchable with `curl -N` | 18–22 min |
| 3 | I | A browser chat UI: token streaming, live tool badges, markdown answers | 18–22 min |
| 4 | I | Per-conversation workspaces with upload; charts and reports open in an artifacts panel | 20–25 min |
| 5 | I | The analyst remembers; sessions sidebar (SDK-native), fork a conversation | 15–18 min |
| 6 | II | The agent queries a real SQLite database through your custom tool | 18–22 min |
| 7 | II | Risky commands pause and wait for your Approve/Deny click | 22–28 min |
| 8 | II | A hook blocks `rm` before it runs and writes an audit log of every tool call | 15–18 min |
| 9 | II | Refresh mid-response and the stream picks up exactly where it left off; a real Stop button | 22–28 min |
| 10 | III | The agent proposes a plan first, asks you structured questions, streams its thinking | 22–28 min |
| 11 | III | A reviewer subagent checks the numbers; a Skill enforces house report style | 18–22 min |
| 12 | III | The agent browses the web through an external MCP server — inside a sandbox | 18–22 min |
| 13 | III | Every analysis returns validated JSON, respects a dollar budget, and passes an eval suite | 22–28 min |
| 14 | III | The whole app live on a Hetzner VM with HTTPS, surviving a reboot | 18–22 min |

Act I ≈ 1h30m reading; Act II ≈ 1h20m; Act III ≈ 1h40m; total ≈ 4h30m. Hands-on, probably
10–14 hours doing all fourteen.

### The event vocabulary (defined once, extended forever)

Part 2 establishes the SSE envelope — `data: {"type": ...}\n\n` — and the rest of the series
only ever *adds event types*, never changes the parser. Same extensibility lesson as the
LangGraph series, taken much further:

| `type` | Introduced | Payload |
|---|---|---|
| `session_start` | Part 2 | `session_id` (+ `workspace_id` from Part 4) |
| `text_delta` | Part 2 | `text` |
| `tool_use_start` | Part 2 | `tool_id`, `tool_name`, `tool_input` (+ `parent_tool_id` from Part 11 for subagent activity) |
| `tool_result` | Part 2 | `tool_id`, `content`, `is_error` |
| `complete` | Part 2 | `usage`, `total_cost_usd`, `duration_ms` (+ `structured_output` from Part 13) |
| `error` | Part 2 | `message` |
| `artifact_update` | Part 4 | `path`, `kind`, `size` |
| `approval_request` / `approval_resolved` | Part 7 | `approval_id`, `tool_name`, `tool_input` / `decision` |
| *(SSE `id:` field — sequence numbers)* | Part 9 | enables replay + `Last-Event-ID` |
| `thinking_delta` | Part 10 | `text` |
| `plan_proposed` | Part 10 | `plan_id`, `markdown` |
| `question_request` / `question_resolved` | Part 10 | `question_id`, `questions` / `answers` |

This table mirrors the production reference app's wire format almost name-for-name —
deliberate, so the series graduates a reader into reading real production code.

### SDK facts the parts are written against (verified 2026-07-03, v0.2.110)

Re-verify before drafting each part (§7), but the plan asserts:

- `ClaudeAgentOptions` fields used: `cwd`, `allowed_tools`, `disallowed_tools`,
  `permission_mode`, `system_prompt` (preset + append), `model`, `resume`, `fork_session`,
  `continue_conversation`, `include_partial_messages`, `mcp_servers`, `agents`, `hooks`,
  `can_use_tool`, `setting_sources`, `max_turns`, `max_budget_usd`, `output_format`,
  `thinking`, `sandbox` (beta).
- Message types: `SystemMessage` (subtype `init`, `data.session_id`), `AssistantMessage`
  (content blocks: `TextBlock`, `ToolUseBlock`, `ThinkingBlock`; `parent_tool_use_id` set for
  subagent messages), tool results as `ToolResultBlock`, `ResultMessage` (`total_cost_usd`,
  `usage`, `structured_output`, `session_id`).
- Session utilities exist in the SDK: `list_sessions()`, `get_session_messages()`,
  `get_session_info()`, `rename_session()` — Part 5 uses them instead of a hand-rolled index.
- Permission evaluation order: hooks → deny rules → ask rules → permission mode → allow rules →
  `can_use_tool`. **Auto-approved tools never reach `can_use_tool`** — this is the hinge between
  Part 7 and Part 8.
- Hook events (Python): `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `UserPromptSubmit`,
  `Stop`, `SubagentStart`, `SubagentStop`, `PreCompact`, `PermissionRequest`, `Notification`.
  Registered via `hooks={"PreToolUse": [HookMatcher(matcher="Bash|Write", hooks=[cb])]}`.
- Custom tools: `@tool(name, description, input_schema)` + `create_sdk_mcp_server(...)`;
  naming `mcp__<server>__<tool>`; external servers via stdio (`command`/`args`/`env`) or HTTP
  (`type: "http"`, `url`, `headers`).
- The pip wheel bundles the Claude Code CLI — no separate Node install for the backend.
- Docs live at `code.claude.com/docs/en/agent-sdk/*` (overview, python, permissions, hooks,
  custom-tools, mcp, subagents, sessions, skills, structured-outputs).

---

### Part 1 — Setup and your first agent

**Slug:** `agent-sdk-1-first-agent` · **Reading:** 15–18 min · **Screenshots:** ~7
*(merges the old plan's Parts 1+2)*

**Why this part exists:** One sitting from `uv init` to an agent that reads files and writes
its own pandas. For an intermediate reader, setup is a checklist, not a lesson — the *lesson*
is the agent loop they didn't write, and we get there fast.

**Sections:**
- *What you're going to build* — the dessert shot: the finished Part 14 analyst (chat, tool
  badges, approval card, artifacts panel). One paragraph on the three acts. Pointer: "never
  touched FastAPI or React? LangGraph Parts 1–5 are the gentler on-ramp; come back after."
- *What the Agent SDK actually is* — the engine inside Claude Code as a pip package (CLI
  bundled in the wheel — nothing else to install). One paragraph, link
  `#agent-sdk-vs-messages-api`.
- *Setup, checklist-style* — Python 3.13 + uv, Node 22 LTS, `uv init backend`,
  `uv add claude-agent-sdk fastapi 'uvicorn[standard]' python-dotenv`; Anthropic API key with a
  $5 hard limit ("treat it like a password" box); WSL2 recommendation for Windows. Brisk — one
  screen, LangGraph Part 1 linked for the from-zero version.
- *Hello, agent* — `query(prompt="What's 144 * 89?")`, five lines, real answer. What just
  happened: no model wiring, no message list.
- *Give it a workspace* — `workspace/` with the **Beanline** sample dataset (§5.1: `stores.csv`,
  `products.csv`, `sales.csv`; deterministic generator script in the companion repo).
- *ClaudeAgentOptions* — `cwd="workspace"`, `allowed_tools=["Read","Glob","Grep","Bash","Write"]`,
  `permission_mode="bypassPermissions"`, `model=MODEL`.
- *Break it on purpose (the permission wall)* — run first **without** `permission_mode`, read
  the refusal. Permission-modes tour (`#permission-modes`), then the honest scary callout:
  `bypassPermissions` means *the agent can run any shell command you can*. Sandbox-cwd
  justification — **and the styled recurring warning: "Running with scissors — until Parts 7–8."**
- *Ask a real question* — "Which Beanline store had the highest revenue in March, and by how
  much?" Watch the terminal: Glob → Read → writes pandas → Bash → answer. The series' first
  dessert moment.
- *Anatomy of the message stream* — what `query()` yields: `SystemMessage` (init, `session_id` —
  seed for Part 5), `AssistantMessage` with `TextBlock`/`ToolUseBlock`, results as
  `ToolResultBlock`, final `ResultMessage` with `usage` and `total_cost_usd`. One annotated
  trace figure — the hardest asset of Act I and the series' Rosetta stone.
- *The cost ritual* — print `ResultMessage.total_cost_usd` after every run; first data point
  (about a cent on Haiku). Every later part keeps the habit.
- *The diary the SDK keeps* — `ls ~/.claude/projects/`: session JSONL noticed, not used.
  (Foreshadows Part 5.)
- *Git init* — `.gitignore` covering `.venv/`, `node_modules/`, `.env*`, `workspaces/`; commit.

**Code introduced:** ~50 lines of Python.

**Beginner callouts (kept light):** `async for` in one box; the built-in tools table; why the
agent writing its own pandas beats us writing pandas for every question — the entire pitch of
agents in one callout; "tested with" pinned-version block.

**Forward references:** "The agent lives in your terminal. Next: behind a URL, streaming."

**NOT covered yet:** `ClaudeSDKClient` (arrives Part 7 with the features that need it), custom
tools, system prompts, sessions, streaming.

---

### Part 2 — The FastAPI bridge and the event vocabulary

**Slug:** `agent-sdk-2-fastapi-streaming` · **Reading:** 18–22 min · **Screenshots:** ~6 + 1 pipeline diagram
*(merges the old plan's Parts 3+4)*

**Why this part exists:** Get the agent behind HTTP and design the **SSE event vocabulary**
that the next twelve parts extend — the single most load-bearing design decision in the series,
and we say so. FastAPI itself is assumed (pointer: LangGraph Part 2); SSE mechanics are assumed
(pointer: LangGraph Part 5). What's new here is *mapping an agent's message stream onto a wire
format*.

**Sections:**
- *Why a server at all* — browsers can't hold your API key or spawn the SDK. One paragraph.
- *`POST /chat`, blocking version, in one screen* — `ChatRequest`/`ChatResponse`, CORS for
  `localhost:3000`, curl it, real answer. Deliberately fast: this is LangGraph Part 2 material
  at review speed. Note the 60-second silence — *name* the problem.
- *The amnesia demo* — curl a follow-up; it has no idea. Every `query()` is fresh. "Part 5
  fixes this; until then the *files* are the memory."
- *Designing the envelope* — the §3 event table, first six types. The teachable moment: we're
  designing for event types we haven't invented yet (artifacts P4, approvals P7, questions P10),
  and the parser will never change.
- *Mapping SDK messages to events* — the translator generator: `SystemMessage(init)` →
  `session_start`; `ToolUseBlock` → `tool_use_start`; `ToolResultBlock` → `tool_result`;
  `ResultMessage` → `complete`. Part 1's message anatomy pays rent.
- *Block-level first* — `StreamingResponse(translate(query(...)), media_type="text/event-stream")`;
  `curl -N`, tool events scroll live. Already dramatic.
- *Then token-level* — `include_partial_messages=True`, `StreamEvent` deltas → `text_delta`.
  Callout `#partial-messages`.
- *The streaming pipeline diagram* — SDK subprocess → async generator → StreamingResponse →
  browser. (One of the two "must be beautiful" SVGs.)

**Code introduced:** ~90 lines of Python (`app/main.py`, `app/events.py` envelope dataclasses +
translator).

**Callouts:** async generators in one box; why JSON envelopes instead of bare text; why not
WebSockets (one-way traffic, plain HTTP); EventSource deferred to Part 9 with one honest
sentence.

**Forward references:** "The only consumer is curl. Next: the real one."

**NOT covered yet:** sessions, interrupts, reconnection.

---

### Part 3 — The agent UI

**Slug:** `agent-sdk-3-agent-ui` · **Reading:** 18–22 min · **Screenshots:** ~8 (UI growing)
*(merges the old plan's Parts 5+6)*

**Why this part exists:** First moment the project looks like a product — and the part that
teaches the defining UX of the agent category: **tool visibility**. Chat-UI-from-zero is
assumed (pointer: LangGraph Part 4); this part starts where that one ended and gets the data
model *right on the first try*.

**Sections:**
- *What we'll build* — screenshot of the finished Part 3 UI.
- *Scaffold* — `npx create-next-app@latest frontend`, `NEXT_PUBLIC_API_BASE_URL` in
  `.env.local`. Checklist speed. (Includes the shadcn-free decision: no component library,
  matches the reference app — §5.1.)
- *The block model, from the start* — assistant turns are *sequences of blocks*:
  `blocks: ({type:'text'} | {type:'tool_use'})[]`. We design it before writing UI because the
  SDK's own content blocks and the reference app both use this shape — say so. (The LangGraph
  series earns this model through a refactor; here we start correct and note why.)
- *Reading the stream* — fetch + reader + SSE line parsing at review speed (pointer: LangGraph
  Part 5 for the from-zero treatment, including the buffering bug). Switch on `type`:
  `text_delta` appends, `tool_use_start` opens a loading tool block, `tool_result` completes it
  by `tool_id`, `complete`/`error` close the turn.
- *The tool badge* — collapsed one-liner: spinner + "Bash — `python analyze.py`" → click to
  expand input/result; error styling on `is_error`; friendly labels via a tiny
  `toolLabel(name, input)` map ("Reading sales.csv…"). One component, ~50 lines.
- *Markdown answers* — `react-markdown` + `remark-gfm`; tables and headers finally render.
- *The long-turn UX kit* — working indicator with elapsed seconds ("Working… 12s" — agent turns
  are *long*; production apps show a counter), a Stop button via `AbortController` with the
  honest caveat (closes the *pipe*; the SDK may finish its current tool call server-side — the
  real interrupt is a Part 9 fix, debt named explicitly), auto-scroll.
- *Try it end-to-end* — a multi-step Beanline question; badges appear and resolve in sequence,
  then the markdown answer. Hero screenshot.

**Code introduced:** ~220 lines of TypeScript across 3–4 files.

**Callouts:** discriminated unions in one box; key tool blocks by `tool_id`, not array position;
`'use client'` one-liner with LangGraph pointer.

**Forward references:** "Your analyst can only see the CSVs *we* gave it. Next: bring your own
data — and get deliverables back."

**NOT covered yet:** thinking blocks (Part 10 renders them — one-line mention), uploads,
sessions.

---

### Part 4 — Workspaces and artifacts

**Slug:** `agent-sdk-4-workspaces-artifacts` · **Reading:** 20–25 min · **Screenshots:** ~9
*(merges the old plan's Parts 7+8 — the biggest Act I part, and the act's dessert)*

**Why this part exists:** A real analyst works on *your* files and hands back *deliverables*.
Workspace-per-conversation (straight from the reference app) plus the artifacts panel — the
series hero screenshot lives here.

**Sections:**
- *One folder per conversation* — the workspace concept: the agent's desk. `workspaces/{id}/`
  created on demand; `cwd` points at the request's workspace. The Part 1 sandbox story gets
  *stronger* (isolation per conversation).
- *Upload endpoints* — `POST /workspaces` + `POST /workspaces/{id}/files` (multipart, size cap,
  filename sanitization — show the `../` attack in one line and block it; never trust a
  client-supplied path).
- *Wiring the chat request* — `ChatRequest` gains `workspace_id`; `session_start` echoes it;
  auto-create on first message.
- *The upload UI* — drop zone + file chips; "Load sample data" button copying the Beanline CSVs
  in (so every later screenshot works instantly).
- *Tell the agent it's an analyst* — `system_prompt` enters with a real job:
  `{"type": "preset", "preset": "claude_code", "append": ANALYST_PROMPT}` — keep Claude Code's
  battle-tested tool instructions, append house rules: charts as PNG via matplotlib, findings to
  `report.md`, tables over prose. Callout `#system-prompt-presets`: why production apps append
  rather than replace.
- *Detecting what the agent made* — snapshot workspace mtimes before the turn, diff after each
  tool result, emit `artifact_update`. ~25 lines; the reference app does exactly this (say so).
  Why we diff the filesystem instead of trusting the model to announce its files. The Part 2
  envelope absorbs the new type with zero parser changes — collect that payoff explicitly.
- *Serving workspace files* — `GET /workspaces/{id}/files/{path}` with mime guessing + the
  traversal guard reused.
- *The artifacts panel* — right-hand panel, mono filenames, live badge; `<img>` for PNGs,
  `react-markdown` for `.md`, `<pre>` fallback; slides open when the first artifact lands.
- *Try it* — "Chart monthly revenue by store and write up what you see." Badges fire, panel
  lights up with `revenue.png` + `report.md`. **Series hero screenshot.**
- *Break it on purpose* — ask for a chart with matplotlib missing; read the agent's
  traceback-driven self-correction. Honest look at agent resilience and its limits.

**Code introduced:** ~130 lines of Python, ~190 lines of TypeScript.

**Callouts:** multipart in one paragraph; server-side UUIDs only; the agent's Python env = the
backend's env (and why real products sandbox — Part 12 will); prompt-writing box (specific,
testable instructions beat vibes).

**Forward references:** "Ask a follow-up about the chart and the analyst has no idea what chart
you mean. Next: memory."

**NOT covered yet:** artifact versioning, PDF viewers, download-as-bundle.

---

### Part 5 — Sessions: the analyst remembers

**Slug:** `agent-sdk-5-sessions` · **Reading:** 15–18 min · **Screenshots:** ~6
*(old plan's Part 9, simplified: the SDK's session utilities replace the hand-rolled index)*

**Why this part exists:** Closes Act I with conversation memory for **zero new infrastructure**.
The SDK has been writing session files since Part 1; now we use them — `resume` for memory,
and the SDK's own `list_sessions()` / `get_session_messages()` for the sidebar. The contrast
with the LangGraph series (build your own checkpointer, LangGraph Part 7) is the point.

**Sections:**
- *The diary, revisited* — open a session JSONL in the editor and read it together. Link
  `#sessions-and-jsonl`.
- *Capturing the session id* — we've emitted it in `session_start` since Part 2 (collect the
  foreshadow); frontend sends it back; backend passes `resume=session_id`.
- *Try it* — "Which store grew fastest?" → "Now chart *that store's* weekly numbers." It knows.
  The single most satisfying two-message demo in the series.
- *The sessions sidebar, SDK-native* — `list_sessions(directory=...)` +
  `get_session_info()` for the list; `get_session_messages()` mapped into our block model for
  history replay (~30 lines instead of the 70 the old plan budgeted for a hand-rolled
  `sessions.json` — the SDK grew this while the plan sat in a drawer; teach the lesson that
  SDK-fast ecosystems reward re-reading release notes). `rename_session()` for titles.
- *Fork a conversation* — `resume=session_id, fork_session=True`: branch an analysis to try a
  different angle without losing the original. Small UI affordance ("Duplicate chat"), big
  concept: sessions are a tree, not a line. Link `#fork-session`.
- *New analysis* — clear messages, drop session + workspace ids; fresh desk, fresh diary.
- *Caveats + Act I curtain* — sessions are per-machine, per-`cwd` (each workspace gets its own
  project dir — gotcha called out); a multi-user product needs a real DB (the reference app
  uses Postgres; we stay honest about the gap). Act I recap: a complete AI data analyst in five
  parts. "What's left? Everything between *works on my machine* and *production*. That's Acts
  II and III."

**Code introduced:** ~60 lines of Python, ~70 lines of TypeScript (sidebar).

**Callouts:** `resume` vs `continue_conversation` (`#resume-vs-continue`); where JSONL lives;
`fork_session` in two sentences.

**Forward references:** Act II overture — the safety ladder, one line per part.

**NOT covered yet:** compaction (`PreCompact` gets a mention in Part 8), multi-user anything.

---

### Part 6 — Custom tools: give the analyst a database

**Slug:** `agent-sdk-6-custom-tools` · **Reading:** 18–22 min · **Screenshots:** ~6

**Why this part exists:** Act II opener. Built-in tools read files; real analysts query
systems. The `@tool` decorator + in-process MCP server is the SDK's extension mechanism and the
gateway to the whole MCP ecosystem (external servers arrive in Part 12).

**Sections:**
- *Why a custom tool at all* — Beanline's "live" data lives in `beanline.db` (SQLite, builder
  script provided), not CSVs. The agent *could* Bash its way in with `sqlite3` — show it, it
  works, agents are resourceful — then the case for a proper tool: schema awareness,
  guardrails, and read-only enforcement Bash can't give you.
- *Your first `@tool`* — `query_database(sql)`: description written like a prompt (the model
  *reads* it — tool descriptions are prompts, the part's key insight), `{"sql": str}` schema,
  SQLite opened read-only (`file:...?mode=ro` — the security beat), rows returned as a markdown
  table.
- *An MCP server inside your process* — `create_sdk_mcp_server(name="beanline", tools=[...])`,
  `mcp_servers={"beanline": server}`. Diagram: external MCP (stdio subprocess / HTTP) vs
  in-process SDK server (a function call). Link `#mcp`.
- *The naming convention* — `mcp__beanline__query_database`; add to `allowed_tools`; the
  `mcp__beanline__*` wildcard. Own H3 + deliberate break: misspell it, watch the agent not see
  the tool, fix it.
- *A second tool for shape contrast* — `get_schema()`, no arguments, returns DDL. Two tools is
  a pattern; one is a trick.
- *Tool badge polish* — friendly labels for the new tools; SQL in the expanded badge.
- *Try it* — "Compare Q1 vs Q2 revenue from the database and chart the difference" — custom
  tool + Bash + matplotlib + artifacts panel, all four systems firing. Screenshot.

**Code introduced:** ~90 lines of Python (`app/tools.py`, db builder), ~10 lines of TypeScript.

**Callouts:** MCP in two sentences; in-process vs external and when you'd want each; why
read-only enforcement lives in the *tool*, not the prompt.

**Forward references:** "Our agent now touches a database with no oversight, still running with
Part 1's scissors. Time to take them away."

**NOT covered yet:** external MCP servers (Part 12), tool annotations, structured output.

---

### Part 7 — Approvals: the human in the loop

**Slug:** `agent-sdk-7-approvals` · **Reading:** 22–28 min · **Screenshots:** ~7 + 1 sequence diagram

**Why this part exists:** Pays off the "running with scissors" arc and teaches the single most
valuable production pattern in the reference app: risky tool calls pause the agent mid-turn and
wait for a human click. Conceptually dense — it gets the most space and the sequence diagram.

**Sections:**
- *The incident that motivates it* — ask the agent to "clean up old files" and watch it
  cheerfully construct an `rm`. Nothing bad happens (sandbox), but the reader feels it.
  [ANECDOTE slot: an agent/automation doing something destructive with confidence —
  WRITING-STYLE §6 shape.]
- *Meet `ClaudeSDKClient`* — `query()`'s bigger sibling: a connected client with a live two-way
  channel (`connect()`, `query()`, `receive_response()`, `interrupt()`). We switch now because
  the permission callback and interrupts need it. Migration is ~10 lines; show the diff.
- *The `can_use_tool` callback* — the SDK calls *your async function* before a gated tool runs;
  return `PermissionResultAllow` (optionally with `updated_input` — mention the rewrite power)
  or `PermissionResultDeny(message)`. Demote `Bash`/`Write`/`Edit` from `allowed_tools`; drop
  `bypassPermissions`. The scissors come off — the Part 1 warning resolves in a styled callout.
- *The evaluation order, honestly* — hooks → deny rules → mode → allow rules → callback. The
  crucial nuance: **anything auto-approved never reaches your callback.** Allow-listing `Read`
  is a feature (fewer interruptions) *and* a hole (no audit) — Part 8 exists because of this
  sentence.
- *The bridge: an event out, a Future in* — the architectural heart, with the sequence diagram:
  callback fires → emit `approval_request` SSE event → park an `asyncio.Future` in a pending
  dict → **the agent is genuinely paused** → user clicks → `POST /approvals/{id}/decision`
  resolves the Future → callback returns → tool runs (or doesn't). Link `#futures-and-events`.
- *The approval card* — new event types in the Part 2 vocabulary; inline card: tool name,
  command preview, Approve / Deny; resolves into a badge either way.
- *Timeouts and disconnects* — an unresolved Future leaks a paused agent forever:
  `asyncio.wait_for` with deny-on-timeout, deny-all on stream teardown. (The reference app runs
  a TTL reaper for exactly this; we do the honest minimum and say what production adds.)
- *Always-allow* — "Approve and don't ask again for `Read`": a per-session allowlist checked
  before emitting the request. Ten lines, big UX win — and it teaches that permission policy is
  *your* code; the SDK just asks.
- *Try it* — re-run the cleanup demo: agent proposes `rm`, card appears, press Deny, and the
  agent — this is the magic — *acknowledges the denial and finds another way*. The denial goes
  back into the loop as information.

**Code introduced:** ~110 lines of Python, ~80 lines of TypeScript.

**Callouts:** `asyncio.Future` in one box (a promise someone else resolves); never block the
event loop in the callback; gate by blast-radius, not tool count.

**Forward references:** "Approvals gate what you *ask* about. But you allow-listed `Read` —
who's watching that? Next: the layer that sees everything."

**NOT covered yet:** hooks (next part), full RBAC/auth.

---

### Part 8 — Hooks: guardrails and audit trails

**Slug:** `agent-sdk-8-hooks` · **Reading:** 15–18 min · **Screenshots:** ~5
*(new part — the hooks system matured after the original plan was written)*

**Why this part exists:** The `can_use_tool` gap from Part 7 — auto-approved tools bypass it —
needs a layer that sees *every* tool call, deterministically. Hooks are that layer: the SDK's
interception points for policy, audit, and context injection. This is also the reference app's
audit-log pattern at tutorial scale, and the arc's synthesis: **approvals = judgment,
hooks = law.**

**Sections:**
- *What approvals can't see* — demo: allow-list `Bash(ls*)`-style rules, watch `can_use_tool`
  never fire for them. The hole, made visible.
- *The hooks system* — the event list (`PreToolUse`, `PostToolUse`, `PostToolUseFailure`,
  `UserPromptSubmit`, `Stop`, `SubagentStart/Stop`, `PreCompact`, …), registration with
  `HookMatcher(matcher="Bash|Write", hooks=[cb])`, matcher patterns (exact, `|` alternation,
  `mcp__*` globs). Link `#hooks`.
- *A tripwire: block `rm` before it runs* — `PreToolUse` hook returning a deny decision with a
  reason the model sees. Compare with Part 7: no human involved, no pause — policy as code.
  Order matters: hooks run *before* everything else in the evaluation chain.
- *An audit log: every tool call, on disk* — `PostToolUse` (+ `PostToolUseFailure`) appending
  JSONL: timestamp, tool, input, outcome, `tool_use_id` correlating pre/post. Ten lines, and
  suddenly you can answer "what did the agent actually do last Tuesday?" — the question every
  production deployment eventually gets asked. (Reference app: audit middleware + semantic
  action records; say so.)
- *Context injection* — `UserPromptSubmit` appending workspace facts (file list, today's date)
  to every prompt. The subtle power: hooks can *add* context, not just block.
- *When to use which* — the decision table: prompt vs `allowed_tools` vs `can_use_tool` vs
  hook. First draft of the governance column of Part 11's graduation table.
- *Try it* — ask for a cleanup again: the hook denies `rm` instantly (no card), the audit log
  records the attempt, the approval card still appears for a legitimate `Write`. All three
  layers visible in one run.

**Code introduced:** ~80 lines of Python.

**Callouts:** hook return shape (`hookSpecificOutput`, `permissionDecision`); hooks are
deterministic code, approvals are human judgment — different failure modes; `PreCompact` in two
sentences (the SDK compacts long conversations; the hook lets you archive first).

**Forward references:** "The agent is governed. It's still fragile: refresh the page
mid-analysis and everything vanishes. Next: durability."

**NOT covered yet:** hook-based input rewriting (mentioned), `Notification` forwarding.

---

### Part 9 — Durable streams: survive the refresh

**Slug:** `agent-sdk-9-durable-streams` · **Reading:** 22–28 min · **Screenshots:** ~6 + 1 architecture diagram

**Why this part exists:** The deepest architecture lesson in the series and the reference
app's production streaming design at tutorial scale: decouple *running the agent* from
*watching the agent*. Pays the two debts the series has carried: the fake Stop button (Part 3)
and single-tab fragility.

**Sections:**
- *Break it first* — mid-analysis, hit refresh. Gone. The agent finished server-side; nobody
  was listening. Root cause: the agent's lifetime is chained to one HTTP response.
- *The decoupling* — `POST /chat` now *starts* a background task and returns
  `{request_id, stream_url}`; the agent runs in an `asyncio.create_task` worker writing events
  to a log and broadcasting to subscribers. `GET /stream/{request_id}` is a dumb pipe:
  replay-then-follow. Architecture diagram (worker → SQLite event log → broadcast hub →
  N subscribers). (The second "must be beautiful" SVG.)
- *SQLite enters* — `events` table (`request_id`, `seq`, `type`, `payload`); `aiosqlite`, one
  migration by hand, no ORM. (Sessions stay SDK-native from Part 5 — SQLite is *only* the event
  log; smaller teaching surface than the old plan.)
- *Sequence numbers and the `id:` field* — every SSE message gets `id: {request_id}:{seq}`;
  replay = `WHERE seq > last_seen`. The Part 2 vocabulary needed **zero changes** to become
  durable — collect that payoff explicitly.
- *Switching to EventSource* — the right tool now that the stream is a GET: automatic
  reconnection, `Last-Event-ID` for free. Honest one-box comparison with the fetch-reader
  (and why the series taught that first: POST bodies, visible parsing). Refresh survival:
  `sessionStorage` keeps `request_id`; dedup guard on the client (at-least-once delivery).
- *A real Stop button* — the worker holds the `ClaudeSDKClient`;
  `POST /chat/{request_id}/cancel` calls `client.interrupt()`. The Part 3 caveat resolves; the
  agent actually stops.
- *Approvals meet durability* — refresh while an approval card is pending: the replay includes
  `approval_request`, the card re-renders, the Future is still parked server-side. This
  composition test is where the architecture proves itself. (Also the honest note: pending
  approvals need the TTL story from Part 7 more than ever.)
- *Try it* — start a long analysis, refresh mid-stream: events replay, live tail continues.
  Then the show-off: a second tab, same analysis streaming in both. Screenshot of the pair.

**Code introduced:** ~150 lines of Python (worker, event log, hub, cancel), ~60 lines of
TypeScript (EventSource migration).

**Callouts:** `asyncio.create_task` lifetime gotchas (keep a reference!); at-least-once delivery
and client dedup; "this is the same shape as production systems backed by Postgres + Redis —
SQLite is the training wheels, the *architecture* is the lesson."

**Forward references:** "Robust, governed, durable. Act III: making it a better analyst —
starting with making it *plan* before it acts."

**NOT covered yet:** multi-process scaling (the hub is in-process — one honest callout),
horizontal deployment.

---

### Part 10 — Plan mode, questions, and thinking

**Slug:** `agent-sdk-10-interactive` · **Reading:** 22–28 min · **Screenshots:** ~8
*(new part — the interactive-agent patterns from the reference app)*

**Why this part exists:** Act III opener. Everything so far is *reactive* — user asks, agent
does. Production agents negotiate: they propose a plan before touching anything expensive, ask
structured questions instead of guessing, and show their reasoning. All three patterns come
straight from the reference app, and all three reuse machinery the reader already owns (the
event vocabulary + the Part 7 Future bridge — the payoff of teaching those well).

**Sections:**
- *The expensive guess* — motivate: ask for "a full report on Beanline's performance" and watch
  the agent burn 40 tool calls on assumptions (wrong date range, wrong grouping). Cost ritual
  makes the waste visible in dollars.
- *Plan mode* — `permission_mode="plan"`: the agent explores read-only and produces a plan
  instead of acting. Wire it as a mode toggle in the UI; emit the plan as `plan_proposed`;
  render as a card with **Implement / Refine** buttons. Implementing = new request with the
  plan as context in `acceptEdits`-or-approvals mode. (Reference app: proposed-plan lifecycle
  with statuses; we do the honest minimum and name what production adds — refinement rounds,
  plan artifacts on disk.) Link `#plan-mode`.
- *AskUserQuestion* — the agent asks *you* a structured question mid-run (which date range?
  which chart style?). Same bridge as Part 7: tool call pauses on a Future → `question_request`
  event → the UI renders option chips → answer resolves the Future. The deliberate echo: "you
  already built this pattern once; now it pays rent a second time." Verify the exact SDK
  surface at writing time (tool + hook interplay — §7). 
- *Extended thinking* — `thinking={"type": "enabled", ...}` and `ThinkingBlock` in the stream →
  `thinking_delta` events → a collapsed "Thinking…" drawer in the UI (expanded on click,
  rendered in faint mono). When to use it (hard analytical questions) and what it costs —
  cost ritual comparison run. Link `#extended-thinking`.
- *Interaction modes as product design* — one screen of synthesis: autopilot (Act I),
  approval-gated (Part 7), plan-first (this part). Which mode for which user — the analyst
  becomes configurable.
- *Try it* — plan-first run of the full-report request: plan card → one question (date range) →
  approve → watch it execute the plan with thinking visible. The most "it's alive" demo in the
  series.

**Code introduced:** ~100 lines of Python, ~140 lines of TypeScript (plan card, question chips,
thinking drawer).

**Callouts:** plan mode ≠ a different model (same agent, different permission surface);
questions vs free-text clarification (structured options are answerable in one click —
UX honesty); thinking tokens are billed — show the delta.

**Forward references:** "The analyst asks good questions. Next: give it colleagues."

**NOT covered yet:** plan refinement rounds, multi-plan management (reference-app material,
named in Part 14's where-next).

---

### Part 11 — Subagents and skills: the analyst grows a team

**Slug:** `agent-sdk-11-subagents-skills` · **Reading:** 18–22 min · **Screenshots:** ~6

**Why this part exists:** The two highest-leverage quality mechanisms the SDK gives you for
free — delegation to fresh-context specialists, and on-demand playbooks. The closing argument
that the reader now understands the machinery Claude Code itself runs on.

**Sections:**
- *The trust problem* — the analyst is confident, fast… and occasionally wrong. You could
  prompt "double-check your work," or you could hire a colleague whose *only job* is checking.
- *Subagents* — `agents={"reviewer": AgentDefinition(description=..., prompt=...,
  tools=["Read","Glob","Grep","Bash"], model=...)}`; the main agent delegates; the reviewer
  re-derives key numbers in a fresh context and reports discrepancies. Why fresh context is the
  feature (no anchoring). Link `#subagents`.
- *Watching delegation* — subagent messages carry `parent_tool_use_id`; map it to
  `parent_tool_id` on `tool_use_start` and render nested "Reviewer" badges. The planted data
  flaw pays off: a duplicated March row in the sample data (in the builder script for exactly
  this moment) — the reviewer catches what the analyst missed.
- *Skills* — the other axis: not *who* works, but *how*. Write
  `.claude/skills/beanline-report/SKILL.md` (house report format: required sections, chart
  conventions, tone), enable `setting_sources=["project"]` + `Skill` in `allowed_tools`.
  Before/after screenshots: free-form vs house-style report. The insight: **skills are knowledge
  you'd otherwise stuff into every prompt.** Link `#skills`.
- *Prompt vs tool vs hook vs skill vs subagent* — the graduation table, now complete with the
  Part 8 column. Where does a given improvement belong? This table is the series' synthesis.
- *Try it* — full run: analyst analyzes, reviewer audits, skill formats. Cost ritual shows the
  delegation premium honestly (subagents multiply tokens).

**Code introduced:** ~70 lines of Python (agent definition + skill file), ~40 lines of
TypeScript (nested badges).

**Callouts:** subagent cost note with real `total_cost_usd` delta; skills vs RAG in two
sentences; `setting_sources` and why we kept it off until now (explicitness over magic).

**Forward references:** "Your team is all in-house. Next: tools other people built — safely."

**NOT covered yet:** background subagents, subagent resumption.

---

### Part 12 — The wider world: external MCP servers and sandboxing

**Slug:** `agent-sdk-12-mcp-sandboxing` · **Reading:** 18–22 min · **Screenshots:** ~6
*(new part)*

**Why this part exists:** Part 6 built tools in-process; the MCP *ecosystem* is thousands of
servers someone else maintains. Plugging one in takes five lines — which is exactly why the
second half of this part exists: third-party tools and agent-written code deserve OS-level
containment, not just prompt-level trust. The safety ladder gets its top rung: approvals
(human) → hooks (policy) → sandbox (physics).

**Sections:**
- *The five-line integration* — add a real external server to `mcp_servers` (stdio config:
  `command`/`args`/`env`; pick a high-demo-value server — web search/fetch or Playwright;
  finalize at writing time against what's stable). `mcp__<server>__*` in `allowed_tools`; tool
  badges just work (Part 3's `toolLabel` map gets one new entry). "Beanline market check:
  compare our Q2 growth against industry news" — the analyst reaches outside its workspace for
  the first time.
- *stdio vs HTTP servers* — the config shapes, when each appears in the wild, and the trust
  question third-party code raises (this section pivots the part).
- *What could go wrong* — a deliberately sketchy prompt ("summarize this webpage" pointing at a
  page with adversarial instructions) → prompt-injection-shaped risk, shown honestly at
  tutorial scale. The approval + hook layers help but run at the *decision* level; the actual
  Bash process still runs as you.
- *The sandbox* — `sandbox={"enabled": True, ...}` (beta — flagged as such, verify at writing
  time): filesystem containment + network `allowed_domains`. Demo: the agent can hit
  `api.anthropic.com` and the MCP server's domain but a `curl evil.example` inside Bash fails.
  What the sandbox does and doesn't cover (macOS/Linux mechanisms differ; one honest box), and
  why production agent hosts still add containers/microVMs on top. Link `#sandboxing`.
- *Try it* — the market-check question end-to-end inside the sandbox: external tool calls,
  approval card for the fetch, audit log entries, contained Bash. The whole safety ladder in
  one screenshot.

**Code introduced:** ~40 lines of Python config, ~10 lines of TypeScript.

**Callouts:** MCP ecosystem pointers (official servers list); env-var hygiene for server
credentials (`.env`, never in config committed to git); sandbox-is-beta stability note; defense
in depth in three sentences.

**Forward references:** "The analyst is capable and contained. But would you sign its reports?
Next: making it provably good."

**NOT covered yet:** building a *standalone* MCP server for other clients, MCP resources/prompts.

---

### Part 13 — Trust but verify: structured outputs, budgets, and evals

**Slug:** `agent-sdk-13-structured-evals` · **Reading:** 22–28 min · **Screenshots:** ~6
*(new part — the capstone before deployment)*

**Why this part exists:** "How do you trust an agent?" is the question every production
deployment answers or dies on. Three mechanisms, in escalating strength: make outputs
machine-checkable (structured outputs), make costs bounded (budgets), make quality measurable
(evals). The reference app runs a full eval harness; we build its tutorial-scale core.

**Sections:**
- *The wall of prose problem* — the analyst's answers are for humans; your *code* can't read
  them. Motivate with a real integration: a `/summary` endpoint another service could consume.
- *Structured outputs* — `output_format={"type": "json_schema", "schema": AnalysisSummary.model_json_schema()}`
  with a Pydantic model (`headline`, `key_metrics[]`, `caveats[]`, `chart_paths[]`);
  `ResultMessage.structured_output` → validate with `model_validate`. The agent still works
  free-form; the *result* is a contract. `complete` event gains the `structured_output` field —
  the vocabulary's final extension. Link `#structured-outputs`.
- *Budgets* — `max_budget_usd` on the options: the run stops when it's spent. Pair with
  `max_turns`. Demo: give a hard question a 2-cent budget and read the graceful failure. The
  cost ritual becomes cost *policy* — per-request budget field in `ChatRequest`.
- *Evals: the driving test* — the argument: you changed a prompt in Part 11; did the analyst
  get better or worse? Vibes don't answer that; a suite does. Build tutorial-scale evals:
  `evals/cases.yaml` (question + expected facts, keyed to the deterministic Beanline data —
  the planted duplicate row becomes a test case), a runner that executes N cases against the
  real agent (asyncio, concurrent, budget-capped), and an **LLM-as-judge** scorer (a cheap
  Haiku call comparing answer vs expected facts, returning structured pass/fail + reason —
  structured outputs eating their own dog food). Output: a pass-rate table printed per run.
- *Regression story* — break the system prompt on purpose, watch the pass rate drop, fix it,
  watch it recover. Evals as the safety net for prompt engineering — the part's dessert.
- *What production adds* — the reference app's suites/attempts/judge schema, semaphores,
  timeouts, heartbeats — one honest paragraph so the reader can read that code.

**Code introduced:** ~140 lines of Python (~60 evals runner, ~40 judge, ~40 structured summary
endpoint), ~20 lines of TypeScript.

**Callouts:** LLM-as-judge caveats (judge with a *different, cheaper* model; judge structured
facts, not style); why evals need deterministic data (the generator script pays off again);
budgets are a floor for safety, not a substitute for monitoring.

**Forward references:** "It works, it's governed, it's measured. One thing left: your laptop
is still the server."

**NOT covered yet:** CI-wired evals, statistical significance, human-in-the-loop grading.

---

### Part 14 — Ship it: deploying to a Hetzner VM

**Slug:** `agent-sdk-14-deploy-hetzner` · **Reading:** 18–22 min · **Screenshots:** ~7
*(new part — decided 2026-07-03; will be **tested by actually deploying** to a real Hetzner VM
before publishing, creds provided at writing time)*

**Why this part exists:** The LangGraph series ends on PaaS (Vercel + Fly.io — LangGraph
Part 8). This series needs the *other* deployment story, and the SDK demands it: the Agent SDK
spawns a CLI subprocess, keeps long-lived state on disk (session JSONL, workspaces, the SQLite
event log), and holds streams open for minutes — **serverless breaks all four**. A plain VM is
the honest home for an agent backend, and Hetzner is the cheapest good one. The part teaches
the VM pattern *portably*: everything transfers verbatim to AWS EC2, DigitalOcean, or any box
with SSH — one section says exactly what changes (nothing but the console you click).

**Sections:**
- *Why the SDK can't go serverless* — subprocess + disk + long streams, each mapped to a
  concrete thing the reader built (Part 5's JSONL, Part 9's event log). The most physical
  "know your runtime" lesson in either series. Pointer: LangGraph Part 8 for the PaaS pattern
  and when it's the better fit (stateless backends).
- *Provision the box* — Hetzner Cloud console: a small shared-vCPU instance (~€5/mo), Ubuntu
  LTS, SSH key auth. Screenshots. The portability box: on EC2 this screen is called AMI +
  instance type + key pair; same decisions, different furniture.
- *Harden the basics* — non-root user, `ufw` (22/80/443 only), unattended-upgrades. Fifteen
  minutes, one screen — link out for the deep version.
- *Install the runtime* — uv + Python 3.13, Node 22 (for the Next.js build), git clone, `.env`
  with the API key (never in git — the series' standing rule), `uv sync`.
- *systemd for the backend* — a unit file for uvicorn: `Restart=always`, `WorkingDirectory`,
  `EnvironmentFile`. The reboot test: `reboot`, watch it come back. This is the part's quiet
  hero — process supervision is what "production" mostly means.
- *The frontend on the same box* — `next build` + a second systemd unit (`next start`). One
  honest callout: Vercel is also fine for the frontend (LangGraph Part 8 showed it); one box
  keeps this part self-contained and teaches more ops.
- *Caddy: HTTPS for free* — reverse proxy in front of both, automatic Let's Encrypt, the
  **SSE gotcha**: disable proxy buffering for `/stream/*` (flush_interval −1) — streaming
  through a proxy is where every tutorial deployment silently dies; we break it on purpose
  first (buffered stream = frozen UI), then fix it.
- *Deploy-for-real checklist* — DNS A record, CORS origin update, `NEXT_PUBLIC_API_BASE_URL`,
  workspace disk hygiene (a cron to age out old workspaces), what to monitor first (disk, the
  audit log from Part 8).
- *The portability section* — "this exact playbook on EC2 / DigitalOcean / anywhere": what's
  identical (systemd, Caddy, uv, the app), what renames (console, firewall UI), what to watch
  (egress pricing). One table.
- *Try it* — the finished analyst on a real URL, on your phone, approval cards and all. Series
  closing screenshot; the demo video for this part is shot against the live VM.
- *Series retrospective + where to go from here* — the three-act recap; the complete event
  vocabulary table; the reference-app comparison ("the production app this series is modeled on
  adds Postgres, JWT auth, multi-provider model routing, plan refinement, TTL reapers — you can
  now read its code"); pointers: multi-user auth, Postgres migration, containers/microVMs for
  the Bash tool, CI-wired evals, external MCP catalog.

**Code introduced:** ~0 lines of Python/TypeScript; ~60 lines of config (systemd units,
Caddyfile, deploy script).

**Callouts:** cost honesty (~€5/mo + LLM usage); backups in one box (`workspaces/` + SQLite +
`~/.claude/projects/`); when you'd *still* pick PaaS; security posture recap (the box runs an
agent that runs Bash — the Part 12 sandbox and Part 8 hooks are not optional in public).

**Forward references:** None — the where-next list is the ending.

---

## 4. The shared "Concepts" page

**Slug:** `agent-sdk-concepts` (in `content/posts/`, frontmatter `kind: reference` — excluded
from listings, included in search). Same mechanics as the LangGraph concepts page: one `h2` per
concept, 2–4 short paragraphs, rehype-slug IDs + hover anchors.

**Anchors:**

- `#agent-loop` — think/act/observe; what "agentic" actually means
- `#agent-sdk-vs-messages-api` — the 10-lines-vs-100 story; when to use which
- `#built-in-tools` — the toolbox tour
- `#permission-modes` — default / dontAsk / acceptEdits / plan / bypassPermissions
- `#permission-evaluation-order` — hooks → rules → mode → callback; why order is the whole game
- `#can-use-tool` — the permission callback contract
- `#hooks` — the event list and the return shape (taught in Part 8)
- `#sessions-and-jsonl` — where transcripts live; the SDK session utilities
- `#resume-vs-continue` — the two continuation options
- `#fork-session` — sessions as a tree
- `#system-prompt-presets` — preset + append vs plain string
- `#mcp` — the protocol; in-process vs stdio vs HTTP servers; `mcp__server__tool` naming
- `#subagents` — fresh-context delegation; `parent_tool_use_id`
- `#skills` — playbooks on demand
- `#plan-mode` — read-only exploration → proposal
- `#extended-thinking` — ThinkingBlock, budgets, when it pays
- `#structured-outputs` — output_format, schemas, the ResultMessage field
- `#sandboxing` — what OS-level containment does and doesn't buy (beta caveat)
- `#evals` — cases, runners, LLM-as-judge in three paragraphs
- `#partial-messages` — StreamEvent and token-level streaming
- `#sse` / `#event-source` — short entries, heavy links to LangGraph Part 5
- `#futures-and-events` — asyncio.Future as "a promise someone else resolves"
- `#cost-and-tokens` — how agent turns are billed; reading `usage`; `max_budget_usd`

Opens with the same one-paragraph "How to read this" note as its sibling, plus one line sending
true beginners to the LangGraph series.

---

## 5. Recurring decisions for the whole series

### 5.1 Conventions table

| Decision | Choice | Why |
|---|---|---|
| Repo layout | Single project per part-folder: `backend/` + `frontend/`; `backend/workspaces/` gitignored | Matches reference app; simplest mental model |
| Companion repo | **`claude-agent-sdk-in-production`** — one folder per part (`part-01-…` to `part-14-…`), each complete + runnable + tested; per-part `demo.mp4`; README wired like `langgraph-from-scratch` | House convention (WRITING-STYLE §13); Act jump-ins depend on it |
| Python tooling | **uv** (`uv init`, `uv add`, `uv run`) — pip+venv equivalents in one Part 1 callout | 2026 default; matches the production app; divergence from LangGraph series is deliberate and now proven fine |
| Frontend packages | npm, no UI component library | Matches reference app; and the LangGraph series' shadcn font/Card breakages cost us real rework — fewer moving parts wins |
| Model | `MODEL = "claude-haiku-4-5"` constant; one callout on upgrading to `claude-sonnet-5` for better analyses | Cheapest current model; agentic loops multiply tokens, so default cheap. Re-quote model ids + pricing at writing time |
| The cost ritual | Every part prints/streams `total_cost_usd`; parts quote real costs; Part 13 graduates it to `max_budget_usd` policy | Cost-awareness is an agent-specific skill; ResultMessage makes it free |
| Event vocabulary | One envelope format (§3 table), defined Part 2, only ever extended | The series' central design lesson; mirrors the reference app |
| Permission arc | `bypassPermissions` + sandbox cwd (Parts 1–6, recurring styled warning "Running with scissors — until Parts 7–8") → approvals (P7) → hooks (P8) → OS sandbox (P12) | A series-long tension with three named payoffs — the safety ladder |
| SDK entry point | `query()` for Parts 1–6; `ClaudeSDKClient` from Part 7 | Simplest thing that works, upgraded exactly when callback + interrupt need it |
| Sessions | SDK-native throughout (`resume`, `fork_session`, `list_sessions`, `get_session_messages`); SQLite only for the Part 9 event log | The SDK grew session utilities; hand-rolling an index now teaches a workaround |
| Sample data | **Beanline**, fictional specialty-coffee chain: `stores.csv`, `products.csv`, `sales.csv` (+ `beanline.db` in Part 6); deterministic generator script; one planted flaw (duplicated March row) paying off in Part 11 (reviewer) and Part 13 (eval case) | Relatable domain, rich enough for real questions, deterministic for evals |
| Code blocks | ≤25 lines, `filename="..."` meta, `repo=`/`lines=` fences for partial updates, runnable as shown against pinned versions | WRITING-STYLE §7 + §13 |
| "Tested with" block | Top of Part 1 + companion README: Python 3.13.x, Node 22.x LTS, Next.js 16.x, `claude-agent-sdk` pinned at writing time (0.2.110 as of 2026-07-03) | SDK is 0.2.x and moves fast — pinning matters even more here than in the LangGraph series |
| Demo videos | Every part, per WRITING-STYLE §13: shot-scraper storyboard, human pacing rubric, MP4 + poster, `<DemoVideo>` before `<Recap>`; Part 14's video shot against the live Hetzner VM | House convention since 2026-07 |
| Recap + Quiz | Every part ends with the Recap + Quiz ritual | House convention (matches LangGraph series) |
| Screenshots | Same fixed combo as the LangGraph series (light browser, dark terminal) | One blog, one look |
| Hero image per part | "What you'll have at the end of this part" screenshot | Same as sibling series |
| Windows | Recommend WSL2 up front in Part 1, short callout | The SDK spawns a CLI subprocess; WSL2 is the safe recommendation (re-verify native Windows at writing time) |
| Keys hygiene | `.env` + gitignore everywhere; pre-push grep for key prefixes; Part 14 repeats the rule server-side | Standing security rule for all series work |

### 5.2 Analogy bank (extends WRITING-STYLE §7 for this series)

Consistent across all 14 parts; where one breaks down, say where.

| Concept | Analogy |
|---|---|
| Agent SDK vs Messages API | Hiring a contractor vs supervising every nail yourself |
| The agent loop | An intern with a toolbox who keeps working until the job's done |
| Built-in tools | The agent's hands |
| `cwd` / workspace | The agent's desk — one desk per client engagement |
| Permission modes | How much you trust a new employee: shadowing → supervised → keys to the building |
| `can_use_tool` + approval card | The manager's sign-off stamp |
| Hooks | The building's security system — logs every badge swipe, even the ones the manager waved through |
| Sessions / JSONL | The agent's diary — it writes one whether or not you read it |
| `resume` | Handing the diary back open at the right page |
| `fork_session` | Photocopying the diary mid-page and letting two stories continue |
| SSE envelopes | Labeled parcels on one conveyor belt (carried over from the LangGraph series verbatim) |
| Custom tools / MCP server | A new tool on the agent's belt, with the safety guard built into the tool |
| External MCP servers | Power tools from the hardware store — versus the ones you machined in-house |
| Sandbox | The glovebox — hands go in, the blast stays contained |
| Event log + replay | The flight recorder — you can replay the whole flight |
| Decoupled worker / stream | The kitchen keeps cooking even if the waiter changes shifts |
| Plan mode | The contractor's written estimate before any demolition |
| AskUserQuestion | The contractor calling mid-job: "matte or gloss?" |
| Extended thinking | The intern's scratchpad you're allowed to read |
| Subagents | Calling in a specialist who hasn't seen your working (fresh eyes) |
| Skills | The employee handbook — read when relevant, not recited daily |
| Structured outputs | A form instead of an essay |
| `max_budget_usd` | The prepaid meter |
| Evals | The driving test — a pass rate, not a vibe |
| The VM (vs serverless) | The analyst finally gets its own office — with a filing cabinet that doesn't vanish at 5pm |

### 5.3 Comic seeds (per WRITING-STYLE §9 — Yad in every strip; the joke encodes the concept)

| Part | Seed |
|---|---|
| 1 | Yad asks his new "analyst" (a laptop in a tiny tie) for average revenue; it vanishes into a filing cabinet and emerges with the answer plus three charts nobody asked for |
| 2 | Yad watching the agent's office through a window: sticky notes going up in real time vs the closed door labeled "PLEASE WAIT 60s" |
| 3 | The agent wearing a body cam; Yad on the couch with popcorn watching "READING SALES.CSV" like a police procedural |
| 4 | Yad hands over a shoebox of crumpled receipts; the agent gravely accepts it like a briefcase — and later slides a bound report across the desk: "Page 12, with charts." |
| 5 | The agent flips through a labeled diary mid-conversation: "Ah yes — Tuesday. You prefer bar charts." Yad, touched and slightly scared |
| 6 | The agent picking a database's lock with a pandas crowbar; Yad hands it a keycard labeled READ-ONLY instead |
| 7 | Agent holds up a sign: "MAY I RUN rm -rf?" Yad spit-takes coffee onto the DENY button |
| 8 | The agent flashes an "ALWAYS ALLOWED" badge and strolls past the manager — straight into frame of the ceiling camera labeled HOOK, which is already printing the incident report |
| 9 | Power cut mid-report. Lights back on. The agent continues mid-sentence from the flight recorder. Yad checks if *he* lost his place |
| 10 | The agent unrolls a full blueprint across Yad's desk. Yad: "I asked you to move a chair." Agent, tapping the blueprint: "Question 1 of 2: which wall?" |
| 11 | Tiny hard-hatted reviewer-clone hands the analyst a sticky note: "March is in here twice." The analyst, deflated: "…recalculating." |
| 12 | The agent, in a glovebox, reaching for a gleaming wall of third-party power tools; Yad checks each one through the airlock slot |
| 13 | The analyst at a driving test; a tiny judge-clone in a powdered wig marks a clipboard: "Attempt 7: PASS. Parallel parking: still prose." |
| 14 | Yad tries to feed the analyst through a mail slot labeled SERVERLESS; it doesn't fit. Behind them, a modest office (labeled HETZNER, €5/mo) with the analyst's name already on the door |

---

## 6. Decisions

### 6.1 Resolved

**2026-06-12 (original planning):**

1. **Series app: the data-analyst agent** (over a general workbench or plain chat). Upload
   CSVs, agent analyzes with Bash+Python, produces charts and reports as artifacts.
2. **Series slug: `claude-agent-sdk-fastapi-nextjs`** (folder matches the official package name
   and the blog's slug convention).
3. **Persistence: SDK-native + SQLite where needed.** No Postgres, no Docker.
4. **Sample dataset: Beanline** (fictional coffee chain) with deterministic generator + planted
   flaw. *(Was §6.2.3, confirmed by default in the 2026-07-03 revision.)*
5. **uv over pip.** *(Was §6.2.2; now also proven unproblematic by a year of uv-default
   ecosystem.)*

**2026-07-03 (this revision, by Yadnesh):**

6. **Series name: "Claude Agent SDK in Production: Build an AI Data Analyst with FastAPI and
   Next.js."** Short form for kickers/nav: *Agent SDK in Production*. Signals the
   intermediate-first level; sibling naming ("from Scratch") deliberately not reused.
7. **Act I compressed to 5 parts** — basics delegated to the LangGraph series via the standing
   pointer map (§1). No re-teaching of FastAPI/Next.js/SSE fundamentals.
8. **All four new advanced parts are in**: Hooks (P8), Plan mode + AskUserQuestion + thinking
   (P10), External MCP + sandboxing (P12), Structured outputs + budgets + evals (P13).
9. **Deployment part is in — Part 14, Hetzner VM**, reversing the June "no deployment part"
   decision now that LangGraph Part 8 covers the PaaS story. **Non-negotiable: the part is
   written against a real deployment** — Yadnesh provides Hetzner creds at writing time, the
   app gets deployed for real, the demo video is shot against the live VM. The part explicitly
   teaches portability to EC2/DigitalOcean/any VM.
10. **Three-act structure** (5 + 4 + 5) with the `stages` TOC extension (§2.1).
11. **Publication order resolved by history**: LangGraph shipped first and built all
    infrastructure; this series inherits everything (§2).
12. **Companion repo: `claude-agent-sdk-in-production`, one folder per part** (house convention
    superseding the old branch-per-part idea).

### 6.2 Open — small, none block Part 1

1. **Which external MCP server for Part 12.** Needs a stable, high-demo-value pick (web
   search/fetch vs Playwright vs GitHub). Decide during the Part 12 spike; the part's prose is
   server-agnostic.
2. **Thinking-block rendering depth in Part 10.** Collapsed drawer is committed; whether to
   stream it token-by-token or reveal-on-complete depends on how `thinking_delta` feels in the
   spike.
3. **Hetzner instance size + whether frontend also lives on the VM.** Plan default: one small
   shared-vCPU box, both services on it, Caddy in front. Revisit against real resource usage
   during the Part 14 deploy test.

---

## 7. Known risks — verify at writing time

The SDK is 0.2.x and fast-moving (three digits of patch releases in a year). Before drafting
each part, re-verify against the freshly pinned SDK version:

1. **Message shapes.** Tool results in the stream, `SystemMessage(init)` payload, `StreamEvent`
   delta structure — Parts 1–2 assert these in figures. **Run the spike script first** (§8
   step 2).
2. **`can_use_tool` transport constraints.** The plan assumes it needs `ClaudeSDKClient`
   (it's *why* Part 7 introduces the client). If plain `query()` supports it on the pinned
   version, Part 7's client motivation shifts to interrupts alone — one paragraph, not a
   restructure.
3. **Session utilities.** `list_sessions` / `get_session_messages` / `get_session_info` /
   `rename_session` are load-bearing for Part 5 — confirm exact signatures and the
   per-`cwd` directory behavior with workspaces (each workspace may shard the session store;
   Part 5's sidebar must account for it).
4. **AskUserQuestion via SDK.** The reference app bridges it with hooks + sidecar persistence;
   confirm the current cleanest SDK surface (tool event vs hook) before drafting Part 10.
5. **Sandbox is beta.** API shape (`sandbox={...}`) and platform behavior (macOS vs Linux)
   may shift; Part 12 flags beta status in prose and pins hard. Re-test on the Hetzner box for
   Part 14 (Linux path is the one readers will run in production).
6. **Billing.** The subscription-credit option for SDK usage was in flux mid-June 2026
   (reportedly paused). Confirm before Part 1's API-key section ships; show whichever path is
   cheapest for readers.
7. **Model ids and pricing.** `claude-haiku-4-5` / `claude-sonnet-5` and per-part cost figures —
   re-quote at writing time (intro pricing on some models ends Aug 31, 2026).
8. **Bundled CLI claim.** Confirmed in docs (wheel bundles the CLI), but verify on a clean
   machine and on WSL2 before Part 1 publishes.
9. **Reader-machine safety.** Parts 1–6 run `bypassPermissions` against a sandbox cwd. The
   recurring warning callout is non-negotiable; have someone adversarial review its wording
   before Part 1 ships.
10. **Hetzner deploy test.** Part 14 requires real creds (Yadnesh provides), a throwaway
    domain/subdomain for Caddy, and a teardown checklist so the box doesn't linger billing.
    The SSE-through-proxy section must be tested against the real Caddy config, not assumed.

---

## 8. Suggested order of work

1. **Spike before prose.** A throwaway `spike/` script against the freshly pinned SDK
   exercising every §7 assertion: message shapes, partial messages, resume + fork, session
   utilities, `can_use_tool` + Future bridge, interrupt, hooks (PreToolUse deny + PostToolUse
   audit), subagent stream events (`parent_tool_use_id`), structured outputs, `max_budget_usd`,
   sandbox on macOS + Linux, one external MCP server. One day; de-risks thirteen parts.
2. **Build the Beanline dataset + companion repo** (`claude-agent-sdk-in-production`):
   generator script with the planted flaw, `beanline.db` builder, `part-01-first-agent/`
   folder, tested end-to-end per WRITING-STYLE §13's testing bar.
3. **`stages` TOC extension** (§2.1) — the only blog-side work; ~45 minutes.
4. **Write Part 1 as the quality reference** — screenshots, callouts, comic, cover, demo video,
   Recap + Quiz. Lock tone against WRITING-STYLE §11. Then Part 2, which is the series' real
   bar (the message-anatomy figure and the event-vocabulary section are the hardest assets).
5. **Write Parts 3–5 in order** to close Act I; publish weekly once 1–2 are done (same cadence
   as the sibling series). Sync each part's folder + video as it lands.
6. **Write the Concepts page in parallel with Parts 1–2** (they generate most anchors).
7. **Act II (6–9), then Act III (10–13)**, batching reviews every 2 parts. The `part-05` folder
   must be rock-solid before Act II advertises jumping in from it.
8. **Part 14 last, against a real VM** — request Hetzner creds, deploy, shoot the demo video
   from the live URL, write the teardown checklist.
9. **Launch ritual per part** + a series-landing announcement once Act I is complete.

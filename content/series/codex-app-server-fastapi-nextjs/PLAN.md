# Series Plan — Codex App Server in Production: Build an AI Website Builder with FastAPI and Next.js

> Internal planning document. Not served by the blog (the post loader only scans `content/posts/*.mdx`).
> Created 2026-07-06 by Yadnesh + Claude against the Codex CLI **0.140.x** line (app-server
> protocol **v2**, marked experimental by OpenAI), the live docs at
> developers.openai.com/codex/app-server, and the production reference app
> (`~/code/afgi/agent_private_credit4/agent_private_credit`, which embeds `codex app-server`
> pinned at `@openai/codex@0.139.0`).
> Decisions from the planning session are logged in §6.1. **Re-pin the CLI version and re-run
> the spike (§8 step 1) before drafting Part 1** — the protocol moves faster than the Claude
> Agent SDK did.

---

## 1. Overview

### What we're building (across the whole series)

**Pagewright** — an AI website builder you run on your own machine, and by the end, on a real
server. You describe a site in plain English ("a one-page site for a specialty coffee chain
called Beanline — warm, editorial, a menu section"), and watch the agent scaffold it file by
file in a live preview: commands streaming, patches landing, a diff drawer showing exactly what
changed. Risky actions wait for your approval. Before anything ships, the agent's own reviewer
inspects the work. Then you hit Publish and the site is live at a real URL.

- **Backend:** Python 3.13 + FastAPI + a **raw JSON-RPC client for `codex app-server`** that we
  build ourselves across Parts 1–2 (no SDK wrapper — see §6.1 decision 3)
- **Frontend:** Next.js 16 (App Router) + Tailwind CSS 4
- **LLM:** OpenAI only — the app server is the engine inside the Codex CLI. Default model
  `MODEL = "gpt-5.4-mini"` (§6.1.12), one line to upgrade to `gpt-5.5`.
- **State:** protocol-native threads (`~/.codex/sessions`) through Part 8; SQLite arrives in
  Part 9 for the durable event log. No Postgres, no Docker, no Redis anywhere in the series.
- **Deployment (Part 13):** a Hetzner VM, for real — tested by actually deploying the finished
  app before the part ships, same non-negotiable as the sibling series.

The core insight the series sells: **`codex app-server` is the engine inside every Codex
surface** — the CLI, the IDE extension, the web app, and the desktop app are all just clients
of this one JSON-RPC process. OpenAI opened that same socket to everyone, and almost nobody has
written about it. This series builds a product on the protocol itself: threads and turns,
streamed items, server-initiated approvals, OS-level sandboxing, mid-turn steering, and a
built-in code reviewer. Where the Claude series' agent *answered questions*, this one *changes
files* — so diffs, patches, and review become the product.

### Audience: intermediate-first

Same contract as the Agent SDK series, now with **two** sibling series to lean on: LangGraph
for web fundamentals, Agent SDK for agent-product patterns. **We never re-teach what a sibling
teaches; we link the exact part.** The standing pointer map (used throughout, verbatim targets):

| When we need… | We point to… |
|---|---|
| Python/Node environment setup from zero | LangGraph Part 1: Installation & Setup |
| FastAPI from zero (endpoints, Pydantic, `/docs`, CORS) | LangGraph Part 2: FastAPI Fundamentals |
| Next.js + chat UI from zero (`'use client'`, state, fetch) | LangGraph Part 4: The Next.js Frontend |
| SSE / streaming from zero (wire format, fetch-reader parsing) | LangGraph Part 5: Streaming Responses |
| What tools / the agent loop are | LangGraph Part 6 · Agent SDK Part 1 |
| The block model for agent chat UIs | Agent SDK Part 3: The Agent UI |
| The asyncio.Future approval-bridge pattern (from zero) | Agent SDK Part 7: Approvals |
| Durable-stream theory (worker/viewer split, seq, `Last-Event-ID`) | Agent SDK Part 9: Durable Streams |
| Eval methodology in full (cases, runners, LLM-as-judge) | Agent SDK Part 13: Trust but Verify |
| VM deployment fundamentals (systemd, Caddy, the SSE-proxy gotcha) | Agent SDK Part 14: Ship It |
| PaaS deployment (Vercel + Fly.io) | LangGraph Part 8: Deploying to the Internet |

Each part that leans on a pointer says so in its first section. The series landing page gets a
"Which series first?" section: LangGraph if you want the from-zero on-ramp; Agent SDK first is
*not* required — this series stands alone, but readers of both will feel the rhymes (that's
deliberate — see "How this relates" below).

### Three acts

- **Act I — Build the product (Parts 1–5).** Brisk. Speak the protocol by hand, wrap it in a
  real async client behind FastAPI, stream into a chat UI, then the series' hero feature: a
  per-project workspace with a live iframe preview and a diff drawer. Close with
  protocol-native persistence (resume, list, fork).
- **Act II — Control (Parts 6–9).** The Codex-shaped safety ladder: the sandbox grid
  (Codex's permission model is sandbox-*first* — the inverse of the Claude series' arc, and we
  say so), human-in-the-loop approvals over server-initiated requests, live control
  (interrupt + **steer** + the usage meter), and durable streams that survive a refresh.
- **Act III — Advanced capabilities and shipping (Parts 10–13).** Plans + reasoning depth +
  structured user questions, the built-in **review mode** gating a Publish button (+ structured
  outputs + smoke evals), MCP servers + skills + AGENTS.md, and a real deployment to a Hetzner
  VM where published sites get real URLs.

> **Companion repo convention (follow WRITING-STYLE §13):** public repo
> **`codex-app-server-in-production`** with **ONE FOLDER PER PART**, each folder the complete
> runnable end-of-part project, tested for real before publishing. Posts wire partial-update
> fences with `repo=`/`lines=` meta, synced via `npm run sync:code`. Every part gets a demo
> video (shot-scraper storyboard, human pacing per §13, MP4 + poster + `preload="none"` via
> `<DemoVideo>`) and ends with the **Recap + Quiz** ritual.

### How this relates to the sibling series

Three series, one blog, three altitudes:

- **LangGraph from Scratch** = build the engine yourself.
- **Claude Agent SDK in Production** = drop in a crate engine via a Python SDK and build the
  car around it.
- **Codex App Server in Production** = there's no SDK between you and the engine — you're
  holding the wiring harness. Build the car anyway.

All three use FastAPI + Next.js + SSE, so the plumbing rhymes on purpose. The deepest rhyme:
the production reference app streams *Claude and Codex through the same SSE contract* — this
series' event vocabulary (§3) is deliberately near the Agent SDK series' so a reader who
finishes both has effectively built that provider-agnostic layer. (A "one UI, two engines"
capstone was considered and deferred — §6.1 decision 4.)

The positioning bet: LangGraph and Agent SDK content exists elsewhere; **nothing serious exists
online about building products on the app-server protocol.** This series is the reference.

### Tone

Identical to the sibling series and governed by **WRITING-STYLE.md** (hooks, voice, banned
words, comics, demo videos, Recap + Quiz, the pre-publish checklist). This plan adds the
series-specific analogy bank (§5.2) and comic seeds (§5.3).

### Concept handling

Same two layers:

1. **Inline `<Callout type="info">` boxes** for 1–3 sentence clarifications.
2. **A shared "Concepts" page** at `/blog/codex-concepts` (frontmatter `kind: reference`),
   linked via fragment URLs (§4).

Generic web concepts get short entries linking to LangGraph; patterns shared with the Agent SDK
series (Future bridge, durable streams, evals) get short entries linking there; the
protocol/Codex concepts get the full treatment.

---

## 2. Series infrastructure (blog changes)

**Zero blog-side work required.** Both prior series paid the full cost. This series inherits:
series frontmatter + `stages` act grouping (shipped for the Agent SDK series), `SeriesToc`,
`SeriesNav`, the "On this page" rail, `<Figure>`/`<Callout>`/`<Recap>`/`<Quiz>`/`<DemoVideo>`,
the FullFile feature (`repo=`/`lines=` fences + `npm run sync:code`), search indexing, OG cards.

### 2.1 Files

```
content/
  posts/
    codex-1-first-thread.mdx … codex-13-deploy-hetzner.mdx
    codex-concepts.mdx               # kind: reference
  series/
    codex-app-server-fastapi-nextjs/
      PLAN.md                        # this file — ignored by the loader
      index.mdx                      # series metadata + intro (incl. pointer-map section)
public/
  videos/codex/part-N-demo.mp4 + part-N-poster.jpg      # per WRITING-STYLE §13
  images/series/codex/part-N/…       # figures, comics, covers per WRITING-STYLE §8–10
```

`index.mdx` `stages`:

```yaml
stages:
  - { name: "Act I — Build the product", from: 1, to: 5 }
  - { name: "Act II — Control", from: 6, to: 9 }
  - { name: "Act III — Advanced capabilities and shipping", from: 10, to: 13 }
```

Series cover: code-drawn SVG per WRITING-STYLE §10, icon row **OpenAI · FastAPI · Next.js**
from `public/icons/`. The series dessert shot — chat on the left mid-build (command badge
running, an approval card with a patch preview), the live site preview on the right with the
diff drawer open — doubles as the hero.

Companion repo: **`yadneshsalvi/codex-app-server-in-production`** — `part-01-first-thread/` …
`part-13-deploy-hetzner/`, each complete + runnable + tested, per-part `demo.mp4`, READMEs
wired like the siblings.

### 2.2 No `<CodeTabs>`

Single-provider series; plain single-variant code blocks throughout.

---

## 3. Tutorial breakdown

13 parts in three acts (5 + 4 + 4). Same rules as the siblings: every part ends with something
runnable; the reader can always name the capability they gained.

### Pacing

| Part | Act | Working result at the end | Reading time |
|---|---|---|---|
| 1 | I | A Python script speaks JSON-RPC to `codex app-server`; the agent builds a real HTML page in a folder | 15–18 min |
| 2 | I | A reusable async client behind FastAPI; the agent's items stream as SSE, watchable with `curl -N` | 22–28 min |
| 3 | I | A browser chat UI: token streaming, live command badges with scrolling output, a reasoning drawer | 18–22 min |
| 4 | I | Per-project workspaces; the site renders in a live iframe preview with a file tree and diff drawer | 22–28 min |
| 5 | I | Projects persist: sidebar from `thread/list`, resume across restarts, fork a site into two drafts | 15–18 min |
| 6 | II | A trust-mode picker maps to sandbox + approval policies; the OS itself blocks out-of-bounds writes | 18–22 min |
| 7 | II | Risky commands and patches pause for your Approve/Deny click — with the diff in the approval card | 22–28 min |
| 8 | II | A Stop button that works, mid-turn steering ("make the header green" without restarting), a live token meter | 15–18 min |
| 9 | II | Refresh mid-build and the stream picks up exactly where it left off; Stop works from any tab | 18–22 min |
| 10 | III | The agent proposes a blueprint first, asks structured questions, and its reasoning depth is a dial | 20–25 min |
| 11 | III | A Publish button gated by the agent's own reviewer; validated JSON manifest; a smoke-eval suite passes | 22–28 min |
| 12 | III | AGENTS.md house rules, a brand-kit skill, and an external MCP server — with a health panel | 18–22 min |
| 13 | III | Pagewright live on a Hetzner VM; published sites at real URLs; Linux sandbox verified in production | 15–18 min |

Act I ≈ 1h45m reading; Act II ≈ 1h20m; Act III ≈ 1h25m; total ≈ 4h30m. Hands-on, 10–14 hours.

### The event vocabulary (defined once, extended forever)

Part 2 establishes the SSE envelope — `data: {"type": ...}\n\n` — and the rest of the series
only ever *adds event types*. Names deliberately shadow the Agent SDK series' vocabulary where
semantics match, and the production reference app's wire format throughout — that app streams
Claude *and* Codex through one contract, which is the proof this vocabulary is provider-portable.

| `type` | Introduced | Payload |
|---|---|---|
| `session_start` | Part 2 | `session_id` (+ `project_id` from Part 4) |
| `text_delta` | Part 2 | `text` (from `item/agentMessage/delta`) |
| `item_start` / `item_done` | Part 2 | `item_id`, `kind` (command, file_change, mcp_tool, web_search…), `detail`, `status` |
| `complete` | Part 2 | `status`, `usage` (+ `structured_output` from Part 11) |
| `error` | Part 2 | `message` |
| `command_output_delta` | Part 3 | `item_id`, `chunk` |
| `reasoning_delta` | Part 3 | `text` (summary deltas) |
| `file_change` | Part 4 | `item_id`, `files: [{path, kind}]`, `status` |
| `diff_updated` | Part 4 | `unified_diff` (from `turn/diff/updated`) |
| `preview_refresh` | Part 4 | `project_id` |
| `approval_request` / `approval_resolved` | Part 7 | `approval_id`, `kind`, `command`/`diff` / `decision` |
| `usage_update` | Part 8 | token counts (from `thread/tokenUsage/updated`) |
| *(SSE `id:` field — sequence numbers)* | Part 9 | enables replay + `Last-Event-ID` |
| `plan_update` | Part 10 | `steps: [{step, status}]` |
| `question_request` / `question_resolved` | Part 10 | `question_id`, `prompt`, `options` / `answer` |
| `review_state` / `review_finding` | Part 11 | `entered`/`exited` / `finding {title, body, location}` |

### Protocol facts the parts are written against (verified 2026-07-06, CLI 0.140.x, protocol v2)

Re-verify before drafting each part (§7) — the protocol is explicitly experimental. The plan
asserts:

- **Launch + transport:** `codex app-server` speaks JSON-RPC 2.0 as newline-delimited JSON over
  stdio (WebSocket and Unix-socket transports exist but are experimental; we use stdio).
  Handshake is mandatory: `initialize` request → response → `initialized` notification; any
  method first gets "Not initialized". `capabilities.experimentalApi: true` gates unstable
  methods; **v2 thread/turn APIs are what OpenAI mandates for new integrations.**
- **Methods we use:** `thread/start`, `thread/resume`, `thread/fork`, `thread/read`,
  `thread/list`, `thread/name/set`, `thread/archive`, `turn/start`, `turn/steer`,
  `turn/interrupt`, `review/start`, `model/list`, `account/rateLimits/read`, `skills/list`,
  `mcpServerStatus/list`.
- **`thread/start` params:** `model`, `cwd`, `approvalPolicy`, `sandboxPolicy`,
  `developerInstructions`, `ephemeral`. **`turn/start` params:** `threadId`,
  `input: [{type:"text"|"image"|"localImage"|"skill"…}]`, plus per-turn overrides — `model`,
  `effort` (low→xhigh ladder in the reference app; docs say low|medium|high — verify), `summary`
  (concise|detailed), `outputSchema` (JSON Schema for structured final output),
  `collaborationMode`.
- **Notifications we consume:** `thread/started`, `turn/started`, `turn/completed` (status
  `completed|interrupted|failed`, carries usage), `turn/diff/updated`, `turn/plan/updated`,
  `thread/tokenUsage/updated`, `item/started`, `item/completed`, `item/agentMessage/delta`,
  `item/reasoning/summaryTextDelta`, `item/commandExecution/outputDelta`,
  `item/fileChange/patchUpdated`, `item/plan/delta`, `serverRequest/resolved`.
- **Item types:** `userMessage`, `agentMessage`, `reasoning`, `commandExecution`, `fileChange`,
  `mcpToolCall`, `webSearch`, `plan`, `enteredReviewMode`, `exitedReviewMode`,
  `contextCompaction`.
- **Approvals are server→client JSON-RPC *requests*** (the server blocks on our response):
  `item/commandExecution/requestApproval`, `item/fileChange/requestApproval`,
  `item/tool/requestUserInput`. Decisions: `accept | acceptForSession | decline | cancel`
  (command approvals also support an execpolicy-amendment variant). Legacy shapes
  (`execCommandApproval`/`applyPatchApproval`, `approved`/`denied`) still exist in the wild —
  the reference app registers both; **we teach only the current shape.**
- **`approvalPolicy` enum:** docs page says `never | unlessTrusted | onRequest`; the repo README
  says `always` where the docs say `onRequest`; the reference app (0.139.0) sends kebab-case
  `untrusted | on-request | never`. **Resolve from the generated schema at spike time** — this
  is the plan's #1 verify item.
- **`sandboxPolicy` variants:** `readOnly`, `workspaceWrite {writableRoots, networkAccess,
  readOnlyAccess}`, `dangerFullAccess`, `externalSandbox`. Network is **off by default** under
  workspaceWrite. Enforcement: macOS Seatbelt; Linux Landlock + seccomp.
- **Persistence:** rollouts live under `~/.codex/sessions` (`CODEX_HOME` relocates);
  `thread/resume` reopens, `thread/fork` branches, `thread/read` replays without loading,
  `ephemeral: true` threads never persist.
- **Typed clients:** `codex app-server generate-json-schema --out DIR` and `generate-ts` emit
  the schema for the *installed* CLI version — we vendor the JSON Schema into the companion
  repo per pinned version as the verification reference; the posts use hand-written models for
  the used surface only (§6.1.15).
- **Errors:** `-32001` server overloaded (retry with backoff); `codexErrorInfo` values include
  `ContextWindowExceeded`, `UsageLimitExceeded`, `SandboxError`, `Unauthorized`.
- **Auth for embedding:** API key (`OPENAI_API_KEY`, billed as standard API usage) is the
  recommended path and what the series uses; ChatGPT-plan auth exists for narrow
  enterprise/trusted-runner cases — one honest callout, not a lane we take. Exact env-var/login
  mechanics verified at spike time (the TS SDK uses `CODEX_API_KEY`; the reference app sets
  `OPENAI_API_KEY` + `CODEX_HOME`).
- **The official SDKs** (`@openai/codex-sdk` TS; `openai-codex` Python, beta) wrap this same
  protocol by shelling out to the CLI, and don't expose the full event/approval surface. One
  callout in Part 1 says so and links out; the series builds on the protocol (§6.1 decision 3).

---

### Part 1 — Setup and your first thread

**Slug:** `codex-1-first-thread` · **Reading:** 15–18 min · **Screenshots:** ~7

**Why this part exists:** One sitting from install to an agent building a real page in a
folder — driven entirely by JSON we wrote ourselves. For an intermediate reader the lesson
isn't setup; it's the reveal that the Codex CLI is a *server*, and every Codex surface is just
a client of it. By the end the reader has spoken the same protocol VS Code speaks.

**Sections:**
- *What you're going to build* — the dessert shot: finished Part 13 Pagewright (chat mid-build,
  approval card with patch preview, live site preview, inspector report). One paragraph on the
  three acts. Pointers: never touched FastAPI or React → LangGraph Parts 1–5; want the
  SDK-flavored sibling of this series → Agent SDK Part 1.
- *The engine and its service hatch* — every Codex surface (CLI, IDE extension, web, desktop)
  is a client of one process: `codex app-server`. OpenAI opened the hatch; we're climbing in.
  Link `#app-server`.
- *Setup, checklist-style* — Node 22 LTS, `npm i -g @openai/codex@<PIN>`, Python 3.13 + uv,
  `uv init backend`, OpenAI API key with a $5 hard limit ("treat it like a password" box);
  WSL2 recommendation for Windows. Run `codex` interactively once — drive the car before
  opening the hood. Brisk; LangGraph Part 1 linked for the from-zero version.
- *Hello, app-server* — spawn the subprocess from Python, write `initialize`, read the
  response, send `initialized`. The numbered-notes-under-the-door analogy. ~30 lines,
  procedural on purpose.
- *Break it on purpose (the handshake wall)* — send `thread/start` before `initialize`, read
  the "Not initialized" error. The protocol has a contract and enforces it — that's a feature.
- *Your first thread* — `thread/start` with `cwd` pointing at an empty `site/` folder, a
  workspace-write sandbox, and approvals set to not-ask. Callout: **the sandbox is why
  not-asking is sane** — Codex arrives with the scissors pre-sheathed (explicit contrast with
  the sibling series' "running with scissors" arc; link `#sandbox-policies`).
- *Your first turn* — `turn/start`: "Build a single-page site for Beanline, a specialty coffee
  chain: warm, editorial, a menu section. Plain HTML and CSS only." Raw notifications scroll:
  `item/started` (reasoning), `item/agentMessage/delta`, a `commandExecution`, `fileChange`
  items, `turn/completed`.
- *Anatomy of the notification stream* — the annotated JSONL trace figure: requests vs
  responses vs notifications; items as the unit of agent work; `turn/completed` with usage.
  The Act I Rosetta stone and the hardest asset of the act.
- *Open the folder* — `index.html` exists; open it in a browser. A real site, built by JSON we
  wrote by hand. The series' first dessert moment.
- *The meter ritual* — print token usage from `turn/completed` after every run; first data
  point. Every later part keeps the habit (graduates to a live meter in Part 8).
- *The archive the engine keeps* — `ls ~/.codex/sessions`: rollout files noticed, not used.
  (Foreshadows Part 5.)
- *Git init* — `.gitignore` covering `.venv/`, `node_modules/`, `.env*`, `projects/`; commit.

**Code introduced:** ~80 lines of Python (single procedural script).

**Callouts:** JSON-RPC in one box (ids correlate request/response; notifications have no id);
"the protocol is experimental — this series pins hard and tells you when to regenerate";
official SDKs exist (TS stable, Python beta) and wrap this same protocol — why we're building
on the protocol itself; "tested with" pinned-version block.

**Forward references:** "A script that prints JSON is not a product. Next: a real client class
and a URL."

**NOT covered yet:** FastAPI, streaming to a browser, approvals (sandbox carries safety for
now), resume, the diff drawer.

---

### Part 2 — The FastAPI bridge and the event vocabulary

**Slug:** `codex-2-fastapi-bridge` · **Reading:** 22–28 min · **Screenshots:** ~6 + 1 pipeline diagram

**Why this part exists:** The two most load-bearing designs in the series land together: the
reusable **`CodexClient`** (async JSONL transport with request/response correlation, a
notification pump, and a server-request handler seam that approvals will plug into in Part 7)
and the **SSE event vocabulary** the next eleven parts only ever extend. FastAPI is assumed
(LangGraph Part 2); SSE mechanics are assumed (LangGraph Part 5). What's new is mapping a
*bidirectional* agent protocol onto a one-way wire.

**Sections:**
- *Why a server at all* — browsers can't hold your API key or spawn subprocesses. One paragraph.
- *From script to client class* — `CodexClient`: spawn, a writer lock, a reader task, a pending-
  futures dict keyed by request id, an `asyncio.Queue` per turn for notifications, and a
  registry for server-initiated requests (empty until Part 7 — we build the seam now and say
  why). The most important ~120 lines of the series.
- *Break it on purpose* — kill the codex process mid-turn; the reader task sees EOF, pending
  futures get exceptions, the stderr ring buffer explains why. Production-grade honesty from
  the start.
- *One process, many threads* — one long-lived app-server per backend process, threads
  multiplexed over it (how every official surface does it) vs process-per-request. Callout on
  `-32001` backpressure + retry.
- *Designing the envelope* — the §3 event table, first six types. The teachable moment: we're
  designing for event types we haven't invented yet (file changes P4, approvals P7, questions
  P10) — and the parser will never change. The provider-portability proof: the production app
  this series is drawn from streams Claude and Codex through one such contract.
- *The translator* — notification → envelope mapping: `item/agentMessage/delta` → `text_delta`;
  `item/started`/`item/completed` → `item_start`/`item_done` with a `kind`; `turn/completed` →
  `complete`. Part 1's stream anatomy pays rent.
- *`POST /chat` + `curl -N`* — `StreamingResponse(translate(...), media_type="text/event-stream")`;
  command items scroll live in the terminal. Already dramatic.
- *The streaming pipeline diagram* — codex subprocess ⇄ CodexClient ⇄ translator ⇄
  StreamingResponse ⇄ browser. (One of the two "must be beautiful" SVGs of Act I.)

**Code introduced:** ~180 lines of Python (`app/codex_client.py`, `app/events.py`,
`app/main.py`).

**Callouts:** why JSON envelopes, not raw protocol passthrough (the frontend should never know
Codex's notification names — the whole point of the vocabulary); why not WebSockets; asyncio
futures-as-mailboxes (short, links `#futures-and-events` and Agent SDK Part 7).

**Forward references:** "The only consumer is curl. Next: the real one."

**NOT covered yet:** sessions/resume, approvals, interrupts, the UI.

---

### Part 3 — The builder UI

**Slug:** `codex-3-builder-ui` · **Reading:** 18–22 min · **Screenshots:** ~8 (UI growing)

**Why this part exists:** First moment Pagewright looks like a product — and the part that
adapts the agent-UI playbook to a *builder*: command badges with live scrolling output
(terminal-in-a-badge — a Codex-specific delight) and a reasoning drawer. Chat-from-zero is
assumed (LangGraph Part 4); the block model is assumed (Agent SDK Part 3 teaches it from
zero — pointer in the first section) so this part starts correct and moves fast.

**Sections:**
- *What we'll build* — screenshot of the finished Part 3 UI.
- *Scaffold* — `npx create-next-app@latest frontend`, `NEXT_PUBLIC_API_BASE_URL`, no component
  library (house convention). Checklist speed.
- *The block model, item-shaped* — assistant turns are sequences of blocks keyed by `item_id`:
  `{type:'text'} | {type:'item', kind}`. One paragraph on why this mirrors the protocol's own
  noun (items), with the pointer to Agent SDK Part 3 for the from-zero derivation.
- *Reading the stream* — fetch + reader + SSE parsing at review speed (LangGraph Part 5
  pointer). Switch on `type`: `text_delta` appends; `item_start` opens a badge; `item_done`
  settles it.
- *The command badge* — spinner + "`npx serve` — running", output area fed by
  `command_output_delta`, capped + scrollable (the flooding lesson learned in the LangGraph
  series, applied preemptively); exit-status styling on `item_done`.
- *The reasoning drawer* — `reasoning_delta` into a collapsed, muted drawer ("the intern's
  scratchpad you're allowed to read" — analogy shared with the sibling). Summary text only;
  the `effort`/`summary` dials are named and deferred to Part 10.
- *Markdown answers* — `react-markdown` + `remark-gfm`.
- *Break it on purpose* — drop the `item_id` keying and watch two concurrent items scramble
  into one badge; restore it. (Same class of bug as the sibling series' — one screen.)

**Code introduced:** ~200 lines of TypeScript.

**Callouts:** `agentMessage` vs `reasoning` items (what the user said vs how it thought);
friendly labels for common commands via a tiny `commandLabel()` map.

**Forward references:** "The agent builds sites you can't see. Next: the live preview."

**NOT covered yet:** file tree, preview, diffs, workspaces.

---

### Part 4 — Workspaces, the live preview, and the diff drawer

**Slug:** `codex-4-live-preview` · **Reading:** 22–28 min · **Screenshots:** ~9

**Why this part exists:** The series' hero part. `fileChange` items and `turn/diff/updated`
are Codex's signature outputs, and here they become product features: a live iframe preview
that refreshes as patches land, a file tree, and a diff drawer. This is the screenshot that
sells the series.

**Sections:**
- *One desk per client* — per-project workspaces: `projects/{id}/site/`, thread `cwd` pointed
  at it, `project_id` in `session_start`. (Same isolation lesson as Agent SDK Part 4 —
  pointer — but the artifact here *is* the workspace.)
- *The brief bank* — `briefs/` in the companion repo: small fictional client briefs, each a
  markdown brief + assets folder (logo SVG, copy deck). First client: **Beanline** (yes, that
  Beanline — the coffee chain from the sibling series finally gets a website; one wink, one
  sentence). One brief — **Harbor & Vine** — carries a planted contradiction (brief says
  forest-green brand; the provided logo is navy) that pays off in Part 11. Briefs are seeded
  into the workspace at project creation.
- *Serving the site* — FastAPI `StaticFiles` mount at `/preview/{project_id}/`, iframe with the
  `sandbox` attribute; the security callout (untrusted generated HTML in an iframe, why the
  attribute matters).
- *`file_change` → the file tree* — panel listing workspace files, badges for add/update/delete
  as items land.
- *`preview_refresh` → the living preview* — emit on `fileChange` completion; iframe reloads
  with a cache-busting query. The magic moment: type a sentence, watch a site assemble.
- *The diff drawer* — `turn/diff/updated` streams the turn's aggregate unified diff; render it
  in a slide-over drawer (hand-rolled ~60-line diff renderer: file headers, +/- line tinting —
  no dependency). "Before/after photos of the job site."
- *Break it on purpose (the network wall)* — ask for Google Fonts; the sandbox has no network,
  the fetch fails, and we *watch the agent adapt* in the reasoning drawer (falls back to system
  fonts). Name the mechanism, defer the dials: "Part 6 gives you the switch."
- *Hero screenshot* — chat left, preview right, diff drawer open. The dessert shot the whole
  series was sold on.

**Code introduced:** ~120 lines of Python + ~180 lines of TypeScript.

**Callouts:** why plain static sites, no build step (instant preview, sandbox-friendly,
deterministic — and the honest note that a production builder would add one); where uploads
would slot in (Agent SDK Part 4 pointer for the multipart plumbing — here briefs are pre-seeded
to keep the part on-message).

**Forward references:** "Close the tab and the project's gone. Next: projects that persist."

**NOT covered yet:** resume/fork, sandbox tuning, approvals, publishing.

---

### Part 5 — Threads that persist: projects, resume, and fork

**Slug:** `codex-5-threads` · **Reading:** 15–18 min · **Screenshots:** ~6

**Why this part exists:** Codex's persistence is protocol-native — `thread/list`,
`thread/resume`, `thread/fork`, `thread/name/set` — so Pagewright's projects sidebar costs
almost nothing to build honestly. The app stores only a `project_id → thread_id + workspace`
map in a flat `projects.json` (SQLite waits for Part 9, same discipline as the sibling).

**Sections:**
- *The rollout archive, revisited* — `~/.codex/sessions` from Part 1, now read on purpose;
  `CODEX_HOME` in one callout.
- *Resume* — messages to an existing project call `thread/resume` first; restart the backend
  mid-project and continue the conversation. The job folder reopens at the bookmark.
- *Break it on purpose (the missing rollout)* — delete the rollout file, resume fails; catch
  the error and fall back to `thread/start` + a fresh association, telling the user their chat
  history is gone but the *site files* survive (the workspace is truth). Exact error shape
  verified at spike time — the reference app string-matches here, and we do better if the
  protocol lets us.
- *The projects sidebar* — `thread/list` + names; auto-title after the first turn via
  `thread/name/set`; archive via `thread/archive`.
- *Fork: two drafts of one site* — `thread/fork` + `cp -r` the workspace → two projects
  diverge; side-by-side previews ("the client wants to see it in blue AND green"). The killer
  demo of the part.
- *Ephemeral threads* — one callout: `ephemeral: true` for throwaway runs (used by the eval
  harness in Part 11).

**Code introduced:** ~100 lines of Python + ~120 lines of TypeScript.

**Callouts:** `thread/read` vs `thread/resume` (replay history without loading the engine);
what forking does NOT copy (the workspace — that's ours to copy, and why).

**Forward references:** "Act I complete: a trusting builder. Act II puts you in control —
starting with what it's allowed to touch."

**NOT covered yet:** sandbox dials, approvals, durable streams.

---

### Part 6 — The sandbox: what the builder may touch

**Slug:** `codex-6-sandbox` · **Reading:** 18–22 min · **Screenshots:** ~6 + 1 diagram

**Why this part exists:** Codex's permission model is **sandbox-first** — OS-level containment
is the default posture, approvals are the escape hatch. That's the inverse of the sibling
series' arc (application-level permissions first, OS sandbox as the Act III capstone), and
naming that inversion is the part's big idea. Everything Act I ran "safely" gets explained
here.

**Sections:**
- *Two dials, one grid* — `sandboxPolicy` × `approvalPolicy` as a 2-axis table; the three
  postures Pagewright will expose (Read-only / Standard / Trusted), mapped exactly like the
  production reference app's runtime modes. Link `#sandbox-policies`, `#approval-policies`.
- *The policies* — `readOnly`; `workspaceWrite` with `writableRoots` and `networkAccess`;
  `dangerFullAccess` (one honest paragraph on when it's legitimate — CI, containers — and why
  a hosted product never sends it); `externalSandbox` in one callout (bring-your-own-container).
- *Break it on purpose #1 (read-only)* — a read-only turn: the agent can look and plan but
  every write is refused by the OS; watch it report that honestly.
- *Break it on purpose #2 (the bench boundary)* — workspace-write turn, ask the agent to write
  `~/notes.txt`; Seatbelt/Landlock blocks it — not a prompt, not a policy check, the kernel.
  Screenshot the `SandboxError`.
- *How the box is built* — one diagram: macOS Seatbelt vs Linux Landlock + seccomp; what
  sandboxing does and doesn't buy (link `#sandboxing`; note the Part 13 payoff — same
  mechanism, verified on the production VM).
- *The network switch* — `networkAccess: true` re-runs the Part 4 Google-Fonts failure and it
  succeeds; the trade named (exfiltration risk vs capability), default stays off.
- *The mode picker* — a small trust-mode selector in the UI driving per-turn policies; persists
  per project in `projects.json`.

**Code introduced:** ~60 lines of Python + ~60 lines of TypeScript.

**Callouts:** sandbox ≠ approvals (containment vs consent — the grid line the next part
completes); Windows: WSL2 recommended, the native Windows sandbox path flagged verify-at-
writing-time.

**Forward references:** "Even inside the bench, some actions deserve a human. Next: the
foreman's stamp."

**NOT covered yet:** approval requests (the policy that triggers them is set here; the wiring
lands in Part 7).

---

### Part 7 — Approvals: the foreman's stamp

**Slug:** `codex-7-approvals` · **Reading:** 22–28 min · **Screenshots:** ~8

**Why this part exists:** The protocol's most interesting mechanic: for approvals, **the server
sends *us* a JSON-RPC request and blocks on our response** — the direction of authority
reverses. The Part 2 client grew a server-request seam for exactly this moment. The
Future-bridge pattern is assumed (Agent SDK Part 7 teaches it from zero — pointer); what's new
is the transport shape and the patch-preview approval card.

**Sections:**
- *Flip the policy* — Standard mode now sends the "ask me" approval policy; nothing else
  changes. First risky command → the backend hangs. *Why?* The server is waiting for an answer
  nobody is giving. Perfect motivation.
- *The reversed request* — `item/commandExecution/requestApproval` and
  `item/fileChange/requestApproval` as server→client *requests* (they have ids; they demand
  responses) vs notifications. One figure updating Part 1's Rosetta stone.
- *The bridge* — register handlers in `CodexClient`; each pending approval becomes an
  `asyncio.Future` in a registry; emit `approval_request` over SSE;
  `POST /approvals/{id}/decision` resolves the future; the JSON-RPC response goes back down
  stdio. (Pointer to Agent SDK Part 7 for the from-zero pattern; here it's a page, not a
  chapter.)
- *The approval card* — command approvals show the command + cwd; **file-change approvals show
  the patch itself** — the Part 4 diff renderer reused inside the card. Inspect the
  dry-cleaning ticket before it's hung.
- *Decisions* — `accept`, `decline`, and `acceptForSession` ("stop asking about writes to this
  workspace") with an honest note on scope; `cancel` for dismissals. Enum verified against the
  generated schema (the §7.2 risk item).
- *Break it on purpose* — decline a patch and watch the turn adapt (the agent proposes an
  alternative); then leave an approval hanging and add the timeout policy (auto-decline after
  N minutes with a clear SSE event — a real product decision, made explicitly).
- *The grid completes* — recap figure: the Part 6 postures now fully wired (Read-only never
  asks because it never acts; Standard asks; Trusted doesn't ask because the sandbox contains).

**Code introduced:** ~120 lines of Python + ~140 lines of TypeScript.

**Callouts:** approvals only fire when policy + sandbox say so (auto-approved actions never
reach you — rhymes with the sibling's permission-evaluation-order lesson, link it); never ship
`dangerFullAccess` + never-ask in a hosted product (the one hard rule of the series).

**Forward references:** "You can say no before it acts. Next: changing its mind mid-flight."

**NOT covered yet:** interrupt, steer, usage meter.

---

### Part 8 — Stop, steer, and the meter

**Slug:** `codex-8-stop-steer-usage` · **Reading:** 15–18 min · **Screenshots:** ~6

**Why this part exists:** Live control. `turn/interrupt` gives the Stop button; `turn/steer`
is the Codex distinctive — **append guidance to a running turn without killing it** — and no
sibling series has an equivalent (say so). Plus the meter ritual graduates to a live token
gauge.

**Sections:**
- *The Stop button* — `turn/interrupt` → `turn/completed` with status `interrupted`; honest UI
  state (badge: "stopped by you"); the workspace keeps whatever landed (files are truth —
  Part 5's lesson pays rent).
- *Steering* — the input stays live during a run; a message sent mid-turn routes to
  `turn/steer` ("actually make the header green") and the build absorbs it without restarting.
  Shouting through the workshop hatch without downing tools. The demo-video moment of Act II.
- *Break it on purpose* — steer after the turn finished → error; write the router (active turn
  → steer, else → new `turn/start`) and show the UI affordance that makes the difference
  legible (a small "steering" chip on mid-turn messages).
- *The live meter* — `thread/tokenUsage/updated` → `usage_update` → a header gauge
  (tokens this turn / this thread); cost math from published per-token prices in one callout
  (re-quote at writing time).
- */usage for the grown-ups* — `account/rateLimits/read` on a small status page; what to watch
  before Part 13 puts this on a server.

**Code introduced:** ~70 lines of Python + ~90 lines of TypeScript.

**Callouts:** interrupt is cooperative — the in-flight command is wound down, not `kill -9`ed
(exact semantics verified at spike time); steering vs queueing a follow-up (when each is
right).

**Forward references:** "Refresh mid-build and the stream is gone — the build isn't. Next:
durability."

**NOT covered yet:** event replay, multi-tab.

---

### Part 9 — Durable streams: survive the refresh

**Slug:** `codex-9-durable-streams` · **Reading:** 18–22 min · **Screenshots:** ~6

**Why this part exists:** Same production requirement as the sibling series, deliberately
pointer-compressed: Agent SDK Part 9 *teaches* the theory (decouple the worker from the
viewer, sequence everything, replay on reconnect); this part does the Codex-shaped build. The
notification consumer becomes a background task writing an event log; SSE becomes
replay-then-follow; Stop works from any tab.

**Sections:**
- *The disappearing build* — refresh mid-turn; the stream dies, the agent doesn't. Name the
  bug class (pointer paragraph: "the full theory, from zero, is sibling Part 9 — here's the
  shape in one figure, then we build it Codex-style").
- *SQLite enters* — the series' first and only database: one `events` table (project_id, seq,
  payload) + a turns table. Why now and not sooner (files and threads carried us this far).
- *The consumer task* — per-turn background task drains the notification queue → translator →
  append to log; SSE viewers read the log.
- *Replay-then-follow* — `GET /projects/{id}/stream` with `Last-Event-ID`; swap fetch-reader
  for `EventSource` (auto-reconnect); seq numbers in the SSE `id:` field.
- *Stop from anywhere* — the Stop button posts against the project, not the stream; open two
  tabs, stop from the second. Approvals answered from either tab too (the Part 7 futures
  already allow it — one paragraph, one screenshot).
- *Break it on purpose* — kill the backend mid-turn, restart: the log shows the gap, the UI
  shows an honest "backend restarted mid-build" state, and `thread/resume` + the workspace
  mean nothing of value was lost. Honest limits stated (we don't resurrect the in-flight turn).

**Code introduced:** ~140 lines of Python + ~60 lines of TypeScript.

**Callouts:** why the app-server process isn't the durability layer (it holds threads, not
your product's delivery guarantees); `thread/read` as the cold-history backstop.

**Forward references:** "Act II done — you're in control. Act III: the builder gets opinions,
an inspector, and a launch day."

**NOT covered yet:** —

---

### Part 10 — Plans, reasoning depth, and questions

**Slug:** `codex-10-plans-questions` · **Reading:** 20–25 min · **Screenshots:** ~7

**Why this part exists:** The consultative builder: a blueprint before demolition
(collaboration plan mode + live plan checklist), structured mid-job questions
(`item/tool/requestUserInput`), and the reasoning dials (`effort`, `summary`) that until now
were fixed constants. The AskUserQuestion UX pattern is assumed (Agent SDK Part 10 — pointer);
the protocol shapes are new.

**Sections:**
- *Blueprint mode* — a "Plan first" toggle sends the turn in plan-mode collaboration; the agent
  explores read-only and proposes; approval starts the build turn. (Exact `collaborationMode`
  shape is a spike item — the prose is mode-agnostic, the code pinned.)
- *The living checklist* — `plan` items + `item/plan/delta` + `turn/plan/updated` →
  `plan_update` → a checklist panel that ticks itself as the build proceeds. The estimate taped
  to the window.
- *Structured questions* — `item/tool/requestUserInput` → question cards ("Serif or sans?
  These three palettes?") over the same Future bridge as Part 7 (one paragraph — the seam
  absorbs its third use without modification; that's the Part 2 design paying compound
  interest).
- *The reasoning dials* — `effort` and `summary` become a "care level" selector on the
  composer; the reasoning drawer from Part 3 finally earns its keep at `detailed`.
- *Break it on purpose* — same brief at lowest vs highest effort; compare the two plans
  side-by-side (screenshot pair; honest token-cost comparison from the Part 8 meter).

**Code introduced:** ~90 lines of Python + ~130 lines of TypeScript.

**Callouts:** plan mode vs read-only sandbox (collaboration posture vs containment — different
axes, one sentence); when questions beat guesses (product judgment, not protocol).

**Forward references:** "The builder plans and asks. But who checks the finished work? Next:
the inspector."

**NOT covered yet:** review mode, structured outputs, publishing.

---

### Part 11 — Trust but verify: review mode, structured outputs, and the Publish gate

**Slug:** `codex-11-review-publish` · **Reading:** 22–28 min · **Screenshots:** ~8

**Why this part exists:** Codex ships a **built-in reviewer** (`review/start`) — a fresh-eyes
pass with its own item vocabulary — and no sibling series has anything like it. Pair it with
`outputSchema` (a validated site manifest) and a light smoke-eval suite, and Pagewright gets
the feature that makes it a *product*: a Publish button that has to be earned.

**Sections:**
- *The Publish button (naive version)* — copy `site/` to `published/{slug}/`, served at
  `/p/{slug}/`. Works. Feels reckless. Name the feeling.
- *The inspector* — `review/start` against the workspace before publishing;
  `enteredReviewMode`/`exitedReviewMode` items; findings rendered as an inspector report card
  (severity, location, body). A different clipboard from the builder's.
- *The planted flaw pays off* — review the Harbor & Vine project: the reviewer catches the
  forest-green-brief vs navy-logo contradiction planted in Part 4. The series' longest setup
  lands. ("Fix findings" button feeds them back as a normal turn.)
- *The manifest* — `outputSchema` on the publish turn: `{title, description, pages[], accent}`
  validated with pydantic; drives the published-site card and the `/p/` index. A form instead
  of an essay (analogy shared with the sibling; link `#output-schema`).
- *Break it on purpose* — hand it a schema the model can't satisfy; observe the failure shape;
  write the retry-or-surface policy deliberately.
- *Smoke evals* — a deliberately small harness (`ephemeral` threads from Part 5): N briefs ×
  build → deterministic checks (index.html exists, internal links resolve, manifest validates)
  + ONE LLM-judge check (does the page match the brief?). Pointer: the full methodology —
  cases, runners, judges, regression discipline — is Agent SDK Part 13; this section is its
  Codex-shaped echo, kept to a page.
- *The gate* — Publish = review passes (no blocker findings) + manifest validates + smoke
  checks green. The button is now earned.

**Code introduced:** ~140 lines of Python + ~100 lines of TypeScript + ~80-line eval script.

**Callouts:** review mode vs asking the same thread "check your work" (fresh context is the
point — rhymes with the sibling's subagent lesson, link it); reviewer routing exists for
auto-review of approvals too (one sentence, not built).

**Forward references:** "The builder works alone with what's in the room. Next: rented tools
and the pattern book."

**NOT covered yet:** MCP, skills, AGENTS.md.

---

### Part 12 — The wider workshop: MCP servers, skills, and AGENTS.md

**Slug:** `codex-12-mcp-skills` · **Reading:** 18–22 min · **Screenshots:** ~7

**Why this part exists:** Three extension surfaces in ascending cost: standing instructions
(AGENTS.md), playbooks (skills), and external capabilities (MCP servers) — each demonstrated
as a Pagewright feature, not a tour.

**Sections:**
- *The site-rules poster* — `AGENTS.md` in the workspace scaffold: semantic HTML, alt text
  always, no inline styles, system-font stacks. Cheapest upgrade in the series; diff a build
  before/after. Link `#agents-md`.
- *The pattern book* — a `brand-kit` skill (SKILL.md: how to read a brief's assets folder and
  apply logo, palette, and voice consistently); `skills/list` to surface it; invoking with a
  `{type:"skill"}` input item. Pointer to Agent SDK Part 11 for the skills-vs-prompt
  philosophy; here the focus is the protocol wiring.
- *Rented power tools* — an image/asset MCP server wired via config (category decided —
  §6.1.13; exact server per §6.2.1): the agent pulls real imagery and the client sites visibly
  improve on camera; `mcpToolCall` items appear in the existing UI *with zero frontend changes*
  (the vocabulary pays rent again); namespaced `server:tool` naming callout.
- *The health panel* — `mcpServerStatus/list` on the status page from Part 8.
- *Break it on purpose* — misconfigure the server command; the startup status surfaces the
  failure in the panel instead of a silent hang; fix it live.

**Code introduced:** ~80 lines of Python + ~70 lines of TypeScript + config.

**Callouts:** MCP tool calls happen inside the same sandbox + approval regime (the Part 6/7
grid governs rented tools too); skills load on demand, not into every prompt.

**Forward references:** "It runs beautifully on your laptop. Launch day next."

**NOT covered yet:** deployment.

---

### Part 13 — Ship it: Pagewright on a Hetzner VM

**Slug:** `codex-13-deploy-hetzner` · **Reading:** 15–18 min · **Screenshots:** ~7

**Why this part exists:** The closing payoff: published sites at real URLs on the public
internet. Deliberately pointer-compressed — systemd, Caddy, the SSE-proxy gotcha, and the
firewall walkthrough are Agent SDK Part 14's material (link hard); this part does the
**Codex-specific deltas**, and like the sibling, **it is written against a real deployment** —
Yadnesh provides Hetzner creds at writing time, the demo video is shot against the live VM,
and a teardown checklist ships with the part.

**Sections:**
- *What's different with an agent on the box* — installing the pinned CLI on Ubuntu
  (`npm i -g @openai/codex@<PIN>`), `CODEX_HOME` for the service user, non-interactive API-key
  auth (mechanics verified on the real box), one app-server process under systemd alongside
  the backend.
- *The sandbox, for real this time* — Landlock + seccomp on the production kernel: re-run
  Part 6's bench-boundary break on the VM and screenshot the same refusal. (Kernel/feature
  check documented; this is where the Linux story stops being a diagram.)
- *systemd + Caddy, deltas only* — unit files for backend + frontend, Caddy with SSE flushing
  (sibling Part 14 pointer for every line we don't re-explain), `/p/{slug}/` now public — the
  Part 11 publishes are live URLs you can text to a friend. The series' final dessert.
- *Production posture* — the Part 6/7 grid revisited for a public box: Standard mode floor,
  approvals on, network off, rate-limit watch from Part 8; `.env` hygiene server-side.
- *Teardown checklist* — so the box doesn't linger billing.
- *Where to go next* — cross-sell both siblings (the LangGraph on-ramp; the Claude-flavored
  twin) + the honest "the protocol will have moved — here's how to re-verify" section
  (`generate-json-schema` as the reader's own tool).

**Code introduced:** mostly config (units, Caddyfile) + ~30 lines of Python (env hardening).

**Callouts:** VM vs PaaS for agent workloads (persistent workspaces + subprocesses — same
argument as the sibling, one paragraph + link); keeping the CLI pinned in production (an
unattended `npm update` is a protocol change you didn't schedule).

**Forward references:** none — series close.

---

## 4. The shared "Concepts" page

`/blog/codex-concepts` (frontmatter `kind: reference`, hidden from listings, in search):

- `#app-server` — the engine behind every Codex surface; why OpenAI opened the hatch
- `#json-rpc` — requests, responses, notifications; ids as correlation; server→client requests
- `#threads-and-turns` — the job folder and the work order
- `#items` — the unit of agent work; the item-type zoo
- `#rollouts` — `~/.codex/sessions`, `CODEX_HOME`, resume/fork/read
- `#sandbox-policies` — readOnly / workspaceWrite / dangerFullAccess / externalSandbox; writableRoots; networkAccess
- `#sandboxing` — Seatbelt vs Landlock+seccomp; what containment does and doesn't buy
- `#approval-policies` — the ask-me dial and how it composes with the sandbox (the grid)
- `#approvals` — server-initiated requests; decision enum; acceptForSession scope
- `#steering` — turn/steer vs interrupt vs a new turn
- `#collaboration-modes` — default vs plan; blueprint-before-build
- `#reasoning-effort` — the effort/summary dials; what you pay for depth
- `#request-user-input` — structured questions from a running turn
- `#review-mode` — the built-in reviewer; findings; why fresh eyes
- `#output-schema` — structured final answers; schema-or-retry
- `#mcp` — servers in config; `server:tool` naming; status; (short — links sibling `#mcp`)
- `#skills` — playbooks on demand (short — links sibling `#skills`)
- `#agents-md` — standing instructions in the workspace
- `#token-usage` — tokenUsage notifications; rate limits; the meter
- `#protocol-versioning` — experimental status; pinning; generate-json-schema as the source of truth
- `#futures-and-events` — short, links sibling; the bridge pattern in one figure
- `#sse` / `#event-source` — short entries, heavy links to LangGraph Part 5 + sibling Part 9

Opens with the same "How to read this" note as its siblings, plus one line routing true
beginners to LangGraph.

---

## 5. Recurring decisions for the whole series

### 5.1 Conventions table

| Decision | Choice | Why |
|---|---|---|
| Repo layout | Single project per part-folder: `backend/` + `frontend/`; `backend/projects/` gitignored | House convention |
| Companion repo | **`codex-app-server-in-production`** — `part-01-…` to `part-13-…`, each complete + runnable + tested; per-part `demo.mp4` | WRITING-STYLE §13 |
| Python tooling | **uv** throughout | House default since the sibling series |
| Frontend packages | npm, no UI component library | House convention; fewer moving parts |
| CLI pinning | `npm i -g @openai/codex@<PIN>` — exact version in Part 1's "tested with" block, in every README, and in the Part 13 server setup; vendored `generate-json-schema` output per pin in the repo | The protocol is experimental; the pin IS the contract |
| Client architecture | One long-lived `codex app-server` process per backend, threads multiplexed; `CodexClient` built in Part 2 with the server-request seam from day one | How official surfaces do it; the seam is the series' compound-interest design |
| Event vocabulary | One envelope (§3 table), defined Part 2, only ever extended; names shadow the Agent SDK series where semantics match | The central design lesson; provider-portability proven by the reference app |
| Model | `MODEL = "gpt-5.4-mini"` constant (§6.1.12); one callout on upgrading to `gpt-5.5`; `model/list` shown once as the discovery tool | Agentic loops multiply tokens, so default cheap; re-quote ids + pricing at writing time |
| The meter ritual | Every part surfaces token usage from `turn/completed`; graduates to the live gauge in Part 8 | Cost-awareness habit, Codex-flavored (tokens, not USD) |
| Safety arc | Sandbox-first from Part 1 (workspace-write + no-ask is *contained*, and we say why) → the grid named in Part 6 → approvals in Part 7 → production posture in Part 13 | The honest Codex story — inverse of the sibling's arc, named explicitly |
| Sites | Plain static HTML/CSS/JS, no build step | Instant iframe preview; sandbox-friendly (no npm, no network); deterministic for evals |
| Sample content | The **brief bank**: fictional client briefs + asset folders; Beanline cameo as first client; **Harbor & Vine** carries the planted contradiction (forest-green brief, navy logo) paying off in Part 11 | Relatable, deterministic, and the cross-series wink |
| Persistence | Protocol-native threads + flat `projects.json` through Part 8; SQLite only for the Part 9 event log | Same discipline as the sibling: no infra before its part |
| Code blocks | ≤25 lines, `filename="…"`, `repo=`/`lines=` fences, runnable against pinned versions | WRITING-STYLE §7 + §13 |
| "Tested with" block | Top of Part 1 + companion README: Python 3.13.x, Node 22.x, Next.js 16.x, `@openai/codex` exact pin + protocol schema hash | Stricter than the siblings — the protocol moves fastest |
| Demo videos | Every part per WRITING-STYLE §13; Part 13's shot against the live VM; Part 8's must show steering | House convention |
| Recap + Quiz | Every part ends with the ritual | House convention |
| Screenshots | Light browser, dark terminal | One blog, one look |
| Windows | WSL2 recommended up front (subprocess + sandbox realities); native path flagged | Same posture as the sibling, stronger reasons |
| Keys hygiene | `.env` + gitignore; pre-push grep for `sk-`; Part 13 repeats server-side | Standing rule |

### 5.2 Analogy bank (extends WRITING-STYLE §7 for this series)

Workshop-flavored, consistent across all 13 parts; where one breaks down, say where.

| Concept | Analogy |
|---|---|
| The app server | The engine's service hatch — every Codex surface bolts onto the same engine; now so do you |
| JSON-RPC over stdio | Numbered notes passed under the door — replies quote your number; unprompted notes (notifications) don't |
| Thread | The job folder for one project |
| Turn | One work order in the folder |
| Items | Line items on the work order |
| Streaming deltas | Watching the workshop through the glass wall |
| Workspace / `cwd` | The job site — one site per client |
| Sandbox policies | The apprentice's wristband: look-only / this-bench-only / keys-to-everything |
| `networkAccess` | The hardware-store door — bricked over by default |
| Approval requests | The foreman's stamp — and it's the *worker* who walks over and asks |
| Patch approval | The dry-cleaning ticket — inspect it before it's hung |
| `acceptForSession` | "Stop asking about this kind of thing today" |
| `turn/steer` | Shouting through the hatch without the work stopping |
| `turn/interrupt` | The big red mushroom button |
| Token usage | The taxi meter on the workshop wall |
| Durable event log | The flight recorder (verbatim from the sibling — same lesson) |
| Plan items | The written estimate taped to the window, ticking itself off |
| `requestUserInput` | The contractor calling mid-job: "matte or gloss?" (shared with the sibling) |
| Reasoning effort | How long the carpenter measures before cutting |
| Review mode | The building inspector — a different clipboard from the builder's |
| `outputSchema` | The handover form — a form instead of an essay (shared with the sibling) |
| MCP servers | Rented power tools — checked through the same airlock |
| Skills | The pattern book on the bench |
| AGENTS.md | The site-rules poster by the door |
| `thread/resume` | Reopening the job folder at the bookmark |
| `thread/fork` | Photocopying the blueprints mid-draft — both copies keep drawing themselves |
| Rollouts (`~/.codex/sessions`) | The workshop's job archive |
| Protocol pinning | Torque specs for this exact engine revision |

### 5.3 Comic seeds (per WRITING-STYLE §9 — Yad in every strip; the joke encodes the concept)

| Part | Seed |
|---|---|
| 1 | Yad pries the back panel off a Codex-branded vending machine and finds an entire workshop inside — with a tiny mail slot labeled `app-server`. He posts a note; a finished webpage slides out |
| 2 | Yad's wall of raw JSON sticky notes vs the same wall reorganized as labeled parcels on a conveyor belt; the agent tips its hat through the hatch |
| 3 | The workshop gets a glass wall; Yad watches a command badge like a departures board while a ticker tape of the agent's inner monologue scrolls overhead |
| 4 | Yad describes a bakery through the hatch; behind the glass a scale-model storefront assembles itself; the agent slides over before/after photos labeled DIFF |
| 5 | The filing wall of job folders; the agent photocopies a blueprint and both copies keep drawing themselves — one turns blue, one turns green; Yad can't pick |
| 6 | The apprentice's saw stops exactly 1mm past the bench outline, mid-stroke, held by an invisible wall; Yad, holding the wristband box: "this-bench-only" |
| 7 | The agent queues at the foreman's window holding a patch like dry-cleaning ("3 files, +42 −7"); Yad stamps APPROVE; behind it, a `curl \| sh` request gets the coffee spit-take |
| 8 | Yad shouts "make the door blue!" through the hatch; the hammering never stops; the door is blue mid-swing. On the wall, a taxi meter ticks tokens |
| 9 | Power cut mid-build; lights back on; the model storefront kept building itself in the dark. The agent taps the flight recorder. Yad checks if *he* lost his place |
| 10 | The agent unrolls a full blueprint across Yad's desk: "Question 1 of 2 — serif or sans?" Yad: "I asked for a lemonade stand" |
| 11 | A clone in a hard hat and a different tie inspects the finished storefront: "Brief says forest green. Logo is navy." The builder-agent, deflated: "…repainting" |
| 12 | The agent at a tool-rental counter (MCP) as Yad inspects each nail gun through the airlock slot; the pattern book (SKILLS) lies open on the bench; the site-rules poster looms |
| 13 | The whole workshop forklifted onto a slab labeled HETZNER (€5/mo); the model storefronts in the window now have real doorbells; Yad hands a passerby the URL |

---

## 6. Decisions

### 6.1 Resolved

**2026-07-06 (planning session, by Yadnesh):**

1. **Series app: an AI website builder ("Pagewright")** — over an issue-to-PR repo agent and a
   docs/changelog engine. Chosen because every Codex-native output (file changes, diffs,
   patches, review) becomes a *visible product feature*, the live-preview demos are the
   strongest of any candidate, and it doesn't overlap the sibling's data-analyst arc.
2. **Series slug: `codex-app-server-fastapi-nextjs`**; post prefix `codex-N-…`; companion repo
   **`codex-app-server-in-production`**.
3. **Raw JSON-RPC over stdio — no SDK wrapper.** The protocol is the series' unique teaching
   content; the official TS SDK and beta Python SDK wrap the same protocol while hiding the
   event/approval surface Acts II–III are made of. The SDKs get one honest callout in Part 1.
4. **13 parts / 3 acts (5 + 4 + 4).** The "one UI, two engines" multi-provider capstone was
   considered and deferred — it remains the natural bonus part if the series lands.
5. **Static sites only** (no build step) — instant previews, sandbox-friendly, deterministic
   evals.
6. **Sandbox-first safety narrative** — Act I runs contained-but-unattended from Part 1 and
   says why; the sibling's "running with scissors" arc is explicitly inverted, not reused.
7. **Persistence protocol-native + `projects.json`; SQLite only for Part 9's event log** —
   same no-infra-before-its-part discipline as the sibling.
8. **Deployment part is in (Part 13, Hetzner), real-deploy non-negotiable** — same bar as the
   sibling: creds at writing time, demo video against the live VM, teardown checklist.
9. **Auth: API key** (standard API billing); ChatGPT-plan auth gets one honest callout, not a
   supported lane.
10. **Brief bank as the dataset equivalent**, with the Beanline cameo and the Harbor & Vine
    planted contradiction paying off in Part 11.

**2026-07-06 (second decision round, by Yadnesh — all §6.2 items resolved):**

11. **Series display name: "Codex App Server in Production: Build an AI Website Builder with
    FastAPI and Next.js."** Short form for kickers/nav: *Codex in Production*. Parallels the
    sibling's naming and carries the exact search phrase. App name confirmed: **Pagewright**.
12. **Default model: `MODEL = "gpt-5.4-mini"`** — house default-cheap philosophy; one callout
    on upgrading to `gpt-5.5` for nicer sites. The spike verifies mini's site quality is
    presentable on camera; escalate the default only if it isn't (§7.10).
13. **Part 12 MCP server: an image/asset provider** (Unsplash-style stock imagery) — the agent
    pulls real imagery and every subsequent screenshot improves; exercises approvals + sandbox
    around a network-touching tool. Exact server picked at the Part 12 spike (§6.2.1).
14. **Published-site URLs: path-based `/p/{slug}/`** — zero DNS work beyond one A record,
    identical shape in local dev (Part 11) and production (Part 13). No subdomain section.
15. **Typed protocol models: hand-written, used surface only** — small pydantic models /
    TypedDicts for just the methods and notifications the series uses, introduced as they
    appear so every type fits a ≤25-line block. The vendored `generate-json-schema` output
    stays in the repo as the verification reference, not as generated code.
16. **Steer UX: the chip treatment** — steered messages render as normal user bubbles with a
    small "steering" chip inline; the chip makes the steer-vs-new-turn routing legible, which
    is the teaching point.

### 6.2 Open — small, none block Part 1

1. **Exact image/asset MCP server for Part 12.** Category is decided (6.1.13); pick the
   specific server at the Part 12 spike by stability + key-signup friction for readers. Prose
   stays server-agnostic.

---

## 7. Known risks — verify at writing time

The app-server protocol is **explicitly experimental** — a stronger caveat than the sibling
series ever carried. Before drafting each part, re-verify against the freshly pinned CLI +
regenerated schema:

1. **The `approvalPolicy` enum.** Three sources disagree (docs: `onRequest`; repo README:
   `always`; reference app 0.139.0: kebab-case `on-request`). The generated JSON schema is the
   tiebreaker. Parts 6–7 assert this in figures — **spike item #1.**
2. **The `jsonrpc` field.** The reference app deliberately omits it ("matches generated
   artifacts"). Determine what the pinned server actually requires/tolerates and teach the
   *correct* framing, not the folklore.
3. **Handshake + method gating.** Which of our methods need `experimentalApi: true`
   (`thread/list` filters are flagged experimental; the base method may be fine). If
   `thread/list` proves unstable, Part 5 falls back to listing rollouts via `thread/read` — a
   paragraph, not a restructure.
4. **`turn/steer` semantics.** Availability, behavior when no turn is active, and how steered
   input appears in the item stream. Part 8's router depends on the error shape.
5. **`review/start` shape and stability.** Inline vs detached delivery, finding item structure.
   Part 11's inspector report asserts this in UI.
6. **`item/tool/requestUserInput` availability.** The reference app enables a feature flag
   (`features.default_mode_request_user_input`) at thread/start to force it in default mode.
   Confirm current status — if still flag-gated, Part 10 teaches the flag honestly.
7. **`collaborationMode` shape.** The reference app sends `{mode, settings:{model,
   reasoning_effort, developer_instructions}}`; docs list it as a turn/start param. Pin at
   spike time.
8. **Resume failure shape.** Part 5's fallback wants a typed error, not the reference app's
   string-matching. Check what the protocol actually returns for a missing rollout.
9. **Auth mechanics non-interactively.** Exact env var(s) the app server honors
   (`OPENAI_API_KEY` vs `CODEX_API_KEY` vs seeded `auth.json`), locally and on the Part 13 VM.
10. **Model ids and pricing.** `gpt-5.5` / `gpt-5.4` / `gpt-5.4-mini` and any `-codex` variants;
    re-quote ids, capabilities, and per-token prices at writing time via `model/list`.
11. **Linux sandbox on the Hetzner VM.** Landlock needs kernel + config cooperation; verify on
    the actual box early (not at Part 13 writing time — during the spike if possible). The
    reference app installs bubblewrap in containers; bare-VM behavior may differ.
12. **Network-off realities.** Briefs and skills must be fully self-contained (no webfonts, no
    CDNs) or Part 4's break-on-purpose becomes Part 4's undiagnosed bug. Asset folders solve
    this — keep them complete.
13. **Reader-machine safety.** Act I runs no-ask inside workspace-write. The "why this is
    contained" callout in Part 1 must be reviewed adversarially before publishing (same bar as
    the sibling's scissors warning).
14. **Protocol drift between parts.** Writing spans weeks; the pin must NOT drift mid-series.
    One pin for Parts 1–13, upgraded only deliberately (and §8's lockstep rule re-tests
    everything if it ever is).

---

## 8. Suggested order of work

1. **Spike before prose.** A throwaway `spike/` script against the freshly pinned CLI
   exercising every §7 assertion: handshake + experimental gating, thread/turn lifecycle,
   full notification zoo (capture real JSONL traces — they become Part 1's Rosetta-stone
   figure), both approval request types + decision enum, steer + interrupt, requestUserInput,
   collaboration/plan mode, review/start, outputSchema, tokenUsage + rateLimits, resume/fork +
   the missing-rollout error, sandbox behavior on macOS **and Linux** (a Hetzner box or any VM
   — doubles as the risk-11 check), `generate-json-schema` output vendored. One to two days;
   de-risks thirteen parts.
2. **Build the brief bank + companion repo** (`codex-app-server-in-production`): briefs +
   asset folders (self-contained, no CDN dependencies), the Harbor & Vine planted
   contradiction, `part-01-first-thread/`, tested end-to-end per WRITING-STYLE §13.
3. **No blog-side work needed** — first series to inherit everything, including `stages`.
4. **Write Part 1 as the quality reference** — screenshots, callouts, comic, cover, demo
   video, Recap + Quiz, locked against WRITING-STYLE §11. Then Part 2, the series' real bar
   (the CodexClient build and the event-vocabulary section are the hardest prose of Act I).
5. **Parts 3–5 in order** to close Act I; publish weekly once 1–2 are done. Sync each part's
   folder + video as it lands. **Part 4 is the hero — budget extra time for its screenshots
   and demo video.**
6. **Concepts page in parallel with Parts 1–2** (they generate most anchors).
7. **Act II (6–9), then Act III (10–12)**, batching reviews every 2 parts. The `part-05`
   folder must be rock-solid before Act II advertises jumping in from it.
8. **Part 13 last, against a real VM** — request Hetzner creds, deploy, shoot the demo video
   from the live URL, write the teardown checklist. (If step 1's Linux sandbox check used a
   throwaway VM, this is its second, full-dress visit.)
9. **Launch ritual per part** + a series-landing announcement once Act I is complete.

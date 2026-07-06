# Spike facts: codex app-server, verified live 2026-07-06

> Ground truth from running `codex-cli 0.142.4` on macOS (arm64) with real
> gpt-5.4-mini turns, plus the generated JSON schema
> (`codex app-server generate-json-schema`). This file supersedes PLAN §3 where
> they disagree. Raw JSONL traces live in the planning session's spike folder;
> the schema can be regenerated anytime from the pinned CLI.

## Handshake

- `initialize` params: `{clientInfo: {name, title, version}, capabilities: {}}`
  (`experimentalApi: true` available; nothing the series needs required it).
- Response: `{userAgent, codexHome, platformFamily, platformOs}`.
- Then send `initialized` notification. Methods before init are rejected.
- All messages are single-line JSON over stdio. Sending `"jsonrpc": "2.0"` works
  fine (the reference app omits it; the server tolerates both).

## thread/start

- Params (all verified): `cwd`, `sandbox` as a **mode string**
  (`"read-only" | "workspace-write" | "danger-full-access"`), `approvalPolicy`
  (`"untrusted" | "on-failure" | "on-request" | "never"` — kebab-case; there is
  also a granular object form), `model`, `developerInstructions`, `ephemeral`,
  `config` (dotted overrides), `personality` (`none|friendly|pragmatic`),
  `approvalsReviewer` (`user|auto_review`).
- Response: `{thread: {id, sessionId, forkedFromId, parentThreadId, preview,
  ephemeral, createdAt, updatedAt, status, path}, model, modelProvider,
  reasoningEffort, sandbox, approvalPolicy, activePermissionProfile,
  multiAgentMode, ...}`. `thread.path` is the rollout file
  (`~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`).

## turn/start

- Params: `threadId`, `input: [{type: "text", text}]` (also `image`,
  `localImage`, `skill` input types), plus per-turn overrides: `model`,
  `effort` (model-advertised strings; gpt-5.4-mini and gpt-5.5 advertise
  low/medium/high/xhigh via `model/list`), `summary`
  (`auto|concise|detailed|none`), `outputSchema` (JSON Schema),
  `sandboxPolicy` (**structured object**, unlike thread/start:
  `{type: "workspaceWrite", writableRoots: [...], networkAccess: bool,
  excludeSlashTmp, excludeTmpdirEnvVar}` / `{type: "readOnly"}` /
  `{type: "dangerFullAccess"}` / `{type: "externalSandbox", networkAccess}`),
  `approvalPolicy`, `cwd`, `personality`.
- Response: `{turn: {id, status: "inProgress", startedAt, ...}}`.
  **Capture `turn.id`**: steer and interrupt need it.
- `collaborationMode` is NOT a turn/start param in 0.142.4 (the 0.139-era
  reference-app shape is gone; `ModeKind` survives only as a TUI setting).
  Part 10's "blueprint first" flow = a read-only turn + plan items instead.

## turn/steer and turn/interrupt

- `turn/steer` params: `{threadId, expectedTurnId, input}`.
  `expectedTurnId` is REQUIRED and is a precondition: the request fails when it
  does not match the currently active turn. This is the steer-vs-new-turn
  router, enforced by the protocol. (The spike's steer without it was silently
  useless; with a wrong id it fails.)
- `turn/interrupt` params: `{threadId, turnId}`, both required.

## The notification stream (one basic build turn, clean CODEX_HOME)

Order observed: `thread/started` → `thread/status/changed (active)` →
`turn/started` → per item: `item/started` → deltas → `item/completed` →
`thread/tokenUsage/updated` (several per turn) → `turn/diff/updated`
(aggregate git-style unified diff, fires after each file change) →
`turn/completed` → `thread/status/changed (idle)`.

- `item/agentMessage/delta`: `{threadId, turnId, itemId, delta}` (per-token).
- `item/reasoning/summaryTextDelta`: same shape, field is `delta` (plain
  string, NOT `chunk`, NOT base64). **Reasoning summaries do not stream at all
  unless turn/start sets `summary` (e.g. "detailed")**; at defaults,
  gpt-5.4-mini emits reasoning items with empty summaries and zero deltas
  (verified across 4 traces, Part 3 build). Part 3+ backends set
  `summary: "detailed"`.
- `item/commandExecution/outputDelta`: `{threadId, turnId, itemId, delta}`.
  Fires only for commands whose output arrives over time; instant commands
  (ls, pwd) deliver output only via `aggregatedOutput` on item/completed.
  Demos wanting the live-output moment need a command that streams (loop +
  sleep). commandExecution items carry `exitCode` on completion (null while
  running).
- `thread/tokenUsage/updated`: `{threadId, turnId, tokenUsage: {total:
  {totalTokens, inputTokens, cachedInputTokens, outputTokens,
  reasoningOutputTokens}, last: {...}, modelContextWindow}}`.
- `turn/completed`: `{threadId, turn: {id, status: "completed" | ...,
  error, startedAt, completedAt, durationMs}}`. **No usage field**; usage
  comes only from tokenUsage notifications. No cost-in-USD anywhere: the meter
  ritual quotes tokens (cost math from published prices is ours).

## Part-4-build findings (verified live)

- `turn/diff/updated` paths are GIT-REPO-relative (relative to the enclosing
  git repo root, e.g. `part-04.../backend/projects/{id}/site/index.html`),
  NOT workspace-relative. Part 4's backend relativizes them before the wire.
- Agents sometimes change files via shell commands (`cp logo.svg ...`) which
  emit NO fileChange item, so no file_change/preview_refresh event. The
  frontend does a catch-all files+preview refresh on `complete`.
- The network-off "Google Fonts wall" needs the right framing: asking for a
  fonts LINK produces no wall (the reader's browser fetches it, not the
  sandbox). The wall appears when the sandbox itself must fetch: "download
  the woff2 files with curl" → curl exit 6 (DNS blocked), then the agent
  swept every READABLE corner of the disk for cached fonts (workspace-write
  blocks writes+network, NOT reads: Part 6 teaser), refused to fabricate
  binaries, and reported the block honestly with three ways forward.

## Item shapes (from item/started + item/completed)

- `userMessage`: `{content: [{type: "text", text, text_elements}]}`.
- `agentMessage`: `{text, phase: "final_answer" | ..., memoryCitation}`.
- `reasoning`: `{summary: [], content: []}`.
- `commandExecution`: `{command (full shell string), cwd, ...}` — commands run
  as `/bin/zsh -lc "..."` on macOS.
- `fileChange`: `{changes: [{path (absolute), kind: {type: "add"|"update"|
  "delete"}, diff}]}`.
- `enteredReviewMode`: `{review: <instructions>}`; `exitedReviewMode`:
  `{review: <findings text>}`.

## Approvals

- Server→client JSON-RPC REQUEST (has an id, expects a response):
  `item/commandExecution/requestApproval` with params `{threadId, turnId,
  itemId, startedAtMs, environmentId, command, cwd, commandActions,
  proposedExecpolicyAmendment, availableDecisions}`.
  **`availableDecisions` tells you the legal enum per request.**
- Respond `{"decision": "accept"}` (or what availableDecisions offers:
  acceptForSession / decline / etc.). `serverRequest/resolved` notification
  follows.
- `approvalPolicy: "untrusted"` + a `git init` command triggered it reliably.
- `item/fileChange/requestApproval` and `item/tool/requestUserInput` exist as
  server requests (schema); fileChange approval untriggered in the spike
  (workspace-write auto-allows in-workspace writes; expect it under
  read-only-ish policies or out-of-root writes — verify in Part 7).
- `item/tool/requestUserInput` did NOT fire spontaneously on default mode;
  the reference app sets `config: {"features.default_mode_request_user_input":
  true}` at thread/start to force it. Verify live when building Part 10.

## review/start

- Params: `{threadId, target, delivery?}`. Targets: `{type:
  "uncommittedChanges"}` (working tree, needs git), `{type: "baseBranch",
  branch}`, `{type: "commit", ...}`, and `{type: "custom", instructions}`
  (free-form, **no git required** — Pagewright uses this). Delivery
  `inline` (default, runs as a turn on the thread) or `detached`
  (new thread, `reviewThreadId`).
- Emits `enteredReviewMode` item, does its own investigation (commands etc.),
  then `exitedReviewMode` whose `review` field is the findings: prose summary +
  bullet list with `[P1]/[P2]/[P3]` priority tags and `path:line` references.
  Final agentMessage repeats the findings.
- Slow: 3m45s for a one-file review on the default review model. Part 11
  should set expectations (and consider `model` override on the review turn).

## Threads: resume / fork / list / errors

- `thread/resume {threadId}` → same response shape as thread/start plus
  `initialTurnsPage`.
- `thread/fork {threadId}` → new thread with `forkedFromId` set. Fork copies
  history, NOT the workspace (ours to copy).
- Malformed thread id → JSON-RPC error `-32600` "invalid session id: ..."
  (typed error, no string matching needed; a well-formed-but-deleted id error
  shape still to be captured when Part 5 is built).
- `thread/list {}` → `{data: [thread meta incl. preview], nextCursor,
  backwardsCursor}`.
- `thread/name/set`, `thread/archive` untested in spike; exercise in Part 5.

## Structured output

- `outputSchema` on turn/start works: the final `agentMessage.text` IS the
  schema-conformant JSON string (validate client-side; the model may embed
  markdown links inside string values — sanitize).

## Models and environment

- `model/list {}` → `{data: [{id, model, displayName, description,
  supportedReasoningEfforts: [{reasoningEffort, description}], hidden, ...}]}`.
  Confirmed available: `gpt-5.5` (frontier), `gpt-5.4-mini` (series default;
  built a genuinely good single-page site in 23-57s).
- Real timings/usage on gpt-5.4-mini: single-page Beanline build, 57s,
  ~73k input / 7.6k output tokens (multi-tool-call turn).
- `CODEX_HOME` relocates auth.json, config.toml, sessions, skills, plugins.
  **A user-level ~/.codex with plugins/skills pollutes the stream** with
  hook/started, mcpServer/startupStatus/updated, warnings. All series
  captures and tests run with a clean CODEX_HOME (auth.json + minimal
  config.toml) so reader output matches.
- Auth: an existing `codex login` in CODEX_HOME is all the app server needs;
  no env var required at runtime.

## Corrections to PLAN.md §3 (this file wins)

1. Usage is NOT on turn/completed; it arrives via thread/tokenUsage/updated.
2. turn/interrupt requires turnId; turn/steer requires expectedTurnId.
3. thread/start takes a sandbox MODE STRING; the structured SandboxPolicy
   object belongs to turn/start.sandboxPolicy.
4. collaborationMode is gone from turn/start; Part 10 reshapes to read-only
   blueprint turns + plan items (`item/plan/delta`, `turn/plan/updated`).
5. Review findings are tagged prose (`[P2] ... path:line`), not structured
   JSON; Part 11 parses the tags or renders markdown.
6. approvalPolicy enum confirmed: untrusted | on-failure | on-request | never.

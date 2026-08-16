# 06 — Implementation notes (decisions locked 2026-08-09, facts verified same day)

Read this AFTER 01–05. Where this file contradicts them, this file wins: it records
Yadnesh's answers and what verification against the live repos/APIs found.

## Decisions from Yadnesh (2026-08-09)

1. **Name: The Agentic Brief.** Site section stays `/brief`. From-name style:
   `The Agentic Brief <newsletter@yadneshsalvi.com>`.
2. **Approval window: 2h for BOTH daily and weekly.** Auto-send when the window expires
   without action. Log timeout-sends vs explicit approvals.
3. **Email infra: Zoho SMTP now, Resend-ready.** This AMENDS 04 §1's locked Resend
   decision. Yadnesh has added to the blog repo's env:
   `NEWSLETTER_ZOHO_SMTP_USER`, `NEWSLETTER_ZOHO_SMTP_PASS`,
   `NEWSLETTER_ZOHO_SMTP_HOST`, `NEWSLETTER_ZOHO_SMTP_PORT`
   (sender: `newsletter@yadneshsalvi.com`). Build a provider-agnostic sender interface
   (`send(issueEmail, recipients)`): the Zoho/nodemailer driver ships now; a Resend
   driver can be swapped in later without rework. Consequences we now own ourselves:
   subscriber store, unsubscribe + suppression, per-recipient send loop with throttling
   (Zoho SMTP daily caps are in the low hundreds), `List-Unsubscribe` +
   `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers on every send.
   The contact form's existing `ZOHO_SMTP_*` vars are separate; leave them.
4. **Vercel plan: Pro.** The send poller is a real Vercel cron (`*/15` inside the send
   windows, per-minute precision available). The launchd-trigger fallback in 05 §Verify
   is NOT needed, but the cron endpoint stays idempotent and shared-secret-protected.
5. **Postal address: deferred.** Wire `BRIEF_POSTAL_ADDRESS` env var; the send path
   hard-refuses to send marketing email while it is unset. Nothing else blocks on it.
6. Defaults adopted without further discussion (plan 05 open questions 4–6):
   `— Y:` editor notes stay (0–2 per daily, drafted, survive only via approval);
   no emoji in subjects; bare-topic subjects, no `Brief:` prefix.

## Verified facts (2026-08-09)

- **Resend** (for the future driver): `POST /broadcasts` takes `segment_id` (audiences
  renamed to segments), `send: true` sends/schedules in one call with `scheduled_at`.
- **Vercel crons:** Hobby = once/day ±59min; **Pro = per-minute precision** (we are Pro).
- **Blog repo:** NO CI exists (no `.github/`), no branch protection, repo setting
  `allow_auto_merge: false` (must be enabled via
  `gh api -X PATCH repos/yadneshSalvi/yadnesh-personal-blog -f allow_auto_merge=true`),
  squash allowed. `next.config.ts` empty → **Cache Components OFF**; existing pages use
  `export const dynamic = "force-static"` + `generateStaticParams`. DO NOT enable
  cacheComponents; follow the force-static idiom (03 §2's cacheLife note simplifies away).
- **Build hazard:** `npm run build` starts with `node scripts/check-tutorial-links.mjs
  --local`, which resolves a sibling clone `../langgraph-in-production` and asserts
  post counts. Brief CI must not depend on it; the brief validation step is standalone.
- **Feed repo** (`/Users/yadneshsalvi/code/x-daily-feed-and-automation`):
  - Models are invoked ONLY via subscription CLIs, never API keys. Judgment:
    `claude -p "$(cat PROMPT.md)" --allowedTools "..." --max-turns N`. Mechanical:
    `codex exec --skip-git-repo-check -s workspace-write -C "$DIR" "$PROMPT"` launched
    standalone with stdin `</dev/null`, completion detected by a sentinel token grepped
    from the log TAIL, 25-min timeout. Model/effort come from `~/.codex/config.toml`.
    The newsletter stage MUST follow these conventions (see the feed repo's
    `plans/05-brief-architecture.md`, esp. "lessons from the first scheduled run":
    launchd PATH pinning, zsh empty-glob, heredoc blocks in headless claude).
  - `editions.json` `leads`/`deeper` are id references into `web_items.json` (join
    required). X stories have no `edition` field; join by `run` timestamp ∈ edition
    window (copy `build_brief.py`'s logic).
  - **Source excerpts are transient**: `collect.py` wipes `data/collected/candidates-*`
    and `batches/` at the next run's start; `web_items.json` keeps only the summary.
    The fact-gate needs excerpts, so the newsletter stage adds excerpt persistence:
    write `data/excerpts/<edition-id>.json` (`{item_id: excerpt}`) at ingest time via a
    small addition in `build_brief.py` `ingest()` (do NOT bloat `web_items.json`).
    For editions predating this change, the fact-gate re-fetches URLs at compose time.
  - The feed repo is **not a git repository** and its `.env` (X keys only) is read by
    no Python file. The newsletter stage reads its own env needs from `.env` via a tiny
    loader (stdlib only). Python 3.11.6 at
    `/Library/Frameworks/Python.framework/Versions/3.11/bin/python3`, deps: stdlib +
    feedparser/certifi only; add nothing without need.
  - launchd runs 08:00/20:00 local via `com.yadneshsalvi.x-daily-feed.plist`;
    `refresh.sh` pins PATH and uses `set -uo pipefail` (no `-e`) so stages fail soft.

## Architecture deltas vs the plan

- **Approval notification email** is sent by the SITE, not the feed repo: after the
  issue PR merges, the pipeline calls `POST {BRIEF_SITE_URL}/api/brief/notify`
  (auth: `BRIEF_PIPELINE_SECRET` bearer) and the site sends the notification via Zoho.
  Keeps SMTP creds in one place (Vercel).
- **The held path uses the same route** (`{..., "needs_review": true, "pr_url",
  "reasons": []}`), and is the one call that arms nothing: it writes no send-state and
  never reads the issue off disk, because a held issue's PR is not merged and its JSON
  is therefore not in the deployment answering the request. Requiring it to be there is
  what made this path silent for the first real weekly (2026-W33): the PR opened, the
  pipeline stopped, and the owner found out by asking why no mail had come. Plan 02 §5
  had always specified the notification; only the code was missing.
- **Subscriber store + send-state store:** one small managed DB provisioned through the
  Vercel Marketplace (Upstash Redis unless something blocks it), holding: subscribers
  (email, cadence, confirmed_at, unsubscribed_at, consent log fields), send-state per
  issue (`pending_approval|approved|held|sent|skipped`, `approve_by`, `sent_at`,
  per-recipient receipts for resume-safe sending), rate-limit counters, feedback votes.
  Provision via the marketplace flow; env keys are auto-injected by the integration.
- **Sitemap:** keep `/sitemap.xml` untouched; add a separate `src/app/brief/sitemap.xml/route.ts`.
- **Feeds:** copy the hand-written RSS shape of `src/app/feed.xml/route.ts` (no feed lib).
- **Tokens:** all signed links (confirm, unsubscribe, preferences, approve/hold,
  feedback) are HMAC-SHA256 over `purpose:email-or-issue:cadence:expiry` with
  `BRIEF_TOKEN_SECRET`; no DB lookup to verify.

## Env vars (final inventory)

Blog repo (Vercel + `.env.local`):
- `NEWSLETTER_ZOHO_SMTP_HOST/PORT/USER/PASS` (already set by Yadnesh)
- `BRIEF_TOKEN_SECRET` (openssl rand -hex 32)
- `BRIEF_PIPELINE_SECRET` (openssl rand -hex 32; shared with feed repo)
- `CRON_SECRET` (openssl rand -hex 32; Vercel sends it on cron invocations)
- `BRIEF_POSTAL_ADDRESS` (before first real send)
- `BRIEF_APPROVER_EMAIL` (Yadnesh's inbox for approval notifications)
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` (Cloudflare Turnstile widget)
- DB keys: injected by the Vercel Marketplace integration
- later, optional: `RESEND_API_KEY` when/if the Resend driver is activated

Feed repo (`.env`):
- `BRIEF_GITHUB_TOKEN` (fine-grained PAT, repo `yadneshSalvi/yadnesh-personal-blog`
  only, permissions: Contents RW + Pull requests RW)
- `BRIEF_SITE_URL=https://yadneshsalvi.com`
- `BRIEF_PIPELINE_SECRET` (same value as on Vercel)

## Division of implementation

- **Blog repo, Phase 1:** issue schema (zod) + fixtures, `content/brief/**` loader with
  skip-and-warn, `/brief` routes + components in the ink-and-paper system, feeds,
  brief sitemap, SEO gates + JSON-LD, search-index extension, CODEOWNERS +
  .gitattributes, first GitHub Actions workflow (brief validation; PR-only),
  `.env.example`.
- **Feed repo:** `newsletter/` stage — assemble.py → NEWSLETTER_COMPOSE.md (claude -p)
  → fact-gate via codex exec → validate.py → publish.py (GitHub Contents API PR +
  auto-merge) → notify (site API call); `newsletter.sh` driver wired after the 08:00
  weekday run + Sunday weekly; excerpt persistence in `build_brief.py`.
- **Blog repo, Phases 2–3:** subscribe/confirm/preferences/unsubscribe routes + pages,
  Turnstile, DB, welcome email, email renderer (≤80KB), notify + send-action + send
  cron routes, feedback widget.

## Post-build resolutions (2026-08-09, after Phase 1 both sides)

- **Resend is now the active mail driver** (2026-08-09, later the same day): Yadnesh
  verified yadneshsalvi.com in Resend and added RESEND_API_KEY to `.env`. The mailer
  prefers Resend when the key is present; Zoho SMTP stays as the fallback driver;
  `BRIEF_MAIL_DRIVER` forces either. Sending address unchanged
  (newsletter@yadneshsalvi.com; `BRIEF_FROM_EMAIL` overrides). This uses Resend's
  transactional `/emails` endpoint per recipient inside our own send loop — the
  subscriber store, suppression, tokens, and resume logic are unchanged; Broadcasts/
  Audiences remain unused. A live test send succeeded. Vercel still needs
  RESEND_API_KEY + BRIEF_FROM_EMAIL set.

- `read_annotation` is DESCRIPTIVE ("arXiv preprint", "HN thread"), never an invented
  minute count; computed "(N min read)" allowed only when the fact-gate held the full
  fetched article.
- Feed category "Meta" maps to blog topic slug `industry` (mapping lives in the feed's
  `newsletter/common.py`); the blog vocabulary does not grow a `meta` slug.
- `src/lib/brief/text.ts` authoredProse now walks `thread_to_watch.story.summary`
  (gap found by the feed-side validator; a banned word had slipped through CI).
- Auto-merge enabled on the GitHub repo 2026-08-09.
- Excerpt persistence exists from edition 2026-08-09-am onward; earlier editions rely
  on fact-gate URL refetching.

House style: the site UI copy and all generator prompts obey WRITING-STYLE.md (no
em-dashes, "you" singular, no emoji in prose, contractions; banned-word list in that
file). The compose prompt embeds a distilled contract; the validator scans glyphs.

## Phase 3 operational notes (added when the send path shipped)

### Cron schedule and the IST window

`vercel.json` declares two crons, both hitting `GET /api/brief/send`. Vercel cron
schedules are **UTC**, always, and IST is UTC+5:30.

| Cron | UTC | IST | What it is for |
|---|---|---|---|
| `*/15 3-5 * * *` | 03:00–05:59, every 15 min | 08:30–11:29 | The send window. Covers the 08:45 daily target, the 09:00 Sunday weekly, and every 2h approval deadline that lands inside it. Runs all seven days: the weekly is a Sunday. |
| `0 6 * * *` | 06:00 | 11:30 | Daily sweep. Catches an issue whose approval window expired after the window closed, ages held issues into `skipped`, and gives the welcome sequence a guaranteed daily pass. |

The poller design is deliberate: an issue is not sent *by* the cron tick, it is
sent by the first tick that finds it due. A missed tick costs at most fifteen
minutes.

### What the send route refuses to do

- **No `BRIEF_POSTAL_ADDRESS`, no marketing email.** The route logs at error
  level, returns the reason in `refused[]`, and changes no state. Setting the
  variable is all it takes for the next tick to send.
- **No send state, no send.** An issue that reaches `content/brief/` without the
  pipeline calling `/api/brief/notify` stays a web-only edition forever. The
  approval gate is the Article 50 human-review step, so bypassing it silently is
  not an option.
- **Only the last 7 days.** An older issue that never went out is history.

### Resume semantics, precisely

The recipient list is frozen into `brief:send-recipients:<type>:<id>` on the
first pass and the `recipients_done` cursor indexes into that frozen list, so a
membership change mid-send cannot shift anyone under the cursor. Suppression is
still re-checked per recipient against a set read once per invocation, so an
unsubscribe that lands mid-send is honored.

The cursor is written **after** each successful send. That makes the loop
at-least-once: a crash in the gap between the SMTP send and the cursor write
repeats exactly one address on the next tick, and can never skip one. For a
newsletter that is the right side to fail on, and the window is one Redis write
wide. A wall-clock timeout (50s per invocation) is clean either way, because the
loop checks the clock before sending rather than after.

### Concurrency

`brief:send-lock` is a `SET NX EX 120`. A second tick that finds it locked
returns `{"ok":true,"skipped":"another run holds the send lock"}` and does
nothing. The lock is released in a `finally`, so a failed run does not wedge the
schedule for two minutes.

### The welcome sequence

W2 (day 3, best of the archive) and W3 (day 10, cadence check) are sent by the
same cron, at most once an hour (`brief:task:lifecycle`), capped at 25 lifecycle
emails per tick. Each one is claimed with `HSETNX` on the subscriber hash
(`w2_sent_at`, `w3_sent_at`, `reminder_sent_at`), and the claim is released if
the send throws, so a bounce retries and a success never repeats. Both have a
catch-up window (W2 stops being due at day 7, W3 at day 14) so wiring the cron
up for the first time cannot mail the whole existing list.

W2's three picks come from `pickArchiveHighlights()`, a pure function over the
issue archive: it scores editor notes highest, then cluster recurrence, then
lead/what-mattered placement, and never picks two stories from one cluster.
"Refresh monthly" means running it again over a longer archive; there is no list
to hand-edit.

### The email itself

`renderIssueEmail()` returns a TEMPLATE with four placeholders
(`%%UNSUB_URL%%`, `%%PREFS_URL%%`, `%%FEEDBACK_UP%%`, `%%FEEDBACK_DOWN%%`) and
the send loop calls `personalizeIssueEmail()` per recipient, which is four
string replaces rather than a re-render. The 80KB check costs each placeholder
at the width of a real signed link, so the measurement is of what ships, not of
the template. `npm run test:brief-email` asserts every fixture is well under
budget, that a synthetic worst case trims down with the lead, corrections, and
footer intact, and that each placeholder appears exactly once per part.

# 05 — Rollout phases, acceptance criteria, open questions

Build in this order. Each phase ships something real and is independently verifiable.
Phases 1–2 involve no email at all; nothing outward-facing sends until Phase 3 is
approved by Yadnesh.

## Phase 1 — Issue generation + web archive (no email, no subscribers)

Build: issue JSON schema + zod validation; the newsletter stage in the feed repo
(assemble → compose → fact-gate → validate → render); GitHub-API PR publishing with CI
checks and auto-merge; `/brief` routes (landing without subscribe form yet, archive,
daily/weekly issue pages, how-it-works v1); feeds (`/brief/*.xml`, `/feed-all.xml`);
SEO plumbing (canonical, robots gates, BlogPosting JSON-LD, split sitemap).

Accept when: 5 consecutive weekday dailies + 1 weekly publish hands-off; a deliberately
corrupted issue file is rejected in CI AND skipped-with-warning by a production build;
`/feed.xml` output is byte-identical to before; Search Console shows the brief sitemap
registered; house-style scan (em-dash glyph, banned words) passes on all generated
issues; Lighthouse on issue pages ≥90.

## Phase 2 — Subscribe flow (collecting, still not sending issues)

Build: subscribe form on `/brief` + issue pages + footer slot; Turnstile + honeypot;
signup log store; confirmation token flow + `/brief/confirm-sent` + `/brief/welcome`;
preferences page; Resend account, `news.` subdomain DNS (DKIM/SPF/DMARC), audience +
`daily`/`weekly` segments; welcome email W1 only.

Accept when: end-to-end signup on production creates a confirmed Resend contact in the
chosen segments and a consent-log row; unconfirmed signups get exactly one reminder;
Turnstile blocks scripted posts (test); the confirmation email lands in Gmail inbox
(not spam) with auth passing (check headers); prefs page can switch cadence and
unsubscribe.

## Phase 3 — Sending (Yadnesh subscribed + a couple of test accounts)

Build: React Email template (byte-budget check in CI with a fat fixture issue);
approval-notification email with signed approve/hold links; send-state store; the
sending cron with the auto-send deadline; footer feedback widget + collection route;
welcome W2/W3.

Accept when: a real daily goes merge → notification → (no action) → auto-send at
deadline, AND another goes merge → approve-now → send within 15 min; template survives
Gmail web/iOS + dark mode + Outlook spot-check; raw HTML ≤80KB on the largest recent
issue; one-click unsubscribe works from Gmail's native button and suppresses within
Resend; double-send impossible (kill the cron mid-run and rerun).

## Phase 4 — Public launch

Do: announce post on the blog (the how-it-works story IS the launch content); subscribe
CTAs live everywhere per 03 §5; `/brief/best` seeded by hand; ask the first real readers
for the named quotes; add Postmaster Tools monitoring; write the ops runbook entry in
the feed repo's plans (what to check when a run fails, how to send a correction).

## Phase 5 — Compounding (any order, as data arrives)

Per-story permalinks + story threading (if not already in P1), stats page, interactive
archive search, re-engagement/sunset automation, engagement-informed weekly curation,
podcast-feed TTS experiment, subscriber-count social proof past 1,000.

## Metrics that decide things

- North star: repeat-clicker cohort (clicked ≥1 of last 10 issues) and reply count.
- Guardrails: unsubscribe <0.3%/send, spam <0.1%, brief-sitemap indexation healthy,
  blog-post rankings unchanged (watch 3 canary queries that rank today).
- Kill criteria worth writing down now: if 3 months post-launch the daily's repeat-click
  cohort is <10% of actives while the weekly's is healthy, drop the daily email (web/RSS
  keeps it) rather than let it poison list health.

## Open questions for Yadnesh (blockers marked ⛔)

1. ⛔ **Physical mailing address for CAN-SPAM** (every marketing email). A registered PO
   box / CMRA mailbox qualifies; home address works but is public forever. Needed
   before Phase 3.
2. **Name**: "The Brief" / "The Agentic Brief" / something personal. Affects wordmark,
   from-name (`Yadnesh's Brief <brief@news.yadneshsalvi.com>`), and the landing pitch.
   Default if undecided: The Agentic Brief (matches the pipeline's identity).
3. **Approval window**: 2h default before auto-send, or longer/shorter? And should the
   weekly ALSO auto-send, or always require explicit approval (it carries the voice
   piece; recommend explicit-only for the weekly).
4. **`— Y:` editor notes in the daily**: keep (0–2, drafted for approval) or start
   without them and add once the review habit exists?
5. **Emoji in subject lines**: default none per house style; confirm.
6. Subject-line brand: bare topics (recommended; sender name carries brand) vs a
   `Brief:` prefix.

## Verify before building (facts true on 2026-08-09, may drift)

- Resend: `segment_id` on `POST /broadcasts`; marketing-vs-transactional quota
  separation; current free-tier contact cap; broadcast stats API surface (needed for
  02 §6).
- Vercel: Hobby cron minimum interval (once/day) and ±59min jitter — the polling-window
  design in 04 §5 assumes ≥15min granularity, which needs **Pro** or a rethink (e.g.,
  trigger the cron endpoint from the feed repo's Mac launchd instead — zero Vercel cron
  dependency; probably the better design anyway, note it for the implementer).
- GitHub auto-merge behavior with Vercel checks on this repo (branch protection config).
- Next.js 16 Cache Components flags in this repo's current config (the repo may not
  have `cacheComponents` enabled; if so, classic static rendering applies and the
  `generateStaticParams` note in 03 §2 simplifies).
- EU AI Act Art. 50 guidance updates (guidelines were still being finalized mid-2026).
- Gmail clipping threshold and Resend link-wrapping behavior (measure an actual send).

## What this plan deliberately does NOT do

- No paid tier, no sponsorships, no growth hacking, no popups.
- No change to the feed repo's curation or its invariants; the newsletter reads its
  outputs only. If the newsletter needs something the feed lacks (e.g., source
  excerpts retained per story), add it as a new field in the feed's pipeline, never a
  rewrite of history.
- No second brand off-domain (no Substack mirror). The site is the product; syndication
  can come later with canonicals pointing home.

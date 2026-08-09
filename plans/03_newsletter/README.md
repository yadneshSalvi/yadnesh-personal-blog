# 03 — The Brief: daily + weekly newsletter from the Agentic Brief feed

Design document for adding an auto-curated daily and weekly agentic-AI newsletter to
yadneshsalvi.com, generated from the feed pipeline that already runs in
`/Users/yadneshsalvi/code/x-daily-feed-and-automation` (referred to below as **the feed
repo**). Written 2026-08-09 after three parallel research passes (content format, email
infrastructure, on-site UX) whose findings are distilled into these files. A future agent
implements from this plan; nothing here is built yet.

## What exists already (do not rebuild it)

The feed repo produces, twice daily at 08:00 and 20:00 IST via launchd:

- `data/editions.json` — one record per run: `headline`, `subtitle`, `leads[]` (item ids),
  `deeper` + `deeper_note`, counts. An edition is already a curated "issue" of ~17–33 items.
- `data/web_items.json` — append-only, every collected item with `title`, `url`, `summary`
  (faithful, GPT-5.6-written), `section` (research|engineering|product|community),
  `category`, `score` 0–10, `cluster` (same-story slug), `selected`, `why` (leads only),
  `source_name`, `kind`, `published_at`, `hn_points`.
- `data/stories.json` — curated X posts with their own summaries and categories.
- Model split (a hard convention of that repo): **Claude Fable 5 does judgment**
  (curation, editorial writing), **GPT-5.6-Sol codex executors do mechanical work**
  (per-item summarizing/scoring), plain Python does everything deterministic.

The newsletter is a **derived product**: the feed stays unchanged, newsletter generation
reads its data files and writes issues into THIS repo. One-way data flow.

## Locked decisions (confirmed with Yadnesh, 2026-08-09)

1. **Email infra: API-first, own the list** → Resend Broadcasts (free ≤1,000 contacts with
   unlimited sends; $40/mo at 5,000; native React Email; automatic unsubscribe handling).
   Decision driver: daily+weekly ≈ 35 sends/subscriber/month, which breaks every
   per-email-priced provider; Resend prices per contact.
2. **Cadence: subscriber chooses** Daily / Weekly / Both at signup.
3. **Voice: transparent agent-curated.** Branded as Yadnesh's newsletter, openly built by
   an agent pipeline and reviewed by him. The pipeline IS part of the pitch.
4. **Publishing: auto-publish web, gated email.** Web editions ship automatically via PR +
   auto-merge; each email send waits for one-tap approval and auto-sends after a timeout
   if Yadnesh doesn't intervene.

## The product in one paragraph

**The Brief** (working name; final name is an open question — "The Agentic Brief" matches
the feed, but the site section is `/brief` either way): a weekday daily email of ~700–900
words (1 lead story with full treatment, 6–9 secondary items, 5–10 quick links, 4–5 min
read, sent 08:45 IST after the morning feed run) and a Sunday weekly that is NOT a recap —
it is an argued synthesis: a 5-bullet week map, one ~500-word through-line connecting the
week's stories, 3–4 deep items with mandatory caveats, a "quietly important" section, and
a forward-looking thread. Every issue lives at a permanent URL on yadneshsalvi.com with
per-story permalinks, topic pages, and RSS. Honesty is the differentiator: the pipeline
publishes "not much happened today" on thin days, keeps a standing corrections section,
and documents itself on a public how-it-works page.

## Files in this plan

| File | Contents |
|---|---|
| `01-editorial-spec.md` | Exact anatomy of daily and weekly issues, voice rules, faithfulness guardrails, disclosure/compliance, subject lines, thin-day and corrections policy |
| `02-data-and-pipeline.md` | Issue JSON schema, generation stages (which model does what), cross-repo publishing via GitHub API + PR, validation layers, schedule |
| `03-website.md` | `/brief` routes, JSON-as-source-of-truth rendering, feeds, SEO strategy (incl. protecting the blog from thin-content penalties), subscribe UX, differentiation features |
| `04-email.md` | Resend setup, DNS/deliverability, template constraints (Gmail 102KB clip, dark mode), subscribe/confirm/preferences API routes, welcome sequence, approval-gated sending |
| `05-rollout.md` | Build phases with acceptance criteria, metrics that matter, ops runbook, open questions and verify-before-building list |

Read them in order; later files assume earlier ones.

## Architecture at a glance

```
feed repo (Mac, launchd 08:00/20:00 IST)          blog repo (GitHub → Vercel)
─────────────────────────────────────────          ────────────────────────────────
collect → enrich (GPT-5.6) → curate (Fable)        content/brief/daily/2026-08-09.json ┐
        └─> editions.json / web_items.json          content/brief/weekly/2026-W32.json  ├─ rendered by /brief routes
                                                    (committed via GitHub API as a PR,  ┘
newsletter stage (new, runs after 08:00 run        auto-merged when CI validation passes
and Sunday morning):                                → Vercel deploys → web edition live)
  compose issue JSON + email HTML (Fable
  writes editorial, executors check facts)  ────>  Vercel cron (hourly): finds issues
  → PR to blog repo                                 due to send, checks approval state,
  → notification email to Yadnesh with              POSTs Resend broadcast per segment
    [Approve now] / [Hold] links                    (daily/weekly), records send receipt
```

## The five highest-leverage design choices (argued in the files)

1. **JSON, not MDX, is the source of truth for issues.** The feed already has per-story
   structure; keeping it unlocks per-story permalinks, topic pages, story threading
   ("3rd appearance of Kimi K3"), search, and stats for free. Expensive to retrofit.
2. **"Not much happened today" is policy, not failure.** The cheapest credibility
   mechanism available to an automated daily (AINews proves it); almost nobody copies it.
3. **Structural separation of reporting and opinion.** Batch-style labels: `Why it
   matters:` carries consequence; a visually distinct `— Y:` block carries the human/
   editorial take. This is what lets a reader calibrate trust per sentence.
4. **Human-in-the-loop email + full transparency = both the legal and the trust optimum.**
   EU AI Act Article 50 applies from 2026-08-02 to AI-generated public-interest text; the
   carve-out is human editorial control. The gated-send flow IS that control. Disclose
   anyway (one line + how-it-works page): this audience (AI practitioners) trusts
   disclosed AI use MORE (Trusting News 2025: 40%+ of weekly AI users).
5. **Quality-gated indexing protects the blog.** Google's helpful-content system judges
   site-wide; a naive indexed daily link-dump could drag down the hand-written posts.
   Weeklies always indexed; dailies indexed only when they carry enough original
   commentary (frontmatter flag set by the pipeline).

## Constraints carried over from the blog repo

- **House style** (`WRITING-STYLE.md`, gitignored, read it locally): no em-dashes
  anywhere, write to "you" singular, no emoji in prose, contractions, concrete verbs,
  paragraph ≤4 rendered lines, exclamation budget. The newsletter generator's prompt must
  embed a distilled version of this contract (the file itself never leaves the machine).
- Next.js 16 App Router, MDX via next-mdx-remote for posts, Tailwind 4, deployed on
  Vercel, `nodemailer` currently used only by the contact form (unrelated; leave it).
- `/feed.xml` today means "blog posts". It must keep meaning that (see `03-website.md`).

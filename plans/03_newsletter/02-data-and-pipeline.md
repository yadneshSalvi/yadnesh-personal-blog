# 02 — Data model and generation pipeline

How feed data becomes an issue, where each piece runs, and how content crosses repos
safely. The feed repo is read-only input; this repo is where issues live.

## 1. Issue JSON is the source of truth (not MDX)

The single most leveraged architectural decision. The feed already produces per-story
structure; flattening it to prose MDX throws away what enables per-story permalinks,
topic pages, story threading, client search, stats, and feeds. MDX stays the format for
hand-written blog posts only.

```
content/
  posts/                          hand-written MDX (unchanged, human-owned)
  brief/
    daily/2026-08-10.json         one file per daily issue   (bot-owned)
    weekly/2026-W33.json          one file per weekly issue  (bot-owned)
```

Guard rails on the split: `CODEOWNERS` marks `content/brief/**` bot-owned and
`content/posts/**` human-owned; `.gitattributes` sets `linguist-generated=true` on
`content/brief/**` to collapse PR diffs. Never interleave generated issues into the
posts collection or its chronology.

### Issue schema (v1 — version the schema from day one)

```jsonc
{
  "schema_version": 1,
  "type": "daily",                      // "daily" | "weekly"
  "id": "2026-08-10",                   // date for daily, "2026-W33" for weekly
  "issue_number": null,                 // weekly only, display metadata
  "status": "published",                // "draft" | "published"
  "index": true,                        // SEO gate, pipeline-set (see 03 §3)
  "generated_at": "...",
  "source_editions": ["2026-08-09-pm", "2026-08-10-am"],
  "subject": "Muse Code ships, AISI incident report, Letta Mods",
  "preheader": "Plus: 6 papers, 3 launches. 4 min.",
  "title": "Muse Code, the AISI incident, and Letta Mods",  // web <title>/H1, topic-rich
  "read_minutes": 4,
  "thin_day": false,
  "disclosure_version": 1,
  "lead": {
    "story_id": "…",
    "what": "…", "details": "…", "yes_but": "…", "why": "…"
  },
  "sections": [                          // stable order; empty sections omitted
    {"key": "research", "items": [ /* story refs + 1-2 sentence text */ ]},
    {"key": "engineering", "items": []},
    {"key": "product", "items": []},
    {"key": "community", "items": []}
  ],
  "from_x": [ /* ≤3 story refs */ ],
  "quick_links": [ {"story_id": "…"} ],
  "editor_notes": [ {"after_story": "…", "text": "…"} ],   // the `— Y:` blocks
  "corrections": [],                     // empty = renders "Nothing to correct."
  "weekly": null,                        // weekly-type issues fill this instead of lead/sections
  "email": {
    "send_state": "pending_approval",    // pending_approval | approved | held | sent | skipped
    "approve_by": "2026-08-10T05:00:00Z",// auto-send deadline (2h after notification)
    "sent_at": null, "resend_broadcast_ids": {}
  }
}
```

Weekly `weekly` object: `{week_in_five: [5 strings], through_line: {title, body_md},
what_mattered: [items with what/yes_but/why], quietly_important: [], thread_to_watch:
{…, prior_threads_paid_off: []}, deep_cuts: []}`.

### Stories are embedded, denormalized

Each item carries the full story object (not a pointer into the feed repo): `story_id`
(the feed's item id — stable, already deduped), `title`, `url`, `source_name`, `kind`,
`section`, `topics` (from the feed's `category` + `cluster`), `cluster`, `published_at`,
`read_annotation` ("6 min read" / "arXiv, 22 pp"), `summary` (the newsletter's 1–2
sentence text), `via` (optional attribution), `paywalled` (bool), `hn_points`.
Denormalizing keeps the blog repo self-contained: the site must build with zero access
to the feed repo. `story_id` + `cluster` are what power threading and per-story pages.

## 2. Where generation runs

A new `newsletter/` stage in the **feed repo** (it has the data, the model conventions,
and the schedule), producing files whose only destination is this repo via the GitHub
API. The blog repo contains no generation code — only rendering, validation, subscribe
APIs, and the send cron.

Schedule (extends the feed repo's existing launchd flow):
- **Daily:** after the 08:00 IST feed refresh completes on weekdays (~08:30), the
  newsletter stage runs. Target: PR open by 08:40, web live minutes later, email approval
  notification immediately, auto-send deadline 2h later (see 04 §5).
- **Weekly:** Sunday 08:00 IST run (no feed refresh needed beyond the normal one; it
  reads the week's data), same flow, send 09:00.

## 3. Generation stages (model split follows the feed repo's convention)

1. **Assemble (Python, deterministic).** Read the source editions + items + X stories;
   merge the two editions; dedupe by `cluster` (keep the primary-source item; aggregator
   copies become `via`); drop anything already used in a previous issue (`used_in_issue`
   ledger kept in the feed repo); compute read annotations; produce a candidate bundle
   with each story's source excerpt attached.
2. **Compose (Fable — judgment).** Pick the lead; order items by reader consequence;
   write the lead skeleton (`what/details/yes_but/why`), item summaries (reusing the
   feed's summaries where they fit email register), subject + preheader + title, decide
   `thin_day`, draft 0–2 `editor_notes`, and for weeklies write the through-line and
   section picks. Prompt embeds the editorial spec (01) and the distilled house-style
   contract.
3. **Fact-gate (GPT-5.6 executors — mechanical, parallel).** For every story: diff the
   issue's text against the attached source excerpt. Flag: numbers or quotes not present
   in the source; certainty inflation (suggests→shows); entity conflation (dense AI
   naming makes this the local failure mode); dead links (HEAD request). Output is a
   pass/fail + patch list; Fable applies patches. An item that cannot be grounded gets
   demoted to quick links (title+link only) or dropped.
4. **Validate (Python + zod-equivalent, deterministic).** Schema check; word-count
   bounds; subject ≤70 chars with load-bearing ≤45; every URL https and resolving; no
   placeholder strings (`TODO`, `[insert`, `As an AI`); date matches filename; topics
   from the controlled vocabulary; forbidden-glyph check per house style (em-dash scan);
   read-time recomputed, not trusted.
5. **Render email HTML (deterministic).** From issue JSON via the template in 04. Size
   check ≤80KB pre-send (Gmail clips at 102KB of raw source INCLUDING rewrapped link
   URLs; iOS clips lower). Over budget → drop quick links, then trailing items; never
   the footer.
6. **Publish (GitHub API).** See §4.

Cost note: one daily ≈ one Fable composition call + ~4–8 small executor calls. Negligible
against the feed pipeline's existing spend.

## 4. Cross-repo publishing: GitHub API, PR, auto-merge

Use the **GitHub Contents/Git Data API, not `git push` from cron**: no local clone to
drift or conflict, fine-grained PAT scoped to this repo + `contents:write` +
`pull_requests:write`, idempotent retries, commit SHA back as receipt. If an issue ever
becomes multi-file, use the Git Data API (blob→tree→commit→ref) so the commit is atomic.

Flow per issue:
1. Branch `brief/daily-2026-08-10` from `main`; commit
   `content(brief): daily 2026-08-10` as a dedicated machine identity
   (`brief-bot` fine-grained PAT or GitHub App, so generated commits are filterable).
2. Open PR; CI runs blog build + content validation (03 §6); Vercel builds a preview.
3. Auto-merge on green (GitHub auto-merge, squash). Vercel deploys `main`; the web
   edition is live. A bad generation = a red PR, not a broken site.
4. Idempotency: re-running a date force-updates the same branch/PR (never a duplicate
   file; date-keyed filenames give this for free).
5. On merge, the pipeline sends the approval-notification email (04 §5).

Fallback documented for the implementing agent: if PR auto-merge proves flaky under
Vercel checks, direct commit to `main` is acceptable ONLY with stage-4 validation green
and the production build's skip-and-warn guard (03 §6) in place.

## 5. Failure and skip semantics

- Feed run failed / no editions today → no daily; nothing is sent claiming otherwise.
  The pipeline logs and (already) the feed repo surfaces errors in its logs.
- Generation failed validation twice → issue written with `"status": "draft"`, PR left
  open (not auto-merged), notification email says "needs review" instead of approve.
- Thin day → still publish (short issue, honest subject). Only a genuinely empty window
  skips: web gets nothing, subscribers get nothing. Silence beats padding.
- The weekly runs even if some dailies failed that week; it reads editions directly.

## 6. Feedback loop (build in v1, it is cheap)

Store per-issue engagement snapshots (Resend broadcast stats: delivered, clicks per URL,
unsubscribes; plus the footer thumbs widget results, captured by a tiny API route into a
JSON/DB log). The weekly composer receives last week's numbers ("readers clicked X 4:1
over Y") as curation evidence. The stats page (03 §7) reads the same log. This is the
only place send data flows back toward generation; subscriber PII never does.

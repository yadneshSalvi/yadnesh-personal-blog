# 01 — Editorial spec

What an issue IS. This file is the contract the generation pipeline implements and the
reviewer checks against. Patterns here are lifted from verified anatomy of the four best
reference newsletters (TLDR AI, The Batch, Import AI, AINews) and adapted to our data.

## 1. The daily

**Cadence:** weekdays only. Composed after the 08:00 IST feed run finishes (~08:30),
target send 08:45–09:00 IST, fixed time ±10 min. Weekend news folds into Monday's issue
and the Sunday weekly. Consistency beats optimization: the ritual is the retention.

**Inputs:** the morning edition + the previous evening's edition (two feed editions per
daily issue), plus X stories from the same window. The daily is a *re-edit* for email, not
a re-curation: selection judgment already happened in the feed; the newsletter stage picks
the lead, merges/dedupes across the two editions (same `cluster` = one story), reorders by
reader consequence, and writes the editorial layer.

**Anatomy (target 700–900 words total, honest 4–5 min badge):**

1. **Header block:** wordmark, date, read-time for the whole issue, and the one-line
   disclosure (see §5). No table of contents; the issue is short enough to scan.
2. **Lead story** (exactly one, ~120–180 words) using the labeled skeleton:
   - `What happened:` 1–2 sentences, entity-led, no hype.
   - `How it works:` / `The details:` (pick whichever fits) 1–3 sentences.
   - `Yes, but:` the caveat or limitation. The generator must fill this or explicitly
     waive it with reason; the slot is structural, because LLM summarizers inflate hedged
     claims into certainties and this forces the check.
   - `Why it matters:` a specific consequence for a specific party. Banned: restating the
     headline, "major step forward", "builders should pay attention".
   The lead floats above sections regardless of which feed section it came from.
3. **Sections, stable order:** Research & Papers → Engineering & Harnesses → Product &
   Releases → Community. 6–9 items total across them at 1–2 sentences each. Each item:
   linked headline + read-time annotation `(6 min read)` / `(arXiv, 22 pp)` + summary.
   Sections with no items are omitted silently.
4. **From X** (optional, ≤3): only X posts that carry real information (releases, data,
   papers). Skip entirely on most days rather than padding.
5. **Quick links:** 5–10 one-liners, headline + source only, no summaries. This is where
   good-but-not-essential items go instead of bloating sections.
6. **Corrections:** standing section, usually the single line "Nothing to correct." When
   a correction exists: what we said, what is true, link to the updated web page. Fixed
   position so readers learn the system is monitored.
7. **Footer:** archive permalink for this issue, preferences link, one-click unsubscribe,
   physical address, "you're getting this because you subscribed at yadneshsalvi.com",
   and a one-tap feedback widget (thumbs up/down → optional text). The feedback signal
   feeds back into curation (see 02).

**Hard rules:**
- If fewer than 3 items clear the bar, ship a short issue and say so in the subject.
  Never pad. `Quiet day — 4 things worth 90 seconds` is a feature, not an apology.
- Every numeric claim and quoted string in a summary must appear in the source excerpt
  the pipeline holds. No exceptions.
- Read-time promise is kept: if the issue runs long, cut quick links first, then items,
  never the lead's caveat.

## 2. The weekly

**Cadence:** Sunday 09:00 IST. Sunday morning IST is an uncontested inbox slot and it is
Saturday evening US; the reflective read fits. Issue-numbered (`Weekly #14`): numbers on a
weekly create collectibility; on a daily they are noise.

**Inputs:** the week's ~14 feed editions, the week's dailies, item scores, cluster
recurrence counts, and click/feedback data from the week's daily sends (which stories
readers actually opened: use as evidence of under- or over-coverage).

**The rule the whole weekly hangs on: the daily's unit is the item; the weekly's unit is
the argument.** A weekly that concatenates the dailies gets deleted. The Batch ships only
4 items weekly because depth-per-item is the product; Import AI spends its budget on
analysis blocks and a closing essay. Ours:

1. **The week in five lines.** Exactly 5 bullets, one sentence each. The only recap
   element, hard-capped.
2. **The through-line** (~400–700 words). One argued observation connecting 3–6 of the
   week's stories ("three labs shipped agent-memory features this week and they are all
   solving the same context-rot problem differently"). Written by Fable, reviewed by
   Yadnesh, and the one place a first-person voice is allowed (see §4). This section is
   the reason the weekly exists.
3. **What mattered, with the caveat.** 3–4 items the dailies under-covered or whose
   significance became visible in retrospect. Batch-style labels; `Why it matters:` AND
   `Yes, but:` mandatory here.
4. **Quietly important.** 2–3 items that got little attention and deserved more (low
   `hn_points` + high `score` is the finding heuristic). The section that proves the
   curation does work a feed-scroll cannot.
5. **Thread to watch.** One forward-looking item. Creates callback hooks ("three weeks
   ago we flagged X; this week it landed") that make an automated product feel edited.
   The pipeline should check past "thread to watch" entries each week and pay off any
   that developed.
6. **Deep cuts.** 5–8 one-liners for completeness.
7. Corrections + footer as in the daily.

**What the weekly does that the daily structurally cannot** (and an LLM does well given
the week as input): retrospective correction, pattern detection across items, magnitude
calibration, follow-through on developing stories. Prompt for exactly these four.

## 3. Citation and faithfulness rules (both cadences)

- Link the **primary source**: the arXiv page, the repo, the blog post — not coverage of
  it. The announcing social post is the *discovery* channel, credited as `via @name`, not
  the source.
- Link-text convention (Import AI's, copy it): `Exact Title (Organization)` — never bare
  "Read more". It does trust work and is what screen readers navigate by.
- Mark paywalled sources inline: `(paywalled)`.
- Quote sparingly, in blockquotes, attributed; summaries must be transformative, not
  close paraphrase.
- Preserve hedging. "Suggests" never becomes "shows"; "preliminary eval" never becomes
  "benchmarks confirm". The fact-check executor pass (02 §3) diffs summary assertions
  against source text with exactly this failure mode named.
- Design target from the EBU/BBC 2025 study of AI news answers: the dominant AI failure
  is **sourcing (31% of answers), not raw accuracy (20%)**. Attribution guardrails get
  the engineering budget first.

## 4. Voice

Register: **institutional in the digest, human where earned.** The digest body is
confident, neutral-but-not-bloodless analysis; no manufactured personality, no "we
think". Opinion lives ONLY in visually distinct blocks marked `— Y:` (rendered italic
with a left rule on web, italic in email). `Why it matters:` = consequence;
`— Y:` = take. The Batch's `Why it matters:` vs `We're thinking:` separation, ours.

The `— Y:` blocks in the DAILY are optional and few (0–2 per issue); the generator drafts
them, and they only survive if Yadnesh approves the issue (the approval step in 04 is
also the editorial-responsibility step). In the WEEKLY, the through-line is the voice
piece and gets real review.

House style applies (distilled contract embedded in the generation prompt; canonical file
is the blog repo's local `WRITING-STYLE.md`): no em-dashes ever (the `— Y:` marker glyph
is a design element, not prose punctuation; if that reads as a violation, use `Y:` in a
styled block instead), "you" singular, contractions, concrete verbs, no emoji in prose,
paragraphs ≤4 rendered lines, headings are narrative beats.

## 5. Disclosure and compliance

- **EU AI Act Article 50** (applies since 2026-08-02): AI-generated text published to
  inform the public requires disclosure UNLESS a human holds editorial responsibility
  after review. Our gated-send flow is that review; Yadnesh is the named editor. We claim
  the carve-out AND disclose anyway.
- **The disclosure line** sits under the masthead, not buried in the footer (research:
  bottom/sidebar placements hit 80%+ noticeability; hover labels are missed by 56–74%):
  "Curated and summarized by an agent pipeline built by Yadnesh; reviewed before send.
  How this is made →" linking `/brief/how-it-works`.
- **No per-item AI labels** — they multiply the trust penalty and add nothing.
- Audience note that resolves the disclosure paradox: general audiences trust AI-labeled
  news less, but weekly-plus AI users trust it MORE (40%+, Trusting News). Our audience
  is the latter. Hiding the pipeline is the bigger risk here.
- **CAN-SPAM:** physical mailing address in every email; a USPS-registered PO box or CMRA
  private mailbox qualifies; a purely virtual address does not. Open item for Yadnesh in
  05. Penalty exposure is per-email; do not send without it.
- **RFC 8058 one-click unsubscribe** headers on every send (Resend handles; verify), and
  unsubscribes processed within 48h (Resend suppresses automatically).

## 6. Subject lines and preheaders

- **Daily default — the TLDR triple:** 2–3 entity-led topics, comma-separated, nouns not
  verbs, load-bearing part ≤45 chars (Gmail iOS shows ~38). `Muse Code ships, AISI
  incident report, Letta Mods`. No issue numbers, no date, no brand prefix (sender name
  carries the brand).
- **Override — the single-thing line** when one story dominates: `An agent rewrote its
  own harness to 95.5% on ARC-AGI-3`. The format change itself signals "big day".
- **Thin-day line:** `Quiet day — 4 things worth 90 seconds`. Publishing this honestly is
  policy (AINews's `not much happened today` pattern, load-bearing for trust).
- **Weekly — thesis + number, visibly different shape from the daily:** `Weekly #14:
  everyone is rebuilding agent memory`.
- **Emoji:** default none (house style leans editorial). If ever used: at most one
  semantic type-tag per topic, TLDR-style, never decorative. Decide once, stay
  consistent.
- **Preheader never repeats the subject.** Formula: coverage + read-time (`Plus: 6
  papers, 3 launches. 4 min.`) or the item that didn't fit. Always includes read-time.

## 7. Web-vs-email content differences

Same content core, different chrome (details in 03/04): the web issue adds prev/next
navigation, per-story anchors and copy-link buttons, topic chips, related-issue links,
an inline subscribe CTA after the second story, and search; the email adds the
unsubscribe/compliance footer and nothing the web lacks. Web is canonical; the email
links to it ("view in browser" = the archive permalink, one URL, not an ESP-hosted copy).

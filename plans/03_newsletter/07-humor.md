# 07 — Humor: meme of the day, hedge of the day, Sunday comic, hall of fame

Decided with Yadnesh 2026-08-11, designed by two implementation agents (blog + feed),
reconciled, adversarially reviewed (verdict: ship after fixes; all fixes applied), and
shipped the same day. This file records the final design and the reasoning that is not
visible in the code.

## Scope (locked by Yadnesh)

- Daily issue: ONE meme (picked from four candidates) + ONE "Hedge of the day". Both
  optional by quality: a weak day sets them null. Never forced.
- Weekly issue: ONE single-panel comic derived from the through-line. No meme, no hedge
  (schema tolerates them as headroom; the pipeline never emits them).
- Email stays text-only: the meme/comic appear as one line (caption + link to the web
  edition's anchor); the hedge is a full text block. Images are web-only.
- Hall of fame at /newsletter/memes: every candidate ever, winners badged, runner-ups
  labeled. Noindex,follow.
- Explicitly rejected: running counters, absurd-unit conversions, pipeline notes.

## The registers rule

The newsletter separates reporting (`Why it matters:`) from opinion (`Y:` blocks).
Humor is a THIRD register and always lives in visually marked slots (kicker-labeled
figure/box, fixed positions) so a joke can never be mistaken for a claim. The hedge box
is a bordered surface panel, deliberately NOT the left-rule style of editor notes.

## Generation flow

1. Each feed run (05:00 + 17:00 IST) writes 2 meme CONCEPTS grounded in that edition's
   selected stories (BRIEF_REFRESH.md step 6) to data/memes/pending/.
2. newsletter/render_memes.py renders them via gpt-image-1 (webp, compression 80,
   1024x1024). Failure-isolated: exits 0 on every path; missing OPENAI_API_KEY = skip
   with warning. Magic-number sniffing names files by their ACTUAL bytes (gpt-image-2
   silently ignores output_format; JPEG substitution = render failure). Cost caps:
   --limit 8 per sweep, pending window 7 days. Ledger writes are merge-by-id to survive
   the Sunday 05:00/05:05 overlap.
3. feed.html (localhost) shows every rendered meme per edition (user requirement).
4. Daily compose: Fable LOOKS at all 4 candidate images (Read tool), picks one winner or
   none, may rewrite the caption; finds the hedge quote in stored source excerpts.
5. Fact-gate (deterministic): hedge.quote must be a sentence-boundary-aligned,
   whitespace-collapsed substring of the story's excerpt with NO negation token in the
   ~40 chars before the match (verbatim substrings can otherwise invert meaning:
   "we do not claim X" must never yield "X"). Curly quotes/dashes normalized in the
   COMPARISON only. Any failure drops the hedge silently.
6. Publish: Git Data API single atomic commit = issue JSON + ALL candidate images
   (runner-ups included) under public/images/brief/memes/<issue-id>/ + hall-of-fame
   record content/brief/memes/<issue-id>.json. Candidate text is house-style-scanned
   pre-publish (bad runner-ups dropped, never blocking the issue).
7. Approval email shows the meme image, caption, alt, hedge quote + note, and the
   weekly's comic: the ONLY human review point before the 2h auto-send, so the humor
   must be in it.

## Cross-repo contract (the parts that bit us)

- **read_minutes counts NO humor text.** Blog text.ts splits authoredProse (word count,
  read time, search plaintext: pre-humor field list) from houseStyleProse (adds
  meme/comic captions, alt, alt_joke, concept, hedge.note, hedge.story.summary; used by
  the CI validator only). The feed side never counted them. A CI step
  (test:brief-text) guards the split; without it, ~52% of humor-carrying issues would
  fail CI on a read-time boundary flip.
- **hedge.quote** is verbatim source text: placeholder-scanned + length-capped (300)
  only; exempt from em-dash/banned-word scans on BOTH sides (the banned word is often
  the joke). hedge.story is excluded from allStories, the duplicate-story rule, and the
  used-item ledger (a hedge may quote a story the issue covers).
- **Hall-of-fame prose findings are WARNINGS in blog CI**, hard-scanned feed-side
  pre-publish. Runner-up captions are not reader-facing issue prose; a hard error there
  wedges every future PR (the workflow validates the whole archive).
- **Images are webp** (15.5x smaller than png at this art style: 103KB vs 1.6MB real
  measurement; repo growth ~140MB/yr vs 2GB/yr). Pattern accepts png|webp. Blog's
  imageSize.ts parses PNG + all three webp variants (VP8/VP8L/VP8X, verified against
  real non-square files); unparseable dimensions are a CI ERROR and a warned 1024x1024
  fallback at render time. Readers always got optimized webp regardless (Next image
  optimizer): the format choice is repo hygiene, not performance.
- Candidate ids are edition-derived (2026-08-11-am-m1) inside issue-id directories;
  filename prefix must never be assumed to match the directory.

## Style contract

Recurring cast, fixed in render_memes.py constants (so visual language cannot drift
with the writing model): BOLT, a small determined robot agent with a boxy head, one
round eye, and a clipboard he never puts down; DECK, an overconfident laptop-shaped
character with a face on its screen and stubby arms (renamed from "Harness": vocabulary
collision). Flat vector ink-and-paper, warm off-white paper, dark brown ink, one
burnt-orange accent: the blog's palette. In-image text ≤ a three-word label. Never a
known meme template, never real people, never logos. Concepts describe ONLY the scene.

Caption ≤25 words carries the joke; alt is a plain description (accessibility is never
the joke); alt_joke is a bonus line — title-attribute easter egg on issue pages,
visible dimmed line on the hall of fame (touch/screen-reader reachability), and by
prompt rule must never carry information the caption lacks. A small "Drawn by an image
model." disclosure line sits under every figure (web only). Dark mode dims the panels.

## Humor rules that are policy, not taste

- Mock the sentence, never the person. The hedge note is one dry sentence that does not
  explain the joke.
- A missing meme/hedge costs nothing; a limp one costs trust in every other judgment in
  the issue. Null is the default, not the fallback.
- The hall of fame publishes even when nothing won (all winner:false): the transparency
  brand extends to the jokes.

## Deferred (known, accepted)

- Gallery pagination beyond the recent-cap when the archive grows (cap + unoptimized
  images shipped now).
- Meme voting via the feedback widget; reader caption contest (drives replies).
- data/memes/ in the feed repo has no version control (the feed repo is not git);
  pending/ and index.json are the audit trail.

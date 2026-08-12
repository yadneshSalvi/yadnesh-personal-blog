# Titles and preheaders — The Agentic Brief

Reference document, not code. Nothing imports it. It exists so the compose
prompt in the feed repo and anybody rewriting a published issue are working from
the same rules.

The `title` is the web `<h1>` and the OG headline. The `preheader` is the italic
deck under it and the inbox preview line. The `subject` is a separate field with
its own 70-character ceiling and is allowed to be a topic list; a title is not.

House style from `WRITING-STYLE.md` binds both fields: no em-dashes anywhere (rewrite
the sentence, never substitute a different dash), no emoji, no banned words, "you"
singular, contractions welcome.

## The rules

**T1. A title is a sentence with a verb, not a list of topics.** Maximum 12 words
and 85 characters. If it reads like three tags joined by commas, it is a subject
line wearing a headline's clothes.

**T2. One idea, or two joined by real tension.** A second clause is allowed only
when it complicates the first: `while`, `as`, `and yet`, or a semicolon. Two facts
stapled together with a comma are two headlines fighting. Never three clauses.

**T3. Put the number in the title when the number is the story.** "28%" and
"82.7%" are stories. "4 talks" is not. A number in a title must be attached to
what it measures: "82.7% on Terminal-Bench", never a bare "82.7%".

**T4. Name what somebody would search for.** Products, organizations, benchmarks,
version numbers. Never "a major lab", "a new study", "the community".

**T5. State the surprise, do not withhold it.** The curiosity comes from the fact
being surprising, not from hiding it until the click. Banned constructions:
"here's why", "what it means", "what you need to know", "the real story behind",
any title ending in a colon and a promise, and questions the issue does not answer
flatly in the lead.

**T6. The deck earns its space by naming what the title does not.** No proper noun
may appear in both. The form is `Plus:` then three items, shortest to longest, at
least two of them different in kind (a number, a release, something human), then
`N min.` A full stop, never an exclamation mark.

**T7. Sentence case, proper nouns capitalized.** No Title Case, no ALL CAPS, no
trailing period on the title itself.

**T8. A thin day says so in the title.** Never manufacture drama on a quiet day.
The brief's credibility rests on being willing to say that not much happened.

## Worked examples

Two of these are real published titles. The other four are built from the real
story sets in the same two issues.

**1. Real, 2026-08-10.**

- Before: *An independent harness matches DeepSeek's 82.7%, and agents outrun their verifiers*
- Wrong: two ideas glued with a comma (T2); "outrun their verifiers" is a metaphor
  doing work a fact should do (T5); "82.7%" floats without its benchmark (T3).
- After: **A public harness reproduces DeepSeek's 82.7% on Terminal-Bench, 445 trials deep**

**2. Real, 2026-08-11.**

- Before: *Auto mode becomes the Claude Code default while agent monitoring keeps failing its tests*
- Wrong: "keeps failing its tests" is a judgment standing where a hard number was
  available, and the number got demoted to the deck (T3, T5).
- After: **Claude Code turns auto mode on for everyone; reward-hack monitors catch 28%**

**3. Real variant of the same issue.**

- Before: *Claude Code auto mode goes default as reward-hack monitors fail on real cheating*
- Wrong: same demotion of the number, and "fail on real cheating" reads as our
  verdict rather than UCLA's result. Verdicts belong in `Y:` notes, not headlines.
- After: as #2.

**4. Built from 2026-08-11 (malicious skill files on arXiv, plus Vercel on sandboxes).**

- Before: *Security concerns emerge around coding agent skill files and sandboxing*
- Wrong: nobody does anything in this sentence (T1), no named source (T4), and
  "concerns emerge" is the passive voice of a press release.
- After: **A skill file is executable, and most sandboxes still let it phone home**

**5. Built from 2026-08-11 (Anthropic on Claude's mathematics).**

- Before: *Anthropic explores Claude's mathematical capabilities: what it means for research*
- Wrong: colon plus a promise (T5); "explores" hides what actually happened (T1).
- After: **Claude tightens a bound on the Riemann hypothesis, and Anthropic shows the working**

**6. A thin day.**

- Before: *A quiet day in agentic AI*
- Wrong: true, and inert. It tells the reader to skip without giving them a reason
  to look.
- After: **Nothing cleared the bar today, so here are the four that came close**

## Decks, for calibration

Published decks are already close to right. These three show the boundary.

- Good, unchanged: `Plus: 4 talks from AI Engineer, a GitHub retirement, and
  sycophancy for smart people. 5 min.` Three items, three different kinds, no
  overlap with the title.
- Needs a swap under rewrite #2: `Plus: reward-hack monitors at 28%, Stagehand v4,
  and Meta's local 30B. 5 min.` becomes `Plus: malicious skill files on arXiv,
  Stagehand v4, and Meta's local 30B. 5 min.`, because the rewritten title now owns
  the 28% and T6 forbids repeating it.
- Fails: `Plus: a lot of interesting AI news and some other stories. 5 min.` No
  concrete nouns, and the items are not different in kind.

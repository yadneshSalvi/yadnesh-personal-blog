#!/usr/bin/env node

/**
 * The prose walk's guard rail, and specifically the split that keeps this repo
 * and the newsletter pipeline agreeing about read time.
 *
 * text.ts has two walks that are easy to confuse:
 *
 *   authoredProse()  what a reader reads. Feeds issueWordCount,
 *                    computeReadMinutes, and the search index.
 *   houseStyleProse() what CI scans. The above PLUS captions, alt text,
 *                    alt_joke, the meme's premise, and the hedge's note.
 *
 * The humor fields must be in the second and NOT the first. The feed repo's
 * validator counts none of them, so if they ever leak into the word count this
 * repo will start recomputing read_minutes one higher than the pipeline wrote,
 * and better than half of all humor-carrying issues will fail CI on a number
 * nobody can see. That is the regression this file exists to catch.
 *
 * Run: npm run test:brief-text
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import module from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

module.registerHooks({
  resolve(specifier, context, nextResolve) {
    const relative = specifier.startsWith("./") || specifier.startsWith("../");
    if (relative && !path.extname(specifier)) {
      const parent = context.parentURL ? fileURLToPath(context.parentURL) : process.cwd();
      const candidate = new URL(`${specifier}.ts`, pathToFileURL(parent));
      if (fs.existsSync(candidate)) return { url: candidate.href, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const { BriefIssueSchema } = await import("../src/lib/brief/schema.ts");
const {
  authoredProse,
  computeReadMinutes,
  houseStyleProse,
  issuePlainText,
  issueWordCount,
} = await import("../src/lib/brief/text.ts");

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
}

/* ── Fixtures ───────────────────────────────────────────────────────────── */

function realDaily() {
  const dir = path.join(REPO_ROOT, "content", "brief", "daily");
  const name = fs.readdirSync(dir).sort().find((file) => file.endsWith(".json"));
  assert.ok(name, "no daily issue in content/brief/daily to test against");
  return JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
}

/** Long enough that if any of it were counted, the minute would move. */
const LONG_ALT =
  "A one-panel drawing of a server rack wearing a party hat while a developer " +
  "reads a changelog aloud to it, with a speech bubble that trails off into " +
  "an ellipsis and a small dog asleep underneath the desk, ignoring both.";

const HUMOR = {
  meme: {
    image: "/images/brief/memes/PLACEHOLDER/one.webp",
    alt: LONG_ALT,
    alt_joke: "The rack has heard this changelog three times and is being polite.",
    caption: "The release notes, read to the only audience that cannot leave.",
    concept: "Take shipping to production literally until it becomes a party.",
    story_id: null,
  },
  hedge: {
    quote:
      "Performance may vary across workloads and these results should be " +
      "considered preliminary pending further evaluation by independent parties.",
    note: "The headline number in the same post carried no such qualifier.",
  },
};

function withHumor(raw) {
  const meme = { ...HUMOR.meme, image: `/images/brief/memes/${raw.id}/one.webp` };
  return BriefIssueSchema.parse({
    ...raw,
    meme,
    hedge: {
      quote: HUMOR.hedge.quote,
      story: raw.quick_links[0] ?? raw.lead.story,
      note: HUMOR.hedge.note,
    },
  });
}

/**
 * Artwork alt text and plain-words bullets are the second wave of fields with
 * the same trap in them: reader-facing prose that must be scanned and must not
 * be counted. Alt text is not read by sighted readers, and a collapsed
 * disclosure panel is not read by anybody until they open it, so counting
 * either would push read_minutes past what the pipeline computed.
 */
const LONG_IMAGE_ALT =
  "A wide drawing of a small robot holding a clipboard beside a stack of paper " +
  "taller than it is, with a laptop character peering over the top of the pile " +
  "and a single sheet drifting to the floor between them, unread by either one.";

const SIMPLE_SUMMARY = [
  "A benchmark is a fixed set of tasks used to compare one system against another.",
  "Somebody outside the company ran the same tasks and got a number close to the published one.",
  "That is unusual, because most published numbers come from the company that made the thing.",
  "It still says nothing about whether the system is useful on work that is not on the list.",
];

function withArtwork(raw) {
  const dir = `/images/brief/issues/${raw.id}`;
  return BriefIssueSchema.parse({
    ...raw,
    cover: {
      light: `${dir}/cover-light.webp`,
      dark: `${dir}/cover-dark.webp`,
      alt: LONG_IMAGE_ALT,
    },
    lead: {
      ...raw.lead,
      story: {
        ...raw.lead.story,
        image: {
          light: `${dir}/lead-light.webp`,
          dark: `${dir}/lead-dark.webp`,
          alt: LONG_IMAGE_ALT,
        },
        simple_summary: SIMPLE_SUMMARY,
      },
    },
  });
}

const rawDaily = realDaily();
const plain = BriefIssueSchema.parse(rawDaily);
const funny = withHumor(rawDaily);
const illustrated = withArtwork(rawDaily);
const leadStoryId = plain.lead.story.story_id;

console.log("brief prose walk");

/* ── The split ──────────────────────────────────────────────────────────── */

test("read time is meme-invariant", () => {
  assert.equal(
    issueWordCount(funny),
    issueWordCount(plain),
    "the humor fields are being counted as reading time",
  );
  assert.equal(computeReadMinutes(funny), computeReadMinutes(plain));
  // And the file's own number still checks out, which is what CI compares.
  assert.equal(computeReadMinutes(funny), plain.read_minutes);
});

test("authoredProse carries no humor field", () => {
  const paths = authoredProse(funny).map((field) => field.path);
  for (const leaked of paths.filter((p) => /^(meme\.|hedge\.|weekly\.comic\.)/.test(p))) {
    assert.fail(`${leaked} reached the counted walk`);
  }
  // The walk is otherwise untouched by the presence of a meme.
  assert.deepEqual(paths, authoredProse(plain).map((field) => field.path));
});

test("houseStyleProse carries every humor field except the quote", () => {
  const walked = new Map(houseStyleProse(funny).map((field) => [field.path, field.text]));
  for (const expected of [
    "meme.alt",
    "meme.caption",
    "meme.concept",
    "meme.alt_joke",
    "hedge.note",
    "hedge.story.summary",
  ]) {
    assert.ok(walked.has(expected), `${expected} is not being scanned`);
  }
  assert.equal(
    [...walked.values()].some((text) => text.includes(HUMOR.hedge.quote)),
    false,
    "hedge.quote is verbatim source text and must not be scanned for house style",
  );
});

test("a weekly's comic is scanned but not counted", () => {
  const weeklyRaw = {
    schema_version: 1,
    type: "weekly",
    id: "2026-W33",
    issue_number: 1,
    status: "published",
    index: true,
    generated_at: "2026-08-16T03:20:00Z",
    source_editions: ["2026-08-16-am"],
    subject: "A weekly used to test the prose walk",
    preheader: "Not published, built here to check the comic fields.",
    title: "A weekly used to test the prose walk",
    read_minutes: 1,
    disclosure_version: 1,
    from_x: [],
    quick_links: [],
    editor_notes: [],
    corrections: [],
    email: { send_state: "pending_approval", approve_by: null, sent_at: null, resend_broadcast_ids: {} },
    weekly: {
      week_in_five: ["One.", "Two.", "Three.", "Four.", "Five."],
      through_line: { title: "A through line", body_md: "One paragraph." },
      what_mattered: [
        {
          story: {
            story_id: "prose-test-1",
            title: "A story",
            url: "https://example.com/prose-test-1",
            source_name: "An Organization",
            kind: "company",
            section: "research",
            topics: ["models"],
            summary: "A summary.",
          },
          what: "What.",
          yes_but: "But.",
          why: "Why.",
        },
      ],
      quietly_important: [],
      thread_to_watch: { title: "A thread", body: "A body.", story: null, prior_threads_paid_off: [] },
      deep_cuts: [],
    },
  };

  const bare = BriefIssueSchema.parse(weeklyRaw);
  const drawn = BriefIssueSchema.parse({
    ...weeklyRaw,
    weekly: {
      ...weeklyRaw.weekly,
      comic: {
        image: "/images/brief/memes/2026-W33/comic.webp",
        alt: LONG_ALT,
        alt_joke: "Panel four exists but it is still rendering.",
        caption: "Drawn after the through line, which is why it agrees with it.",
      },
    },
  });

  assert.equal(issueWordCount(drawn), issueWordCount(bare), "the comic is being counted");
  const paths = houseStyleProse(drawn).map((field) => field.path);
  for (const expected of ["weekly.comic.alt", "weekly.comic.caption", "weekly.comic.alt_joke"]) {
    assert.ok(paths.includes(expected), `${expected} is not being scanned`);
  }
});

test("the search index and feeds stay free of alt text", () => {
  const text = issuePlainText(funny);
  assert.equal(text.includes(HUMOR.meme.alt), false, "alt text reached the search index");
  assert.equal(text.includes(HUMOR.meme.concept), false, "the premise reached the search index");
  assert.equal(text, issuePlainText(plain), "plain text changed when a meme was added");
});

/* ── Artwork and plain words ────────────────────────────────────────────── */

test("read time is artwork-invariant", () => {
  assert.equal(
    issueWordCount(illustrated),
    issueWordCount(plain),
    "cover alt, image alt, or the plain-words bullets are being counted as reading time",
  );
  assert.equal(computeReadMinutes(illustrated), computeReadMinutes(plain));
  assert.equal(computeReadMinutes(illustrated), plain.read_minutes);
});

test("authoredProse carries no artwork or plain-words field", () => {
  const paths = authoredProse(illustrated).map((field) => field.path);
  for (const leaked of paths.filter((p) => /(^cover\.|image\.alt|simple_summary)/.test(p))) {
    assert.fail(`${leaked} reached the counted walk`);
  }
  assert.deepEqual(paths, authoredProse(plain).map((field) => field.path));
});

test("houseStyleProse scans the cover, the pictures, and every bullet", () => {
  const walked = new Map(
    houseStyleProse(illustrated).map((field) => [field.path, field.text]),
  );
  const expected = [
    "cover.alt",
    `story[${leadStoryId}].image.alt`,
    ...SIMPLE_SUMMARY.map((_, i) => `story[${leadStoryId}].simple_summary[${i}]`),
  ];
  for (const path of expected) {
    assert.ok(walked.has(path), `${path} is not being scanned`);
  }
  assert.equal(
    walked.get(`story[${leadStoryId}].simple_summary[0]`),
    SIMPLE_SUMMARY[0],
    "a bullet is being scanned under the wrong text",
  );
});

test("plain words and alt text stay out of the search index", () => {
  const text = issuePlainText(illustrated);
  assert.equal(text.includes(LONG_IMAGE_ALT), false, "alt text reached the search index");
  assert.equal(
    text.includes(SIMPLE_SUMMARY[0]),
    false,
    "a plain-words bullet reached the search index",
  );
  assert.equal(text, issuePlainText(plain), "plain text changed when artwork was added");
});

console.log(`\n${passed} passed`);

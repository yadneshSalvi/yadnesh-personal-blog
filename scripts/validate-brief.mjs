#!/usr/bin/env node

/**
 * Hard-fail validation for generated brief issues. CI runs this on every PR
 * that touches content/brief/**; `npm run validate:brief` runs the same checks
 * locally.
 *
 * It imports the zod schema straight from src/ through node's built-in type
 * stripping, so there is exactly one definition of what an issue is. That is
 * why the imports below carry explicit .ts extensions: node does not do
 * extensionless resolution.
 *
 * Deliberately NOT checked here: whether each URL resolves. These files are
 * generated on a machine with network access by a pipeline that already does a
 * fact-gate pass with HEAD requests; making CI depend on 40 third-party hosts
 * being up would turn a green build into a coin flip.
 *
 * Usage:
 *   node scripts/validate-brief.mjs                 validate every issue
 *   node scripts/validate-brief.mjs <file> [...]    validate specific files
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  BriefIssueSchema,
  BriefMemeSetSchema,
  DAILY_ID_PATTERN,
  HEDGE_QUOTE_MAX_LENGTH,
  MEME_IMAGE_ROOT,
  SUBJECT_MAX_LENGTH,
  WEEKLY_ID_PATTERN,
} from "../src/lib/brief/schema.ts";
import { computeReadMinutes, houseStyleProse } from "../src/lib/brief/text.ts";
import { measurePublicImage } from "../src/lib/brief/imageSize.ts";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BRIEF_DIR = path.join(REPO_ROOT, "content", "brief");
const MEMES_DIR = path.join(BRIEF_DIR, "memes");

/** How far back the duplicate-story check looks, per the editorial spec. */
const DUPLICATE_LOOKBACK = 7;

/** Phrases that mean a generation step left its scaffolding behind. */
const PLACEHOLDER_PATTERNS = [
  /\bTODO\b/,
  /\bFIXME\b/,
  /\[insert/i,
  /\bas an AI\b/i,
  /\blorem ipsum\b/i,
  /\bPLACEHOLDER\b/i,
  /\{\{\s*\w+\s*\}\}/,
];

/**
 * House style, from WRITING-STYLE.md §3. Split into two tiers because a few of
 * the banned words are only banned in one sense, and failing a build on "just"
 * would be worse than the disease.
 */
const BANNED_ERRORS = [
  { pattern: /—/, label: "em-dash (rewrite the sentence)" },
  { pattern: /\bdelve\b/i, label: "delve" },
  { pattern: /\bdive into\b/i, label: "dive into" },
  { pattern: /\bdeep dive\b/i, label: "deep dive" },
  { pattern: /\bunleash/i, label: "unleash" },
  { pattern: /\bseamless(ly)?\b/i, label: "seamless" },
  { pattern: /\brobust\b/i, label: "robust" },
  { pattern: /\bgame[- ]chang(er|ing)\b/i, label: "game-changer" },
  { pattern: /\brevolutioni[sz]e/i, label: "revolutionize" },
  { pattern: /\bin today's fast-paced world\b/i, label: "in today's fast-paced world" },
  { pattern: /\bit's important to note\b/i, label: "it's important to note" },
  { pattern: /\bwithout further ado\b/i, label: "without further ado" },
  { pattern: /\bsimply\b/i, label: "simply" },
  { pattern: /\bobviously\b/i, label: "obviously" },
  { pattern: /\bas mentioned earlier\b/i, label: "as mentioned earlier" },
  { pattern: /\bin conclusion\b/i, label: "in conclusion" },
  { pattern: /\bhappy coding\b/i, label: "happy coding" },
  { pattern: /\bleverag(es|ed|ing)\b/i, label: "leverage (as a verb)" },
  { pattern: /\bleverage\s+(the|a|an|your|its|their|our)\b/i, label: "leverage (as a verb)" },
  { pattern: /\bharness(ing|ed)\b/i, label: "harness (as a verb)" },
  { pattern: /\p{Extended_Pictographic}/u, label: "emoji" },
];

const BANNED_WARNINGS = [
  { pattern: /\bjust\b/i, label: "just (check it isn't a minimizer)" },
  { pattern: /\beasy\b/i, label: "easy" },
];

function collectIssueFiles() {
  const files = [];
  for (const type of ["daily", "weekly"]) {
    const dir = path.join(BRIEF_DIR, type);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir).sort()) {
      if (name.endsWith(".json")) files.push(path.join(dir, name));
    }
  }
  return files;
}

function collectMemeFiles() {
  if (!fs.existsSync(MEMES_DIR)) return [];
  return fs
    .readdirSync(MEMES_DIR)
    .sort()
    .filter((name) => name.endsWith(".json"))
    .map((name) => path.join(MEMES_DIR, name));
}

function isMemeFile(file) {
  return path.dirname(file) === MEMES_DIR;
}

/** The hall-of-fame file for an issue, or null when there is none or it is unreadable. */
function memeSetFor(issueId) {
  const file = path.join(MEMES_DIR, `${issueId}.json`);
  if (!fs.existsSync(file)) return null;
  try {
    const parsed = BriefMemeSetSchema.safeParse(JSON.parse(fs.readFileSync(file, "utf8")));
    // A broken set file reports its own errors when it is itself a target.
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Two things about a drawn image: it sits in its own issue's folder, and it is
 * actually in the tree. The pipeline commits images in the same PR as the issue
 * it draws for, so a missing file here means a half-published issue, which on
 * the web is a broken frame in the middle of the page.
 */
function checkDrawnImage(label, issueId, imagePath, errors) {
  const expected = `${MEME_IMAGE_ROOT}/${issueId}/`;
  if (!imagePath.startsWith(expected)) {
    errors.push(`${label}: image "${imagePath}" must live under ${expected}`);
    return;
  }
  const onDisk = path.join(REPO_ROOT, "public", imagePath.replace(/^\/+/, ""));
  if (!fs.existsSync(onDisk)) {
    errors.push(`${label}: image "${imagePath}" is not in public/`);
    return;
  }
  // The page needs real width and height or next/image gets the aspect ratio
  // from a guess. The render-time fallback is square and the generator's output
  // is square, so a bad file would look fine locally and wrong for anything
  // hand-added. Fail here instead.
  if (!measurePublicImage(imagePath, REPO_ROOT)) {
    errors.push(
      `${label}: image "${imagePath}" could not be measured; it is not a readable png or webp`,
    );
  }
}

/** The house-style walk, applied to one field of authored prose. */
function checkProseField(label, text, errors, warnings) {
  const placeholder = firstMatch(
    text,
    PLACEHOLDER_PATTERNS.map((pattern) => ({ pattern, label: String(pattern) })),
  );
  if (placeholder) {
    errors.push(`${label}: placeholder text left in: ${placeholder.snippet}`);
  }
  const banned = firstMatch(text, BANNED_ERRORS);
  if (banned) {
    errors.push(`${label}: house style, ${banned.label}: ${banned.snippet}`);
  }
  const soft = firstMatch(text, BANNED_WARNINGS);
  if (soft) {
    warnings.push(`${label}: house style, ${soft.label}: ${soft.snippet}`);
  }
}

function firstMatch(text, patterns) {
  for (const entry of patterns) {
    const match = entry.pattern.exec(text);
    if (match) return { label: entry.label, snippet: excerptAround(text, match.index) };
  }
  return null;
}

function excerptAround(text, index) {
  const start = Math.max(0, index - 40);
  const end = Math.min(text.length, index + 40);
  return `${start > 0 ? "..." : ""}${text.slice(start, end).replace(/\s+/g, " ")}${end < text.length ? "..." : ""}`;
}

function checkIssue(file, issue, previousIssues) {
  const errors = [];
  const warnings = [];
  const relative = path.relative(REPO_ROOT, file);

  const expectedDir = path.basename(path.dirname(file));
  if (expectedDir !== issue.type) {
    errors.push(`type "${issue.type}" but the file sits in content/brief/${expectedDir}/`);
  }
  const basename = path.basename(file, ".json");
  if (basename !== issue.id) {
    errors.push(`id "${issue.id}" does not match filename "${basename}.json"`);
  }

  if (issue.subject.length > SUBJECT_MAX_LENGTH) {
    errors.push(`subject is ${issue.subject.length} chars, over the ${SUBJECT_MAX_LENGTH} limit`);
  }
  if (/^brief:/i.test(issue.subject)) {
    errors.push('subject carries a "Brief:" prefix; the sender name carries the brand');
  }
  if (issue.preheader.trim() === issue.subject.trim()) {
    errors.push("preheader repeats the subject");
  }

  // houseStyleProse is the scan surface: authored prose plus the humor blocks.
  // It is deliberately wider than what read_minutes counts, and it deliberately
  // omits hedge.quote, which is verbatim source text and exempt the way story
  // titles are.
  for (const field of houseStyleProse(issue)) {
    checkProseField(field.path, field.text, errors, warnings);
  }

  const computed = computeReadMinutes(issue);
  if (computed !== issue.read_minutes) {
    errors.push(`read_minutes says ${issue.read_minutes}, recomputed ${computed}`);
  }

  const seen = new Map();
  for (const story of storiesOf(issue)) {
    if (seen.has(story.story_id)) {
      errors.push(`story ${story.story_id} appears twice in this issue`);
    }
    seen.set(story.story_id, story);
    let url;
    try {
      url = new URL(story.url);
    } catch {
      errors.push(`story ${story.story_id}: url is not parseable`);
      continue;
    }
    if (url.protocol !== "https:") {
      errors.push(`story ${story.story_id}: url is not https`);
    }
  }

  if (issue.meme) {
    checkDrawnImage("meme", issue.id, issue.meme.image, errors);
    if (issue.meme.story_id && !seen.has(issue.meme.story_id)) {
      warnings.push(
        `meme.story_id "${issue.meme.story_id}" is not a story this issue carries`,
      );
    }
  }

  // The winner in the hall-of-fame file is supposed to BE the image the issue
  // ran. A mismatch means one of the two files was regenerated on its own, and
  // the gallery would badge the wrong drawing as the one that shipped. A
  // warning rather than an error: the two files can legitimately arrive in
  // separate pull requests.
  const published = [issue.meme?.image, issue.type === "weekly" ? issue.weekly.comic?.image : null]
    .filter(Boolean);
  if (published.length > 0) {
    const set = memeSetFor(issue.id);
    const winner = set?.candidates.find((candidate) => candidate.winner);
    if (winner && !published.includes(winner.image)) {
      warnings.push(
        `memes/${issue.id}.json marks "${winner.image}" the winner, but this issue publishes ${published.map((image) => `"${image}"`).join(" and ")}`,
      );
    }
  }
  if (issue.type === "weekly" && issue.weekly.comic) {
    checkDrawnImage("weekly.comic", issue.id, issue.weekly.comic.image, errors);
  }
  if (issue.type === "daily" && issue.hedge) {
    const hedge = issue.hedge;
    if (hedge.quote.trim().length === 0) {
      errors.push("hedge.quote is blank");
    }
    // The quote is exempt from banned words and glyphs (somebody else wrote it,
    // and "seamless" in the quote is often the whole joke) but NOT from the
    // scaffolding check: "[insert quote]" is a failed generation, not a source.
    const leftover = firstMatch(
      hedge.quote,
      PLACEHOLDER_PATTERNS.map((pattern) => ({ pattern, label: String(pattern) })),
    );
    if (leftover) {
      errors.push(`hedge.quote: placeholder text left in: ${leftover.snippet}`);
    }
    if (hedge.quote.length > HEDGE_QUOTE_MAX_LENGTH) {
      errors.push(
        `hedge.quote is ${hedge.quote.length} chars, over the ${HEDGE_QUOTE_MAX_LENGTH} limit`,
      );
    }
    // The hedge's story sits outside the issue's story walk, so its URL is
    // checked here rather than in the loop above.
    try {
      if (new URL(hedge.story.url).protocol !== "https:") {
        errors.push("hedge.story: url is not https");
      }
    } catch {
      errors.push("hedge.story: url is not parseable");
    }
  }

  // Dailies must not re-run a story the last seven dailies already carried.
  // Weeklies are retrospective by design, so the rule does not apply to them.
  if (issue.type === "daily") {
    const recent = previousIssues
      .filter((candidate) => candidate.issue.type === "daily")
      .slice(-DUPLICATE_LOOKBACK);
    for (const previous of recent) {
      for (const story of storiesOf(previous.issue)) {
        if (seen.has(story.story_id)) {
          errors.push(
            `story ${story.story_id} already ran in ${previous.issue.type}/${previous.issue.id}`,
          );
        }
      }
    }
  }

  return { relative, errors, warnings };
}

/**
 * A day's meme batch: content/brief/memes/<issue-id>.json. The winner is the
 * one that ran in the issue; the rest are the hall of fame's runner-ups.
 */
function checkMemeSet(file, set) {
  const errors = [];
  const warnings = [];
  const relative = path.relative(REPO_ROOT, file);

  const basename = path.basename(file, ".json");
  if (basename !== set.issue_id) {
    errors.push(`issue_id "${set.issue_id}" does not match filename "${basename}.json"`);
  }
  const pattern = set.type === "daily" ? DAILY_ID_PATTERN : WEEKLY_ID_PATTERN;
  if (!pattern.test(set.issue_id)) {
    errors.push(`issue_id "${set.issue_id}" is not a valid ${set.type} id`);
  }

  const ids = new Set();
  let winners = 0;
  set.candidates.forEach((candidate, i) => {
    const label = `candidates[${i}]`;
    if (ids.has(candidate.id)) {
      errors.push(`${label}: id "${candidate.id}" appears twice`);
    }
    ids.add(candidate.id);
    if (candidate.winner) winners += 1;
    checkDrawnImage(label, set.issue_id, candidate.image, errors);

    // House-style findings on candidate text are WARNINGS, not errors, and the
    // difference matters more than it looks. A runner-up's caption is not
    // reader-facing issue prose: it appears once in a gallery nobody is graded
    // on. Meanwhile this workflow revalidates the WHOLE archive on every pull
    // request, so one banned word in a caption written months ago would fail
    // every future PR until somebody edited history. The feed side drops bad
    // candidates before publishing; this is the safety net, not the gate.
    // Schema, path, image and winner checks above stay hard errors.
    checkProseField(`${label}.alt`, candidate.alt, warnings, warnings);
    checkProseField(`${label}.caption`, candidate.caption, warnings, warnings);
    if (candidate.concept) {
      checkProseField(`${label}.concept`, candidate.concept, warnings, warnings);
    }
    if (candidate.alt_joke) {
      checkProseField(`${label}.alt_joke`, candidate.alt_joke, warnings, warnings);
    }
  });

  if (winners > 1) {
    errors.push(`${winners} candidates are marked winner; exactly one ran`);
  }
  if (winners === 0) {
    warnings.push("no candidate is marked winner, so none of these ran");
  }

  return { relative, errors, warnings };
}

/** Local copy of the story walk, so this script needs only type-only imports from text.ts. */
function storiesOf(issue) {
  const stories = [];
  if (issue.type === "daily") {
    if (issue.lead) stories.push(issue.lead.story);
    for (const section of issue.sections) stories.push(...section.items);
  } else {
    for (const pick of issue.weekly.what_mattered) stories.push(pick.story);
    for (const pick of issue.weekly.quietly_important) stories.push(pick.story);
    if (issue.weekly.thread_to_watch.story) stories.push(issue.weekly.thread_to_watch.story);
    stories.push(...issue.weekly.deep_cuts);
  }
  stories.push(...issue.from_x, ...issue.quick_links);
  return stories;
}

function main() {
  const requested = process.argv.slice(2).filter((arg) => !arg.startsWith("-"));
  const targets = requested.length > 0
    ? requested.map((arg) => path.resolve(REPO_ROOT, arg))
    : [...collectIssueFiles(), ...collectMemeFiles()];

  if (targets.length === 0) {
    console.log("No brief issues to validate.");
    return 0;
  }

  // Duplicate detection needs the history, not only the changed files.
  const history = [];
  for (const file of collectIssueFiles()) {
    try {
      const parsed = BriefIssueSchema.safeParse(JSON.parse(fs.readFileSync(file, "utf8")));
      if (parsed.success) history.push({ file, issue: parsed.data });
    } catch {
      // A file that cannot be read is reported when it is itself a target.
    }
  }

  let failed = 0;
  let warned = 0;

  for (const file of targets) {
    const relative = path.relative(REPO_ROOT, file);
    if (!fs.existsSync(file)) {
      console.error(`FAIL ${relative}\n  - file does not exist`);
      failed += 1;
      continue;
    }

    let raw;
    try {
      raw = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (error) {
      console.error(`FAIL ${relative}\n  - not valid JSON: ${error.message}`);
      failed += 1;
      continue;
    }

    const schema = isMemeFile(file) ? BriefMemeSetSchema : BriefIssueSchema;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const lines = parsed.error.issues.map(
        (problem) => `  - ${problem.path.join(".") || "(root)"}: ${problem.message}`,
      );
      console.error(`FAIL ${relative}\n${lines.join("\n")}`);
      failed += 1;
      continue;
    }

    const previous = history.filter((entry) => entry.file < file);
    const result = isMemeFile(file)
      ? checkMemeSet(file, parsed.data)
      : checkIssue(file, parsed.data, previous);
    if (result.errors.length > 0) {
      console.error(
        `FAIL ${relative}\n${result.errors.map((line) => `  - ${line}`).join("\n")}`,
      );
      failed += 1;
    } else {
      console.log(`ok   ${relative}`);
    }
    for (const warning of result.warnings) {
      console.warn(`warn ${relative}\n  - ${warning}`);
      warned += 1;
    }
  }

  const summary = `${targets.length} file(s) checked, ${failed} failed, ${warned} warning(s)`;
  if (failed > 0) {
    console.error(`\n${summary}`);
    return 1;
  }
  console.log(`\n${summary}`);
  return 0;
}

process.exit(main());

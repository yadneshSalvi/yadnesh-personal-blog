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
  SUBJECT_MAX_LENGTH,
} from "../src/lib/brief/schema.ts";
import { authoredProse, computeReadMinutes } from "../src/lib/brief/text.ts";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BRIEF_DIR = path.join(REPO_ROOT, "content", "brief");

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

  const prose = authoredProse(issue);
  for (const field of prose) {
    const placeholder = firstMatch(field.text, PLACEHOLDER_PATTERNS.map((pattern) => ({ pattern, label: String(pattern) })));
    if (placeholder) {
      errors.push(`${field.path}: placeholder text left in: ${placeholder.snippet}`);
    }
    const banned = firstMatch(field.text, BANNED_ERRORS);
    if (banned) {
      errors.push(`${field.path}: house style, ${banned.label}: ${banned.snippet}`);
    }
    const soft = firstMatch(field.text, BANNED_WARNINGS);
    if (soft) {
      warnings.push(`${field.path}: house style, ${soft.label}: ${soft.snippet}`);
    }
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
    : collectIssueFiles();

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

    const parsed = BriefIssueSchema.safeParse(raw);
    if (!parsed.success) {
      const lines = parsed.error.issues.map(
        (problem) => `  - ${problem.path.join(".") || "(root)"}: ${problem.message}`,
      );
      console.error(`FAIL ${relative}\n${lines.join("\n")}`);
      failed += 1;
      continue;
    }

    const previous = history.filter((entry) => entry.file < file);
    const result = checkIssue(file, parsed.data, previous);
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

  const summary = `${targets.length} issue(s) checked, ${failed} failed, ${warned} warning(s)`;
  if (failed > 0) {
    console.error(`\n${summary}`);
    return 1;
  }
  console.log(`\n${summary}`);
  return 0;
}

process.exit(main());

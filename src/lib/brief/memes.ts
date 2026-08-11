// src/lib/brief/memes.ts
//
// Reads content/brief/memes/**.json: one file per issue day, holding every
// candidate the pipeline drew that day and which one ran.
//
// Same failure policy as issues.ts (plan 03 §6): CI fails hard on a bad file,
// production skips it with a warning. The hall of fame is the least important
// page on the site and must never be the reason a deploy dies.

import fs from "node:fs";
import path from "node:path";
import {
  BriefMemeSetSchema,
  DAILY_ID_PATTERN,
  WEEKLY_ID_PATTERN,
  type BriefMemeCandidate,
  type BriefMemeSet,
} from "./schema";
import { issueDate } from "./dates";

const MEMES_DIR = path.join(process.cwd(), "content", "brief", "memes");

/** One panel on the hall of fame, carrying the issue it belongs to. */
export type MemeGalleryEntry = {
  candidate: BriefMemeCandidate;
  issueType: BriefMemeSet["type"];
  issueId: string;
  date: Date;
};

function idMatchesType(type: BriefMemeSet["type"], id: string): boolean {
  return type === "daily" ? DAILY_ID_PATTERN.test(id) : WEEKLY_ID_PATTERN.test(id);
}

let cache: BriefMemeSet[] | null = null;

/** Every meme set on disk that parsed, newest issue first. */
export function getMemeSets(): BriefMemeSet[] {
  if (cache) return cache;
  if (!fs.existsSync(MEMES_DIR)) {
    cache = [];
    return cache;
  }

  const sets: BriefMemeSet[] = [];
  for (const file of fs.readdirSync(MEMES_DIR).sort()) {
    if (!file.endsWith(".json")) continue;
    const fullPath = path.join(MEMES_DIR, file);

    let raw: unknown;
    try {
      raw = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    } catch (error) {
      console.warn(`[brief] SKIPPED memes/${file}: not valid JSON. ${String(error)}`);
      continue;
    }

    const parsed = BriefMemeSetSchema.safeParse(raw);
    if (!parsed.success) {
      const problems = parsed.error.issues
        .slice(0, 5)
        .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("; ");
      console.warn(`[brief] SKIPPED memes/${file}: schema errors. ${problems}`);
      continue;
    }

    const set = parsed.data;
    if (`${set.issue_id}.json` !== file) {
      console.warn(
        `[brief] SKIPPED memes/${file}: issue_id "${set.issue_id}" does not match the filename.`,
      );
      continue;
    }
    if (!idMatchesType(set.type, set.issue_id)) {
      console.warn(
        `[brief] SKIPPED memes/${file}: issue_id "${set.issue_id}" is not a ${set.type} id.`,
      );
      continue;
    }

    sets.push(set);
  }

  sets.sort(
    (a, b) =>
      issueDate(b.type, b.issue_id).getTime() - issueDate(a.type, a.issue_id).getTime(),
  );
  cache = sets;
  return cache;
}

/**
 * Every candidate ever drawn, newest issue first, and the winner ahead of its
 * runner-ups inside a day. Order is the whole layout of the gallery.
 */
export function getMemeGallery(): MemeGalleryEntry[] {
  const entries: MemeGalleryEntry[] = [];
  for (const set of getMemeSets()) {
    const date = issueDate(set.type, set.issue_id);
    const ordered = [...set.candidates].sort(
      (a, b) => Number(b.winner) - Number(a.winner),
    );
    for (const candidate of ordered) {
      entries.push({
        candidate,
        issueType: set.type,
        issueId: set.issue_id,
        date,
      });
    }
  }
  return entries;
}

export function hasMemeGallery(): boolean {
  return getMemeSets().length > 0;
}

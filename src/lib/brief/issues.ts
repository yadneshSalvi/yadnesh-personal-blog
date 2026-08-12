// src/lib/brief/issues.ts
//
// Reads content/brief/**.json and hands the routes typed, validated issues.
//
// Failure policy (plan 03 §6): CI fails hard on a bad issue file, production
// skips it with a loud warning. One malformed generated file must never block a
// deploy of the hand-written blog.

import fs from "node:fs";
import path from "node:path";
import {
  BriefIssueSchema,
  type BriefIssue,
  type BriefStory,
  type BriefTopic,
} from "./schema";
import { issueDate } from "./dates";
import { allStories } from "./text";

const BRIEF_DIR = path.join(process.cwd(), "content", "brief");

/** Archive page size. Page 1 is indexed; the rest are noindex,follow. */
export const ISSUES_PER_PAGE = 20;

export type IssueType = "daily" | "weekly";

/** Where a story sat inside an issue. Drives the "appeared in" list. */
export type StoryPlacement =
  | "lead"
  | "section"
  | "from_x"
  | "quick_link"
  | "what_mattered"
  | "quietly_important"
  | "thread_to_watch"
  | "deep_cut";

export type StoryAppearance = {
  type: IssueType;
  id: string;
  issueTitle: string;
  date: Date;
  placement: StoryPlacement;
  /** The story exactly as that issue carried it; summaries can differ between issues. */
  story: BriefStory;
};

export type StoryRecord = {
  storyId: string;
  /** The most recent version of the story. */
  story: BriefStory;
  appearances: StoryAppearance[];
};

export type TopicRecord = {
  topic: BriefTopic;
  count: number;
};

/**
 * Drafts render on previews so a held issue can be reviewed at its real URL,
 * and 404 in production. They never appear in listings, feeds, or sitemaps.
 */
export function draftsAreRenderable(): boolean {
  return process.env.VERCEL_ENV !== "production";
}

let cache: BriefIssue[] | null = null;

function readIssueDir(type: IssueType): BriefIssue[] {
  const dir = path.join(BRIEF_DIR, type);
  if (!fs.existsSync(dir)) return [];

  const issues: BriefIssue[] = [];
  for (const file of fs.readdirSync(dir).sort()) {
    if (!file.endsWith(".json")) continue;
    const fullPath = path.join(dir, file);
    let raw: unknown;
    try {
      raw = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    } catch (error) {
      console.warn(`[brief] SKIPPED ${type}/${file}: not valid JSON. ${String(error)}`);
      continue;
    }

    const parsed = BriefIssueSchema.safeParse(raw);
    if (!parsed.success) {
      const problems = parsed.error.issues
        .slice(0, 5)
        .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("; ");
      console.warn(`[brief] SKIPPED ${type}/${file}: schema errors. ${problems}`);
      continue;
    }

    const issue = parsed.data;
    if (issue.type !== type) {
      console.warn(
        `[brief] SKIPPED ${type}/${file}: type "${issue.type}" does not match its directory.`,
      );
      continue;
    }
    if (`${issue.id}.json` !== file) {
      console.warn(
        `[brief] SKIPPED ${type}/${file}: id "${issue.id}" does not match the filename.`,
      );
      continue;
    }

    issues.push(issue);
  }
  return issues;
}

/** Every issue on disk that parsed, drafts included, newest first. */
export function getAllIssuesIncludingDrafts(): BriefIssue[] {
  if (cache) return cache;
  const issues = [...readIssueDir("daily"), ...readIssueDir("weekly")];
  issues.sort((a, b) => {
    const diff = issueDate(b.type, b.id).getTime() - issueDate(a.type, a.id).getTime();
    if (diff !== 0) return diff;
    // A weekly closes the week it shares a date with, so it sorts above the daily.
    return a.type === b.type ? 0 : a.type === "weekly" ? -1 : 1;
  });
  cache = issues;
  return issues;
}

/** The public set: what listings, feeds, sitemaps, and search index. */
export function getAllIssues(): BriefIssue[] {
  return getAllIssuesIncludingDrafts().filter((issue) => issue.status === "published");
}

export function getIssuesOfType(type: IssueType): BriefIssue[] {
  return getAllIssues().filter((issue) => issue.type === type);
}

export function getLatestIssue(type: IssueType): BriefIssue | null {
  return getIssuesOfType(type)[0] ?? null;
}

/** The set of pages that exist. Drafts are included only where they can render. */
export function getRenderableIssues(): BriefIssue[] {
  return draftsAreRenderable()
    ? getAllIssuesIncludingDrafts()
    : getAllIssues();
}

export function getIssue(type: IssueType, id: string): BriefIssue | null {
  return (
    getRenderableIssues().find((issue) => issue.type === type && issue.id === id) ??
    null
  );
}

/** Previous and next issue of the same cadence, in publication order. */
export function getAdjacentIssues(issue: BriefIssue): {
  previous: BriefIssue | null;
  next: BriefIssue | null;
} {
  const siblings = getIssuesOfType(issue.type);
  const index = siblings.findIndex((candidate) => candidate.id === issue.id);
  if (index === -1) return { previous: null, next: null };
  // siblings is newest-first, so the next issue chronologically sits before it.
  return {
    previous: siblings[index + 1] ?? null,
    next: index > 0 ? siblings[index - 1] ?? null : null,
  };
}

function placementsFor(issue: BriefIssue): Array<[BriefStory, StoryPlacement]> {
  const pairs: Array<[BriefStory, StoryPlacement]> = [];
  if (issue.type === "daily") {
    if (issue.lead) pairs.push([issue.lead.story, "lead"]);
    for (const section of issue.sections) {
      for (const story of section.items) pairs.push([story, "section"]);
    }
  } else {
    for (const pick of issue.weekly.what_mattered) {
      pairs.push([pick.story, "what_mattered"]);
    }
    for (const pick of issue.weekly.quietly_important) {
      pairs.push([pick.story, "quietly_important"]);
    }
    if (issue.weekly.thread_to_watch.story) {
      pairs.push([issue.weekly.thread_to_watch.story, "thread_to_watch"]);
    }
    for (const story of issue.weekly.deep_cuts) pairs.push([story, "deep_cut"]);
  }
  for (const story of issue.from_x) pairs.push([story, "from_x"]);
  for (const story of issue.quick_links) pairs.push([story, "quick_link"]);
  return pairs;
}

let storyCache: Map<string, StoryRecord> | null = null;

/** Every story that has appeared in a published issue, keyed by the feed's item id. */
export function getStories(): Map<string, StoryRecord> {
  if (storyCache) return storyCache;
  const records = new Map<string, StoryRecord>();
  // Oldest first, so the last write leaves the newest version of the story.
  for (const issue of [...getAllIssues()].reverse()) {
    const date = issueDate(issue.type, issue.id);
    for (const [story, placement] of placementsFor(issue)) {
      const appearance: StoryAppearance = {
        type: issue.type,
        id: issue.id,
        issueTitle: issue.title,
        date,
        placement,
        story,
      };
      const existing = records.get(story.story_id);
      if (existing) {
        existing.story = story;
        existing.appearances.push(appearance);
      } else {
        records.set(story.story_id, {
          storyId: story.story_id,
          story,
          appearances: [appearance],
        });
      }
    }
  }
  for (const record of records.values()) {
    record.appearances.sort((a, b) => b.date.getTime() - a.date.getTime());
  }
  storyCache = records;
  return records;
}

export type StoryEditorNote = {
  text: string;
  type: IssueType;
  id: string;
  issueTitle: string;
};

/** Every `Y:` note the archive has attached to one story. */
export function getEditorNotesForStory(storyId: string): StoryEditorNote[] {
  const notes: StoryEditorNote[] = [];
  for (const issue of getAllIssues()) {
    for (const note of issue.editor_notes) {
      if (note.after_story === storyId) {
        notes.push({
          text: note.text,
          type: issue.type,
          id: issue.id,
          issueTitle: issue.title,
        });
      }
    }
  }
  return notes;
}

export function getStory(storyId: string): StoryRecord | null {
  return getStories().get(storyId) ?? null;
}

/**
 * The thread a story belongs to: every distinct story sharing its cluster,
 * oldest first. Two or more entries means the story recurred.
 */
export function getClusterThread(cluster: string | null): StoryRecord[] {
  if (!cluster) return [];
  const thread = [...getStories().values()].filter(
    (record) => record.story.cluster === cluster,
  );
  thread.sort((a, b) => {
    const aOldest = a.appearances[a.appearances.length - 1].date.getTime();
    const bOldest = b.appearances[b.appearances.length - 1].date.getTime();
    return aOldest - bOldest;
  });
  return thread;
}

/** Topics across every published issue, most-covered first. */
export function getTopics(): TopicRecord[] {
  const counts = new Map<BriefTopic, number>();
  for (const record of getStories().values()) {
    for (const topic of record.story.topics) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count || a.topic.localeCompare(b.topic));
}

export function getStoriesForTopic(topic: string): StoryRecord[] {
  return [...getStories().values()]
    .filter((record) => (record.story.topics as string[]).includes(topic))
    .sort(
      (a, b) => b.appearances[0].date.getTime() - a.appearances[0].date.getTime(),
    );
}

export function getIssuesForTopic(topic: string): BriefIssue[] {
  return getAllIssues().filter((issue) =>
    allStories(issue).some((story) => (story.topics as string[]).includes(topic)),
  );
}

export function issueTopics(issue: BriefIssue): BriefTopic[] {
  const seen = new Set<BriefTopic>();
  for (const story of allStories(issue)) {
    for (const topic of story.topics) seen.add(topic);
  }
  return [...seen];
}

function issueClusters(issue: BriefIssue): Set<string> {
  const clusters = new Set<string>();
  for (const story of allStories(issue)) {
    if (story.cluster) clusters.add(story.cluster);
  }
  return clusters;
}

/**
 * Two or three issues that cover the same ground, scored by shared clusters
 * first (same story, strongest signal) and shared topics second.
 */
export function getRelatedIssues(issue: BriefIssue, limit = 3): BriefIssue[] {
  const topics = new Set<string>(issueTopics(issue));
  const clusters = issueClusters(issue);

  const scored = getAllIssues()
    .filter(
      (candidate) => !(candidate.type === issue.type && candidate.id === issue.id),
    )
    .map((candidate) => {
      let score = 0;
      for (const cluster of issueClusters(candidate)) {
        if (clusters.has(cluster)) score += 3;
      }
      for (const topic of issueTopics(candidate)) {
        if (topics.has(topic)) score += 1;
      }
      return { candidate, score };
    })
    .filter((entry) => entry.score > 0);

  scored.sort(
    (a, b) =>
      b.score - a.score ||
      issueDate(b.candidate.type, b.candidate.id).getTime() -
        issueDate(a.candidate.type, a.candidate.id).getTime(),
  );
  return scored.slice(0, limit).map((entry) => entry.candidate);
}

/**
 * The issue's number within its own cadence, counting from the oldest.
 *
 * Printed as the folio's "No. 037". Derived from the archive rather than stored
 * on the issue, the same way thread appearance counts are: the pipeline has no
 * business knowing how many times it has run, and a stored counter is a thing
 * that can disagree with the files on disk.
 *
 * A draft is not in the published list, so it reports the number it would take.
 */
export function issueOrdinal(issue: BriefIssue): number {
  const siblings = getIssuesOfType(issue.type);
  const index = siblings.findIndex((candidate) => candidate.id === issue.id);
  // siblings is newest-first, so the oldest is number one.
  return index === -1 ? siblings.length + 1 : siblings.length - index;
}

/** Issues that carry a `noindex` robots directive. Weeklies are always indexed. */
export function isIndexed(issue: BriefIssue): boolean {
  return issue.type === "weekly" ? true : issue.index;
}

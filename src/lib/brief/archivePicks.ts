// src/lib/brief/archivePicks.ts
//
// "Best of the archive" for the day-3 welcome email. Plan 04 §4 calls for five
// evergreen items refreshed monthly; we send three, because three good links
// get clicked and five get skimmed.
//
// The selection is a pure function of the issues it is handed, so refreshing it
// monthly means running it again over a longer archive, not editing a list by
// hand. Nothing here reads the filesystem or the clock.
//
// What counts as "best", in the order the scoring applies it:
//   1. Yadnesh attached a `Y:` note to the story. That is the only signal in
//      the whole archive that a human stopped and said something.
//   2. The story's cluster came back across multiple issues. A thread that
//      recurred is a thread that mattered.
//   3. It held a position that had to be argued for: a daily's lead or a
//      weekly's "what mattered" pick.
// Ties break newest first, and no two picks come from the same cluster.

import type { BriefIssue, BriefStory } from "./schema";
import { issueDate } from "./dates";

export type ArchivePick = {
  story: BriefStory;
  type: "daily" | "weekly";
  issueId: string;
  issueTitle: string;
  /** The `Y:` note when there is one; it makes the best possible blurb. */
  editorNote: string | null;
  /** Plain-language account of why this one made the cut. */
  reason: string;
};

type Candidate = ArchivePick & { score: number; date: number; cluster: string | null };

/** Stories that had to earn their slot, as opposed to filling a quick-links list. */
function arguedStories(issue: BriefIssue): BriefStory[] {
  if (issue.type === "daily") return issue.lead ? [issue.lead.story] : [];
  return issue.weekly.what_mattered.map((pick) => pick.story);
}

function allBodyStories(issue: BriefIssue): BriefStory[] {
  if (issue.type === "daily") {
    const stories = issue.lead ? [issue.lead.story] : [];
    for (const section of issue.sections) stories.push(...section.items);
    return stories;
  }
  const weekly = issue.weekly;
  const stories = [
    ...weekly.what_mattered.map((pick) => pick.story),
    ...weekly.quietly_important.map((pick) => pick.story),
  ];
  if (weekly.thread_to_watch.story) stories.push(weekly.thread_to_watch.story);
  return stories;
}

/**
 * The three archive items the welcome sequence links. Pure: hand it
 * getAllIssues() at the call site and it will never surprise you.
 */
export function pickArchiveHighlights(issues: BriefIssue[], limit = 3): ArchivePick[] {
  // How many distinct issues each cluster appeared in. A cluster that ran twice
  // is a story that developed.
  const clusterIssues = new Map<string, Set<string>>();
  for (const issue of issues) {
    for (const story of allBodyStories(issue)) {
      if (!story.cluster) continue;
      const seen = clusterIssues.get(story.cluster) ?? new Set<string>();
      seen.add(`${issue.type}/${issue.id}`);
      clusterIssues.set(story.cluster, seen);
    }
  }

  const candidates = new Map<string, Candidate>();

  for (const issue of issues) {
    if (issue.status !== "published") continue;
    const date = issueDate(issue.type, issue.id).getTime();
    const argued = new Set(arguedStories(issue).map((story) => story.story_id));
    const notes = new Map<string, string>();
    for (const note of issue.editor_notes) {
      if (note.after_story) notes.set(note.after_story, note.text);
    }

    for (const story of allBodyStories(issue)) {
      const recurrence = story.cluster ? (clusterIssues.get(story.cluster)?.size ?? 1) : 1;
      const editorNote = notes.get(story.story_id) ?? null;

      let score = 0;
      const reasons: string[] = [];
      if (editorNote) {
        score += 4;
        reasons.push("it earned a note");
      }
      if (recurrence > 1) {
        score += 2 * (recurrence - 1);
        reasons.push(`it came back across ${recurrence} issues`);
      }
      if (argued.has(story.story_id)) {
        score += 1;
        reasons.push(issue.type === "daily" ? "it led an issue" : "it was a weekly pick");
      }
      if (score === 0) continue;

      const existing = candidates.get(story.story_id);
      if (existing && (existing.score > score || existing.date >= date)) continue;
      candidates.set(story.story_id, {
        story,
        type: issue.type,
        issueId: issue.id,
        issueTitle: issue.title,
        editorNote,
        reason: reasons.join(", and "),
        score,
        date,
        cluster: story.cluster,
      });
    }
  }

  const ranked = [...candidates.values()].sort(
    (a, b) => b.score - a.score || b.date - a.date || a.story.title.localeCompare(b.story.title),
  );

  const picked: ArchivePick[] = [];
  const usedClusters = new Set<string>();
  for (const candidate of ranked) {
    if (candidate.cluster && usedClusters.has(candidate.cluster)) continue;
    if (candidate.cluster) usedClusters.add(candidate.cluster);
    picked.push({
      story: candidate.story,
      type: candidate.type,
      issueId: candidate.issueId,
      issueTitle: candidate.issueTitle,
      editorNote: candidate.editorNote,
      reason: candidate.reason,
    });
    if (picked.length >= limit) break;
  }
  return picked;
}

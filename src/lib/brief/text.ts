// src/lib/brief/text.ts
//
// Walks an issue's prose: read time, word count, and the surface the
// house-style scan checks.
//
// scripts/validate-brief.mjs loads this file directly through node's type
// stripping, which does not resolve extensionless specifiers. Every import here
// must therefore stay type-only, so node erases it before resolution happens.

import type { BriefIssue, BriefStory } from "./schema";

/** Matches src/lib/posts.ts so a brief minute means the same as a post minute. */
const WORDS_PER_MINUTE = 200;

export type ProseField = { path: string; text: string };

/** Every story an issue puts on the page, in reading order. */
export function allStories(issue: BriefIssue): BriefStory[] {
  const stories: BriefStory[] = [];
  if (issue.type === "daily") {
    if (issue.lead) stories.push(issue.lead.story);
    for (const section of issue.sections) stories.push(...section.items);
  } else {
    for (const pick of issue.weekly.what_mattered) stories.push(pick.story);
    for (const pick of issue.weekly.quietly_important) stories.push(pick.story);
    if (issue.weekly.thread_to_watch.story) {
      stories.push(issue.weekly.thread_to_watch.story);
    }
    stories.push(...issue.weekly.deep_cuts);
  }
  stories.push(...issue.from_x);
  stories.push(...issue.quick_links);
  return stories;
}

/**
 * Prose the pipeline wrote, as opposed to text quoted from a source. Story
 * titles are deliberately excluded: the link-text convention keeps them verbatim,
 * so a house-style glyph scan must not police them.
 */
export function authoredProse(issue: BriefIssue): ProseField[] {
  const fields: ProseField[] = [
    { path: "subject", text: issue.subject },
    { path: "preheader", text: issue.preheader },
    { path: "title", text: issue.title },
  ];

  const pushStorySummaries = (stories: BriefStory[], prefix: string) => {
    stories.forEach((story, i) => {
      fields.push({ path: `${prefix}[${i}].summary`, text: story.summary });
    });
  };

  if (issue.type === "daily") {
    if (issue.lead) {
      fields.push({ path: "lead.what", text: issue.lead.what });
      fields.push({ path: "lead.details", text: issue.lead.details });
      if (issue.lead.yes_but) {
        fields.push({ path: "lead.yes_but", text: issue.lead.yes_but });
      }
      if (issue.lead.yes_but_waived) {
        fields.push({
          path: "lead.yes_but_waived",
          text: issue.lead.yes_but_waived,
        });
      }
      fields.push({ path: "lead.why", text: issue.lead.why });
      fields.push({ path: "lead.story.summary", text: issue.lead.story.summary });
    }
    issue.sections.forEach((section) => {
      pushStorySummaries(section.items, `sections.${section.key}.items`);
    });
  } else {
    const weekly = issue.weekly;
    weekly.week_in_five.forEach((line, i) => {
      fields.push({ path: `weekly.week_in_five[${i}]`, text: line });
    });
    fields.push({
      path: "weekly.through_line.title",
      text: weekly.through_line.title,
    });
    fields.push({
      path: "weekly.through_line.body_md",
      text: weekly.through_line.body_md,
    });
    weekly.what_mattered.forEach((pick, i) => {
      fields.push({ path: `weekly.what_mattered[${i}].what`, text: pick.what });
      fields.push({
        path: `weekly.what_mattered[${i}].yes_but`,
        text: pick.yes_but,
      });
      fields.push({ path: `weekly.what_mattered[${i}].why`, text: pick.why });
      fields.push({
        path: `weekly.what_mattered[${i}].story.summary`,
        text: pick.story.summary,
      });
    });
    weekly.quietly_important.forEach((pick, i) => {
      fields.push({ path: `weekly.quietly_important[${i}].note`, text: pick.note });
      fields.push({
        path: `weekly.quietly_important[${i}].story.summary`,
        text: pick.story.summary,
      });
    });
    fields.push({
      path: "weekly.thread_to_watch.title",
      text: weekly.thread_to_watch.title,
    });
    fields.push({
      path: "weekly.thread_to_watch.body",
      text: weekly.thread_to_watch.body,
    });
    if (weekly.thread_to_watch.story) {
      fields.push({
        path: "weekly.thread_to_watch.story.summary",
        text: weekly.thread_to_watch.story.summary,
      });
    }
    weekly.thread_to_watch.prior_threads_paid_off.forEach((thread, i) => {
      fields.push({
        path: `weekly.thread_to_watch.prior_threads_paid_off[${i}].title`,
        text: thread.title,
      });
      fields.push({
        path: `weekly.thread_to_watch.prior_threads_paid_off[${i}].body`,
        text: thread.body,
      });
    });
    pushStorySummaries(weekly.deep_cuts, "weekly.deep_cuts");
  }

  pushStorySummaries(issue.from_x, "from_x");
  pushStorySummaries(issue.quick_links, "quick_links");

  issue.editor_notes.forEach((note, i) => {
    fields.push({ path: `editor_notes[${i}].text`, text: note.text });
  });
  issue.corrections.forEach((correction, i) => {
    fields.push({ path: `corrections[${i}].we_said`, text: correction.we_said });
    fields.push({
      path: `corrections[${i}].whats_true`,
      text: correction.whats_true,
    });
  });

  return fields;
}

/**
 * Every field the house-style scan checks: the authored prose above plus the
 * humor blocks.
 *
 * The humor fields are scanned but deliberately NOT counted, which is why they
 * live here rather than in authoredProse(). A caption, an alt text and a
 * premise are not reading time: alt text is not read by sighted readers, the
 * premise never renders at all, and the feed repo's validator counts none of
 * them either. Counting them here would put roughly a hundred words into
 * read_minutes that the pipeline does not know about, and the two repos would
 * disagree about the same issue's read time on better than half of all issues.
 *
 * hedge.quote is absent from both walks: it is verbatim source text, and a
 * house-style scan has no business policing what somebody else wrote. The
 * validator scans it for leftover placeholders separately.
 */
export function houseStyleProse(issue: BriefIssue): ProseField[] {
  const fields = authoredProse(issue);

  if (issue.type === "daily") {
    if (issue.hedge) {
      fields.push({ path: "hedge.note", text: issue.hedge.note });
      fields.push({
        path: "hedge.story.summary",
        text: issue.hedge.story.summary,
      });
    }
  } else if (issue.weekly.comic) {
    const comic = issue.weekly.comic;
    fields.push({ path: "weekly.comic.alt", text: comic.alt });
    fields.push({ path: "weekly.comic.caption", text: comic.caption });
    if (comic.alt_joke) {
      fields.push({ path: "weekly.comic.alt_joke", text: comic.alt_joke });
    }
  }

  if (issue.meme) {
    fields.push({ path: "meme.alt", text: issue.meme.alt });
    fields.push({ path: "meme.caption", text: issue.meme.caption });
    fields.push({ path: "meme.concept", text: issue.meme.concept });
    if (issue.meme.alt_joke) {
      fields.push({ path: "meme.alt_joke", text: issue.meme.alt_joke });
    }
  }

  return fields;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

/** Words a reader actually sees: the authored prose plus every linked headline. */
export function issueWordCount(issue: BriefIssue): number {
  const prose = authoredProse(issue).reduce(
    (sum, field) => sum + countWords(field.text),
    0,
  );
  const headlines = allStories(issue).reduce(
    (sum, story) => sum + countWords(story.title),
    0,
  );
  return prose + headlines;
}

/** Never trust the file's read_minutes; recompute and compare. */
export function computeReadMinutes(issue: BriefIssue): number {
  return Math.max(1, Math.ceil(issueWordCount(issue) / WORDS_PER_MINUTE));
}

/** Plain text for the search index and for feed descriptions. */
export function issuePlainText(issue: BriefIssue): string {
  const parts = authoredProse(issue).map((field) => field.text);
  for (const story of allStories(issue)) parts.push(story.title);
  return parts.join(" ").replace(/\s+/g, " ").trim();
}


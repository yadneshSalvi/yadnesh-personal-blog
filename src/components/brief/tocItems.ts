// src/components/brief/tocItems.ts
//
// The rail's entries, derived from the issue rather than scraped from the DOM.
// An issue's structure lives in its JSON, not in a heading hierarchy, so the
// blog's heading-collecting TOC has nothing to collect here.
import type { BriefIssue } from "@/lib/brief/schema";
import { sectionLabel } from "@/lib/brief/schema";
import { storyAnchor } from "./StoryRow";

/** Level 2 is a block of the issue; level 3 is a story inside one. */
export type IssueTocItem = { id: string; text: string; level: number };

export function issueTocItems(issue: BriefIssue): IssueTocItem[] {
  const items: IssueTocItem[] =
    issue.type === "daily" ? dailyItems(issue) : weeklyItems(issue);

  if (issue.from_x.length > 0) {
    items.push({ id: "from-x", text: "From X", level: 2 });
  }
  if (issue.quick_links.length > 0) {
    items.push({ id: "quick-links", text: "Quick links", level: 2 });
  }
  items.push({ id: "corrections", text: "Corrections", level: 2 });

  // Anything the issue skipped renders nothing, so it must not get a link.
  return items.filter((item) => item.text.trim().length > 0);
}

function dailyItems(issue: BriefIssue): IssueTocItem[] {
  const items: IssueTocItem[] = [];

  if (issue.lead) {
    items.push({
      id: storyAnchor(issue.lead.story),
      text: issue.lead.story.title,
      level: 2,
    });
  } else {
    items.push({ id: "quiet-day", text: "Quiet day", level: 2 });
  }

  for (const section of issue.sections) {
    items.push({
      id: `section-${section.key}`,
      text: sectionLabel(section.key),
      level: 2,
    });
    for (const story of section.items) {
      items.push({ id: storyAnchor(story), text: story.title, level: 3 });
    }
  }

  return items;
}

function weeklyItems(issue: BriefIssue): IssueTocItem[] {
  const { weekly } = issue;
  if (!weekly) return [];

  const items: IssueTocItem[] = [
    { id: "week-in-five", text: "The week in five", level: 2 },
    { id: "through-line", text: weekly.through_line.title, level: 2 },
    { id: "what-mattered", text: "What mattered", level: 2 },
  ];

  for (const pick of weekly.what_mattered) {
    items.push({
      id: storyAnchor(pick.story),
      text: pick.story.title,
      level: 3,
    });
  }

  if (weekly.quietly_important.length > 0) {
    items.push({
      id: "quietly-important",
      text: "Quietly important",
      level: 2,
    });
  }
  items.push({ id: "thread-to-watch", text: "Thread to watch", level: 2 });
  if (weekly.deep_cuts.length > 0) {
    items.push({ id: "deep-cuts", text: "Deep cuts", level: 2 });
  }

  return items;
}

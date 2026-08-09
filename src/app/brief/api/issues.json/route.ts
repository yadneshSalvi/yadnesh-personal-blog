// src/app/brief/api/issues.json/route.ts
// Machine-readable index of the archive. AI answer engines are a real referral
// channel for this content, and giving them one clean document beats making
// them parse the archive page.
import { getAllIssues } from "@/lib/brief/issues";
import { allStories } from "@/lib/brief/text";
import { issueDate } from "@/lib/brief/dates";
import { BRIEF_NAME, BRIEF_TAGLINE, issueHref } from "@/lib/brief/seo";
import { absoluteUrl } from "@/lib/seo";
import { BRIEF_SCHEMA_VERSION } from "@/lib/brief/schema";

export const dynamic = "force-static";

export function GET() {
  const issues = getAllIssues().map((issue) => ({
    type: issue.type,
    id: issue.id,
    issue_number: issue.issue_number,
    url: absoluteUrl(issueHref(issue)),
    title: issue.title,
    subject: issue.subject,
    preheader: issue.preheader,
    published_at: issueDate(issue.type, issue.id).toISOString(),
    generated_at: issue.generated_at,
    read_minutes: issue.read_minutes,
    thin_day: issue.thin_day,
    index: issue.index,
    story_count: allStories(issue).length,
    topics: [...new Set(allStories(issue).flatMap((story) => story.topics))],
  }));

  return Response.json(
    {
      name: BRIEF_NAME,
      description: BRIEF_TAGLINE,
      site: absoluteUrl("/brief"),
      schema_version: BRIEF_SCHEMA_VERSION,
      feeds: {
        all: absoluteUrl("/brief/feed.xml"),
        daily: absoluteUrl("/brief/daily/feed.xml"),
        weekly: absoluteUrl("/brief/weekly/feed.xml"),
      },
      count: issues.length,
      issues,
    },
    { headers: { "Cache-Control": "public, max-age=3600" } },
  );
}

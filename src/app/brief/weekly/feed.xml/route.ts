// src/app/brief/weekly/feed.xml/route.ts
import { getIssuesOfType } from "@/lib/brief/issues";
import { issueFeedItem, renderRssFeed, rssResponse } from "@/lib/brief/feed";
import { BRIEF_NAME } from "@/lib/brief/seo";

export const dynamic = "force-static";

export function GET() {
  return rssResponse(
    renderRssFeed({
      title: `${BRIEF_NAME}, weekly`,
      description:
        "The Sunday edition of The Agentic Brief: five lines, one argued through-line, and the week's quiet finds.",
      selfPath: "/brief/weekly/feed.xml",
      items: getIssuesOfType("weekly").map(issueFeedItem),
    }),
  );
}

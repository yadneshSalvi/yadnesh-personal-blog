// src/app/brief/daily/feed.xml/route.ts
import { getIssuesOfType } from "@/lib/brief/issues";
import { issueFeedItem, renderRssFeed, rssResponse } from "@/lib/brief/feed";
import { BRIEF_NAME } from "@/lib/brief/seo";

export const dynamic = "force-static";

export function GET() {
  return rssResponse(
    renderRssFeed({
      title: `${BRIEF_NAME}, daily`,
      description:
        "The weekday edition of The Agentic Brief: one lead story, six to nine items, and the quick links.",
      selfPath: "/brief/daily/feed.xml",
      items: getIssuesOfType("daily").map(issueFeedItem),
    }),
  );
}

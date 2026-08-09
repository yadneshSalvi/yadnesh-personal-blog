// src/app/newsletter/feed.xml/route.ts
import { getAllIssues } from "@/lib/brief/issues";
import { issueFeedItem, renderRssFeed, rssResponse } from "@/lib/brief/feed";
import { BRIEF_NAME, BRIEF_TAGLINE } from "@/lib/brief/seo";

export const dynamic = "force-static";

export function GET() {
  return rssResponse(
    renderRssFeed({
      title: `${BRIEF_NAME}, daily and weekly`,
      description: BRIEF_TAGLINE,
      selfPath: "/newsletter/feed.xml",
      items: getAllIssues().map(issueFeedItem),
    }),
  );
}

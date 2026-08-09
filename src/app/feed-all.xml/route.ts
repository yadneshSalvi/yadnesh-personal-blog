// src/app/feed-all.xml/route.ts
// Everything on the site in one feed: hand-written posts and brief issues.
// /feed.xml keeps meaning "posts only" so long-time subscribers see no change.
import { getAllPostsMeta } from "@/lib/posts";
import { getAllIssues } from "@/lib/brief/issues";
import {
  issueFeedItem,
  renderRssFeed,
  rssResponse,
  type FeedItem,
} from "@/lib/brief/feed";
import { SITE_NAME, absoluteUrl } from "@/lib/seo";

export const dynamic = "force-static";

export function GET() {
  const postItems: FeedItem[] = getAllPostsMeta().map((post) => ({
    title: post.title,
    url: absoluteUrl(`/blog/${post.slug}`),
    date: new Date(post.createdAt),
    description: post.description ?? post.subtitle ?? "",
    categories: post.tags ?? [],
  }));

  const items = [...postItems, ...getAllIssues().map(issueFeedItem)].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );

  return rssResponse(
    renderRssFeed({
      title: `${SITE_NAME}, everything`,
      description:
        "Every post and every issue of The Agentic Brief, in one feed.",
      selfPath: "/feed-all.xml",
      items,
    }),
  );
}

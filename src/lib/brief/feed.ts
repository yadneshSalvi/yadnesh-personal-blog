// src/lib/brief/feed.ts
// Hand-written RSS 2.0, the same shape as src/app/feed.xml/route.ts. No feed
// library: the existing feed is byte-stable and this one has to match its idiom.

import type { BriefIssue } from "./schema";
import { issueDate } from "./dates";
import { issueToHtml } from "./render";
import { issueHref } from "./seo";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

export function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!,
  );
}

export type FeedItem = {
  title: string;
  url: string;
  date: Date;
  description: string;
  categories?: string[];
  /** Full HTML body, emitted as content:encoded. */
  content?: string;
};

export function issueFeedItem(issue: BriefIssue): FeedItem {
  const url = absoluteUrl(issueHref(issue));
  return {
    title: issue.subject,
    url,
    // generated_at is when the issue actually shipped; the id is only its key.
    date: new Date(issue.generated_at || issueDate(issue.type, issue.id)),
    description: issue.preheader,
    categories: [issue.type],
    content: issueToHtml(issue, url),
  };
}

function renderItem(item: FeedItem): string {
  return `
    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${item.url}</link>
      <guid isPermaLink="true">${item.url}</guid>
      <pubDate>${item.date.toUTCString()}</pubDate>
      ${item.description ? `<description>${escapeXml(item.description)}</description>` : ""}
      ${item.content ? `<content:encoded>${escapeXml(item.content)}</content:encoded>` : ""}
      ${(item.categories ?? []).map((c) => `<category>${escapeXml(c)}</category>`).join("")}
    </item>`;
}

export function renderRssFeed({
  title,
  description,
  selfPath,
  items,
}: {
  title: string;
  description: string;
  selfPath: string;
  items: FeedItem[];
}): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(description)}</description>
    <language>en</language>
    <atom:link href="${absoluteUrl(selfPath)}" rel="self" type="application/rss+xml" />${items
      .map(renderItem)
      .join("")}
  </channel>
</rss>`;

  return xml;
}

export function rssResponse(xml: string): Response {
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}

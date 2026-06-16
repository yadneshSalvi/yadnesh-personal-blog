// src/app/feed.xml/route.ts
import { getAllPostsMeta } from "@/lib/posts";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, absoluteUrl } from "@/lib/seo";

export const dynamic = "force-static";

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!,
  );
}

export function GET() {
  const posts = getAllPostsMeta(); // already sorted newest-first
  const items = posts
    .map((p) => {
      const url = absoluteUrl(`/blog/${p.slug}`);
      const desc = p.description ?? p.subtitle ?? "";
      return `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(p.createdAt).toUTCString()}</pubDate>
      ${desc ? `<description>${escapeXml(desc)}</description>` : ""}
      ${(p.tags ?? []).map((t) => `<category>${escapeXml(t)}</category>`).join("")}
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(SITE_NAME)}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>en</language>
    <atom:link href="${absoluteUrl("/feed.xml")}" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}

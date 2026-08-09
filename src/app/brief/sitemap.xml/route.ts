// src/app/brief/sitemap.xml/route.ts
// A sitemap of its own, so Search Console reports brief indexation separately
// from the blog's. That separation is the early-warning system: if brief pages
// start piling up as "crawled, not indexed", the gate tightens before the
// hand-written posts feel it. /sitemap.xml is untouched.
import { getAllIssues, getTopics, isIndexed } from "@/lib/brief/issues";
import { issueDate } from "@/lib/brief/dates";
import { escapeXml } from "@/lib/brief/feed";
import { issueHref } from "@/lib/brief/seo";
import { isCuratedTopic } from "@/lib/brief/topics";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-static";

type Entry = { loc: string; lastmod: Date; changefreq: string; priority: string };

export function GET() {
  const issues = getAllIssues();
  const newest = issues[0];
  const hubLastMod = newest
    ? new Date(newest.generated_at)
    : new Date();

  const entries: Entry[] = [
    { loc: absoluteUrl("/brief"), lastmod: hubLastMod, changefreq: "daily", priority: "0.9" },
    { loc: absoluteUrl("/brief/archive"), lastmod: hubLastMod, changefreq: "daily", priority: "0.7" },
    { loc: absoluteUrl("/brief/how-it-works"), lastmod: hubLastMod, changefreq: "monthly", priority: "0.6" },
  ];

  for (const issue of issues) {
    if (!isIndexed(issue)) continue;
    entries.push({
      loc: absoluteUrl(issueHref(issue)),
      lastmod: new Date(issue.generated_at || issueDate(issue.type, issue.id)),
      changefreq: "monthly",
      priority: issue.type === "weekly" ? "0.8" : "0.6",
    });
  }

  for (const entry of getTopics()) {
    if (!isCuratedTopic(entry.topic)) continue;
    entries.push({
      loc: absoluteUrl(`/brief/topics/${entry.topic}`),
      lastmod: hubLastMod,
      changefreq: "weekly",
      priority: "0.5",
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${escapeXml(entry.loc)}</loc>
    <lastmod>${entry.lastmod.toISOString()}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}

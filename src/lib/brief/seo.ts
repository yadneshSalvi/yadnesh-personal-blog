// src/lib/brief/seo.ts
// Metadata and structured data for brief pages, joined to the site-wide
// @id graph declared in src/app/layout.tsx.

import type { Metadata } from "next";
import type { BriefIssue } from "./schema";
import { issueDate, issueDateLabel } from "./dates";
import { isIndexed } from "./issues";
import { issuePlainText } from "./text";
import { SITE_URL, absoluteUrl, ogImageFor } from "@/lib/seo";

export const BRIEF_NAME = "The Agentic Brief";
export const BRIEF_TAGLINE =
  "A weekday brief on agentic AI, curated by an agent pipeline and reviewed before it ships.";

export function issueHref(issue: Pick<BriefIssue, "type" | "id">): string {
  return `/newsletter/${issue.type}/${issue.id}`;
}

/** The `<title>` pattern from plan 03 §3: topics first, cadence and date after. */
export function issuePageTitle(issue: BriefIssue): string {
  const cadence = issue.type === "weekly" ? "The Agentic Brief, weekly" : "The Agentic Brief";
  return `${issue.title} · ${cadence}, ${issueDateLabel(issue.type, issue.id)}`;
}

export function issueMetadata(issue: BriefIssue): Metadata {
  const href = issueHref(issue);
  const description = issue.preheader;
  const indexed = isIndexed(issue) && issue.status === "published";

  return {
    title: issuePageTitle(issue),
    description,
    alternates: { canonical: href },
    // `follow` keeps link equity moving to the archive and the blog even when a
    // thin daily is held out of the index.
    robots: indexed ? undefined : { index: false, follow: true },
    openGraph: {
      type: "article",
      title: issue.title,
      description,
      url: href,
      publishedTime: issue.generated_at,
      authors: [`${SITE_URL}/about`],
    },
    twitter: {
      card: "summary_large_image",
      title: issue.title,
      description,
    },
  };
}

export function issueJsonLd(issue: BriefIssue) {
  const url = absoluteUrl(issueHref(issue));
  const published = issueDate(issue.type, issue.id).toISOString();
  const plain = issuePlainText(issue);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: issue.title,
    description: issue.preheader,
    image: absoluteUrl(ogImageFor(undefined)),
    datePublished: published,
    dateModified: issue.generated_at,
    author: { "@id": `${SITE_URL}/#person` },
    publisher: { "@id": `${SITE_URL}/#person` },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    isPartOf: {
      "@type": "Periodical",
      "@id": `${SITE_URL}/newsletter#periodical`,
      name: BRIEF_NAME,
      url: absoluteUrl("/newsletter"),
    },
    url,
    wordCount: plain.split(/\s+/).filter(Boolean).length,
    timeRequired: `PT${issue.read_minutes}M`,
  };
}

export function breadcrumbJsonLd(
  trail: Array<{ name: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function itemListJsonLd(issues: BriefIssue[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${absoluteUrl("/newsletter/archive")}#itemlist`,
    name: `${BRIEF_NAME} archive`,
    itemListElement: issues.map((issue, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: absoluteUrl(issueHref(issue)),
      name: issue.title,
    })),
  };
}

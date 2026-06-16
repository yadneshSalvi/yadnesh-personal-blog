// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { getAllPostsMeta } from "@/lib/posts";
import { getAllSeriesMeta } from "@/lib/series";
import { absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const allPosts = getAllPostsMeta(); // newest-first
  // Derive a stable lastmod for the content hubs from the newest post, so `/` and `/blog` don't
  // churn their lastmod on every rebuild (which trains crawlers to ignore the signal).
  const newestPost = allPosts[0]?.updatedAt;
  const contentLastMod = newestPost ? new Date(newestPost) : new Date();
  const staticLastMod = new Date(); // fine for rarely-changing pages

  // Static, indexable routes. (/search is intentionally excluded — it is noindex; see Phase 3.)
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: contentLastMod, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/blog"), lastModified: contentLastMod, changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/about"), lastModified: staticLastMod, changeFrequency: "monthly", priority: 0.7 },
    { url: absoluteUrl("/contact"), lastModified: staticLastMod, changeFrequency: "yearly", priority: 0.5 },
  ];

  // Every post (standalone + series parts + kind:reference) lives at /blog/<slug> and is indexable.
  const postRoutes: MetadataRoute.Sitemap = allPosts.map((post) => ({
    url: absoluteUrl(`/blog/${post.slug}`),
    lastModified: new Date(post.updatedAt),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // Series landing pages.
  const seriesRoutes: MetadataRoute.Sitemap = getAllSeriesMeta().map((series) => ({
    url: absoluteUrl(`/series/${series.slug}`),
    lastModified: new Date(series.updatedAt),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...postRoutes, ...seriesRoutes];
}

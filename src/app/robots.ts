// src/app/robots.ts
import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Only /api/ is blocked. /search is deliberately NOT disallowed so Googlebot
      // can crawl it and read its `noindex` meta tag (added in Phase 3).
      disallow: ["/api/"],
    },
    // Two sitemaps, deliberately: Search Console then reports brief indexation
    // separately from the blog's, which is the early warning if generated pages
    // ever start dragging the hand-written posts.
    sitemap: [absoluteUrl("/sitemap.xml"), absoluteUrl("/newsletter/sitemap.xml")],
  };
}

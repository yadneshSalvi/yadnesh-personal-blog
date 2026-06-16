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
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}

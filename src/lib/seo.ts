// src/lib/seo.ts
// Single source of truth for site-wide SEO constants and helpers.
export const SITE_URL = "https://yadneshsalvi.com";
export const SITE_NAME = "Yadnesh Salvi";
export const SITE_TITLE_DEFAULT = "Yadnesh Salvi · Notes on AI Engineering";
export const SITE_DESCRIPTION =
  "Essays and field notes on AI engineering: agents, RAG, fine-tuning, and what actually survives production.";
export const TWITTER_HANDLE = "@yadnesh_sa88965";

export const AUTHOR = {
  name: "Yadnesh Salvi",
  jobTitle: "AI/ML Engineer",
  url: `${SITE_URL}/about`,
  email: "yadneshujwal@gmail.com",
  sameAs: [
    "https://github.com/yadneshSalvi",
    "https://www.linkedin.com/in/yadnesh-salvi-bb5151ba",
    "https://x.com/yadnesh_sa88965",
  ],
} as const;

/** Absolute URL helper — joins a site-relative path onto SITE_URL. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

/** Default social share image (1200×630 PNG). Created in Phase 2. */
export const DEFAULT_OG_IMAGE = "/og-default.png";

/** Returns an OG-safe image URL: the cover if it's a raster (png/jpg/webp), else the default. */
export function ogImageFor(cover?: string): string {
  if (cover && /\.(png|jpe?g|webp)$/i.test(cover)) return cover;
  return DEFAULT_OG_IMAGE;
}

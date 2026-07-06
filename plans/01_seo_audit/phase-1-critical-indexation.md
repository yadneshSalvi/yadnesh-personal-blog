# Phase 1 — Critical Indexation & Per-Page Metadata

> **Goal:** Make every page individually discoverable and uniquely described. This phase fixes the
> highest-impact issues with four small, additive changes. Ship and deploy this before anything else.
>
> **Covers issues:** #7 (per-post metadata), #1 (sitemap), #2 (robots), #3 (`metadataBase`),
> #4 partial (per-post canonical).
>
> **Risk:** Low — all changes are additive (new files + new `generateMetadata`); no existing
> rendering logic changes.
>
> **Branch:** `seo/phase-1-indexation`

---

## Why this phase matters most

Right now **every blog post renders the identical `<title>` and `<meta name="description">`** (the
root-layout default), because `src/app/blog/[slug]/page.tsx` has no `generateMetadata`. Google has
nothing unique to rank or display for any individual article — the single biggest SEO problem on
the site. On top of that, there is no sitemap and no robots.txt, so discovery relies entirely on
internal links. These four changes remove those blockers.

---

## Task 1.1 — Create the central SEO config module

**File (new):** `src/lib/seo.ts`

This is the single source of truth used by every later phase. Create it exactly as specified in
`README.md` → **Shared conventions → Central SEO config module**. Reproduced here for convenience:

```ts
// src/lib/seo.ts
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

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

export const DEFAULT_OG_IMAGE = "/og-default.png";
```

> If the production domain is ever not `yadneshsalvi.com`, change `SITE_URL` here only.

---

## Task 1.2 — Add a lightweight, MDX-free post-meta reader

**File (edit):** `src/lib/posts.ts`

**Why:** `generateMetadata` needs only the frontmatter, but the existing `getPostBySlug()` runs the
full `compileMDX()` pipeline. Calling it from both `generateMetadata` and the page component would
compile each post's MDX **twice** per request. Add a cheap frontmatter-only reader.

Add this function (next to `getPostBySlug`, reusing the existing `matter` import and `POSTS_DIR`):

```ts
/**
 * Frontmatter-only reader for a single post. Does NOT compile MDX — use this in
 * generateMetadata so the page render isn't forced to compile the post twice.
 */
export function getPostMetaBySlug(slug: string): PostMeta | null {
  ensurePostsDir();
  const mdxPath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(mdxPath)) return null;
  const { data, content } = matter(fs.readFileSync(mdxPath, "utf8"));
  const title = String(data.title || slug);
  const subtitle = data.subtitle ? String(data.subtitle) : undefined;
  const image = data.image ? String(data.image) : undefined;
  const imageDark = data.imageDark ? String(data.imageDark) : undefined;
  const createdAt = String(data.createdAt || new Date().toISOString());
  const updatedAt = String(data.updatedAt || createdAt);
  const tags = Array.isArray(data.tags)
    ? data.tags.map((t: unknown) => String(t)).filter(Boolean)
    : undefined;
  const readingTime = data.readingTime
    ? Number(data.readingTime)
    : Math.max(1, Math.ceil(content.split(/\s+/).filter(Boolean).length / 200));
  const series = data.series ? String(data.series) : undefined;
  const seriesPart = data.seriesPart ? Number(data.seriesPart) : undefined;
  const kind = data.kind ? String(data.kind) : undefined;
  return { slug, title, subtitle, image, imageDark, createdAt, updatedAt, tags, readingTime, series, seriesPart, kind };
}
```

> This mirrors the per-field parsing already in `getAllPostsMeta()`. If you prefer DRY over the
> small duplication, factor the field-parsing into a shared `parsePostMeta(slug, data, content)`
> helper and call it from `getAllPostsMeta`, `getPostBySlug`, and `getPostMetaBySlug`. Either is
> acceptable; the duplication above is intentionally low-risk.

---

## Task 1.3 — Add `generateMetadata` to the post route (issue #7 + #4-posts)

**File (edit):** `src/app/blog/[slug]/page.tsx`

Add the import and the `generateMetadata` export. **Keep the existing default component unchanged.**

At the top, add:

```tsx
import type { Metadata } from "next";
import { getAllPostSlugs, getPostBySlug, getPostMetaBySlug } from "@/lib/posts";
import { SITE_DESCRIPTION } from "@/lib/seo";
```

(Merge the `getPostMetaBySlug` import into the existing `@/lib/posts` import line; don't duplicate it.)

Then add this export (place it above the default `BlogPost` component):

```tsx
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = getPostMetaBySlug(slug);
  if (!meta) return {};

  // Description precedence: explicit subtitle → site default.
  // (Phase 3 adds an explicit `description` frontmatter field and inserts it ahead of subtitle.)
  const description = meta.subtitle ?? SITE_DESCRIPTION;

  return {
    title: meta.title, // root template appends " · Yadnesh Salvi"
    description,
    keywords: meta.tags,
    alternates: { canonical: `/blog/${slug}` },
    // openGraph / twitter are added in Phase 2.
  };
}
```

**Notes**
- `title` is a plain string; the root `metadata.title.template` (`"%s · Yadnesh Salvi"`) wraps it
  automatically. Do **not** repeat the brand here.
- `alternates.canonical` is a site-relative path; it resolves to an absolute URL because Phase 1
  sets `metadataBase` (Task 1.5). Verify the resolved canonical in the build output.
- Returning `{}` for a missing post is correct — the page component already calls `notFound()`.

---

## Task 1.4 — Create the XML sitemap (issue #1)

**File (new):** `src/app/sitemap.ts`

Next.js 16 turns a default export returning `MetadataRoute.Sitemap` into `/sitemap.xml` at build
time. Drive it from the existing data helpers.

```ts
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
```

**Notes**
- Uses `getAllPostsMeta()` (all posts, including series parts and `kind:reference`) so nothing is
  orphaned from a crawl standpoint. This also makes the reference-page fix in Phase 4 a
  link-discovery improvement rather than an indexation fix.
- `new Date(post.updatedAt)` — `updatedAt` is an ISO string; valid.
- The sitemap is statically generated at build (the data comes from the filesystem). No runtime
  cost.

---

## Task 1.5 — Create robots.txt and set `metadataBase` (issues #2, #3)

### 1.5a — robots route

**File (new):** `src/app/robots.ts`

```ts
// src/app/robots.ts
import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
```

> Note: we deliberately omit the legacy `host` directive — Google ignores it, and Next's
> `MetadataRoute.Robots` expects a bare host if you use it. It adds noise for no benefit here.

**Important — do NOT `disallow: /search` here.** `/search` is linked from the footer, so we want
Google to *crawl* it and read its `noindex` meta tag (added in Phase 3). If we blocked it in
robots.txt, Googlebot could never see the `noindex` and the URL could still surface as a bare
result. Crawl-allow + meta-noindex is the correct combination to keep a utility page out of the
index. Only `/api/` (non-HTML) is disallowed here.

### 1.5b — `metadataBase`

**File (edit):** `src/app/layout.tsx`

Update the root `metadata` export to add `metadataBase` (and switch the hard-coded strings to the
`seo.ts` constants so there's one source of truth):

```tsx
import type { Metadata } from "next";
import { SITE_URL, SITE_TITLE_DEFAULT, SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE_DEFAULT,
    template: "%s · Yadnesh Salvi",
  },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  applicationName: SITE_NAME,
};
```

**Notes**
- `metadataBase` makes all site-relative `alternates.canonical` and (Phase 2) `openGraph.images`
  resolve to absolute `https://yadneshsalvi.com/...` URLs. Without it, Next emits a build warning
  and falls back to `localhost`.
- `alternates: { canonical: "/" }` here is the homepage self-canonical. Child routes that set their
  own `alternates.canonical` (e.g. posts) override it; routes that don't will inherit a canonical
  resolved against their own path. (Static-page canonicals are finalized in Phase 2.)
- The visible behavior of the site does not change — this is metadata only.

---

## Verification

```bash
git checkout -b seo/phase-1-indexation
npm run build      # MUST be clean — in particular, NO "metadataBase property ... not set" warning
npm start &        # serve production build on http://localhost:3000
sleep 3
```

Then assert each artifact exists:

```bash
# 1. robots.txt present, references the sitemap, does NOT block /search
curl -s localhost:3000/robots.txt
#   expect: "Sitemap: https://yadneshsalvi.com/sitemap.xml", "Disallow: /api/", and NO "/search"

# 2. sitemap.xml present and lists posts + series + static routes
curl -s localhost:3000/sitemap.xml | grep -c "<url>"
#   expect: 15 today (4 static + 10 posts + 1 routable series `langgraph-fastapi-nextjs`).
#   The 2nd series (claude-agent-sdk) has no index.mdx yet, so it is NOT listed. Re-count if
#   posts/series change.
curl -s localhost:3000/sitemap.xml | grep "yadneshsalvi.com/blog/langgraph-1-setup"
#   expect: a match
curl -s localhost:3000/sitemap.xml | grep "yadneshsalvi.com/series/langgraph-fastapi-nextjs"
#   expect: a match

# 3. A post has a UNIQUE title, description, and canonical
curl -s localhost:3000/blog/langgraph-1-setup | grep -o '<title>[^<]*</title>'
#   expect: "LangGraph from Scratch, Part 1: Installation & Setup · Yadnesh Salvi"
curl -s localhost:3000/blog/langgraph-1-setup | grep -o '<meta name="description"[^>]*>'
#   expect: the post's subtitle, NOT the generic site description
curl -s localhost:3000/blog/langgraph-1-setup | grep -o '<link rel="canonical"[^>]*>'
#   expect: href="https://yadneshsalvi.com/blog/langgraph-1-setup"

# 4. A DIFFERENT post has a DIFFERENT title (proves per-post metadata works)
curl -s localhost:3000/blog/langgraph-5-streaming | grep -o '<title>[^<]*</title>'
#   expect: "LangGraph from Scratch, Part 5: Streaming Responses · Yadnesh Salvi"
```

Stop the server when done (`kill %1` or equivalent).

---

## Acceptance checklist

- [ ] `src/lib/seo.ts` created with the constants from `README.md`.
- [ ] `getPostMetaBySlug()` added to `src/lib/posts.ts` (frontmatter-only, no `compileMDX`).
- [ ] `generateMetadata` added to `src/app/blog/[slug]/page.tsx`; existing component untouched.
- [ ] Two different posts return two different `<title>` and `<meta name="description">` values.
- [ ] Each post emits `<link rel="canonical">` with an absolute `https://yadneshsalvi.com/...` URL.
- [ ] `src/app/sitemap.ts` created; `/sitemap.xml` lists all static routes, all posts, all series.
- [ ] `src/app/robots.ts` created; `/robots.txt` points to the sitemap and disallows only `/api/`.
- [ ] `metadataBase` set in `src/app/layout.tsx`; `npm run build` has **no metadataBase warning**.
- [ ] `npm run build` succeeds; all verification `curl` checks pass against `npm start`.

## Post-deploy follow-up (after this phase is live)

- [ ] Submit `https://yadneshsalvi.com/sitemap.xml` in Google Search Console + Bing Webmaster Tools.
- [ ] Use GSC "URL Inspection" → "Request indexing" for the homepage and 2–3 priority posts.

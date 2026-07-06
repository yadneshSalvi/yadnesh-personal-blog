# Phase 4 — Long-Term Enhancements

> **Goal:** Distribution and polish — an RSS feed, dynamically generated per-post social images
> (the robust fix for the SVG-OG-image problem), and eliminating orphan glossary pages.
>
> **Covers issues:** #13 (RSS/Atom feed), #15 (dynamic OG images), #14 (orphan `kind:reference`
> pages).
>
> **Depends on:** Phase 1 (`seo.ts`, sitemap), Phase 2 (OG conventions, `ogImageFor`), **and
> Phase 3** — the RSS feed reads `PostMeta.description`, a field that only exists after Phase 3
> Task 3.4. Do Phase 3 before Phase 4, or apply the small type guard noted in Task 4.1.
>
> **Risk:** Low–Medium. The dynamic OG route uses `next/og`; verify it renders on Vercel.
>
> **Branch:** `seo/phase-4-enhancements`

---

## Task 4.1 — RSS feed (issue #13)

A tutorial blog benefits from a feed: feed readers, newsletter automation (e.g. Substack/Buttondown
import), and some AI/discovery crawlers consume RSS.

### Step 1 — Feed route

**File (new):** `src/app/feed.xml/route.ts`

A Route Handler that emits RSS 2.0 from the listed posts. Use `getListedPostsMeta()` (standalone
posts) plus series parts if you want every article in the feed — below includes **all** posts so
series parts are discoverable.

```ts
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
```

> **Type dependency:** `p.description` is only added to the `PostMeta` type in Phase 3 Task 3.4. The
> `?? p.subtitle ?? ""` chain is runtime-safe, but **TypeScript will fail the build** with
> `Property 'description' does not exist on type 'PostMeta'` if you run Phase 4 *before* Phase 3.
> Either land Phase 3 first (recommended — it's earlier in the sequence anyway) or, to ship Phase 4
> standalone, read it through a guard: `const desc = (p as PostMeta & { description?: string }).description ?? p.subtitle ?? ""`.

### Step 2 — Advertise the feed

**File (edit):** `src/app/layout.tsx` — add a feed alternate to the root `metadata` so browsers and
readers can autodiscover it:
```tsx
alternates: {
  canonical: "/",
  types: { "application/rss+xml": [{ url: "/feed.xml", title: "Yadnesh Salvi — RSS" }] },
},
```
Optionally add a visible "RSS" link in `Footer.tsx`.

**Verify:**
```bash
curl -s localhost:3000/feed.xml | head -20
#   well-formed RSS; xmllint --noout <(curl -s localhost:3000/feed.xml) should exit 0
curl -s localhost:3000/ | grep 'application/rss+xml'   # autodiscovery <link> present
```

---

## Task 4.2 — Dynamic per-post OG images (issue #15)

Phase 2 falls back to `og-default.png` for SVG-cover posts (the whole LangGraph series). Generate a
branded, per-post social card with `next/og` so every share shows a relevant image.

**File (new):** `src/app/blog/[slug]/opengraph-image.tsx`

```tsx
import { ImageResponse } from "next/og";
import { getAllPostSlugs, getPostMetaBySlug } from "@/lib/posts";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Yadnesh Salvi — Notes on AI Engineering";

export function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const meta = getPostMetaBySlug(slug);
  const title = meta?.title ?? "Yadnesh Salvi";
  const subtitle = meta?.subtitle ?? "Notes on AI Engineering";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          justifyContent: "space-between", padding: 80,
          background: "#faf8f4", color: "#1a1a1a", fontFamily: "serif",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: 4, textTransform: "uppercase", color: "#8a8378" }}>
          Yadnesh Salvi · Notes on AI Engineering
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 64, lineHeight: 1.1, fontWeight: 600 }}>{title}</div>
          <div style={{ fontSize: 32, fontStyle: "italic", color: "#555" }}>{subtitle}</div>
        </div>
        <div style={{ fontSize: 24, color: "#8a8378" }}>yadneshsalvi.com</div>
      </div>
    ),
    { ...size },
  );
}
```

**Effect:** Next auto-wires `/blog/<slug>/opengraph-image` and injects the correct absolute
`og:image` / `twitter:image` for each post — **overriding** the Phase 2 `ogImageFor` fallback. Once
this is in place you can simplify Task 2.2 to stop setting `openGraph.images` manually for posts
(Next's file-based convention wins), or leave both — the file convention takes precedence.

> Match the colors to the ink-and-paper design tokens (`#faf8f4` paper / `#1a1a1a` ink shown above
> are placeholders — pull the real values from `globals.css`/`tailwind.config`). Add a dark variant
> only if desired; OG images are typically light.

**Verify:**
```bash
npm run build && npm start &
curl -sI "localhost:3000/blog/langgraph-1-setup/opengraph-image" | grep -i "content-type\|200"
#   expect 200 + image/png
curl -s localhost:3000/blog/langgraph-1-setup | grep -o '<meta property="og:image"[^>]*>'
#   now points at the generated opengraph-image route
```
Then confirm the rendered card in the X Card Validator / LinkedIn Post Inspector on a preview deploy.

Optionally add the same pattern for series (`src/app/series/[slug]/opengraph-image.tsx`).

---

## Task 4.3 — Fix orphan `kind:reference` glossary pages (issue #14)

`getListedPostsMeta()` filters out `kind === "reference"` posts, so any such page would render at
`/blog/<slug>` but be linked from **nowhere** in the UI (only the sitemap, after Phase 1). Orphan
pages get crawled rarely and rank poorly.

> **Current status: there are ZERO `kind:reference` posts in the repo** (verified —
> `grep -rln "^kind:" content/posts/` returns nothing). This task is **future-proofing**: it's a
> no-op today and only kicks in when a glossary/reference page is added. Implement it now so the
> orphan risk is closed in advance, or defer it until the first reference page lands.

### Step 1 — Find them

```bash
grep -rln "^kind:" content/posts/
# expect: no output today. If/when it returns slugs, those are the reference pages to link.
```
If the result is empty (it is, as of this audit), skip Steps 2–3 — the sitemap inclusion from
Phase 1 already covers future pages from a crawl standpoint, but add the internal links below as
soon as a reference page exists.

### Step 2 — Link them from a relevant surface

Pick the approach that fits the content:

- **If a reference page belongs to a series** (most likely — e.g. a LangGraph glossary): add a
  "Reference" section to `src/app/series/[slug]/page.tsx` listing the series' `kind:reference`
  posts. Add a helper to `src/lib/series.ts`:
  ```ts
  export function getSeriesReferences(slug: string): PostMeta[] {
    return getAllPostsMeta().filter((p) => p.series === slug && p.kind === "reference");
  }
  ```
  Render them under the existing "The parts" list with their own heading and `/blog/<slug>` links.

- **If reference pages are standalone**: add a small "Reference / Glossary" section to the `/blog`
  index (`src/app/blog/page.tsx`) below the main list, listing `kind === "reference"` posts (fetch
  via `getAllPostsMeta().filter((p) => p.kind === "reference")`).

### Step 3 — Confirm no longer orphaned

```bash
# every reference slug should appear in at least one rendered page's HTML besides the sitemap
curl -s localhost:3000/series/<series-slug> | grep '/blog/<reference-slug>'
```

---

## Acceptance checklist

- [ ] `/feed.xml` returns well-formed RSS 2.0 (`xmllint` clean) listing posts with titles, links,
      dates, descriptions, categories.
- [ ] Root layout advertises the feed via `alternates.types`; autodiscovery `<link>` present in HTML.
- [ ] `src/app/blog/[slug]/opengraph-image.tsx` generates a 1200×630 PNG per post; post `og:image`
      now points at the generated route; card validates in X/LinkedIn inspectors.
- [ ] OG card colors match the ink-and-paper design tokens.
- [ ] `kind:reference` pages identified; if any exist, each is linked from a series page or the
      `/blog` index and confirmed non-orphan; if none exist, noted in the PR.
- [ ] `npm run build` clean; all verification checks pass.

---

## After Phase 4 — ongoing SEO hygiene (not code)

- Re-check Core Web Vitals in Search Console monthly.
- Keep the sitemap submitted; watch GSC "Pages" for `Crawled – not indexed` / `Discovered – not
  indexed` and address thin pages.
- Refresh `updatedAt` when you materially revise a post (feeds the sitemap `lastModified` + schema
  `dateModified`).
- Internal-link new posts from related older posts and the relevant series page.

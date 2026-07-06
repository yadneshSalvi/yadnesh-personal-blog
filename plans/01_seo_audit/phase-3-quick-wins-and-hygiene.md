# Phase 3 — Quick Wins & Hygiene

> **Goal:** Close the remaining medium/low-severity gaps: keep the search utility page out of the
> index, give images descriptive alt text, shrink oversized image assets, and add a first-class
> `description` field for posts.
>
> **Covers issues:** #5 (`/search` noindex), #10 (image alt text), #6 (large images), #11 (post
> `description` field).
>
> **Depends on:** Phase 1 (`seo.ts`, post `generateMetadata`). Independent of Phase 2 — can be done
> in parallel with it.
>
> **Risk:** Low. #6 touches binary assets + one frontmatter reference; everything else is small
> and additive.
>
> **Branch:** `seo/phase-3-hygiene`

---

## Task 3.1 — Keep `/search` out of the index (issue #5)

`/search` is a JS-driven search UI with no static content — exactly the kind of thin/utility page
that shouldn't be indexed. It's `"use client"`, so (like About) it can't export `metadata` directly.
Split it the same way.

> **Reminder from Phase 1:** we deliberately did **not** `Disallow: /search` in robots.txt. To
> deindex a *linked* page (it's in the footer), Google must be able to crawl it and read a
> `noindex` meta tag. Blocking it in robots.txt would prevent Google from ever seeing `noindex`.
> So: crawl-allowed + `noindex` meta = correct.

### Step 1 — Move the client component

- **Rename/move** `src/app/search/page.tsx` → **`src/app/search/SearchClient.tsx`**.
- Keep `"use client"` at the top. If the file currently exports a default `SearchPage`, rename the
  default export to `SearchClient` (optional). Remove any route-segment config exports (e.g.
  `dynamic`) from this child component if present.

### Step 2 — New server `page.tsx`

**File (new):** `src/app/search/page.tsx`

```tsx
import type { Metadata } from "next";
import SearchClient from "./SearchClient";

export const metadata: Metadata = {
  title: "Search",
  description: "Search essays and field notes on AI engineering.",
  robots: { index: false, follow: true }, // keep out of the index; still follow links
  alternates: { canonical: "/search" },
};

export default function SearchPage() {
  return <SearchClient />;
}
```

> `index: false, follow: true` emits `<meta name="robots" content="noindex, follow">`. The page is
> already excluded from `sitemap.ts` (Phase 1), which is correct — never list noindex URLs in a
> sitemap.

**Verification:**
```bash
curl -s localhost:3000/search | grep -o '<meta name="robots"[^>]*>'
#   expect: content="noindex, follow"
```

---

## Task 3.2 — Descriptive alt text on cover images (issue #10)

Empty `alt=""` marks meaningful, topical cover images as decorative — forfeiting Google Images
relevance and hurting accessibility. Give covers descriptive alt text, with an optional
frontmatter override.

### Step 1 — Add an optional `imageAlt` field to `PostMeta` and `SeriesMeta`

**File (edit):** `src/lib/posts.ts`
- Add `imageAlt?: string;` to the `PostMeta` type.
- Parse it in `getAllPostsMeta()`, `getPostBySlug()`, and `getPostMetaBySlug()` (added in Phase 1):
  ```ts
  imageAlt: data.imageAlt ? String(data.imageAlt) : undefined,   // gray-matter path
  // and for compileMDX path:
  imageAlt: frontmatter.imageAlt ? String(frontmatter.imageAlt) : undefined,
  ```

**File (edit):** `src/lib/series.ts`
- Add `imageAlt?: string;` to `SeriesMeta` and parse it in `parseSeriesMeta()`:
  ```ts
  imageAlt: data.imageAlt ? String(data.imageAlt) : undefined,
  ```
- Carry it through `seriesToListItem()` if you want list thumbnails to use it (optional).

### Step 2 — Use it (with a sensible fallback) in the render paths

**File (edit):** `src/app/blog/[slug]/page.tsx` — the post cover `ZoomableImage` (currently
`alt=""` at line **88**):
```tsx
alt={meta.imageAlt ?? `Cover illustration for “${meta.title}”`}
```

**File (edit):** `src/app/series/[slug]/page.tsx`:
- Series hero `ThemedImage` (currently `alt=""` at line **111**):
  ```tsx
  alt={meta.imageAlt ?? `Cover illustration for the ${meta.name} series`}
  ```
- Per-part thumbnail `ThemedImage` (currently `alt=""` at line **148**):
  ```tsx
  alt={part.imageAlt ?? `Cover illustration for “${shortPartTitle(part.title)}”`}
  ```

> Keep alt **descriptive, not keyword-stuffed**. The fallback above is fine for decorative-leaning
> covers; set `imageAlt` in frontmatter for images that convey specific information.

> **In-content MDX images:** images authored inside post bodies (via the `Figure`/`ZoomableImage`
> MDX components) should also have real alt text. Audit `content/posts/*.mdx` for `alt=""` or
> missing `alt` on `<Figure>`/`<ZoomableImage>` usages and fill them in. (Grep:
> `grep -rn 'alt=""' content/` and `grep -rn '<Figure' content/`.)

---

## Task 3.3 — Compress oversized image assets (issue #6)

These source files are far too large and are the most likely Core Web Vitals / LCP liability.
All three are **rendered covers** (verified against frontmatter), so all three must be compressed:

| File | Current size | Used by | Action |
|------|--------------|---------|--------|
| `public/images/series/langgraph/cover.png` | ~2.1 MB | `priority` hero of `/series/langgraph-fastapi-nextjs` (also the series OG image) | compress — highest priority (LCP on a landing page) |
| `public/vibecoding.png` | ~2.1 MB | cover of `content/posts/vibe-coding.mdx` (`image: "/vibecoding.png"`) | compress — **do NOT move/delete**, it's a live cover |
| `public/why-this-blog2.png` | ~2.2 MB | cover of `content/posts/getting-started.mdx` | compress |
| `public/why-this-blog.png` | ~2.1 MB | referenced only in `content/archived/*` (not routed) | optional — compress or leave; not deployed-critical |

`next/image` optimizes the *rendered* thumbnail, but the full-resolution zoom view and any direct
hit serve the raw file, and the repo carries the weight.

> **Earlier-draft caution corrected:** `vibecoding.png` is **not** generation-reference-only — it is
> the rendered cover of the published `/blog/vibe-coding` post. Compress it like the others; do not
> move it out of `public/` or the post cover 404s. (The MDX `--ref` comments that also mention it
> are separate and harmless.) Always confirm with `grep -rn "vibecoding" content/ src/` before
> touching any asset.

### Option A — Convert to WebP (preferred; biggest savings)

On macOS, `sips` can output WebP; otherwise install `sharp` for a quick script.

```bash
# Using sharp (reliable, cross-platform). Run from repo root.
npm i -D sharp
node -e '
  const sharp = require("sharp");
  const f = "public/why-this-blog2.png";
  sharp(f).resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(f.replace(/\.png$/, ".webp"))
    .then(() => console.log("done"));
'
```

Then update the reference in **`content/posts/getting-started.mdx`** frontmatter:
```yaml
image: "/why-this-blog2.webp"
```
…and delete the original `.png` once the `.webp` renders correctly. **Repeat for each rendered PNG,
updating its reference:**
- `public/vibecoding.png` → update `image:` in `content/posts/vibe-coding.mdx`.
- `public/images/series/langgraph/cover.png` → update `image:` in
  `content/series/langgraph-fastapi-nextjs/index.mdx` (this one is also the series OG image, so the
  compressed raster keeps social cards working).

`next/image` serves WebP/AVIF natively and `ZoomableImage` handles non-SVG sources fine.

### Option B — Recompress PNG in place (no reference changes)

If you'd rather not change file extensions/references:
```bash
# macOS built-in: downscale to a sane max width (keeps PNG, big size win)
sips --resampleWidth 1600 public/why-this-blog2.png
# optionally run pngquant for lossy palette compression:
# npx pngquant --quality=60-80 --ext .png --force public/why-this-blog2.png
```
Target: **< 300 KB** per rendered cover.

### Verify

```bash
ls -lh public/*.png public/*.webp 2>/dev/null
npm run build && npm start &
# Load /blog/getting-started in a browser, run PageSpeed Insights on the deployed URL,
# confirm LCP < 2.5s and the cover is served as webp/avif.
```

> The LangGraph series covers are already **SVG** (tiny) — no action needed there.

---

## Task 3.4 — First-class `description` frontmatter field (issue #11)

`subtitle` is currently doing double duty as the meta description, and posts without a subtitle
(e.g. `getting-started.mdx`) fall back to the generic site description. Add an explicit, optional
`description` so each post can ship a tuned 150–160-char SERP snippet.

### Step 1 — Type + parsing

**File (edit):** `src/lib/posts.ts`
- Add `description?: string;` to the `PostMeta` type.
- Parse it in `getAllPostsMeta()`, `getPostBySlug()`, and `getPostMetaBySlug()`:
  ```ts
  description: data.description ? String(data.description) : undefined,      // gray-matter path
  description: frontmatter.description ? String(frontmatter.description) : undefined, // compileMDX path
  ```

### Step 2 — Use it first in the description precedence

**File (edit):** `src/app/blog/[slug]/page.tsx` — update the `generateMetadata` line:
```tsx
// precedence: explicit description → subtitle → site default
const description = meta.description ?? meta.subtitle ?? SITE_DESCRIPTION;
```
Also update the `BlogPosting` schema `description` (Phase 2, Task 2.5b) to prefer
`meta.description ?? meta.subtitle`.

### Step 3 — Backfill content (especially descriptionless posts)

Add a `description:` to frontmatter where the subtitle is missing or too long for a snippet. Highest
priority: **`content/posts/getting-started.mdx`** (no subtitle today). Example:
```yaml
description: "Why this blog exists and what you'll find here: practical notes on AI engineering, agents, RAG, and shipping LLM systems to production."
```
Keep descriptions unique per post, ~150–160 characters, written for a human scanning search results.

> Optionally mirror this for series: add `description?` to `SeriesMeta` and use it in the series
> `generateMetadata` ahead of `tagline`. Not required.

---

## Acceptance checklist

- [ ] `/search` split into server `page.tsx` + `SearchClient.tsx`; renders
      `<meta name="robots" content="noindex, follow">`; still excluded from sitemap; search UI works.
- [ ] `imageAlt?` added to `PostMeta` + `SeriesMeta` and parsed in all read paths.
- [ ] Post cover, series hero, and series part thumbnails use descriptive alt (no remaining
      `alt=""` on meaningful images in the route files).
- [ ] In-content MDX images audited; no meaningful image left with empty/missing alt.
- [ ] All three rendered covers compressed/converted to < 300 KB with frontmatter references
      updated and originals removed: `images/series/langgraph/cover.png`, `vibecoding.png`,
      `why-this-blog2.png`. (None are moved/deleted — all are live covers.)
- [ ] PageSpeed Insights on a PNG-cover post shows LCP < 2.5s and a webp/avif-served cover.
- [ ] `description?` added to `PostMeta` and parsed; precedence is description → subtitle → default.
- [ ] `getting-started.mdx` (and any other descriptionless post) has a tuned `description`.
- [ ] `npm run build` clean; verification `curl` checks pass.

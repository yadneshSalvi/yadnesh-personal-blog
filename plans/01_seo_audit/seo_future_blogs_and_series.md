# SEO Playbook — Writing Future Posts & Series

> **Who this is for:** you, every time you write a new blog post or start a new series
> (like the LangGraph one).
>
> **The big idea:** after the Phase 1–4 SEO work, *almost all* SEO is now **automatic** and
> derived from frontmatter. The sitemap, robots.txt, canonicals, `<title>`, meta description,
> Open Graph/Twitter tags, the per-post social image, JSON-LD structured data, and the RSS feed
> are all generated for you. Your job per post is small and mostly about **content quality + good
> frontmatter + a compressed cover image + internal links.**
>
> Follow the checklists below and every new page ships fully optimized.

---

## TL;DR — the pre-publish checklist

For a **new standalone post** (`content/posts/<slug>.mdx`):

- [ ] **Filename = slug** — lowercase, hyphenated, keyword-rich (e.g. `rag-chunking-strategies.mdx`).
- [ ] **`title`** — unique, ~50–60 chars, primary keyword near the front. **Don't** add "· Yadnesh Salvi" (the template appends it).
- [ ] **`description`** — a tuned 150–160-char SERP snippet, written for a human scanning results. **Always set this for standalone posts.**
- [ ] **`createdAt` / `updatedAt`** — ISO 8601 with timezone (`"2026-07-01T00:00:00.000Z"`).
- [ ] **`tags`** — 3–6 relevant, **lowercase** keywords.
- [ ] **`image`** (+ optional `imageDark`) — a **compressed** cover (JPEG < 300 KB, or SVG). Never commit a multi-MB PNG. (See [Cover images](#cover-images-create--compress).)
- [ ] **`imageAlt`** — one factual sentence describing the cover.
- [ ] **In-body images** use `<Figure>` with real `alt` + `caption`. Never `alt=""`.
- [ ] **Body headings start at `##`** (the title is the page's only `<h1>`).
- [ ] **Internal links** — link to/from 2–3 related existing posts.
- [ ] Build locally and run the [verification curls](#verify-a-new-page-locally).

For a **new series**, also do the [Series checklist](#starting-a-new-series).

That's it. Everything below is detail and the "why".

---

## What is automatic — do NOT redo these per post

Once your `.mdx` exists with good frontmatter, the build generates all of this with **zero extra work**:

| Concern | How it's handled | Source of truth |
|---|---|---|
| **Sitemap** (`/sitemap.xml`) | New post/series added automatically | `src/app/sitemap.ts` (reads all posts + series) |
| **robots.txt** | Already correct; points at sitemap | `src/app/robots.ts` |
| **`<title>`** | `title` + `"· Yadnesh Salvi"` template | `src/app/layout.tsx` + post `generateMetadata` |
| **Meta description** | `description ?? subtitle ?? site default` | `src/app/blog/[slug]/page.tsx` |
| **Canonical URL** | `https://yadneshsalvi.com/blog/<slug>` | `metadataBase` + `alternates.canonical` |
| **Open Graph / Twitter tags** | Per-post `article` OG + summary_large_image | post `generateMetadata` |
| **Social share image** | **Auto-generated branded card** (title + subtitle) | `src/app/blog/[slug]/opengraph-image.tsx` |
| **Structured data** | `BlogPosting` + `BreadcrumbList` JSON-LD; site-wide `WebSite` + `Person` | post page + `src/app/layout.tsx` |
| **RSS feed** (`/feed.xml`) | New post added with title/link/date/desc/categories | `src/app/feed.xml/route.ts` |
| **Reading time** | Auto-calculated from word count (override with `readingTime`) | `src/lib/posts.ts` |
| **Author / E-E-A-T identity** | Centralized `Person` schema; every post inherits authorship | `src/lib/seo.ts` (`AUTHOR`) |

> **Implication:** you almost never edit code to publish. You edit code only when site-wide
> identity changes (domain, name, social handles) — see [When to touch code](#when-to-touch-code-rare).

---

## Writing a new standalone post — step by step

### 1. Filename & slug

The file path **is** the URL: `content/posts/rag-chunking-strategies.mdx` → `/blog/rag-chunking-strategies`.

- Lowercase, hyphen-separated, no dates or stop-words you don't need.
- Put the **primary keyword** in the slug. Keep it short and readable.
- Slugs are permanent once indexed — choose well; renaming later needs a redirect.

### 2. Frontmatter (annotated template)

```yaml
---
title: "RAG Chunking Strategies That Actually Work"     # unique, ~50–60 chars, keyword near front
subtitle: "Fixed-size vs. semantic vs. recursive — and when each wins"  # optional editorial line, shown on page
description: "A practical comparison of RAG chunking strategies — fixed-size, recursive, and semantic — with the trade-offs that decide retrieval quality in production."  # 150–160 char SERP snippet
image: "/images/posts/rag-chunking.jpg"                 # compressed cover (JPEG <300KB) or SVG
imageDark: "/images/posts/rag-chunking-dark.jpg"        # optional dark-mode variant
imageAlt: "Diagram comparing three ways of splitting a document into chunks for retrieval."
createdAt: "2026-07-01T00:00:00.000Z"                   # ISO 8601 + timezone; drives sort + dates
updatedAt: "2026-07-01T00:00:00.000Z"                   # bump when you materially revise
tags: ["rag", "retrieval", "chunking", "production"]    # lowercase, 3–6 keywords
---
```

**Field meanings & where they surface:**

| Field | Required | Drives |
|---|---|---|
| `title` | ✅ | `<title>`, `og:title`, `twitter:title`, `<h1>`, `BlogPosting.headline`, breadcrumb, RSS title, the social card |
| `description` | strongly recommended | meta description, `og:description`, RSS `<description>`, `BlogPosting.description` (precedence: **`description` → `subtitle` → site default**) |
| `subtitle` | optional | shown on the page; the social card's second line; fallback description |
| `image` / `imageDark` | recommended | in-page hero cover; `BlogPosting.image`. (Social image is the auto-card, **not** this — see [Images & OG](#images--open-graph-the-precise-rules)) |
| `imageAlt` | recommended | the cover's `alt` (a11y + image SEO). Falls back to a generated string if omitted |
| `createdAt` | ✅ | sort order, `article:published_time`, `datePublished`, RSS `pubDate` |
| `updatedAt` | ✅ | sitemap `lastModified`, `article:modified_time`, `dateModified`. **Bump on real edits** |
| `tags` | recommended | `keywords`, `article:tag`, RSS `<category>`, on-site tag filtering/search |
| `readingTime` | optional | overrides the auto word-count estimate |
| `series` / `seriesPart` | series only | see [Series](#starting-a-new-series) |
| `kind: "reference"` | glossary only | see [Reference pages](#referenceglossary-pages-kindreference) |

### 3. Cover images (create + compress)

**This is the one place you can hurt performance if you're careless.** Raw AI-generated PNGs are
2 MB+ and tank Largest Contentful Paint. Always compress before committing.

**Workflow:**

1. Generate the cover (the repo uses `gpt-image` with `--ref public/vibecoding.png` to keep the
   recurring cartoon character consistent — see the `{/* cover prompt ... */}` notes in existing
   posts/series for the exact recipe, and `scripts/generate-image.mjs`).
2. **Compress it.** Reuse `scripts/compress-covers.mjs` (resize to ≤1400px wide, JPEG quality 82,
   mozjpeg). Target **< 300 KB**. Quick one-off:
   ```bash
   node -e '
     const sharp = require("sharp"); const fs = require("fs");
     const src = "public/images/posts/rag-chunking-RAW.png";
     const out = "public/images/posts/rag-chunking.jpg";
     sharp(fs.readFileSync(src)).resize({ width: 1400, withoutEnlargement: true })
       .jpeg({ quality: 82, mozjpeg: true }).toFile(out)
       .then(() => console.log("done"));
   '
   ```
3. Point `image:` at the compressed `.jpg`. Delete the raw PNG (don't commit it).
4. **Diagrams/screenshots → prefer SVG** (crisp, tiny, no compression needed), like the LangGraph
   part covers.

> **Format rule of thumb:** photographic/illustrated covers → **JPEG**. Line-art diagrams/UI →
> **SVG**. Use PNG only when you truly need lossless raster with transparency (rare for covers).

### 4. In-body images — always `<Figure>` with real alt + caption

Use the `<Figure>` MDX component (it frames, supports light/dark, and is zoomable):

```mdx
<Figure
  src="/images/posts/rag-chunking/semantic-split-light.svg"
  srcDark="/images/posts/rag-chunking/semantic-split-dark.svg"
  alt="A long, factual description of exactly what the image shows, written so someone who can't see it understands the content."
  caption="A short caption that adds context or a takeaway. [Links](/blog/...) are allowed."
  width={1180}
  height={520}
/>
```

- **`alt` is for accessibility + Google Images** — describe the *content*, factually, not "image of…".
  (See the existing LangGraph posts for excellent examples of long descriptive alt.)
- **`caption` is editorial** — it adds meaning a reader sees; it does **not** replace `alt`.
- Never ship `alt=""` on a meaningful image. Decorative-only images are rare here.

### 5. Headings & content structure

- The post `title` renders as the page's single **`<h1>`**. In the MDX body, **start headings at
  `##`** (h2) and nest logically (`##` → `###`). Never use a top-level `#` in the body (it creates
  a second h1 and breaks the hierarchy).
- Put the primary keyword in the first ~100 words naturally.
- Write for search intent and depth; original, first-hand engineering experience is the E-E-A-T
  signal Google rewards here.
- Avoid keyword stuffing. One clear primary topic per post (no cannibalizing an existing post that
  targets the same query).

### 6. Internal linking

Internal links are the cheapest ranking + discovery win, and they're **manual**:

- From the **new post**, link to 2–3 relevant existing posts with descriptive anchor text
  (not "click here").
- From **older related posts**, add a link to the new post.
- Series parts auto-link each other via the series page, but cross-linking related concepts in
  prose still helps.
- Goal: no post is more than ~3 clicks from the homepage, and nothing is orphaned.

### 7. Verify a new page locally

```bash
npm run build && npm start &
SLUG=rag-chunking-strategies
curl -s localhost:3000/blog/$SLUG | grep -o '<title>[^<]*</title>'
curl -s localhost:3000/blog/$SLUG | grep -o '<meta name="description"[^>]*>'
curl -s localhost:3000/blog/$SLUG | grep -o '<link rel="canonical"[^>]*>'
curl -s localhost:3000/blog/$SLUG | grep -o '"@type":"[A-Za-z]*"' | sort -u   # expect BlogPosting + BreadcrumbList
curl -sI "localhost:3000/blog/$SLUG/opengraph-image" | grep -i "200\|image/png"  # social card renders
curl -s localhost:3000/sitemap.xml | grep "$SLUG"                              # in the sitemap
curl -s localhost:3000/feed.xml | grep "$SLUG"                                 # in the RSS feed
```

After deploy, paste the URL into the **X Card Validator** / **LinkedIn Post Inspector** to confirm
the social card, and run it through **Google Rich Results Test** for the JSON-LD.

---

## Starting a new series

A series (like LangGraph) = one **landing page** (`content/series/<slug>/index.mdx`) + N **part
posts** (normal posts in `content/posts/` tagged with `series`/`seriesPart`).

### Series checklist

- [ ] Create `content/series/<slug>/index.mdx`. **It MUST have `index.mdx` to be routable** — a
      `PLAN.md` alone will *not* create a `/series/<slug>` page or appear in the sitemap.
- [ ] Fill the series frontmatter (template below).
- [ ] Give the series a **compressed raster (JPEG) cover** — for series, the cover **is** the
      social image (see the OG note below). Compress it like any cover.
- [ ] Set `plannedParts` to the eventual total so the "X of N parts" UI is correct.
- [ ] Write each part as a normal post with `series: "<slug>"` and `seriesPart: <n>`.
- [ ] Bump the series `updatedAt` (and ship the part) as each part publishes.

### Series landing page frontmatter (`content/series/<slug>/index.mdx`)

```yaml
---
name: "Production RAG from Scratch"            # the series title
accentWord: "Scratch"                          # a word inside `name` rendered in accent italic
tagline: "Build a retrieval system that survives real traffic — chunking, embeddings, reranking, and evals, end to end."  # THIS is the series meta description + OG description
plannedParts: 6                                # total parts when complete
image: "/images/series/prod-rag/cover.jpg"     # compressed JPEG (this is the series social image)
imageDark: "/images/series/prod-rag/cover-dark.jpg"   # optional
imageAlt: "Cartoon of the recurring character assembling a retrieval pipeline on a workbench."
createdAt: "2026-08-01T00:00:00.000Z"
updatedAt: "2026-08-01T00:00:00.000Z"
tags: ["rag", "retrieval", "production", "tutorial", "series"]
---

{/* Intro MDX body goes here — it renders above "The parts" list. */}
```

**Series fields that matter for SEO:**

| Field | Drives |
|---|---|
| `name` | `<title>`, `og:title`, `<h1>`, breadcrumb, sitemap |
| `tagline` | **the series meta description** + `og:description` + `twitter:description` (write it like a 150–160-char snippet) |
| `image` / `imageDark` | series hero **and** the series social image (raster only — see OG note) |
| `imageAlt` | hero `alt` |
| `createdAt` / `updatedAt` | sitemap `lastModified`; sort order |
| `plannedParts` | "X of N parts" UI; doesn't affect SEO but keep it honest |

### Series part posts

Each part is a regular `content/posts/<slug>.mdx` with two extra fields:

```yaml
series: "prod-rag"     # must match the series folder slug
seriesPart: 1          # ordering on the series page
```

- Parts get the **same automatic SEO** as standalone posts (per-post metadata, auto social card,
  `BlogPosting`, RSS, sitemap).
- Parts **auto-appear** on the series page's "The parts" list and auto-link Part 1 → Part 2 → …
- Still write a unique `title`, `description`/`subtitle`, `tags`, and cover for **each part**.
- Cross-link parts in prose where it helps the reader (e.g. "as we set up in [Part 1](...)").

---

## Images & Open Graph — the precise rules

There's one nuance worth understanding so you're never surprised by a social preview:

- **Blog posts (standalone or series parts):** the social image (`og:image` / `twitter:image`) is
  **always the auto-generated branded card** from `opengraph-image.tsx` (it renders `title` +
  `subtitle`/`description` on the ink-and-paper background). The post's `image:` cover is **not**
  the social image — it's the in-page hero + the `BlogPosting.image` for structured data. So the
  cover's format/size only affects on-page LCP, not social sharing.
  → **Action:** write a strong `title` + `subtitle` (they make the card); keep the cover compressed.

- **Series landing pages:** there is **no** auto-card; the social image is the series `image:` cover
  via `ogImageFor()`. That helper returns the cover **only if it's a raster** (`.jpg`/`.jpeg`/
  `.png`/`.webp`); if the cover is an **SVG** or missing, it falls back to `/og-default.png`.
  → **Action:** give a series a **compressed JPEG cover** if you want a custom social card. An SVG
  series cover will share the generic default image.

> **Optional future enhancement:** to give series pages their own generated card too, add
> `src/app/series/[slug]/opengraph-image.tsx` mirroring the post one. Not required.

---

## Reference / glossary pages (`kind: "reference"`)

For glossary/reference/cheat-sheet pages that shouldn't clutter the main listings:

```yaml
kind: "reference"
series: "prod-rag"     # optional — attaches it to a series
```

- They're **excluded** from the homepage and `/blog` index and from the numbered "parts" list.
- They're still served at `/blog/<slug>`, included in the **sitemap** and **RSS**, and get full
  per-page metadata + schema.
- If you set `series`, the page **auto-surfaces** in a "Reference" section on that series' page, so
  it isn't orphaned. (If standalone with no series, link to it from a relevant post manually.)

---

## Title & description best practices

**Titles**
- Unique per page; ~50–60 chars (longer gets truncated in SERPs).
- Primary keyword near the front; make it click-worthy, not clickbait.
- Don't append the brand — the `%s · Yadnesh Salvi` template does it.

**Descriptions**
- Unique per page; ~150–160 chars.
- Include the primary keyword naturally; give a concrete reason to click.
- For posts: set `description` (don't rely on `subtitle` doubling as the snippet unless the subtitle
  genuinely reads like a good SERP line).
- For series: the `tagline` **is** the description — write it accordingly.

**Tags**
- Lowercase, consistent across posts (reuse existing tag spellings: `langgraph`, `rag`, `fastapi`,
  `nextjs`, `tutorial`, …). Inconsistent casing fragments the on-site tag filter.

---

## Post-publish checklist (one-time, after deploy)

- [ ] Confirm the new URL is in the live sitemap (`https://yadneshsalvi.com/sitemap.xml`).
- [ ] In **Google Search Console** → URL Inspection → **Request indexing** for important new posts
      (speeds up first crawl; the sitemap handles the rest over time).
- [ ] Validate the social card (X Card Validator / LinkedIn Post Inspector).
- [ ] Validate JSON-LD (Google Rich Results Test / `validator.schema.org`).
- [ ] Add internal links from 1–2 older related posts to the new one.

---

## When to touch code (rare)

You only edit code when site-wide facts change — not for normal publishing:

| Change | Edit |
|---|---|
| Domain, site name, default title/description, Twitter handle, author identity/socials | `src/lib/seo.ts` |
| Add a new frontmatter field | `src/lib/posts.ts` (`PostMeta` + the 3 readers) and/or `src/lib/series.ts` (`SeriesMeta` + `parseSeriesMeta`) |
| Change the social-card design | `src/app/blog/[slug]/opengraph-image.tsx` (and `scripts/gen-og-default.mjs` for the default) |
| Adjust sitemap priorities / add a new static route | `src/app/sitemap.ts` |
| Change crawl rules | `src/app/robots.ts` |
| Change RSS shape | `src/app/feed.xml/route.ts` |

---

## Ongoing SEO hygiene (monthly-ish)

- Check **Core Web Vitals** and the **Pages** report in Search Console; watch for
  `Crawled – not indexed` / `Discovered – not indexed` (usually a thin-content or internal-linking
  signal).
- Refresh `updatedAt` when you materially revise a post (feeds sitemap `lastModified` +
  `dateModified`).
- Keep covers compressed; never let a multi-MB raster slip into `public/`.
- Keep internal links healthy — new posts should link to and be linked from related older ones.

---

### Quick reference: the only files you normally create per post

```
content/posts/<slug>.mdx                      # the post (frontmatter + body)
public/images/posts/<slug>.jpg                # compressed cover (+ optional -dark.jpg)
public/images/posts/<slug>/*.svg|*.jpg        # in-body figures
```

For a series, additionally:

```
content/series/<slug>/index.mdx               # the landing page (frontmatter + intro)
public/images/series/<slug>/cover.jpg         # compressed series cover (+ optional -dark)
```

Everything else is generated. Write well, compress images, link internally — ship.

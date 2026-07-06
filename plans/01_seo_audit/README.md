# SEO Audit & Remediation Plan — yadneshsalvi.com

> **Audit date:** 2026-06-16
> **Site:** Personal blog / AI-engineering writing (Next.js 16 App Router, MDX content, deployed on Vercel)
> **Canonical domain:** `https://yadneshsalvi.com`
> **Audit method:** Code-level review of the repository source. Findings about metadata,
> structured data, sitemap, and robots are **definitive** (read directly from source).
> Core Web Vitals / image-weight findings are **inferred from asset sizes** — confirm on the
> deployed URL with PageSpeed Insights.

This folder contains the full SEO audit plus a **phase-by-phase implementation plan**. Each phase
is a self-contained Markdown file with exact file paths, code, and verification steps. Work the
phases in order — Phase 1 is the highest-impact and unblocks everything else.

---

## How to use this folder

| File | What it covers |
|------|----------------|
| `README.md` (this file) | Site context, full issue catalog, severity, coverage matrix, shared conventions |
| `phase-1-critical-indexation.md` | Per-post metadata, sitemap, robots, `metadataBase`, per-post canonical |
| `phase-2-rich-results-and-structured-data.md` | Open Graph / Twitter, JSON-LD structured data, About-page server split, static-page canonicals |
| `phase-3-quick-wins-and-hygiene.md` | `/search` noindex, image alt text, image compression, post `description` field |
| `phase-4-long-term.md` | RSS feed, dynamic OG images, orphan reference-page fixes |

Read `README.md` first (especially **Shared conventions** below — every phase depends on the
`src/lib/seo.ts` constants module introduced in Phase 1).

---

## Site context (for whoever implements this)

- **Framework:** Next.js `^16.2.6`, App Router, React 19. Pages are statically rendered
  (`export const dynamic = "force-static"`).
- **Content:** MDX files under `content/`.
  - `content/posts/*.mdx` — 10 posts. Standalone posts + the 8-part LangGraph series parts.
  - `content/series/<slug>/index.mdx` — series landing pages. **Only 1 series is currently
    routable: `langgraph-fastapi-nextjs`** (it has an `index.mdx`). A second,
    `claude-agent-sdk-fastapi-nextjs`, has only a `PLAN.md` (no `index.mdx`), so
    `getAllSeriesSlugs()` ignores it — it is *not* live. It will appear in the sitemap/feed
    automatically once its `index.mdx` ships; don't hard-code "1 series" anywhere.
  - `content/archived/*` — not routed (ignore for SEO).
- **Routing layer (`src/app/`):**
  - `layout.tsx` — root metadata (title template + description only).
  - `page.tsx` — homepage (no own metadata; inherits layout default — acceptable).
  - `blog/page.tsx` — `/blog` index (has `metadata.title`).
  - `blog/[slug]/page.tsx` — **post pages. NO `generateMetadata`.** ← primary problem.
  - `series/[slug]/page.tsx` — series pages (has `generateMetadata`).
  - `about/page.tsx` — `"use client"` (so it **cannot** export metadata).
  - `contact/page.tsx` — has `metadata.title`.
  - `search/page.tsx` — `"use client"`, no metadata, indexable.
  - `api/contact/route.ts`, `api/search/route.ts` — API routes.
- **Data helpers (already exist — reuse them, do not re-implement):**
  - `src/lib/posts.ts` — `getAllPostSlugs()`, `getAllPostsMeta()`, `getListedPostsMeta()`,
    `getPostBySlug()`, type `PostMeta`.
  - `src/lib/series.ts` — `getAllSeriesSlugs()`, `getAllSeriesMeta()`, `getSeriesMeta()`,
    `getSeriesBySlug()`, `getSeriesContextForPost()`, type `SeriesMeta`.
- **`PostMeta` shape** (`src/lib/posts.ts`): `slug, title, subtitle?, image?, imageDark?,
  createdAt, updatedAt, tags?, readingTime?, series?, seriesPart?, kind?`.
  - Note: **there is no `description` field** — `subtitle` is the closest thing. Phase 3 adds a
    dedicated `description`.
  - `kind: "reference"` posts are served at `/blog/<slug>` but excluded from listings
    (`getListedPostsMeta` filters them) → potential orphans (Phase 4).
- **Images:** `src/components/ZoomableImage.tsx` (client, wraps `next/image`) renders post covers;
  `series/[slug]/page.tsx` has its own `ThemedImage` (also `next/image`). Series/part covers are
  mostly **SVG**; some standalone posts use **multi-MB PNGs** in `public/`.
- **Author / social identity (use consistently in metadata + schema):**
  - Name: **Yadnesh Salvi** · AI/ML Engineer · Mumbai, India
  - GitHub: `https://github.com/yadneshSalvi`
  - LinkedIn: `https://www.linkedin.com/in/yadnesh-salvi-bb5151ba`
  - X/Twitter: `https://x.com/yadnesh_sa88965` (handle `@yadnesh_sa88965`)

---

## Full issue catalog

Severity: 🔴 Critical · 🟠 High · 🟡 Medium/Low. "Evidence" is the source location proving the gap.

| # | Issue | Sev | Evidence | Phase |
|---|-------|-----|----------|-------|
| 1 | **No XML sitemap** — nothing tells Google what to crawl | 🔴 | No `app/sitemap.ts` / `public/sitemap.xml`; Next 16 does not auto-generate | P1 |
| 2 | **No robots.txt** — no crawl directives, no sitemap pointer | 🔴 | No `app/robots.ts` / `public/robots.txt` | P1 |
| 3 | **Missing `metadataBase`** — canonicals & OG image URLs can't resolve to absolute | 🟠 | `src/app/layout.tsx:25` metadata has only `title`+`description` | P1 |
| 4 | **No canonical URLs** — duplicate-URL dilution risk | 🟠 | No `alternates.canonical` on any route | P1 (posts) + P2 (static) |
| 5 | **`/search` is indexable** — thin/soft-404 utility page | 🟡 | `src/app/search/page.tsx` client, no metadata | P3 |
| 6 | **Large source images** — LCP / page-weight risk | 🟡 | `public/images/series/langgraph/cover.png` 2.1 MB (series hero, `priority`), `public/vibecoding.png` 2.1 MB (cover of `vibe-coding.mdx`), `public/why-this-blog2.png` 2.2 MB (cover of `getting-started.mdx`) | P3 |
| 7 | **Blog posts have no per-page metadata** — every post shares one title+description | 🔴 | `src/app/blog/[slug]/page.tsx` has no `generateMetadata` | P1 |
| 8 | **No Open Graph / Twitter Card metadata** — bare social shares | 🟠 | No `openGraph`/`twitter` keys anywhere | P2 |
| 9 | **About page can't emit metadata** (key E-E-A-T author page) | 🟠 | `src/app/about/page.tsx:1` is `"use client"` | P2 |
| 10 | **Cover images use empty `alt`** — forfeits image search + a11y | 🟡 | `blog/[slug]/page.tsx:88`, `series/[slug]/page.tsx:111` (hero) + `:148` (part thumb) use `alt=""` | P3 |
| 11 | **No meta-description source field** — some posts have no description at all | 🟡 | `PostMeta` has no `description`; `getting-started.mdx` has no `subtitle` | P3 |
| 12 | **Zero structured data (JSON-LD)** — no rich results, no entity signals | 🟠 | No `application/ld+json` anywhere in source | P2 |
| 13 | **No RSS/Atom feed** — misses readers, newsletters, some AI crawlers | 🟡 | No `feed`/`rss` route | P4 |
| 14 | **`kind:reference` glossary pages would be orphaned (future-proofing — none exist yet)** | 🟡 | `getListedPostsMeta()` filters `kind !== "reference"`, but a content grep finds **zero** `kind:reference` posts today. Latent risk: any such page added later is served at `/blog/<slug>` yet linked nowhere | P4 |
| 15 | **No dynamic OG images** — SVG covers don't render as social images | 🟡 | Series covers are `.svg`; social platforms reject SVG OG images | P4 |

> Issue **#4** is intentionally split: the per-post canonical is cheapest to add inside the same
> `generateMetadata` block written in Phase 1, while canonicals for the static/server pages
> (home, /blog, /about, /contact, /series) land in Phase 2 alongside Open Graph. Both halves are
> tracked so nothing is missed.

> Issue **#15** (dynamic OG) was called out in the audit's "long-term" bucket and is the robust
> fix for the SVG-OG-image problem surfaced by #8; it lives in Phase 4.

> Issue **#14** is **latent, not a present defect** — there are no `kind:reference` posts in the
> repo today. Phase 4 Task 4.3 detects the empty case and is a no-op until such pages exist; it's
> documented now so the gap is closed the moment a glossary page is added. Phase 1's sitemap
> already includes any future reference page regardless.

---

## Coverage matrix (every point is implemented somewhere)

| Issue # | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
|---------|---|---|---|---|---|---|---|---|---|----|----|----|----|----|----|
| Phase 1 | ✅ | ✅ | ✅ | ◑ |   |   | ✅ |   |   |    |    |    |    |    |    |
| Phase 2 |   |   |   | ◑ |   |   |   | ✅ | ✅ |    |    | ✅ |    |    |    |
| Phase 3 |   |   |   |   | ✅ | ✅ |   |   |   | ✅ | ✅ |    |    |    |    |
| Phase 4 |   |   |   |   |   |   |   |   |   |    |    |    | ✅ | ✅ | ✅ |

(◑ = partially addressed in that phase.)

---

## Shared conventions

### 1. Central SEO config module — `src/lib/seo.ts` (created in Phase 1, used everywhere)

Every phase imports site-wide constants from a single module so there's one source of truth for
the domain, author identity, and default copy. Phase 1 creates it; later phases extend it. The
canonical shape:

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

/** Absolute URL helper — joins a site-relative path onto SITE_URL. */
export function absoluteUrl(path: string): string {
  return new URL(path, SITE_URL).toString();
}

/** Default social share image (1200×630 PNG). Created in Phase 2. */
export const DEFAULT_OG_IMAGE = "/og-default.png";
```

### 2. Branch & commit hygiene

- Work on a branch (`seo/phase-1-indexation`, etc.), **not `main`**. Do not push or open PRs
  unless the repo owner asks.
- One phase per branch/PR keeps review tractable.

### 3. Verification baseline (used by every phase)

```bash
npm run build          # must succeed with no metadata warnings
npm start              # serve the production build on :3000
# then curl the rendered HTML and assert the expected tags exist (per-phase checks)
```

For schema, use the **Google Rich Results Test** (https://search.google.com/test/rich-results)
and **Schema Markup Validator** (https://validator.schema.org/) on the deployed URL — these render
JS and validate JSON-LD. Do not trust `curl`/`web_fetch` alone for schema (they strip `<script>`),
though in this codebase JSON-LD is server-rendered so it *will* appear in `curl` output once added.

### 4. Definition of done (per phase)

Each phase file ends with an **Acceptance checklist**. A phase is done when every box is checked,
`npm run build` is clean, and the per-phase `curl` assertions pass against `npm start`.

---

## Recommended sequencing

1. **Phase 1** — do first and deploy. Resolves the worst indexation/ranking blockers with 4 small
   files. Everything else builds on the `seo.ts` module and `metadataBase` it introduces.
2. **Phase 2** — rich results & sharing. Depends on Phase 1 (`metadataBase`, `seo.ts`).
3. **Phase 3** — quick wins & hygiene. Independent of Phase 2; can run in parallel.
4. **Phase 4** — long-term enhancements. Depends on Phase 1–2 for OG/feed conventions.

After Phase 1 ships: submit the sitemap in Google Search Console and Bing Webmaster Tools, and
request indexing for the homepage and a few key posts.

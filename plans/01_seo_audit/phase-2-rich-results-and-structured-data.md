# Phase 2 — Rich Results, Social Sharing & Structured Data

> **Goal:** Make shared links render rich previews, make the site eligible for rich results, and
> establish author/site entity signals.
>
> **Covers issues:** #8 (Open Graph / Twitter), #12 (JSON-LD structured data), #9 (About-page
> server split), #4 remainder (canonicals on static/server pages).
>
> **Depends on:** Phase 1 (`src/lib/seo.ts`, `metadataBase`).
>
> **Risk:** Low–Medium. The About-page split (#9) is the only structural change; the rest is
> additive metadata + JSON-LD `<script>` tags.
>
> **Branch:** `seo/phase-2-rich-results`

---

## Important upfront decision: OG images and SVG

Social platforms (X, LinkedIn, Facebook, Slack) **do not reliably render SVG** Open Graph images.
Most of this site's covers are **SVG** (`/images/series/langgraph/part-N/cover-light.svg`), and a
few posts use large PNGs. So we cannot simply pass `meta.image` to `openGraph.images`.

**Phase 2 strategy:** ship a single static default OG image (`/public/og-default.png`, 1200×630)
and use it everywhere, **plus** use a post's cover only when it is a non-SVG raster. Phase 4 then
adds per-post **dynamically generated** OG images (`next/og`) for the SVG-cover posts — the robust
final state.

A small helper centralizes the rule:

```ts
// add to src/lib/seo.ts
/** Returns an OG-safe image URL: the cover if it's a raster (png/jpg/webp), else the default. */
export function ogImageFor(cover?: string): string {
  if (cover && /\.(png|jpe?g|webp)$/i.test(cover)) return cover;
  return DEFAULT_OG_IMAGE;
}
```

---

## Task 2.0 — Create the default OG image asset ⚠️ DO THIS FIRST

> **Prerequisite for the whole phase.** The root layout and every page's `ogImageFor()` fallback
> reference `/og-default.png`. The build will still succeed without it, but social validators (and
> the verification step) will 404 the image, so create this asset before wiring up the metadata.

**File (new, binary):** `public/og-default.png` — **1200×630 px PNG**, < 200 KB.

Content: site title "Yadnesh Salvi" + tagline "Notes on AI Engineering" on the ink-and-paper brand
background. Create it however is convenient (Figma export, or a one-off `next/og` script, or the
existing `scripts/generate-image.mjs` tooling). This is the fallback share image for every page
until Phase 4's dynamic generation lands.

> Acceptance: file exists, is 1200×630, and `curl -sI localhost:3000/og-default.png` returns
> `200` + `content-type: image/png`.

---

## Task 2.1 — Open Graph + Twitter defaults in the root layout (issue #8)

**File (edit):** `src/app/layout.tsx`

Extend the Phase 1 `metadata` object with `openGraph` and `twitter` defaults. Child routes inherit
and override these.

```tsx
import {
  SITE_URL, SITE_NAME, SITE_TITLE_DEFAULT, SITE_DESCRIPTION,
  TWITTER_HANDLE, DEFAULT_OG_IMAGE,
} from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE_DEFAULT, template: "%s · Yadnesh Salvi" },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
    images: [{ url: DEFAULT_OG_IMAGE, width: 1200, height: 630, alt: SITE_TITLE_DEFAULT }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
    site: TWITTER_HANDLE,
    creator: TWITTER_HANDLE,
    images: [DEFAULT_OG_IMAGE],
  },
};
```

---

## Task 2.2 — Per-post Open Graph + Twitter (issue #8)

**File (edit):** `src/app/blog/[slug]/page.tsx` — extend the `generateMetadata` written in Phase 1.

```tsx
import { SITE_DESCRIPTION, SITE_URL, ogImageFor } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = getPostMetaBySlug(slug);
  if (!meta) return {};

  const description = meta.subtitle ?? SITE_DESCRIPTION; // Phase 3 inserts meta.description first
  const url = `/blog/${slug}`;
  const ogImage = ogImageFor(meta.image);

  return {
    title: meta.title,
    description,
    keywords: meta.tags,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: meta.title,
      description,
      url,
      images: [{ url: ogImage, width: 1200, height: 630, alt: meta.title }],
      publishedTime: meta.createdAt,
      modifiedTime: meta.updatedAt,
      authors: [`${SITE_URL}/about`],
      tags: meta.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description,
      images: [ogImage],
    },
  };
}
```

> Series part covers are SVG → `ogImageFor` returns `/og-default.png` for them today; Phase 4's
> dynamic OG images replace that with a per-post rendered card.

---

## Task 2.3 — Per-series Open Graph (issue #8)

**File (edit):** `src/app/series/[slug]/page.tsx` — extend the existing `generateMetadata`
(currently returns only `{ title, description }`).

```tsx
import { ogImageFor } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);
  if (!series) return {};
  const { meta } = series;
  const description = meta.tagline;
  const url = `/series/${slug}`;
  const ogImage = ogImageFor(meta.image);

  return {
    title: meta.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: meta.name,
      description,
      url,
      images: [{ url: ogImage, width: 1200, height: 630, alt: meta.name }],
    },
    twitter: { card: "summary_large_image", title: meta.name, description, images: [ogImage] },
  };
}
```

---

## Task 2.4 — Canonicals + metadata on the remaining static pages (issue #4 remainder)

Add `alternates.canonical` (and a description where missing) so every indexable route self-canonicals.

- **`src/app/blog/page.tsx`** — currently `export const metadata = { title: "Writing" }`. Extend:
  ```tsx
  export const metadata = {
    title: "Writing",
    description:
      "Essays and field notes on AI engineering: agents, retrieval, fine-tuning, and the unglamorous plumbing in between.",
    alternates: { canonical: "/blog" },
  };
  ```
- **`src/app/contact/page.tsx`** — extend the existing `metadata`:
  ```tsx
  export const metadata = {
    title: "Contact",
    description: "Get in touch with Yadnesh Salvi — booking, email, and social links.",
    alternates: { canonical: "/contact" },
  };
  ```
- **`src/app/about/page.tsx`** — handled in Task 2.6 (needs the server split first).
- Home canonical (`"/"`) was set in Phase 1's layout edit; no change needed.

---

## Task 2.5 — Structured data: reusable JSON-LD component (issue #12)

**File (new):** `src/components/JsonLd.tsx`

A tiny server component that serializes a schema object into a script tag. Render it inside server
components only.

```tsx
// src/components/JsonLd.tsx
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Content is build-time, author-controlled data — safe to inline.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

### 2.5a — Site-wide `WebSite` + `Person` (root layout)

**File (edit):** `src/app/layout.tsx` — render two JSON-LD blocks in `<body>` (a `<script>` in body
is valid for JSON-LD). Include the sitelinks search box via `SearchAction`.

```tsx
import JsonLd from "@/components/JsonLd";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, AUTHOR } from "@/lib/seo";

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  inLanguage: "en",
  publisher: { "@id": `${SITE_URL}/#person` },
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
    "query-input": "required name=search_term_string",
  },
};

const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE_URL}/#person`,
  name: AUTHOR.name,
  url: SITE_URL,
  jobTitle: AUTHOR.jobTitle,
  email: AUTHOR.email,
  sameAs: AUTHOR.sameAs,
};
```

Render both just inside `<body>` (before or after the layout `<div>`):

```tsx
<body className={...}>
  <JsonLd data={websiteSchema} />
  <JsonLd data={personSchema} />
  <ThemeProvider>...</ThemeProvider>
  <Analytics />
</body>
```

> The `@id` anchors (`#website`, `#person`) let post-level `BlogPosting` schema reference the same
> author/site entities by ID instead of duplicating them.

### 2.5b — `BlogPosting` + `BreadcrumbList` on post pages

**File (edit):** `src/app/blog/[slug]/page.tsx` — inside the `BlogPost` component (which already has
`meta`, `seriesCtx`), render JSON-LD. Build the breadcrumb from the series context when present.

```tsx
import JsonLd from "@/components/JsonLd";
import { SITE_URL, AUTHOR, absoluteUrl, ogImageFor } from "@/lib/seo";

// inside BlogPost(), after `const seriesCtx = ...`:
const postUrl = absoluteUrl(`/blog/${slug}`);
const blogPostingSchema = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "@id": `${postUrl}#article`,
  headline: meta.title,
  description: meta.subtitle ?? undefined,
  image: absoluteUrl(ogImageFor(meta.image)),
  datePublished: meta.createdAt,
  dateModified: meta.updatedAt,
  author: { "@id": `${SITE_URL}/#person` },
  publisher: { "@id": `${SITE_URL}/#person` },
  mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
  keywords: meta.tags?.join(", "),
  url: postUrl,
  ...(meta.readingTime ? { timeRequired: `PT${meta.readingTime}M` } : {}),
};

const breadcrumbItems = [
  { name: "Home", url: SITE_URL },
  ...(seriesCtx
    ? [{ name: seriesCtx.series.name, url: absoluteUrl(`/series/${seriesCtx.series.slug}`) }]
    : [{ name: "Writing", url: absoluteUrl("/blog") }]),
  { name: meta.title, url: postUrl },
];
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: breadcrumbItems.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: item.url,
  })),
};
```

Then render near the top of the returned JSX (inside `<main>` is fine):

```tsx
<JsonLd data={blogPostingSchema} />
<JsonLd data={breadcrumbSchema} />
```

### 2.5c — `BreadcrumbList` on series pages (optional but recommended)

**File (edit):** `src/app/series/[slug]/page.tsx` — same `BreadcrumbList` pattern:
`Home → Writing → <series name>`. Reuse the snippet above with `breadcrumbItems = [Home, Writing, series.name]`.

---

## Task 2.6 — Split the About page so it can emit metadata + Person schema (issue #9)

The About page is `"use client"`, so it cannot export `metadata`. Split it into a server wrapper +
a client body.

### Step 1 — Move the current client component

- **Rename/move** `src/app/about/page.tsx` → **`src/app/about/AboutClient.tsx`**.
- In `AboutClient.tsx`: keep `"use client"` at the top; **remove** the
  `export const dynamic = "force-static"` line and **move it to the new server `page.tsx`**
  (route-segment config must be exported from the *route module*; once this file is no longer the
  route, its config would be ignored). Change the default export name to `AboutClient` (optional but
  clearer).

> Why the split at all: the current `about/page.tsx` builds fine today *with* both `"use client"`
> and `export const dynamic` — a client component can be a route module and export route config.
> The blocker is narrower: **a client component cannot export `metadata` / `generateMetadata`.**
> That's the only reason we introduce a server wrapper.

### Step 2 — New server `page.tsx`

**File (new):** `src/app/about/page.tsx`

```tsx
import type { Metadata } from "next";
import AboutClient from "./AboutClient";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, AUTHOR } from "@/lib/seo";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "About",
  description:
    "Yadnesh Salvi — AI/ML Engineer in Mumbai. Five years shipping NLP, agents, and RAG systems. Trained at IISc Bangalore and IIT Delhi.",
  alternates: { canonical: "/about" },
};

const profileSchema = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  mainEntity: {
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: AUTHOR.name,
    url: AUTHOR.url,
    jobTitle: AUTHOR.jobTitle,
    email: AUTHOR.email,
    sameAs: AUTHOR.sameAs,
    address: { "@type": "PostalAddress", addressLocality: "Mumbai", addressCountry: "IN" },
    alumniOf: [
      { "@type": "CollegeOrUniversity", name: "Indian Institute of Science (IISc), Bangalore" },
      { "@type": "CollegeOrUniversity", name: "Indian Institute of Technology (IIT) Delhi" },
    ],
    knowsAbout: ["NLP", "Agentic AI", "LLMs", "RAG", "LangGraph", "FastAPI"],
  },
};

export default function AboutPage() {
  return (
    <>
      <JsonLd data={profileSchema} />
      <AboutClient />
    </>
  );
}
```

> Verify nothing else imports `about/page.tsx` directly (it shouldn't — it's a route). The
> interactive expand/collapse behaviour is untouched; it now lives in `AboutClient.tsx`.

---

## Verification

```bash
git checkout -b seo/phase-2-rich-results
npm run build      # clean
npm start &
sleep 3

# OG defaults present on home
curl -s localhost:3000/ | grep -o '<meta property="og:[^>]*>' | head
#   expect og:title, og:description, og:image (absolute https URL), og:type=website

# Per-post OG + article metadata
curl -s localhost:3000/blog/langgraph-1-setup | grep -o '<meta property="og:[^>]*>'
#   expect og:type=article, og:image absolute, article:published_time, article:tag

# Twitter card
curl -s localhost:3000/blog/langgraph-1-setup | grep -o '<meta name="twitter:[^>]*>'
#   expect twitter:card=summary_large_image

# Default OG image served
curl -sI localhost:3000/og-default.png | grep -i "content-type\|200"

# JSON-LD present and parseable
curl -s localhost:3000/ | grep -o 'application/ld+json'            # >= 2 (WebSite + Person)
curl -s localhost:3000/blog/langgraph-1-setup \
  | grep -A1 'application/ld+json'                                 # BlogPosting + BreadcrumbList
curl -s localhost:3000/about | grep -o 'application/ld+json'       # ProfilePage

# About page now has its own title + canonical (proves the split worked)
curl -s localhost:3000/about | grep -o '<title>[^<]*</title>'      # "About · Yadnesh Salvi"
curl -s localhost:3000/about | grep -o '<link rel="canonical"[^>]*>'
```

Then validate the JSON-LD on the deployed URL with:
- Google Rich Results Test — https://search.google.com/test/rich-results
- Schema Markup Validator — https://validator.schema.org/

Confirm: `BlogPosting`, `BreadcrumbList`, `WebSite`, `Person`/`ProfilePage` all parse with **no
errors** (warnings about optional fields are acceptable).

Validate social previews with the LinkedIn Post Inspector and X Card Validator (or paste a URL into
a Slack DM to yourself).

---

## Acceptance checklist

- [ ] `ogImageFor()` (and any new exports) added to `src/lib/seo.ts`.
- [ ] `public/og-default.png` exists, 1200×630, < 200 KB, served with `content-type: image/png`.
- [ ] Root layout emits `openGraph` + `twitter` defaults with an **absolute** og:image URL.
- [ ] Posts emit `og:type=article`, `article:published_time`, `article:modified_time`, tags, and a
      `summary_large_image` Twitter card.
- [ ] Series pages emit Open Graph + canonical.
- [ ] `/blog` and `/contact` have descriptions + self-canonicals.
- [ ] `src/components/JsonLd.tsx` created.
- [ ] Home renders `WebSite` (with `SearchAction`) + `Person` JSON-LD.
- [ ] Posts render `BlogPosting` + `BreadcrumbList` JSON-LD that reference `#person`/`#website`.
- [ ] About page split into server `page.tsx` + `AboutClient.tsx`; emits `title`, description,
      canonical, and `ProfilePage`/`Person` schema; interactive sections still work.
- [ ] Rich Results Test + Schema Validator pass with no errors on a deployed/preview URL.
- [ ] `npm run build` clean; all `curl` assertions pass.

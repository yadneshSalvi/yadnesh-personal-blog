# 03 — Website: routes, rendering, SEO, subscribe UX

The web archive is not a courtesy copy of the email; it is the product's home, the SEO
surface, the sample issue, and the thing summarizer apps cannot flatten. Email is a
delivery channel for it.

## 1. Information architecture

One unified section. A daily+weekly pair from one author is one product with two
cadences (Stratechery's model), so there is exactly one landing/conversion page.

```
/brief                          landing: pitch + subscribe + latest daily + latest weekly + recent archive
/brief/archive                  full archive, filterable; page 1 indexed
/brief/archive/page/[n]         noindex,follow
/brief/daily/[date]             /brief/daily/2026-08-10
/brief/weekly/[week]            /brief/weekly/2026-W33  (+ redirect alias /brief/weekly/33)
/brief/story/[storyId]          per-story permalink (differentiator #1, see §7)
/brief/topics/[topic]           topic archive (index only curated ones)
/brief/how-it-works             the transparency page (disclosure target, E-E-A-T asset)
/brief/stats                    coverage stats (differentiator)
/brief/preferences              token-authed cadence prefs + unsubscribe confirm
/brief/confirm-sent, /brief/welcome   double-opt-in flow pages (04)
```

URL rules: **date-keyed, never generated slugs** (slug generation is a failure mode in an
automated pipeline; TLDR's exact pattern). ISO week for weeklies (sorts lexically,
derivable, renumber-proof; issue number is display metadata only). Topic-rich text goes
in `<title>`/H1, not the URL. Blog routes are untouched.

## 2. Rendering (Next.js 16 specifics)

- Issue pages read `content/brief/**.json` and render through React components
  (`<LeadStory>`, `<IssueSection>`, `<StoryRow>`, `<EditorNote>`, `<CorrectionsBlock>`,
  `<WeeklyThroughLine>`). No MDX for issues.
- With Cache Components, static generation is explicit: `generateStaticParams()` over
  the content dir + `"use cache"` / `cacheLife("max")` on issue pages (immutable after
  publication). **Plan the build-cost horizon now:** `generateStaticParams` returns only
  the last ~90 days; older issues render on demand and cache indefinitely. (~420 issues
  a year makes fully-static generation slow by year two.)
- Issue page chrome vs email: breadcrumb + date + prev/next issue nav; per-story anchors
  (`#story-3`) with copy-link buttons; topic chips; reading time; inline subscribe CTA
  after the second story + unobtrusive sticky footer CTA; "related issues" links (2–3,
  computed from shared topics/clusters, automated); site footer. No email UTMs on
  internal web links.

## 3. SEO strategy (protecting the blog is the priority)

Google's helpful-content system evaluates **site-wide**; a pattern of thin auto-generated
pages can drag down the hand-written posts. Design order:

1. **Original commentary is the antidote**: the lead skeleton, `— Y:` notes, and weekly
   through-line are the "original analysis" signal, and they are already in the product.
2. **Quality gate on indexing**: weeklies always `index: true`; dailies indexed only if
   they clear a threshold the pipeline computes (e.g., ≥300 words of non-quoted original
   text AND a filled lead skeleton; thin days are `noindex`). Render
   `<meta name="robots" content="noindex,follow">` when false — `follow` keeps link
   equity moving to the archive and blog.
3. Pagination and long-tail topic pages: `noindex,follow`. Index only topic pages given
   a hand-written description.
4. Every issue self-canonical (absolute URL). **Never canonical to a noindexed page.**
   Any future syndication canonicals back here.
5. Titles name the searchable topics, not the date: `{2–3 lead topics} · The Brief,
   {date}` pattern; generator produces titles (low-stakes), never slugs.
6. Structured data: `BlogPosting` per issue (headline, datePublished, author Person +
   `sameAs`, mainEntityOfPage); optional secondary `Periodical`/`PublicationIssue`
   node (correct semantics, no rich-result support — cheap, do it for AI-answer-engine
   consumers); `ItemList` on the archive; keep the site's existing `WebSite` schema.
   In 2026 structured data earns AI citations (Overviews/Perplexity/Claude) as much as
   blue links; for this content that channel matters more than SERP rank.
7. **Split sitemaps** (`sitemap-brief.xml` vs existing) so Search Console shows brief
   indexation separately: this is the early-warning system. If brief pages start getting
   "crawled, not indexed" at scale, tighten the gate before it hurts the blog.
8. The conversion path search feeds: story/issue page → inline CTA → topic page proving
   longitudinal depth → subscribe. That is why topic pages and CTAs exist.

## 4. Feeds

`/feed.xml` keeps meaning "hand-written blog posts" — changing an established feed's
meaning churns long-time RSS readers. Add:

| Feed | Path |
|---|---|
| Everything (posts + brief) | `/feed-all.xml` |
| Brief, both cadences | `/brief/feed.xml` |
| Daily only | `/brief/daily/feed.xml` |
| Weekly only | `/brief/weekly/feed.xml` |
| Per topic (auto) | `/brief/topics/[topic]/feed.xml` |

Full content in feeds (this audience is RSS-native), JSON Feed siblings where cheap,
generated statically at build (`feed` npm package emits RSS+Atom+JSON from one object),
declared in `metadata.alternates.types` (Next supports multiple titled feeds). Announce
`/feed-all.xml` in a blog post when it ships. Also expose `/brief/api/issues.json`
(machine-readable index) — AI answer engines are a real referral channel for AI content.

## 5. Subscribe UX

- **Form:** single email field + cadence choice + button reading "Get the brief".
  Cadence radio: `Both (daily ~4 min + Sunday deep-dive)` / `Daily only` / `Weekly
  only`, **weekly pre-selected** (safest retention default; flip to Both later if the
  daily proves ≤5 min honest). State the schedule literally under the form: "Weekdays
  8:45am IST + Sundays. Unsubscribe in one click." Cadence choice at signup is rare
  (80% of sites lack it) and measurably cuts later unsubscribes; it is also the granular
  consent GDPR likes.
- **Placement:** dedicated `/brief` landing above the fold; inline on issue pages after
  story 2 (the reader just experienced the product); persistent quiet footer slot
  site-wide; top+bottom of the archive. **No exit-intent, no popups** (2.8% average
  conversion for a reputational cost a personal blog should not pay).
- **Social proof ladder** (in order of availability): "read the latest issue" link beside
  the form from day one (the archive IS the sample; never gate it); "what you get"
  structural promise (3 bullets); named-reader quotes after month one (ask five real
  readers); subscriber count only past ~1,000 (before that, weekly-signup momentum if
  anything); publishing our own engagement stats later (credible for an AI/data site,
  ties to `/brief/stats`).
- Bot protection on the form: honeypot + timing check + Cloudflare Turnstile
  (free tier suffices) validated server-side, then double opt-in (04) as the final
  filter.

## 6. Content safety in the build

- **CI (on the PR):** hard-fail validation — schema (zod), URLs resolve, no dupes vs
  last 7 issues, no placeholder strings, date/filename match, house-style glyph scan.
  A broken generation never merges. This plus the Vercel preview is the whole reason
  publishing goes through PRs.
- **Production build:** skip-and-warn — an invalid issue file is filtered out with a
  loud log, everything else builds. One bad file must never block deploys of the blog.
  (Fail-hard belongs in CI, availability belongs in prod.)
- Drafts (`status: "draft"`) render only when `VERCEL_ENV !== 'production'`; excluded
  from archive, feeds, sitemaps.

## 7. Differentiation features (build order = listed order)

Context: summarizer apps already dedupe and strip link-roundups; being a well-formatted
list of links is a solved, zero-margin product. These are what a summarizer can't flatten:

1. **Per-story permalinks** (`/brief/story/[id]`): source link, our summary + any editor
   note, topic tags, "appeared in issues …". Shareable single stories, stable backlink
   targets, search results that answer specific queries. Feed `story_id`s make this
   nearly free — almost no newsletter site has it.
2. **Story threading:** the feed's `cluster` field detects recurrence; render "3rd
   appearance — see the thread" on stories and a thread timeline view on the story page.
   A view of how a story developed over six weeks is an artifact no link-roundup can
   produce.
3. **`/brief/how-it-works`:** the pipeline explained — models, source list, selection
   criteria, what is automated vs reviewed, error/correction policy, even costs.
   Thematically perfect, uncopyable, link-bait, satisfies the disclosure-detail
   preference (two-thirds of readers want detail available; almost none want it inline).
4. **Interactive archive:** client-side search over a prebuilt index (Pagefind or the
   site's existing Fuse.js), filter by topic/source/cadence. Mobile-first; archive
   browsing is mostly mobile.
5. **`/brief/stats`:** which labs/topics dominated the last 90 days, source diversity,
   trend charts, plus honest engagement numbers once real. Regenerates itself from issue
   JSON; evergreen.
6. **`/brief/best`:** hand-picked (genuinely, by Yadnesh) stories of the quarter/year.
   The one page automation must not write.
7. **Reliability as pitch copy** on the landing page: an automated pipeline can promise
   "every weekday at 8:45, without fail" in a way no human newsletter honestly can.
   Lean into it; it is the voice decision (transparent agent-curated) turned into a
   benefit.

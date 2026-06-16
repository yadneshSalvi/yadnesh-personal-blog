import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import TOC from "@/components/TOC";
import ZoomableImage from "@/components/ZoomableImage";
import JsonLd from "@/components/JsonLd";
import { getAllPostSlugs, getPostBySlug, getPostMetaBySlug } from "@/lib/posts";
import { getSeriesContextForPost } from "@/lib/series";
import { SITE_DESCRIPTION, SITE_URL, AUTHOR, absoluteUrl, ogImageFor } from "@/lib/seo";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = getPostMetaBySlug(slug);
  if (!meta) return {};

  // Description precedence: explicit description → subtitle → site default.
  const description = meta.description ?? meta.subtitle ?? SITE_DESCRIPTION;
  const url = `/blog/${slug}`;

  // Note: og:image / twitter:image are supplied by the file-based
  // `opengraph-image.tsx` (a per-post generated card). We intentionally do NOT
  // set openGraph.images / twitter.images here — config-based images override
  // the file convention in Next, which would suppress the generated card.
  return {
    title: meta.title, // root template appends " · Yadnesh Salvi"
    description,
    keywords: meta.tags,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: meta.title,
      description,
      url,
      publishedTime: meta.createdAt,
      modifiedTime: meta.updatedAt,
      authors: [`${SITE_URL}/about`],
      tags: meta.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description,
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return notFound();
  const { meta, content, headings } = post;
  const seriesCtx = getSeriesContextForPost(meta);
  const updatedDiffers =
    formatDate(meta.updatedAt) !== formatDate(meta.createdAt);

  const postUrl = absoluteUrl(`/blog/${slug}`);
  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${postUrl}#article`,
    headline: meta.title,
    description: meta.description ?? meta.subtitle ?? undefined,
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

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <JsonLd data={blogPostingSchema} />
      <JsonLd data={breadcrumbSchema} />
      <div className="grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)]">
        <TOC
          key={slug}
          contentSelector="#post-content"
          initialHeadings={headings}
        />
        <article className="w-full max-w-3xl lg:mx-auto">
          <header>
            {seriesCtx ? (
              <p className="mb-3">
                <Link
                  href={`/series/${seriesCtx.series.slug}`}
                  className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint transition-colors hover:text-accent"
                >
                  Series · {seriesCtx.series.name} · Part {seriesCtx.part} of{" "}
                  {seriesCtx.totalParts}
                </Link>
              </p>
            ) : null}
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
              <time dateTime={meta.createdAt}>{formatDate(meta.createdAt)}</time>
              {updatedDiffers ? (
                <>
                  {" · Updated "}
                  <time dateTime={meta.updatedAt}>
                    {formatDate(meta.updatedAt)}
                  </time>
                </>
              ) : null}
              {meta.readingTime ? <> · {meta.readingTime} min read</> : null}
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-[1.12] tracking-tight text-ink sm:text-5xl">
              {meta.title}
            </h1>
            {meta.subtitle ? (
              <p className="mt-4 font-serif text-xl italic leading-relaxed text-muted">
                {meta.subtitle}
              </p>
            ) : null}
            {meta.tags && meta.tags.length > 0 ? (
              <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.15em] text-faint">
                {meta.tags.join(" · ")}
              </p>
            ) : null}
          </header>

          {meta.image ? (
            <ZoomableImage
              src={meta.image}
              srcDark={meta.imageDark}
              alt={meta.imageAlt ?? `Cover illustration for “${meta.title}”`}
              width={1280}
              height={720}
              priority
              frameClassName="mt-10 overflow-hidden rounded-sm border border-line"
              imageClassName="h-auto w-full object-cover"
              zoomLabel={`Enlarge cover image for ${meta.title}`}
            />
          ) : null}

          <div
            id="post-content"
            className="prose mt-10 max-w-none scroll-smooth dark:prose-invert"
          >
            {content}
          </div>
        </article>
      </div>
    </main>
  );
}

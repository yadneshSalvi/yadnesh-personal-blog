import Link from "next/link";
import { notFound } from "next/navigation";
import TOC from "@/components/TOC";
import ZoomableImage from "@/components/ZoomableImage";
import { getAllPostSlugs, getPostBySlug } from "@/lib/posts";
import { getSeriesContextForPost } from "@/lib/series";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return getAllPostSlugs().map((slug) => ({ slug }));
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

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
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
              alt=""
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

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllSeriesSlugs, getSeriesBySlug } from "@/lib/series";
import { formatDate } from "@/components/PostList";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return getAllSeriesSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);
  if (!series) return {};
  return { title: series.meta.name, description: series.meta.tagline };
}

function AccentName({ name, accentWord }: { name: string; accentWord?: string }) {
  const idx = accentWord ? name.indexOf(accentWord) : -1;
  if (!accentWord || idx < 0) return <>{name}</>;
  return (
    <>
      {name.slice(0, idx)}
      <em className="italic text-accent">{accentWord}</em>
      {name.slice(idx + accentWord.length)}
    </>
  );
}

function ThemedImage({
  src,
  srcDark,
  alt,
  width,
  height,
  priority,
}: {
  src: string;
  srcDark?: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}) {
  const img = (variant: string, className: string) => (
    <Image
      src={variant}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      unoptimized={variant.endsWith(".svg")}
      className={className}
    />
  );
  if (!srcDark) return img(src, "h-auto w-full object-cover");
  return (
    <>
      {img(src, "h-auto w-full object-cover dark:hidden")}
      {img(srcDark, "hidden h-auto w-full object-cover dark:block")}
    </>
  );
}

/** "LangGraph from Scratch, Part 1: Installation & Setup" -> "Installation & Setup" */
function shortPartTitle(title: string): string {
  return title.replace(/^.*Part \d+:\s*/, "");
}

export default async function SeriesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const series = await getSeriesBySlug(slug);
  if (!series) return notFound();
  const { meta, parts, intro } = series;

  const published = parts.length;
  const planned = meta.plannedParts ?? published;
  const totalMinutes = parts.reduce((sum, p) => sum + (p.readingTime ?? 0), 0);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
          Series · {published} of {planned} parts · {totalMinutes} min so far
        </p>
        <h1 className="mt-4 font-serif text-5xl leading-[1.08] tracking-tight text-ink sm:text-6xl">
          <AccentName name={meta.name} accentWord={meta.accentWord} />
        </h1>
        {meta.tagline ? (
          <p className="mt-5 max-w-xl font-serif text-xl italic leading-relaxed text-muted">
            {meta.tagline}
          </p>
        ) : null}
      </header>

      {meta.image ? (
        <div className="mt-10 overflow-hidden rounded-sm border border-line">
          <ThemedImage
            src={meta.image}
            srcDark={meta.imageDark}
            alt=""
            width={1280}
            height={720}
            priority
          />
        </div>
      ) : null}

      <div className="prose mt-10 max-w-none dark:prose-invert">{intro}</div>

      {parts.length > 0 ? (
        <p className="mt-8">
          <Link
            href={`/blog/${parts[0].slug}`}
            className="font-mono text-xs uppercase tracking-[0.15em] text-accent transition-colors hover:text-ink"
          >
            Start with Part 1 →
          </Link>
        </p>
      ) : null}

      <section className="mt-16">
        <h2 className="border-b border-line pb-4 font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
          The parts
        </h2>
        <ol className="divide-y divide-line border-b border-line">
          {parts.map((part) => (
            <li key={part.slug}>
              <Link
                href={`/blog/${part.slug}`}
                className="group flex flex-col gap-5 py-8 sm:flex-row sm:items-center sm:gap-8"
              >
                {part.image ? (
                  <div className="w-full shrink-0 overflow-hidden rounded-sm border border-line sm:w-52">
                    <ThemedImage
                      src={part.image}
                      srcDark={part.imageDark}
                      alt=""
                      width={1280}
                      height={720}
                    />
                  </div>
                ) : null}
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
                    Part {String(part.seriesPart ?? 0).padStart(2, "0")}
                  </p>
                  <h3 className="mt-2 font-serif text-2xl leading-snug tracking-tight text-ink transition-colors group-hover:text-accent">
                    {shortPartTitle(part.title)}
                  </h3>
                  {part.subtitle ? (
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                      {part.subtitle}
                    </p>
                  ) : null}
                  <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.15em] text-faint">
                    <time dateTime={part.createdAt}>
                      {formatDate(part.createdAt)}
                    </time>
                    {typeof part.readingTime === "number" ? (
                      <> · {part.readingTime} min</>
                    ) : null}
                  </p>
                </div>
                <span
                  aria-hidden
                  className="hidden font-serif text-xl text-faint transition-all group-hover:translate-x-1 group-hover:text-accent sm:block"
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ol>
        {published < planned ? (
          <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.15em] text-faint">
            Parts {String(published + 1).padStart(2, "0")}–
            {String(planned).padStart(2, "0")} are being written. They appear
            here as they ship.
          </p>
        ) : null}
      </section>
    </main>
  );
}

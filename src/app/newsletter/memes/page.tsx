import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/brief/IssueNav";
import ZoomableImage from "@/components/ZoomableImage";
import { formatIssueDate } from "@/lib/brief/dates";
import { publicImageSize } from "@/lib/brief/imageSize";
import { getMemeGallery, type MemeGalleryEntry } from "@/lib/brief/memes";
import { BRIEF_NAME } from "@/lib/brief/seo";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: `Meme hall of fame · ${BRIEF_NAME}`,
  description:
    "Every meme the brief's pipeline drew, the ones that ran and the ones that did not.",
  alternates: { canonical: "/newsletter/memes" },
  // A gallery of in-jokes has no business in search results, but the issues it
  // links back to do.
  robots: { index: false, follow: true },
};

/**
 * The gallery grows by three or four drawings every weekday and nobody scrolls
 * past the first screen or two of it. Capping the page keeps a year-three
 * archive from shipping a thousand images to anyone who opens it; the count
 * line still tells the truth about how many there are.
 */
const GALLERY_LIMIT = 120;

export default function MemeHallOfFame() {
  const all = getMemeGallery();
  const entries = all.slice(0, GALLERY_LIMIT);
  const winners = all.filter((entry) => entry.candidate.winner).length;
  const capped = all.length > entries.length;

  return (
    <main className="mx-auto max-w-5xl px-6 py-16 sm:py-20">
      <Breadcrumb
        trail={[
          { label: "Home", href: "/" },
          { label: "Brief", href: "/newsletter" },
          { label: "Hall of fame" },
        ]}
      />

      <header className="mt-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
          Hall of fame
        </p>
        <h1 className="mt-4 font-serif text-4xl leading-[1.12] tracking-tight text-ink sm:text-5xl">
          Every meme, including the ones that didn&apos;t make it
        </h1>
        <p className="mt-5 max-w-2xl font-serif text-xl italic leading-relaxed text-muted">
          One ran in the issue that morning. The rest were drawn the same day and
          lost. They are all here, because the runner-ups are usually the reason
          the winner is any good.
        </p>
        {all.length > 0 ? (
          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
            {all.length} drawn · {winners} ran
            {capped ? ` · showing the most recent ${entries.length}` : ""}
          </p>
        ) : null}
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
          Drawn by an image model.
        </p>
      </header>

      {entries.length === 0 ? (
        <p className="mt-14 leading-relaxed text-muted">
          Nothing here yet. The first one shows up with the first issue that
          earns a joke.
        </p>
      ) : (
        <ul className="mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2">
          {entries.map((entry) => (
            <MemeCard
              key={`${entry.issueId}-${entry.candidate.id}`}
              entry={entry}
            />
          ))}
        </ul>
      )}
    </main>
  );
}

function MemeCard({ entry }: { entry: MemeGalleryEntry }) {
  const { candidate, issueType, issueId, date } = entry;
  const { width, height } = publicImageSize(candidate.image);
  const dateLabel = formatIssueDate(date);

  return (
    <li>
      {/* No title attribute anywhere on this page. A title belongs on the img
          rather than the figure, and here the bonus line is already rendered
          visibly below, so a tooltip would only repeat what is on screen and
          make a screen reader say it twice. The hidden version is the issue
          page's easter egg. */}
      <figure>
        <ZoomableImage
          src={candidate.image}
          alt={candidate.alt}
          width={width}
          height={height}
          frameClassName="overflow-hidden rounded-sm border border-line"
          imageClassName="h-auto w-full dark:brightness-[0.85]"
          sizes="(max-width: 640px) calc(100vw - 3rem), 460px"
          // The sources are already ~100KB webp, so the optimizer has nothing
          // to win here and would bill per source image. In-issue figures keep
          // it; a wall of thumbnails does not need it.
          unoptimized
        />
        <figcaption className="mt-3 space-y-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
            {candidate.winner ? (
              <Link
                href={`/newsletter/${issueType}/${issueId}#meme`}
                className="text-accent transition-colors hover:text-ink"
              >
                Ran on {dateLabel}
              </Link>
            ) : (
              <>Runner-up · {dateLabel}</>
            )}
          </p>
          <p className="font-mono text-xs leading-relaxed text-faint">
            {candidate.caption}
          </p>
          {/* The bonus line. It hides in a title attribute on issue pages,
              which is the joke, but a title attribute does not exist on a
              phone and is announced inconsistently by screen readers. The
              gallery is the browse context, so here it is simply visible. */}
          {candidate.alt_joke ? (
            <p className="font-mono text-[11px] italic leading-relaxed text-faint">
              {candidate.alt_joke}
            </p>
          ) : null}
        </figcaption>
      </figure>
    </li>
  );
}

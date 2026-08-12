import Link from "next/link";
import clsx from "clsx";
import type { BriefStory } from "@/lib/brief/schema";
import CopyLinkButton from "./CopyLinkButton";
import PlainWordsToggle from "./PlainWordsToggle";
import StoryImage, { GutterTick } from "./StoryImage";

export function storyAnchor(story: BriefStory): string {
  return `story-${story.story_id}`;
}

/** "Exact Title (Organization)", the Import AI link-text convention. */
export function StoryLink({ story }: { story: BriefStory }) {
  return (
    <a
      href={story.url}
      target="_blank"
      rel="noreferrer"
      className="text-ink transition-colors hover:text-accent"
    >
      {story.title}{" "}
      <span className="text-muted">({story.source_name})</span>
    </a>
  );
}

/** The mono line under a headline: annotation, flags, and the permalink. */
export function StoryMeta({
  story,
  threadLabel,
}: {
  story: BriefStory;
  threadLabel?: string | null;
}) {
  const bits: React.ReactNode[] = [];
  if (story.read_annotation) bits.push(story.read_annotation);
  if (story.paywalled) bits.push("paywalled");
  if (story.via) bits.push(`via ${story.via}`);
  if (story.hn_points !== null) bits.push(`${story.hn_points} points on HN`);

  return (
    <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
      {bits.map((bit, i) => (
        <span key={i}>
          {i > 0 ? " · " : null}
          {bit}
        </span>
      ))}
      {bits.length > 0 ? " · " : null}
      <Link
        href={`/newsletter/story/${story.story_id}`}
        className="transition-colors hover:text-accent"
      >
        Story page
      </Link>
      {threadLabel ? (
        <>
          {" · "}
          <Link
            href={`/newsletter/story/${story.story_id}#thread`}
            className="text-accent transition-colors hover:text-ink"
          >
            {threadLabel}
          </Link>
        </>
      ) : null}
    </p>
  );
}

/**
 * The row's picture column, when its section has one.
 *
 * The gutter is reserved per section rather than per row, and that is the whole
 * trick that lets a section mix stories with art and stories without: the text
 * column's left edge never moves, so the list still scans as one list. A row
 * with no picture gets a tick rather than a hole.
 */
export const GUTTER_GRID =
  "grid grid-cols-[minmax(0,1fr)_4.5rem] gap-x-4 sm:grid-cols-[minmax(0,1fr)_8.5rem] sm:gap-x-6 lg:grid-cols-[minmax(0,1fr)_10.5rem]";

export default function StoryRow({
  story,
  threadLabel,
  reserveGutter = false,
  children,
}: {
  story: BriefStory;
  threadLabel?: string | null;
  /** True when any story in this section carries a picture. */
  reserveGutter?: boolean;
  /** Editor notes attached to this story render here, under the summary. */
  children?: React.ReactNode;
}) {
  const anchor = storyAnchor(story);
  return (
    <li
      id={anchor}
      className={clsx("scroll-mt-24 py-6", reserveGutter && GUTTER_GRID)}
    >
      <div className="min-w-0">
        <div className="flex items-baseline justify-between gap-4">
          <h4 className="font-serif text-xl leading-snug tracking-tight">
            <StoryLink story={story} />
          </h4>
          <CopyLinkButton anchor={anchor} label={story.title} />
        </div>
        <StoryMeta story={story} threadLabel={threadLabel} />
        <p className="mt-3 leading-relaxed text-muted">{story.summary}</p>
        {story.simple_summary ? (
          <PlainWordsToggle bullets={story.simple_summary} />
        ) : null}
        {children}
      </div>
      {reserveGutter ? (
        <div>
          {story.image ? <StoryImage image={story.image} /> : <GutterTick />}
        </div>
      ) : null}
    </li>
  );
}

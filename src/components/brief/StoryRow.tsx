import Link from "next/link";
import type { BriefStory } from "@/lib/brief/schema";
import CopyLinkButton from "./CopyLinkButton";
import PlainWordsToggle from "./PlainWordsToggle";
import StoryImage from "./StoryImage";

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
 * A story in a section list.
 *
 * Everything runs at the full measure in one column, and the picture is a plate
 * under the summary rather than a thumbnail beside the headline. The side
 * gutter this replaced cost every row about 200px of measure so that half of
 * them could show art too small to read, and it put the headline, the copy
 * button and the picture in the same narrow band, where they collided.
 *
 * The left edge is invariant because there is only one column now, so a section
 * that mixes stories with art and stories without needs no reserved space and
 * no placeholder mark. A row without a picture is simply a row of text.
 */
export default function StoryRow({
  story,
  threadLabel,
  children,
}: {
  story: BriefStory;
  threadLabel?: string | null;
  /** Editor notes attached to this story render here, under the summary. */
  children?: React.ReactNode;
}) {
  const anchor = storyAnchor(story);
  return (
    <li id={anchor} className="scroll-mt-24 py-6">
      <div className="flex items-baseline justify-between gap-4">
        <h4 className="font-serif text-xl leading-snug tracking-tight">
          <StoryLink story={story} />
        </h4>
        <CopyLinkButton anchor={anchor} label={story.title} />
      </div>
      <StoryMeta story={story} threadLabel={threadLabel} />
      <p className="mt-3 leading-relaxed text-muted">{story.summary}</p>
      {/* The disclosure stays next to the prose it discloses, and the plate
          closes the row. With the picture between them, a control sat 288
          pixels of drawing away from its own subject. */}
      {story.simple_summary ? (
        <PlainWordsToggle bullets={story.simple_summary} />
      ) : null}
      {story.image ? <StoryImage image={story.image} /> : null}
      {children}
    </li>
  );
}

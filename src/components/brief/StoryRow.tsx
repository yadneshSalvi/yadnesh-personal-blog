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
 * The title band: headline, copy button and meta line. It is the left half of
 * a two-column band when the story has a picture, and the full width when it
 * does not.
 */
export function StoryHead({
  story,
  threadLabel,
  anchor,
}: {
  story: BriefStory;
  threadLabel?: string | null;
  anchor: string;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-4">
        <h4 className="font-serif text-xl leading-snug tracking-tight">
          <StoryLink story={story} />
        </h4>
        <CopyLinkButton anchor={anchor} label={story.title} />
      </div>
      <StoryMeta story={story} threadLabel={threadLabel} />
    </div>
  );
}

/**
 * A story in a section list.
 *
 * A story with a picture opens on a two-column band: the headline, its copy
 * button and the meta line on the left, the diagram on the right. Everything
 * that follows, the summary, the plain-words disclosure and any editor note,
 * runs the full measure underneath. A story without a picture is that same
 * stack with no band, so the left text edge never moves between rows.
 *
 * The band splits at md rather than sm. Half of a phone's measure is under
 * 200px, and these diagrams carry labels that stop being readable well before
 * that, so below md the picture takes the full width under the title instead.
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
  const head = (
    <StoryHead story={story} threadLabel={threadLabel} anchor={anchor} />
  );

  return (
    <li id={anchor} className="scroll-mt-24 py-6">
      {story.image ? (
        <div className="grid gap-x-6 md:grid-cols-2 md:items-center">
          {head}
          <StoryImage image={story.image} />
        </div>
      ) : (
        head
      )}
      <p className="mt-4 leading-relaxed text-muted">{story.summary}</p>
      {story.simple_summary ? (
        <PlainWordsToggle bullets={story.simple_summary} />
      ) : null}
      {children}
    </li>
  );
}

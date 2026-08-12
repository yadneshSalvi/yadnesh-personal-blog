import Link from "next/link";
import clsx from "clsx";
import type { BriefIssue } from "@/lib/brief/schema";
import { issueDateLabel } from "@/lib/brief/dates";
import { issueHref } from "@/lib/brief/seo";
import { COVER_BOX, HERO_SIZES, LIST_THUMB_SIZES } from "@/lib/brief/artwork";
import ThemedArt from "./ThemedArt";

/**
 * An issue as a card, in the two sizes the landing page needs.
 *
 * `hero` leads the page with the cover at full measure: the landing's job is to
 * show what an issue looks like before it asks for an email address, and a
 * picture does that in less time than three paragraphs about a pipeline.
 * `compact` hangs a thumbnail on the right, the same shape as an archive row.
 *
 * Both are entirely clickable, which is what earns them a hover treatment the
 * story rows do not get.
 */
export default function IssueCard({
  issue,
  label,
  variant = "compact",
  priority,
}: {
  issue: BriefIssue;
  label: string;
  variant?: "hero" | "compact";
  priority?: boolean;
}) {
  const cover = issue.cover;
  const meta = `${issueDateLabel(issue.type, issue.id)} · ${issue.read_minutes} min`;

  const kicker = (
    <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
      <span aria-hidden className="h-px w-6 bg-accent" />
      {label}
    </p>
  );

  if (variant === "hero") {
    return (
      <Link href={issueHref(issue)} className="group block">
        {cover ? (
          <div
            className={`${COVER_BOX} overflow-hidden rounded-sm border border-line`}
          >
            <ThemedArt
              art={cover}
              sizes={HERO_SIZES}
              priority={priority}
              className="hover-zoom object-cover"
            />
          </div>
        ) : null}
        <div className={clsx(cover && "mt-5")}>{kicker}</div>
        <h2 className="mt-3 font-serif text-3xl leading-[1.15] tracking-tight text-ink transition-colors group-hover:text-accent sm:text-4xl">
          {issue.title}
        </h2>
        <p className="mt-3 font-serif text-lg italic leading-relaxed text-muted">
          {issue.preheader}
        </p>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] tabular-nums text-faint">
          {meta}
        </p>
      </Link>
    );
  }

  return (
    <Link
      href={issueHref(issue)}
      className={clsx(
        "group grid gap-x-4 sm:gap-x-6",
        // The picture column is reserved only when there is a picture. An empty
        // 13rem gutter on a two-card page reads as a broken image, which is the
        // opposite of the problem the reserved gutter solves inside a section.
        cover
          ? "grid-cols-[minmax(0,1fr)_5rem] sm:grid-cols-[minmax(0,1fr)_13rem]"
          : "grid-cols-1",
      )}
    >
      <div className="min-w-0">
        {kicker}
        <h2 className="mt-3 font-serif text-2xl leading-snug tracking-tight text-ink transition-colors group-hover:text-accent">
          {issue.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">{issue.preheader}</p>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] tabular-nums text-faint">
          {meta}
        </p>
      </div>
      {cover ? (
        <div
          // self-start, or the grid stretches this to the text column's height
          // and the stretched height beats the aspect ratio.
          className={`${COVER_BOX} self-start overflow-hidden rounded-sm border border-line`}
        >
          <ThemedArt
            art={cover}
            sizes={LIST_THUMB_SIZES}
            className="hover-zoom object-cover"
          />
        </div>
      ) : null}
    </Link>
  );
}

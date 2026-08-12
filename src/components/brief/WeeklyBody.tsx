import Link from "next/link";
import type { BriefWeekly } from "@/lib/brief/schema";
import { StoryLink, StoryMeta, storyAnchor } from "./StoryRow";
import CopyLinkButton from "./CopyLinkButton";
import PlainWordsToggle from "./PlainWordsToggle";
import SectionHead from "./SectionHead";
import StoryImage from "./StoryImage";
import { Kicker, WeeklyThroughLine } from "./IssueParts";

export function WeekInFive({ lines }: { lines: string[] }) {
  return (
    <section id="week-in-five" className="scroll-mt-24">
      <SectionHead label="The week in five lines" count={lines.length} />
      <ol className="mt-5 space-y-3">
        {lines.map((line, i) => (
          <li key={i} className="grid grid-cols-[1.75rem_1fr] gap-x-3">
            <span className="pt-1 font-mono text-xs tabular-nums text-faint">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="leading-relaxed text-muted">{line}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function WhatMattered({
  picks,
}: {
  picks: BriefWeekly["what_mattered"];
}) {
  return (
    <section id="what-mattered" className="scroll-mt-24">
      <SectionHead label="What mattered" count={picks.length} />
      <ul className="mt-2 divide-y divide-line border-b border-line">
        {picks.map((pick) => {
          const anchor = storyAnchor(pick.story);
          return (
            <li key={pick.story.story_id} id={anchor} className="scroll-mt-24 py-7">
              {/* Same band as a section row, at the weekly's larger headline. */}
              {pick.story.image ? (
                <div className="grid gap-x-6 md:grid-cols-2 md:items-center">
                  <div className="min-w-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <h3 className="font-serif text-2xl leading-snug tracking-tight">
                        <StoryLink story={pick.story} />
                      </h3>
                      <CopyLinkButton anchor={anchor} label={pick.story.title} />
                    </div>
                    <StoryMeta story={pick.story} />
                  </div>
                  <StoryImage image={pick.story.image} />
                </div>
              ) : (
                <div className="min-w-0">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-serif text-2xl leading-snug tracking-tight">
                      <StoryLink story={pick.story} />
                    </h3>
                    <CopyLinkButton anchor={anchor} label={pick.story.title} />
                  </div>
                  <StoryMeta story={pick.story} />
                </div>
              )}
              <p className="mt-4 leading-relaxed text-muted">{pick.what}</p>
              <p className="mt-3 leading-relaxed text-muted">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink">
                  Yes, but:{" "}
                </span>
                {pick.yes_but}
              </p>
              <p className="mt-3 leading-relaxed text-muted">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink">
                  Why it matters:{" "}
                </span>
                {pick.why}
              </p>
              {pick.story.simple_summary ? (
                <PlainWordsToggle bullets={pick.story.simple_summary} />
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function QuietlyImportant({
  picks,
}: {
  picks: BriefWeekly["quietly_important"];
}) {
  if (picks.length === 0) return null;

  return (
    <section id="quietly-important" className="scroll-mt-24">
      <SectionHead label="Quietly important" count={picks.length} />
      <ul className="mt-2 divide-y divide-line border-b border-line">
        {picks.map((pick) => (
          <li
            key={pick.story.story_id}
            id={storyAnchor(pick.story)}
            className="scroll-mt-24 py-6"
          >
            {pick.story.image ? (
              <div className="grid gap-x-6 md:grid-cols-2 md:items-center">
                <div className="min-w-0">
                  <h4 className="font-serif text-xl leading-snug tracking-tight">
                    <StoryLink story={pick.story} />
                  </h4>
                  <StoryMeta story={pick.story} />
                </div>
                <StoryImage image={pick.story.image} />
              </div>
            ) : (
              <div className="min-w-0">
                <h4 className="font-serif text-xl leading-snug tracking-tight">
                  <StoryLink story={pick.story} />
                </h4>
                <StoryMeta story={pick.story} />
              </div>
            )}
            <p className="mt-4 leading-relaxed text-muted">{pick.note}</p>
            {pick.story.simple_summary ? (
              <PlainWordsToggle bullets={pick.story.simple_summary} />
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ThreadToWatch({
  thread,
}: {
  thread: BriefWeekly["thread_to_watch"];
}) {
  return (
    <section id="thread-to-watch" className="scroll-mt-24">
      <SectionHead label="Thread to watch" />
      <h3 className="mt-5 font-serif text-2xl leading-snug tracking-tight text-ink">
        {thread.title}
      </h3>
      <p className="mt-4 leading-relaxed text-muted">{thread.body}</p>
      {thread.story ? (
        <div className="mt-5">
          <h4 className="font-serif text-lg leading-snug">
            <StoryLink story={thread.story} />
          </h4>
          <StoryMeta story={thread.story} />
          <p className="mt-3 leading-relaxed text-muted">
            {thread.story.summary}
          </p>
        </div>
      ) : null}
      {thread.prior_threads_paid_off.length > 0 ? (
        <div className="mt-8 border-l-2 border-line pl-5">
          <Kicker>Paid off this week</Kicker>
          <ul className="mt-3 space-y-3">
            {thread.prior_threads_paid_off.map((prior, i) => (
              <li key={i} className="leading-relaxed text-muted">
                <span className="text-ink">{prior.title}.</span> {prior.body}
                {prior.issue_id ? (
                  <>
                    {" "}
                    <Link
                      href={`/newsletter/daily/${prior.issue_id}`}
                      className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent transition-colors hover:text-ink"
                    >
                      That issue →
                    </Link>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

export function DeepCuts({ stories }: { stories: BriefWeekly["deep_cuts"] }) {
  if (stories.length === 0) return null;
  return (
    <section id="deep-cuts" className="scroll-mt-24">
      <SectionHead label="Deep cuts" count={stories.length} />
      <ul className="mt-5 space-y-3">
        {stories.map((story) => (
          <li key={story.story_id} className="leading-snug">
            <StoryLink story={story} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export { WeeklyThroughLine };

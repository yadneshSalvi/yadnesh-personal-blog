import Link from "next/link";
import clsx from "clsx";
import type {
  BriefCorrection,
  BriefLead,
  BriefSection,
  BriefStory,
  BriefWeekly,
} from "@/lib/brief/schema";
import { sectionLabel, topicLabel } from "@/lib/brief/schema";
import StoryRow, { StoryLink, StoryMeta, storyAnchor } from "./StoryRow";
import CopyLinkButton from "./CopyLinkButton";
import PlainWordsToggle from "./PlainWordsToggle";
import SectionHead from "./SectionHead";

/** The mono kicker used above the issue's smaller blocks. */
export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
      {children}
    </p>
  );
}

/**
 * A drop cap needs a capital letter. On a digit it reads as a rendering fault,
 * on an opening quote as a stray mark, and on a lowercase initial it reads as a
 * typo three lines tall, which is what a paragraph opening with "xAI shipped"
 * or "vLLM now" would get. Any of those runs without one.
 *
 * Matching the Unicode uppercase category rather than A-Z also lets "Élan" and
 * "Über" keep theirs.
 */
export function dropCapEligible(text: string): boolean {
  return /^\p{Lu}/u.test(text.trim());
}

/**
 * The labeled skeleton. `Yes, but:` is structural, so it always renders.
 *
 * `What happened` is the exception: it leaves the list and becomes the opening
 * paragraph, larger and with the issue's one drop cap. The label was redundant
 * with its position (it is the first thing under the headline), and the first
 * paragraph of a five-minute read has to look different from the eight that
 * follow or the page reads as one flat column.
 *
 * The lead's own story picture is deliberately not rendered. The cover already
 * leads the page, and two large pictures in the first screen means neither one
 * is the dominant element.
 */
export function LeadStory({
  lead,
  threadLabel,
  notes = [],
}: {
  lead: BriefLead;
  threadLabel?: string | null;
  notes?: string[];
}) {
  const anchor = storyAnchor(lead.story);
  return (
    <section id={anchor} className="scroll-mt-24">
      <SectionHead label="The lead" />
      <div className="mt-5 flex items-baseline justify-between gap-4">
        <h2 className="font-serif text-[2.125rem] leading-[1.15] tracking-tight sm:text-[2.5rem]">
          <StoryLink story={lead.story} />
        </h2>
        <CopyLinkButton anchor={anchor} label={lead.story.title} />
      </div>
      <StoryMeta story={lead.story} threadLabel={threadLabel} />
      <p
        className={clsx(
          "mt-6 font-serif text-[1.375rem] leading-[1.55] text-ink",
          dropCapEligible(lead.what) && "dropcap",
        )}
      >
        {lead.what}
      </p>
      <dl className="mt-5 space-y-4 leading-relaxed text-muted">
        <LabeledLine label="The details" text={lead.details} />
        <LabeledLine
          label="Yes, but"
          text={lead.yes_but ?? lead.yes_but_waived ?? "No caveat recorded."}
        />
        <LabeledLine label="Why it matters" text={lead.why} />
      </dl>
      {lead.story.simple_summary ? (
        <PlainWordsToggle bullets={lead.story.simple_summary} />
      ) : null}
      {notes.map((text, i) => (
        <EditorNote key={i} text={text} />
      ))}
    </section>
  );
}

function LabeledLine({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <dt className="inline font-mono text-[11px] uppercase tracking-[0.14em] text-ink">
        {label}:{" "}
      </dt>
      <dd className="inline">{text}</dd>
    </div>
  );
}

export function IssueSection({
  section,
  threadLabels,
  notes,
}: {
  section: BriefSection;
  threadLabels?: Map<string, string>;
  notes?: Map<string, string[]>;
}) {
  return (
    <section id={`section-${section.key}`} className="scroll-mt-24">
      <SectionHead label={sectionLabel(section.key)} count={section.items.length} />
      <ul className="mt-2 divide-y divide-line border-b border-line">
        {section.items.map((story) => (
          <StoryRow
            key={story.story_id}
            story={story}
            threadLabel={threadLabels?.get(story.story_id) ?? null}
          >
            {(notes?.get(story.story_id) ?? []).map((text, i) => (
              <EditorNote key={i} text={text} />
            ))}
          </StoryRow>
        ))}
      </ul>
    </section>
  );
}

/** The `Y:` block. Italic, left rule, visibly not part of the reporting. */
export function EditorNote({ text }: { text: string }) {
  return (
    <aside className="my-8 border-l-2 border-accent pl-5">
      <p className="font-serif text-lg italic leading-relaxed text-muted">
        <span className="font-mono text-[11px] not-italic uppercase tracking-[0.2em] text-accent">
          Y:{" "}
        </span>
        {text}
      </p>
    </aside>
  );
}

export function QuickLinks({ stories }: { stories: BriefStory[] }) {
  if (stories.length === 0) return null;
  return (
    <section id="quick-links" className="scroll-mt-24">
      <Kicker>Quick links</Kicker>
      <ul className="mt-4 space-y-3">
        {stories.map((story) => (
          <li key={story.story_id} className="leading-snug">
            <StoryLink story={story} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export function CorrectionsBlock({
  corrections,
}: {
  corrections: BriefCorrection[];
}) {
  return (
    <section id="corrections" className="scroll-mt-24">
      <Kicker>Corrections</Kicker>
      {corrections.length === 0 ? (
        <p className="mt-4 leading-relaxed text-muted">Nothing to correct.</p>
      ) : (
        <ul className="mt-4 space-y-6">
          {corrections.map((correction, i) => (
            <li key={i} className="leading-relaxed text-muted">
              <p>
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink">
                  We said:{" "}
                </span>
                {correction.we_said}
              </p>
              <p className="mt-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink">
                  What&apos;s true:{" "}
                </span>
                {correction.whats_true}
              </p>
              {correction.issue_id && correction.issue_type ? (
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                  <Link
                    href={`/newsletter/${correction.issue_type}/${correction.issue_id}`}
                    className="transition-colors hover:text-accent"
                  >
                    The corrected issue
                  </Link>
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * The weekly's argued observation. `body_md` carries paragraph breaks only; the
 * generator writes plain paragraphs, so there is no markdown parser here.
 */
export function WeeklyThroughLine({
  throughLine,
}: {
  throughLine: BriefWeekly["through_line"];
}) {
  const paragraphs = throughLine.body_md
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <section id="through-line" className="scroll-mt-24">
      <SectionHead label="The through line" />
      <h2 className="mt-5 font-serif text-[2.125rem] leading-[1.15] tracking-tight text-ink sm:text-[2.5rem]">
        {throughLine.title}
      </h2>
      <div className="mt-6 space-y-5 leading-relaxed text-muted">
        {paragraphs.map((paragraph, i) =>
          // The weekly's one drop cap, the counterpart of the daily's lead.
          i === 0 ? (
            <p
              key={i}
              className={clsx(
                "font-serif text-[1.375rem] leading-[1.55] text-ink",
                dropCapEligible(paragraph) && "dropcap",
              )}
            >
              {paragraph}
            </p>
          ) : (
            <p key={i}>{paragraph}</p>
          ),
        )}
      </div>
    </section>
  );
}

export function TopicChips({ topics }: { topics: string[] }) {
  if (topics.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {topics.map((topic) => (
        <li key={topic}>
          <Link
            href={`/newsletter/topics/${topic}`}
            className="inline-block rounded-sm border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition-colors hover:border-accent hover:text-accent"
          >
            {topicLabel(topic)}
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Sits under the masthead, per plan 01 §5. Not buried in the footer. */
export function DisclosureLine() {
  return (
    <p className="mt-6 border-l-2 border-line pl-4 text-sm leading-relaxed text-faint">
      Curated and summarized by an agent pipeline built by Yadnesh; reviewed
      before send.{" "}
      <Link
        href="/newsletter/how-it-works"
        className="text-accent transition-colors hover:text-ink"
      >
        How this is made →
      </Link>
    </p>
  );
}

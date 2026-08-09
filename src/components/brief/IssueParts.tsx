import Link from "next/link";
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

/** The mono kicker used above every block in the issue. */
export function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
      {children}
    </p>
  );
}

/** The labeled skeleton. `Yes, but:` is structural, so it always renders. */
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
      <Kicker>The lead</Kicker>
      <div className="mt-4 flex items-baseline justify-between gap-4">
        <h2 className="font-serif text-3xl leading-tight tracking-tight">
          <StoryLink story={lead.story} />
        </h2>
        <CopyLinkButton anchor={anchor} label={lead.story.title} />
      </div>
      <StoryMeta story={lead.story} threadLabel={threadLabel} />
      <dl className="mt-6 space-y-4 leading-relaxed text-muted">
        <LabeledLine label="What happened" text={lead.what} />
        <LabeledLine label="The details" text={lead.details} />
        <LabeledLine
          label="Yes, but"
          text={lead.yes_but ?? lead.yes_but_waived ?? "No caveat recorded."}
        />
        <LabeledLine label="Why it matters" text={lead.why} />
      </dl>
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
      <Kicker>{sectionLabel(section.key)}</Kicker>
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
      <Kicker>The through line</Kicker>
      <h2 className="mt-4 font-serif text-3xl leading-tight tracking-tight text-ink">
        {throughLine.title}
      </h2>
      <div className="mt-6 space-y-5 leading-relaxed text-muted">
        {paragraphs.map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
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

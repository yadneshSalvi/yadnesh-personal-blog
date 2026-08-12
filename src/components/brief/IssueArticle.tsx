import JsonLd from "@/components/JsonLd";
import type { BriefIssue } from "@/lib/brief/schema";
import { issueDateLabel } from "@/lib/brief/dates";
import {
  getAdjacentIssues,
  getClusterThread,
  getRelatedIssues,
  issueOrdinal,
  issueTopics,
} from "@/lib/brief/issues";
import { allStories } from "@/lib/brief/text";
import {
  BRIEF_NAME,
  breadcrumbJsonLd,
  issueHref,
  issueJsonLd,
} from "@/lib/brief/seo";
import { SITE_URL, absoluteUrl } from "@/lib/seo";
import BriefSubscribeCTA from "./BriefSubscribeCTA";
import {
  CorrectionsBlock,
  DisclosureLine,
  EditorNote,
  IssueSection,
  Kicker,
  LeadStory,
  QuickLinks,
  TopicChips,
} from "./IssueParts";
import { ComicFigure, HedgeBlock, MemeFigure } from "./IssueHumor";
import { Breadcrumb, IssueNav, RelatedIssues } from "./IssueNav";
import IssueCover from "./IssueCover";
import IssueTOC from "./IssueTOC";
import ReadingProgress from "./ReadingProgress";
import SectionHead from "./SectionHead";
import { issueTocItems } from "./tocItems";
import StoryRow from "./StoryRow";
import {
  DeepCuts,
  QuietlyImportant,
  ThreadToWatch,
  WeekInFive,
  WeeklyThroughLine,
  WhatMattered,
} from "./WeeklyBody";

const ORDINALS = ["", "1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th", "9th"];

/**
 * "3rd appearance" labels for stories whose cluster has recurred. Computed from
 * the archive, so the pipeline never has to know how many times it has run a
 * thread.
 */
function threadLabels(issue: BriefIssue): Map<string, string> {
  const labels = new Map<string, string>();
  for (const story of allStories(issue)) {
    if (!story.cluster) continue;
    const thread = getClusterThread(story.cluster);
    if (thread.length < 2) continue;
    const position = thread.findIndex(
      (record) => record.storyId === story.story_id,
    );
    if (position < 1) continue;
    const ordinal = ORDINALS[position + 1] ?? `${position + 1}th`;
    labels.set(story.story_id, `${ordinal} appearance, see the thread`);
  }
  return labels;
}

function groupEditorNotes(issue: BriefIssue): {
  byStory: Map<string, string[]>;
  loose: string[];
} {
  const byStory = new Map<string, string[]>();
  const loose: string[] = [];
  for (const note of issue.editor_notes) {
    if (!note.after_story) {
      loose.push(note.text);
      continue;
    }
    byStory.set(note.after_story, [
      ...(byStory.get(note.after_story) ?? []),
      note.text,
    ]);
  }
  return { byStory, loose };
}

export default function IssueArticle({ issue }: { issue: BriefIssue }) {
  const { previous, next } = getAdjacentIssues(issue);
  const related = getRelatedIssues(issue, 3);
  const labels = threadLabels(issue);
  const { byStory, loose } = groupEditorNotes(issue);
  const dateLabel = issueDateLabel(issue.type, issue.id);
  const url = absoluteUrl(issueHref(issue));

  const cadence =
    issue.type === "weekly"
      ? issue.issue_number
        ? `Weekly #${issue.issue_number}`
        : "Weekly"
      : "Daily";

  // The inline CTA goes after the reader has experienced two stories.
  let storiesSoFar = issue.type === "daily" && issue.lead ? 1 : 0;
  const ctaAfterSectionIndex =
    issue.type === "daily"
      ? issue.sections.findIndex((section) => {
          storiesSoFar += section.items.length;
          return storiesSoFar >= 2;
        })
      : -1;

  // The folio's edition number. Weeklies already carry one for display; a daily
  // gets its position in the archive.
  const folioNumber =
    issue.type === "weekly" && issue.issue_number
      ? issue.issue_number
      : issueOrdinal(issue);

  return (
    <main className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
      <ReadingProgress />
      <JsonLd data={issueJsonLd(issue)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", url: SITE_URL },
          { name: BRIEF_NAME, url: absoluteUrl("/newsletter") },
          { name: "Archive", url: absoluteUrl("/newsletter/archive") },
          { name: issue.title, url },
        ])}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[auto_minmax(0,1fr)]">
        <IssueTOC items={issueTocItems(issue)} />
        {/* mx-auto, not the blog's lg:mx-auto: below lg there is no rail, and
            the issue column stayed centered before the rail existed. */}
        <article className="mx-auto w-full max-w-3xl">
          <Breadcrumb
            trail={[
              { label: "Home", href: "/" },
              { label: "Brief", href: "/newsletter" },
              { label: "Archive", href: "/newsletter/archive" },
              { label: dateLabel },
            ]}
          />

          <header className="mt-8">
            {/* The folio. An issue is an edition of something, and saying so
                above the title is what a printed masthead does. */}
            <div className="flex items-baseline justify-between gap-4 border-b border-line pb-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink">
                {BRIEF_NAME}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] tabular-nums text-faint">
                No. {String(folioNumber).padStart(3, "0")}
              </span>
            </div>
            <div className="mt-5">
              <Kicker>
                {cadence} · {dateLabel} · {issue.read_minutes} min read
                {issue.thin_day ? " · quiet day" : ""}
                {issue.status === "draft" ? " · draft" : ""}
              </Kicker>
            </div>
            <h1 className="mt-4 font-serif text-4xl leading-[1.12] tracking-tight text-ink sm:text-5xl">
              {issue.title}
            </h1>
            <p className="mt-4 font-serif text-xl italic leading-relaxed text-muted">
              {issue.preheader}
            </p>
            {issue.cover ? (
              <IssueCover cover={issue.cover} title={issue.title} />
            ) : null}
            {/* Both of these sit under the picture rather than above it: they
                are the header's footnotes, and between the deck and the cover
                they were what made the first screen trail off. */}
            <DisclosureLine />
            <div className="mt-6">
              <TopicChips topics={issueTopics(issue)} />
            </div>
          </header>

          <div className="mt-14 space-y-14">
            {issue.type === "daily" ? (
              <>
                {issue.lead ? (
                  <LeadStory
                    lead={issue.lead}
                    threadLabel={labels.get(issue.lead.story.story_id) ?? null}
                    notes={byStory.get(issue.lead.story.story_id) ?? []}
                  />
                ) : (
                  <section id="quiet-day" className="scroll-mt-24">
                    <Kicker>Quiet day</Kicker>
                    <p className="mt-4 leading-relaxed text-muted">
                      Not enough cleared the bar for a lead story today. Here is
                      what did, and nothing more. Padding a thin day is how a daily
                      loses you.
                    </p>
                  </section>
                )}
                {issue.sections.map((section, i) => (
                  <div key={section.key} className="space-y-14">
                    <IssueSection
                      section={section}
                      threadLabels={labels}
                      notes={byStory}
                    />
                    {i === ctaAfterSectionIndex ? (
                      <BriefSubscribeCTA variant="inline" />
                    ) : null}
                  </div>
                ))}
                {issue.hedge ? <HedgeBlock hedge={issue.hedge} /> : null}
              </>
            ) : (
              <>
                <WeekInFive lines={issue.weekly.week_in_five} />
                <WeeklyThroughLine throughLine={issue.weekly.through_line} />
                {issue.weekly.comic ? (
                  <ComicFigure comic={issue.weekly.comic} />
                ) : null}
                <BriefSubscribeCTA variant="inline" />
                <WhatMattered picks={issue.weekly.what_mattered} />
                <QuietlyImportant picks={issue.weekly.quietly_important} />
                <ThreadToWatch thread={issue.weekly.thread_to_watch} />
                <DeepCuts stories={issue.weekly.deep_cuts} />
              </>
            )}

            {issue.from_x.length > 0 ? (
              <section id="from-x" className="scroll-mt-24">
                <SectionHead label="From X" count={issue.from_x.length} />
                <ul className="mt-2 divide-y divide-line border-b border-line">
                  {issue.from_x.map((story) => (
                    <StoryRow
                      key={story.story_id}
                      story={story}
                      threadLabel={labels.get(story.story_id) ?? null}
                    >
                      {(byStory.get(story.story_id) ?? []).map((text, i) => (
                        <EditorNote key={i} text={text} />
                      ))}
                    </StoryRow>
                  ))}
                </ul>
              </section>
            ) : null}

            <QuickLinks stories={issue.quick_links} />

            {loose.map((text, i) => (
              <EditorNote key={i} text={text} />
            ))}

            {issue.meme ? (
              <>
                {/* The one ornament on the page: a short centered rule that
                    says the reporting is finished and a joke is next. */}
                <hr className="mx-auto h-px w-16 border-0 bg-line" />
                <MemeFigure meme={issue.meme} type={issue.type} />
              </>
            ) : null}

            <CorrectionsBlock corrections={issue.corrections} />
          </div>

          <div className="mt-16 space-y-16">
            <IssueNav previous={previous} next={next} />
            <RelatedIssues issues={related} />
            <BriefSubscribeCTA latestIssueHref={null} />
          </div>
        </article>
      </div>
    </main>
  );
}

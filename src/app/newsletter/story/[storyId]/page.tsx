import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/brief/IssueNav";
import { EditorNote, TopicChips } from "@/components/brief/IssueParts";
import BriefSubscribeCTA from "@/components/brief/BriefSubscribeCTA";
import { StoryLink, StoryMeta, storyAnchor } from "@/components/brief/StoryRow";
import {
  getClusterThread,
  getEditorNotesForStory,
  getStories,
  getStory,
} from "@/lib/brief/issues";
import { issueDateLabel, formatIssueDate } from "@/lib/brief/dates";
import { BRIEF_NAME } from "@/lib/brief/seo";

export const dynamic = "force-static";

const PLACEMENT_LABELS: Record<string, string> = {
  lead: "lead story",
  section: "in the sections",
  from_x: "from X",
  quick_link: "quick links",
  what_mattered: "what mattered",
  quietly_important: "quietly important",
  thread_to_watch: "thread to watch",
  deep_cut: "deep cuts",
};

export async function generateStaticParams() {
  return [...getStories().keys()].map((storyId) => ({ storyId }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storyId: string }>;
}): Promise<Metadata> {
  const { storyId } = await params;
  const record = getStory(storyId);
  if (!record) return {};
  // Quality gate, same logic as the daily's index flag: a story page earns an
  // index entry when it carries a thread or an editor note. A bare summary plus
  // an outbound link does not, and a pattern of those is what the
  // helpful-content system punishes site-wide.
  const hasDepth =
    getClusterThread(record.story.cluster).length > 1 ||
    getEditorNotesForStory(storyId).length > 0;
  return {
    title: `${record.story.title} · ${BRIEF_NAME}`,
    description: record.story.summary,
    alternates: { canonical: `/newsletter/story/${storyId}` },
    robots: hasDepth ? undefined : { index: false, follow: true },
  };
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ storyId: string }>;
}) {
  const { storyId } = await params;
  const record = getStory(storyId);
  if (!record) return notFound();

  const { story, appearances } = record;
  const thread = getClusterThread(story.cluster);
  const notes = getEditorNotesForStory(storyId);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <Breadcrumb
        trail={[
          { label: "Home", href: "/" },
          { label: "Brief", href: "/newsletter" },
          { label: "Archive", href: "/newsletter/archive" },
          { label: "Story" },
        ]}
      />

      <header className="mt-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
          Story · {story.source_name}
        </p>
        <h1 className="mt-4 font-serif text-4xl leading-[1.15] tracking-tight text-ink">
          <StoryLink story={story} />
        </h1>
        <StoryMeta story={story} />
      </header>

      <p className="mt-8 text-lg leading-relaxed text-muted">{story.summary}</p>

      {notes.length > 0 ? (
        <div className="mt-8">
          {notes.map((note, i) => (
            <EditorNote key={i} text={note.text} />
          ))}
        </div>
      ) : null}

      <div className="mt-8">
        <TopicChips topics={story.topics} />
      </div>

      <section className="mt-14">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
          Appeared in
        </p>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {appearances.map((appearance, i) => (
            <li key={i} className="py-4">
              <Link
                href={`/newsletter/${appearance.type}/${appearance.id}#${storyAnchor(story)}`}
                className="font-serif text-lg leading-snug text-ink transition-colors hover:text-accent"
              >
                {appearance.issueTitle}
              </Link>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                {issueDateLabel(appearance.type, appearance.id)} ·{" "}
                {PLACEMENT_LABELS[appearance.placement] ?? appearance.placement}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {thread.length > 1 ? (
        <section id="thread" className="mt-14 scroll-mt-24">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
            The thread · {thread.length} stories
          </p>
          <p className="mt-3 max-w-xl leading-relaxed text-muted">
            This story is part of a thread the pipeline has been tracking. Here
            is how it developed, oldest first.
          </p>
          <ol className="mt-6 border-l border-line pl-6">
            {thread.map((entry) => {
              const oldest = entry.appearances[entry.appearances.length - 1];
              const current = entry.storyId === story.story_id;
              return (
                <li key={entry.storyId} className="relative pb-8">
                  <span
                    aria-hidden
                    className={`absolute -left-[1.8rem] top-2 h-1.5 w-1.5 rounded-full ${current ? "bg-accent" : "bg-line"}`}
                  />
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                    {formatIssueDate(oldest.date)}
                  </p>
                  <p className="mt-1 font-serif text-lg leading-snug">
                    {current ? (
                      <span className="text-accent">{entry.story.title}</span>
                    ) : (
                      <Link
                        href={`/newsletter/story/${entry.storyId}`}
                        className="text-ink transition-colors hover:text-accent"
                      >
                        {entry.story.title}
                      </Link>
                    )}
                  </p>
                  <p className="mt-2 leading-relaxed text-muted">
                    {entry.story.summary}
                  </p>
                </li>
              );
            })}
          </ol>
        </section>
      ) : null}

      <div className="mt-16">
        <BriefSubscribeCTA />
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumb } from "@/components/brief/IssueNav";
import IssueList from "@/components/brief/IssueList";
import BriefSubscribeCTA from "@/components/brief/BriefSubscribeCTA";
import { StoryLink, StoryMeta } from "@/components/brief/StoryRow";
import { getIssuesForTopic, getStoriesForTopic, getTopics } from "@/lib/brief/issues";
import { topicLabel } from "@/lib/brief/schema";
import { BRIEF_NAME } from "@/lib/brief/seo";
import { CURATED_TOPICS } from "@/lib/brief/topics";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return getTopics().map((entry) => ({ topic: entry.topic }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ topic: string }>;
}): Promise<Metadata> {
  const { topic } = await params;
  const description = CURATED_TOPICS[topic];
  return {
    title: `${topicLabel(topic)} · ${BRIEF_NAME}`,
    description:
      description ??
      `Everything The Agentic Brief has covered under ${topicLabel(topic)}.`,
    alternates: { canonical: `/newsletter/topics/${topic}` },
    robots: description ? undefined : { index: false, follow: true },
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const stories = getStoriesForTopic(topic);
  if (stories.length === 0) return notFound();
  const issues = getIssuesForTopic(topic).slice(0, 10);
  const description = CURATED_TOPICS[topic];

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <Breadcrumb
        trail={[
          { label: "Home", href: "/" },
          { label: "Brief", href: "/newsletter" },
          { label: "Archive", href: "/newsletter/archive" },
          { label: topicLabel(topic) },
        ]}
      />

      <header className="mt-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
          Topic · {stories.length} stories
        </p>
        <h1 className="mt-4 font-serif text-5xl tracking-tight text-ink">
          {topicLabel(topic)}
        </h1>
        {description ? (
          <p className="mt-5 max-w-xl leading-relaxed text-muted">{description}</p>
        ) : null}
      </header>

      <section className="mt-14">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
          Stories
        </p>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {stories.map((record) => (
            <li key={record.storyId} className="py-6">
              <h2 className="font-serif text-xl leading-snug tracking-tight">
                <StoryLink story={record.story} />
              </h2>
              <StoryMeta story={record.story} />
              <p className="mt-3 leading-relaxed text-muted">
                {record.story.summary}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {issues.length > 0 ? (
        <section className="mt-14">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
            Issues that covered it
          </p>
          <div className="mt-6">
            <IssueList issues={issues} />
          </div>
        </section>
      ) : null}

      <p className="mt-10 font-mono text-[11px] uppercase tracking-[0.18em]">
        <Link href="/newsletter/archive" className="text-accent transition-colors hover:text-ink">
          All topics →
        </Link>
      </p>

      <div className="mt-16">
        <BriefSubscribeCTA />
      </div>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import ArchiveBrowser from "@/components/brief/ArchiveBrowser";
import { Breadcrumb } from "@/components/brief/IssueNav";
import { ISSUES_PER_PAGE, getAllIssues, getTopics } from "@/lib/brief/issues";
import { topicLabel } from "@/lib/brief/schema";
import { BRIEF_NAME, itemListJsonLd } from "@/lib/brief/seo";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: `${BRIEF_NAME} archive`,
  description:
    "Every issue of The Agentic Brief, daily and weekly, with per-story permalinks and topic pages.",
  alternates: { canonical: "/newsletter/archive" },
};

export default function BriefArchive() {
  const all = getAllIssues();
  const page = all.slice(0, ISSUES_PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(all.length / ISSUES_PER_PAGE));
  const topics = getTopics().slice(0, 10);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <JsonLd data={itemListJsonLd(page)} />
      <Breadcrumb
        trail={[
          { label: "Home", href: "/" },
          { label: "Brief", href: "/newsletter" },
          { label: "Archive" },
        ]}
      />

      <header className="mt-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
          Archive · {String(all.length).padStart(2, "0")} issues
        </p>
        <h1 className="mt-4 font-serif text-5xl tracking-tight text-ink">
          The archive
        </h1>
        <p className="mt-5 max-w-xl leading-relaxed text-muted">
          Every issue, nothing gated. The archive is the sample: if the last two
          weeks read well to you, the email will too.
        </p>
      </header>

      <div className="mt-12">
        <ArchiveBrowser issues={page} />
      </div>

      {totalPages > 1 ? (
        <nav aria-label="Pagination" className="mt-10">
          <Link
            href="/newsletter/archive/page/2"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent transition-colors hover:text-ink"
          >
            Older issues →
          </Link>
        </nav>
      ) : null}

      {topics.length > 0 ? (
        <section className="mt-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
            Browse by topic
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {topics.map((entry) => (
              <li key={entry.topic}>
                <Link
                  href={`/newsletter/topics/${entry.topic}`}
                  className="inline-block rounded-sm border border-line px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted transition-colors hover:border-accent hover:text-accent"
                >
                  {topicLabel(entry.topic)} · {entry.count}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

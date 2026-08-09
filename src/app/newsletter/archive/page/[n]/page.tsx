import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArchiveBrowser from "@/components/brief/ArchiveBrowser";
import { Breadcrumb } from "@/components/brief/IssueNav";
import { ISSUES_PER_PAGE, getAllIssues } from "@/lib/brief/issues";
import { BRIEF_NAME } from "@/lib/brief/seo";

export const dynamic = "force-static";

function pageCount(): number {
  return Math.max(1, Math.ceil(getAllIssues().length / ISSUES_PER_PAGE));
}

export async function generateStaticParams() {
  const total = pageCount();
  const params = [];
  for (let n = 2; n <= total; n += 1) params.push({ n: String(n) });
  return params;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ n: string }>;
}): Promise<Metadata> {
  const { n } = await params;
  return {
    title: `${BRIEF_NAME} archive, page ${n}`,
    description: `Older issues of The Agentic Brief, page ${n}.`,
    alternates: { canonical: `/newsletter/archive/page/${n}` },
    // Pagination is crawlable but not indexable: `follow` keeps the issues
    // themselves discoverable without filling the index with list pages.
    robots: { index: false, follow: true },
  };
}

export default async function BriefArchivePage({
  params,
}: {
  params: Promise<{ n: string }>;
}) {
  const { n } = await params;
  const pageNumber = Number(n);
  const total = pageCount();
  if (!Number.isInteger(pageNumber) || pageNumber < 2 || pageNumber > total) {
    return notFound();
  }

  const all = getAllIssues();
  const start = (pageNumber - 1) * ISSUES_PER_PAGE;
  const issues = all.slice(start, start + ISSUES_PER_PAGE);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <Breadcrumb
        trail={[
          { label: "Home", href: "/" },
          { label: "Brief", href: "/newsletter" },
          { label: "Archive", href: "/newsletter/archive" },
          { label: `Page ${pageNumber}` },
        ]}
      />

      <header className="mt-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
          Archive · page {pageNumber} of {total}
        </p>
        <h1 className="mt-4 font-serif text-5xl tracking-tight text-ink">
          Older issues
        </h1>
      </header>

      <div className="mt-12">
        <ArchiveBrowser issues={issues} />
      </div>

      <nav
        aria-label="Pagination"
        className="mt-10 flex justify-between font-mono text-[11px] uppercase tracking-[0.18em]"
      >
        <Link
          href={pageNumber === 2 ? "/newsletter/archive" : `/newsletter/archive/page/${pageNumber - 1}`}
          className="text-accent transition-colors hover:text-ink"
        >
          ← Newer
        </Link>
        {pageNumber < total ? (
          <Link
            href={`/newsletter/archive/page/${pageNumber + 1}`}
            className="text-accent transition-colors hover:text-ink"
          >
            Older →
          </Link>
        ) : null}
      </nav>
    </main>
  );
}

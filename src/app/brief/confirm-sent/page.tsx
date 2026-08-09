import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import BriefSubscribeCTA from "@/components/brief/BriefSubscribeCTA";
import ConfirmSentNotice from "@/components/brief/ConfirmSentNotice";
import { Breadcrumb } from "@/components/brief/IssueNav";
import { issueDateLabel } from "@/lib/brief/dates";
import { getAllIssues } from "@/lib/brief/issues";
import { issueHref } from "@/lib/brief/seo";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Check your inbox",
  robots: { index: false, follow: false },
};

export default function ConfirmSent() {
  const recent = getAllIssues().slice(0, 3);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <Breadcrumb
        trail={[
          { label: "Home", href: "/" },
          { label: "Brief", href: "/brief" },
          { label: "Confirm" },
        ]}
      />

      <header className="mt-8">
        <Suspense
          fallback={
            <h1 className="mt-4 font-serif text-5xl leading-[1.08] tracking-tight text-ink">
              Check your inbox
            </h1>
          }
        >
          <ConfirmSentNotice />
        </Suspense>
      </header>

      {recent.length > 0 ? (
        <section className="mt-14 border-t border-line pt-8">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
            While you&apos;re waiting
          </p>
          <h2 className="mt-3 font-serif text-2xl leading-snug tracking-tight text-ink">
            Three issues to read now
          </h2>
          <ul className="mt-5 space-y-4">
            {recent.map((issue) => (
              <li key={`${issue.type}-${issue.id}`}>
                <Link
                  href={issueHref(issue)}
                  className="font-serif text-lg leading-snug text-ink transition-colors hover:text-accent"
                >
                  {issue.title}
                </Link>
                <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
                  {issue.type === "weekly" ? "Weekly" : "Daily"} ·{" "}
                  {issueDateLabel(issue.type, issue.id)} · {issue.read_minutes} min
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="mt-14">
        <BriefSubscribeCTA />
      </div>
    </main>
  );
}

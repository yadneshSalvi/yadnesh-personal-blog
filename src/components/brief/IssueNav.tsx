import Link from "next/link";
import type { BriefIssue } from "@/lib/brief/schema";
import { issueDateLabel } from "@/lib/brief/dates";

export function IssueNav({
  previous,
  next,
}: {
  previous: BriefIssue | null;
  next: BriefIssue | null;
}) {
  if (!previous && !next) return null;
  return (
    <nav
      aria-label="Issue navigation"
      className="grid gap-6 border-t border-line pt-8 sm:grid-cols-2"
    >
      {previous ? (
        <Link href={`/brief/${previous.type}/${previous.id}`} className="group">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
            ← Previous
          </span>
          <span className="mt-2 block font-serif text-lg leading-snug text-ink transition-colors group-hover:text-accent">
            {previous.title}
          </span>
          <span className="mt-1 block font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
            {issueDateLabel(previous.type, previous.id)}
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          href={`/brief/${next.type}/${next.id}`}
          className="group sm:text-right"
        >
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
            Next →
          </span>
          <span className="mt-2 block font-serif text-lg leading-snug text-ink transition-colors group-hover:text-accent">
            {next.title}
          </span>
          <span className="mt-1 block font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
            {issueDateLabel(next.type, next.id)}
          </span>
        </Link>
      ) : null}
    </nav>
  );
}

export function RelatedIssues({ issues }: { issues: BriefIssue[] }) {
  if (issues.length === 0) return null;
  return (
    <section>
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
        Related issues
      </p>
      <ul className="mt-4 space-y-3">
        {issues.map((issue) => (
          <li key={`${issue.type}-${issue.id}`}>
            <Link
              href={`/brief/${issue.type}/${issue.id}`}
              className="font-serif text-lg leading-snug text-ink transition-colors hover:text-accent"
            >
              {issue.title}
            </Link>
            <span className="ml-2 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
              {issueDateLabel(issue.type, issue.id)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Breadcrumb({
  trail,
}: {
  trail: Array<{ label: string; href?: string }>;
}) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-baseline gap-x-2 font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
        {trail.map((crumb, i) => (
          <li key={crumb.label} className="flex items-baseline gap-x-2">
            {i > 0 ? <span aria-hidden>/</span> : null}
            {crumb.href ? (
              <Link href={crumb.href} className="transition-colors hover:text-accent">
                {crumb.label}
              </Link>
            ) : (
              <span className="text-muted">{crumb.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

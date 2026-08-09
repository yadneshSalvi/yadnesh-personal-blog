import Link from "next/link";
import type { BriefIssue } from "@/lib/brief/schema";
import { issueDateLabel } from "@/lib/brief/dates";

function cadenceLabel(issue: BriefIssue): string {
  if (issue.type === "weekly") {
    return issue.issue_number ? `Weekly #${issue.issue_number}` : "Weekly";
  }
  return issue.thin_day ? "Daily · quiet day" : "Daily";
}

/** The archive row. Mirrors PostList's rhythm so the two indexes feel related. */
export default function IssueList({ issues }: { issues: BriefIssue[] }) {
  if (issues.length === 0) {
    return (
      <p className="border-b border-line py-12 text-center font-mono text-xs uppercase tracking-[0.2em] text-faint">
        Nothing here yet
      </p>
    );
  }

  return (
    <ol className="divide-y divide-line border-b border-t border-line">
      {issues.map((issue) => (
        <li key={`${issue.type}-${issue.id}`}>
          <Link
            href={`/newsletter/${issue.type}/${issue.id}`}
            className="group grid grid-cols-1 gap-x-6 py-7 sm:grid-cols-[7.5rem_1fr]"
          >
            <span className="pt-1 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
              {cadenceLabel(issue)}
            </span>
            <div className="min-w-0">
              <h3 className="mt-2 font-serif text-2xl leading-snug tracking-tight text-ink transition-colors group-hover:text-accent sm:mt-0">
                {issue.title}
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                {issue.preheader}
              </p>
              <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
                {issueDateLabel(issue.type, issue.id)} · {issue.read_minutes} min
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ol>
  );
}

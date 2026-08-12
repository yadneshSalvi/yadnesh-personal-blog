import Link from "next/link";
import clsx from "clsx";
import type { BriefIssue } from "@/lib/brief/schema";
import { issueDateLabel } from "@/lib/brief/dates";
import { COVER_BOX, LIST_THUMB_SIZES } from "@/lib/brief/artwork";
import ThemedArt from "./ThemedArt";

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

  // One issue with a cover makes the whole list reserve the picture column, for
  // the same reason a section does: a column that appears and disappears down
  // the page moves every headline with it.
  const reserveGutter = issues.some((issue) => issue.cover !== null);

  return (
    <ol className="divide-y divide-line border-b border-t border-line">
      {issues.map((issue) => {
        const cover = issue.cover;
        const weekly = issue.type === "weekly";
        return (
          <li key={`${issue.type}-${issue.id}`}>
            <Link
              href={`/newsletter/${issue.type}/${issue.id}`}
              className={clsx(
                "group grid gap-x-4 py-7 sm:gap-x-6",
                reserveGutter
                  ? "grid-cols-[minmax(0,1fr)_5rem] sm:grid-cols-[7.5rem_minmax(0,1fr)_9rem]"
                  : "grid-cols-1 sm:grid-cols-[7.5rem_1fr]",
              )}
            >
              {/* With a picture column the placement is explicit, because the
                  row has three children and two columns on a phone: the label
                  and the text stack on the left, the picture spans both rows on
                  the right. From sm all three take a column each. */}
              <span
                className={clsx(
                  // self-start, because a grid item stretches to the row's
                  // height by default and items-center would then float the
                  // label down beside the middle of the headline.
                  "flex items-center gap-2 self-start pt-1 font-mono text-[11px] uppercase tracking-[0.14em]",
                  reserveGutter && "col-start-1 row-start-1 sm:row-start-1",
                  weekly ? "text-accent" : "text-faint",
                )}
              >
                {weekly ? <span aria-hidden className="h-px w-4 bg-accent" /> : null}
                {cadenceLabel(issue)}
              </span>
              <div
                className={clsx(
                  "min-w-0",
                  reserveGutter &&
                    "col-start-1 row-start-2 sm:col-start-2 sm:row-start-1",
                )}
              >
                <h3 className="mt-2 font-serif text-2xl leading-snug tracking-tight text-ink transition-colors group-hover:text-accent sm:mt-0">
                  {issue.title}
                </h3>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
                  {issue.preheader}
                </p>
                <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] tabular-nums text-faint">
                  {issueDateLabel(issue.type, issue.id)} · {issue.read_minutes} min
                </p>
              </div>
              {reserveGutter ? (
                <div className="col-start-2 row-span-2 row-start-1 sm:col-start-3 sm:row-span-1">
                  {cover ? (
                    <div
                      className={`${COVER_BOX} overflow-hidden rounded-sm border border-line`}
                    >
                      <ThemedArt
                        art={cover}
                        sizes={LIST_THUMB_SIZES}
                        className="hover-zoom object-cover"
                      />
                    </div>
                  ) : (
                    <span aria-hidden className="mt-2 block h-px w-6 bg-line" />
                  )}
                </div>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}

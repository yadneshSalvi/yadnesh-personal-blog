import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import IssueArticle from "@/components/brief/IssueArticle";
import { getIssue, getRenderableIssues } from "@/lib/brief/issues";
import { issueMetadata } from "@/lib/brief/seo";

export const dynamic = "force-static";

/** Issue numbers are display metadata, so /brief/weekly/14 aliases the ISO week. */
function aliasTarget(week: string): string | null {
  if (!/^\d{1,3}$/.test(week)) return null;
  const number = Number(week);
  const match = getRenderableIssues().find(
    (issue) => issue.type === "weekly" && issue.issue_number === number,
  );
  return match ? `/brief/weekly/${match.id}` : null;
}

export async function generateStaticParams() {
  const weeklies = getRenderableIssues().filter(
    (issue) => issue.type === "weekly",
  );
  return [
    ...weeklies.map((issue) => ({ week: issue.id })),
    ...weeklies
      .filter((issue) => issue.issue_number !== null)
      .map((issue) => ({ week: String(issue.issue_number) })),
  ];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ week: string }>;
}): Promise<Metadata> {
  const { week } = await params;
  const issue = getIssue("weekly", week);
  if (!issue) {
    // The numeric alias is a redirect, so keep it out of the index.
    return aliasTarget(week) ? { robots: { index: false, follow: true } } : {};
  }
  return issueMetadata(issue);
}

export default async function WeeklyIssuePage({
  params,
}: {
  params: Promise<{ week: string }>;
}) {
  const { week } = await params;
  const issue = getIssue("weekly", week);
  if (!issue) {
    const alias = aliasTarget(week);
    if (alias) redirect(alias);
    return notFound();
  }
  return <IssueArticle issue={issue} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import IssueArticle from "@/components/brief/IssueArticle";
import { getIssue, getRenderableIssues } from "@/lib/brief/issues";
import { issueMetadata } from "@/lib/brief/seo";

export const dynamic = "force-static";

export async function generateStaticParams() {
  return getRenderableIssues()
    .filter((issue) => issue.type === "daily")
    .map((issue) => ({ date: issue.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ date: string }>;
}): Promise<Metadata> {
  const { date } = await params;
  const issue = getIssue("daily", date);
  if (!issue) return {};
  return issueMetadata(issue);
}

export default async function DailyIssuePage({
  params,
}: {
  params: Promise<{ date: string }>;
}) {
  const { date } = await params;
  const issue = getIssue("daily", date);
  if (!issue) return notFound();
  return <IssueArticle issue={issue} />;
}

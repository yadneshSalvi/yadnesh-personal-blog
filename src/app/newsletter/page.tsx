import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import BriefSubscribeCTA from "@/components/brief/BriefSubscribeCTA";
import IssueList from "@/components/brief/IssueList";
import { getAllIssues, getLatestIssue } from "@/lib/brief/issues";
import type { BriefIssue } from "@/lib/brief/schema";
import { issueDateLabel } from "@/lib/brief/dates";
import { BRIEF_NAME, BRIEF_TAGLINE, issueHref } from "@/lib/brief/seo";
import { SITE_URL, absoluteUrl } from "@/lib/seo";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: BRIEF_NAME,
  description: BRIEF_TAGLINE,
  alternates: { canonical: "/newsletter" },
};

export default function BriefLanding() {
  const latestDaily = getLatestIssue("daily");
  const latestWeekly = getLatestIssue("weekly");
  const recent = getAllIssues().slice(0, 6);

  const periodicalSchema = {
    "@context": "https://schema.org",
    "@type": "Periodical",
    "@id": `${SITE_URL}/newsletter#periodical`,
    name: BRIEF_NAME,
    description: BRIEF_TAGLINE,
    url: absoluteUrl("/newsletter"),
    inLanguage: "en",
    publisher: { "@id": `${SITE_URL}/#person` },
    author: { "@id": `${SITE_URL}/#person` },
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <JsonLd data={periodicalSchema} />

      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
          Newsletter · Weekdays &amp; Sundays
        </p>
        <h1 className="mt-4 font-serif text-5xl leading-[1.08] tracking-tight text-ink">
          The Agentic Brief
        </h1>
        <p className="mt-5 max-w-xl font-serif text-xl italic leading-relaxed text-muted">
          Agentic AI in four minutes a morning. Curated by a pipeline I built,
          reviewed by me before it goes out.
        </p>
      </header>

      <section className="mt-12 space-y-5 leading-relaxed text-muted">
        <p>
          Every weekday a pipeline reads 82 feeds, the Hacker News stories that
          clear 80 points, 15 company engineering blogs, and 12 accounts on X.
          It picks the one story that changed something, writes it up with the
          caveat attached rather than buried, and lines six to nine items up
          behind it. Then it stops.
        </p>
        <p>
          On Sunday it does the thing a daily structurally can&apos;t. One
          argued observation connecting the week&apos;s stories, the items whose
          significance only showed up in hindsight, and the two or three good
          things that nobody clicked.
        </p>
        <p>
          The pipeline is the pitch. It ships at the same time every weekday
          because software doesn&apos;t oversleep, it says so out loud when the
          day was quiet instead of padding, and every issue carries a
          corrections section whether or not there is anything in it. What it
          reads, which model does which job, and what I check before a send are
          all written down on{" "}
          <Link
            href="/newsletter/how-it-works"
            className="text-accent underline decoration-accent/40 underline-offset-[3px] transition-colors hover:decoration-accent"
          >
            the how-it-works page
          </Link>
          .
        </p>
      </section>

      <div className="mt-14">
        <BriefSubscribeCTA
          latestIssueHref={latestDaily ? issueHref(latestDaily) : null}
        />
      </div>

      {latestDaily || latestWeekly ? (
        <section className="mt-16">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
            Latest
          </p>
          <div className="mt-6 grid gap-8 sm:grid-cols-2">
            {latestDaily ? <LatestCard issue={latestDaily} label="Today's daily" /> : null}
            {latestWeekly ? (
              <LatestCard issue={latestWeekly} label="This week's weekly" />
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="mt-16">
        <div className="flex items-baseline justify-between gap-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
            Recent issues
          </p>
          <Link
            href="/newsletter/archive"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent transition-colors hover:text-ink"
          >
            Full archive →
          </Link>
        </div>
        <div className="mt-6">
          <IssueList issues={recent} />
        </div>
      </section>

      <section className="mt-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
          Feeds
        </p>
        <ul className="mt-4 space-y-2 text-sm text-muted">
          <li>
            <a href="/newsletter/feed.xml" className="transition-colors hover:text-accent">
              /newsletter/feed.xml
            </a>{" "}
            both cadences, full text
          </li>
          <li>
            <a
              href="/newsletter/daily/feed.xml"
              className="transition-colors hover:text-accent"
            >
              /newsletter/daily/feed.xml
            </a>{" "}
            dailies only
          </li>
          <li>
            <a
              href="/newsletter/weekly/feed.xml"
              className="transition-colors hover:text-accent"
            >
              /newsletter/weekly/feed.xml
            </a>{" "}
            weeklies only
          </li>
          <li>
            <a href="/feed-all.xml" className="transition-colors hover:text-accent">
              /feed-all.xml
            </a>{" "}
            the brief plus the blog
          </li>
        </ul>
      </section>
    </main>
  );
}

function LatestCard({
  issue,
  label,
}: {
  issue: BriefIssue;
  label: string;
}) {
  return (
    <Link href={issueHref(issue)} className="group block border-t border-line pt-5">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
        {label}
      </p>
      <h2 className="mt-3 font-serif text-2xl leading-snug tracking-tight text-ink transition-colors group-hover:text-accent">
        {issue.title}
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{issue.preheader}</p>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-faint">
        {issueDateLabel(issue.type, issue.id)} · {issue.read_minutes} min
      </p>
    </Link>
  );
}

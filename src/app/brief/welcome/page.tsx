import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/brief/IssueNav";
import WelcomeSchedule from "@/components/brief/WelcomeSchedule";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "You're subscribed",
  robots: { index: false, follow: false },
};

function Section({ kicker, title, children }: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
        {kicker}
      </p>
      <h2 className="mt-3 font-serif text-2xl leading-snug tracking-tight text-ink">
        {title}
      </h2>
      <div className="mt-4 space-y-4 leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export default function Welcome() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <Breadcrumb
        trail={[
          { label: "Home", href: "/" },
          { label: "Brief", href: "/brief" },
          { label: "Welcome" },
        ]}
      />

      <header className="mt-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
          Confirmed
        </p>
        <h1 className="mt-4 font-serif text-5xl leading-[1.08] tracking-tight text-ink">
          You&apos;re in
        </h1>
        <div className="mt-5 max-w-xl font-serif text-xl italic leading-relaxed text-muted">
          <Suspense
            fallback={
              <p>
                Weekdays at 8:45am IST, about four minutes. Sundays at 9am IST,
                about six minutes.
              </p>
            }
          >
            <WelcomeSchedule />
          </Suspense>
        </div>
      </header>

      <Section kicker="What arrives" title="A lead, then six to nine items, then it stops">
        <p>
          The daily leads with the one story that changed something, writes it up
          with the caveat attached rather than buried, and lines the rest up
          behind it. A quiet day ships short and says so in the subject line,
          because padding a thin day is the fastest way for a daily to lose you.
        </p>
        <p>
          The Sunday edition does what a daily structurally can&apos;t: one argued
          observation connecting the week, the items whose significance only
          showed up in hindsight, and the two or three good things nobody
          clicked.
        </p>
      </Section>

      <Section kicker="Disclosure" title="How this is made">
        <p>
          Curated and summarized by an agent pipeline I built, reviewed before
          send. Which sources it reads, which model does which job, and what I
          check before an issue goes out are all written down on{" "}
          <Link
            href="/brief/how-it-works"
            className="text-accent underline decoration-accent/40 underline-offset-[3px] transition-colors hover:decoration-accent"
          >
            the how-it-works page
          </Link>
          . Every issue carries a corrections section whether or not there is
          anything in it.
        </p>
      </Section>

      <Section kicker="Control" title="If the cadence is wrong">
        <p>
          Every issue footer carries a preferences link and a plain unsubscribe
          link. The preferences link switches you between daily, weekly, and
          both. The unsubscribe link takes one click and asks no questions.
        </p>
        <p>
          The welcome email in your inbox has both links in it, which is the
          fastest way to reach them right now.
        </p>
      </Section>

      <Section kicker="One ask" title="Reply and tell me what you work on">
        <p>
          Hit reply on the welcome email. I read every reply, and knowing what
          you build is the fastest way to shape what gets picked. It also teaches
          your mail client that this address belongs in your inbox rather than in
          promotions.
        </p>
        <p>
          In the meantime,{" "}
          <Link
            href="/brief/archive"
            className="text-accent underline decoration-accent/40 underline-offset-[3px] transition-colors hover:decoration-accent"
          >
            the archive
          </Link>{" "}
          holds every issue, ungated.
        </p>
      </Section>
    </main>
  );
}

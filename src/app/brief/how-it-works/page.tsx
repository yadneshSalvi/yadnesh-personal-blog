import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumb } from "@/components/brief/IssueNav";
import BriefSubscribeCTA from "@/components/brief/BriefSubscribeCTA";
import { BRIEF_NAME } from "@/lib/brief/seo";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: `How ${BRIEF_NAME} is made`,
  description:
    "The sources, the models, the selection rules, and exactly which parts of The Agentic Brief are automated and which ones a human signs off on.",
  alternates: { canonical: "/brief/how-it-works" },
};

function Section({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14">
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
        {kicker}
      </p>
      <h2 className="mt-3 font-serif text-3xl leading-tight tracking-tight text-ink">
        {title}
      </h2>
      <div className="mt-5 space-y-4 leading-relaxed text-muted">{children}</div>
    </section>
  );
}

export default function HowItWorks() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
      <Breadcrumb
        trail={[
          { label: "Home", href: "/" },
          { label: "Brief", href: "/brief" },
          { label: "How it works" },
        ]}
      />

      <header className="mt-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
          Transparency
        </p>
        <h1 className="mt-4 font-serif text-5xl leading-[1.08] tracking-tight text-ink">
          How this is made
        </h1>
        <p className="mt-5 max-w-xl font-serif text-xl italic leading-relaxed text-muted">
          An agent pipeline writes it. I read it before it sends. Here is every
          part of that sentence, in detail.
        </p>
      </header>

      <Section kicker="Sources" title="What it reads">
        <p>
          Twice a day, at 8am and 8pm IST, a scheduled job on a Mac in Mumbai
          collects candidates from four places:
        </p>
        <ul className="ml-5 list-disc space-y-2">
          <li>
            <strong className="text-ink">82 RSS feeds.</strong> Lab and company
            engineering blogs, individual researchers, arXiv and Hugging Face
            paper feeds, and a handful of newsletters. High-volume general feeds
            are filtered against a keyword list (agent, agentic, harness, mcp,
            tool use, claude code, codex, multi-agent, computer use, swe-bench,
            eval, context engineering, and a few more) so a general tech feed
            can be included without flooding the pool.
          </li>
          <li>
            <strong className="text-ink">Hacker News, above 80 points.</strong>{" "}
            Queried through the Algolia API for agent, agentic, coding agent,
            mcp, and llm. The points floor is the whole filter: it is a crude
            signal, and it is honest about being one.
          </li>
          <li>
            <strong className="text-ink">15 sites with no usable feed,</strong>{" "}
            scraped from their index pages with a headless browser. Anthropic
            engineering and research, Cursor, Letta, LangChain, Zed, and others
            that publish without RSS.
          </li>
          <li>
            <strong className="text-ink">12 accounts on X,</strong> read through
            the official X API. These are treated as a discovery channel, not as
            sources: when a post points at a real release or paper, the brief
            links the release or the paper and credits the post with{" "}
            <em>via</em>.
          </li>
        </ul>
        <p>
          Every URL the pipeline has ever collected sits in a ledger, so the same
          story never gets served to you twice.
        </p>
      </Section>

      <Section kicker="Models" title="Which model does which job">
        <p>
          The split is deliberate and it has not changed since the pipeline
          started. Judgment goes to one model, mechanical work goes to another,
          and anything that can be a plain function stays a plain function.
        </p>
        <ul className="ml-5 list-disc space-y-2">
          <li>
            <strong className="text-ink">Python does everything deterministic.</strong>{" "}
            Fetching, deduplication, the seen-URL ledger, read-time arithmetic,
            schema validation, and file writing. If an outcome can be computed,
            no model is asked for an opinion about it.
          </li>
          <li>
            <strong className="text-ink">
              GPT-5.6-Sol executors do the mechanical passes.
            </strong>{" "}
            Every collected item gets summarized, assigned a section, scored from
            0 to 10, and clustered with other coverage of the same story. This
            runs in parallel batches, because it is per-item work with a
            checkable output.
          </li>
          <li>
            <strong className="text-ink">Claude Fable 5 does the judgment.</strong>{" "}
            Choosing the lead, ordering by consequence, writing the lead
            skeleton, deciding a day was quiet, and writing the Sunday
            through-line. That is the editorial layer, and it is the part that
            gets read before it ships.
          </li>
        </ul>
        <p>
          Nothing here uses an API key I typed into a config file for a vendor
          you cannot see. Both models run through subscription CLIs, and the
          costs are the subscriptions plus about 15 to 30 cents per run for X
          reads.
        </p>
      </Section>

      <Section kicker="Selection" title="What gets picked, and what gets dropped">
        <p>
          Roughly 18 to 30 items survive a collection run. The rules the curation
          step works under:
        </p>
        <ul className="ml-5 list-disc space-y-2">
          <li>One item per cluster, and the primary source beats the retelling.</li>
          <li>
            Anything scoring under 6 gets dropped unless it is uniquely
            important, and marketing copy is treated with suspicion.
          </li>
          <li>
            If fewer than three items clear the bar, the issue ships short and
            says so in the subject line. Padding a thin day is the fastest way
            for a daily to lose you.
          </li>
          <li>
            Every number and every quoted string in a summary has to appear in
            the source text the pipeline is holding. An item that cannot be
            grounded gets demoted to a bare link or dropped.
          </li>
          <li>
            Hedging is preserved. &ldquo;Suggests&rdquo; never becomes
            &ldquo;shows&rdquo;, and a preliminary eval never becomes a confirmed
            benchmark. A separate checking pass diffs the written summary against
            the source with exactly that failure mode named.
          </li>
        </ul>
      </Section>

      <Section kicker="Review" title="What is automated and what I sign off on">
        <p>
          The web edition publishes itself. The pipeline opens a pull request
          against this site, automated validation runs against it, and it merges
          on green. A bad generation shows up as a red pull request rather than a
          broken page.
        </p>
        <p>
          Email is different. Every send waits for me. I get a notification with
          an approve link and a hold link, and if I do not act within two hours
          the issue sends on its own under my name. That window is a deliberate
          choice: a daily that only ships when I am awake is not a daily. What it
          is not is an excuse. Anything that goes out is my responsibility,
          approved or not, and the corrections section below is how that gets
          settled when it goes wrong.
        </p>
        <p>
          That review step is also what the EU AI Act calls human editorial
          control, which is the reason this page exists in the form it does. I
          would rather over-disclose than let you discover the pipeline
          yourself.
        </p>
      </Section>

      <Section kicker="Corrections" title="What happens when it is wrong">
        <p>
          Every issue carries a corrections section, in the same position,
          whether or not there is anything in it. Most days it reads
          &ldquo;Nothing to correct.&rdquo;
        </p>
        <p>
          When something is wrong, the correction states what the issue said,
          what is actually true, and links the issue being corrected. The web
          version of the original issue is fixed and the correction stays
          visible. Nothing gets quietly edited out of the archive.
        </p>
        <p>
          If you spot something,{" "}
          <Link
            href="/contact"
            className="text-accent underline decoration-accent/40 underline-offset-[3px] transition-colors hover:decoration-accent"
          >
            tell me
          </Link>
          . A correction filed by a reader is the cheapest quality signal this
          thing has.
        </p>
      </Section>

      <Section kicker="Limits" title="What this does not do">
        <p>
          It does not read anything behind a paywall, so paywalled sources are
          marked and summarized from what is public. It does not rank by
          engagement, because the point of curation is to surface the good thing
          nobody clicked. It does not have sponsors, a paid tier, or a referral
          program.
        </p>
        <p>
          And it will be wrong sometimes. A pipeline that summarizes 30 items a
          day at speed will conflate two similarly named labs, or read a
          preprint&apos;s claim more confidently than the preprint does. The
          structures on this page exist because that is expected, not because it
          is unthinkable.
        </p>
      </Section>

      <div className="mt-16">
        <BriefSubscribeCTA />
      </div>
    </main>
  );
}

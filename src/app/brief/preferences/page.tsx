import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumb } from "@/components/brief/IssueNav";
import PreferencesPanel from "@/components/brief/PreferencesPanel";

// Everything on this page depends on a token in the URL, so there is nothing
// to prerender and nothing a search engine should ever hold.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your subscription",
  robots: { index: false, follow: false },
};

export default function Preferences() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
      <Breadcrumb
        trail={[
          { label: "Home", href: "/" },
          { label: "Brief", href: "/brief" },
          { label: "Preferences" },
        ]}
      />

      <header className="mt-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
          Your subscription
        </p>
        <h1 className="mt-4 font-serif text-4xl leading-[1.1] tracking-tight text-ink">
          How often, or not at all
        </h1>
        <p className="mt-5 leading-relaxed text-muted">
          Change the schedule or leave entirely. Both take one click and neither
          asks you why.
        </p>
      </header>

      <Suspense
        fallback={
          <p className="mt-8 leading-relaxed text-muted">Reading your subscription.</p>
        }
      >
        <PreferencesPanel />
      </Suspense>
    </main>
  );
}

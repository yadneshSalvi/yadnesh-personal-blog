"use client";

import { useSearchParams } from "next/navigation";

/**
 * The confirm-sent page has two states and one URL. Reading the query in a
 * client component keeps the page itself static.
 */
export default function ConfirmSentNotice() {
  const expired = useSearchParams().get("expired") === "1";

  if (expired) {
    return (
      <>
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
          Link expired
        </p>
        <h1 className="mt-4 font-serif text-5xl leading-[1.08] tracking-tight text-ink">
          That link has gone stale
        </h1>
        <p className="mt-5 max-w-xl font-serif text-xl italic leading-relaxed text-muted">
          Confirmation links last 24 hours. Yours is older than that, or it was
          already used.
        </p>
        <div className="mt-8 space-y-4 leading-relaxed text-muted">
          <p>
            Nothing is lost. Sign up again below and a fresh link arrives in a
            few seconds. If you already confirmed once, the new link just
            re-confirms the same address.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
        One step left
      </p>
      <h1 className="mt-4 font-serif text-5xl leading-[1.08] tracking-tight text-ink">
        Check your inbox
      </h1>
      <p className="mt-5 max-w-xl font-serif text-xl italic leading-relaxed text-muted">
        There&apos;s an email from newsletter@yadneshsalvi.com waiting. Click the link
        in it and you&apos;re subscribed.
      </p>
      <div className="mt-8 space-y-4 leading-relaxed text-muted">
        <p>
          Nothing gets sent until you click, which is the point: it keeps anyone
          from signing up an address they don&apos;t own.
        </p>
        <p>
          If it isn&apos;t there in a minute, check spam and promotions. Marking it
          &ldquo;not spam&rdquo; also fixes where the issues land later, so it&apos;s
          worth the two seconds.
        </p>
      </div>
    </>
  );
}

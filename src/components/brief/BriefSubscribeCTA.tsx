"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { CADENCE_CHOICES, type BriefCadence } from "@/lib/brief/cadence";
import { CONSENT_TEXT } from "@/lib/brief/consent";

/**
 * The subscribe form, in the two shapes the site places it: a bordered panel on
 * the landing and how-it-works pages, and a quieter inline block on issue pages.
 * The component API is fixed; every placement picks changes up without an edit.
 *
 * Four filters guard the endpoint, three of them here: a hidden field bots fill
 * in, the timestamp the form rendered at, and Turnstile. The fourth is the
 * confirmation email.
 */

type SubmitState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "done" }
  | { status: "error"; message: string };

const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

/** Loaded once per page, and only after someone shows intent to type. */
function loadTurnstileScript() {
  if (typeof document === "undefined") return;
  if (document.querySelector(`script[src^="${TURNSTILE_SRC}"]`)) return;
  const script = document.createElement("script");
  script.src = `${TURNSTILE_SRC}?render=explicit`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

type TurnstileApi = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
};

function SubscribeForm({ compact = false }: { compact?: boolean }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const fieldId = useId();
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetRendered = useRef(false);
  const renderedAt = useRef<number>(0);

  const [email, setEmail] = useState("");
  const [cadence, setCadence] = useState<BriefCadence>("weekly");
  const [website, setWebsite] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileWanted, setTurnstileWanted] = useState(false);
  const [state, setState] = useState<SubmitState>({ status: "idle" });

  // The timing check compares against this, so it has to be set in the browser
  // rather than baked into a statically rendered page.
  useEffect(() => {
    renderedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (!turnstileWanted || !siteKey) return;
    loadTurnstileScript();

    let cancelled = false;
    const timer = window.setInterval(() => {
      const api = (window as unknown as { turnstile?: TurnstileApi }).turnstile;
      if (cancelled || !api || !widgetRef.current || widgetRendered.current) return;
      widgetRendered.current = true;
      window.clearInterval(timer);
      api.render(widgetRef.current, {
        sitekey: siteKey,
        callback: (token: string) => setTurnstileToken(token),
        "expired-callback": () => setTurnstileToken(""),
        "error-callback": () => setTurnstileToken(""),
        theme: "auto",
        appearance: "interaction-only",
      });
    }, 200);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [turnstileWanted, siteKey]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.status === "sending") return;
    setState({ status: "sending" });

    try {
      const response = await fetch("/api/brief/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          cadence,
          website,
          t: renderedAt.current,
          turnstileToken,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        next?: string;
      };
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "That didn't go through. Try again in a minute.");
      }
      setState({ status: "done" });
      window.location.assign(data.next || "/newsletter/confirm-sent");
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Something broke. Try again.",
      });
    }
  }

  const sending = state.status === "sending" || state.status === "done";

  return (
    <form onSubmit={onSubmit} noValidate className={compact ? "mt-4" : "mt-6"}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <label htmlFor={`${fieldId}-email`} className="sr-only">
          Email address
        </label>
        <input
          id={`${fieldId}-email`}
          type="email"
          name="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@work.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          onFocus={() => setTurnstileWanted(true)}
          className="w-full flex-1 rounded-sm border border-line bg-paper px-3 py-2.5 text-sm text-ink placeholder:text-faint outline-none transition-colors focus:border-accent"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-sm border border-accent px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-accent transition-colors hover:bg-accent hover:text-paper disabled:opacity-60"
        >
          {sending ? "Sending" : "Get the brief"}
        </button>
      </div>

      {/* Honeypot. Off-screen rather than display:none, which some bots skip. */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
        <label htmlFor={`${fieldId}-website`}>Website</label>
        <input
          id={`${fieldId}-website`}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
        />
      </div>

      <fieldset className="mt-5">
        <legend className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
          How often
        </legend>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:gap-6">
          {CADENCE_CHOICES.map((choice) => (
            <label
              key={choice.value}
              className="flex cursor-pointer items-start gap-2 text-sm text-muted"
            >
              <input
                type="radio"
                name={`${fieldId}-cadence`}
                value={choice.value}
                checked={cadence === choice.value}
                onChange={() => setCadence(choice.value)}
                className="mt-1 accent-[var(--accent)]"
              />
              <span>
                <span className="text-ink">{choice.label}</span>
                <span className="block text-xs text-faint">{choice.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {siteKey ? <div ref={widgetRef} className="mt-4" /> : null}

      <p className="mt-4 text-xs leading-relaxed text-faint">
        Weekdays 8:45am IST + Sundays. Unsubscribe in one click.
      </p>
      <p className="mt-2 text-xs leading-relaxed text-faint">{CONSENT_TEXT}</p>

      {state.status === "error" ? (
        <p role="alert" className="mt-3 text-sm text-accent">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export default function BriefSubscribeCTA({
  variant = "panel",
  latestIssueHref,
}: {
  variant?: "panel" | "inline";
  latestIssueHref?: string | null;
}) {
  const headingId = useId();

  if (variant === "inline") {
    return (
      <aside className="relative my-10 border-y border-line py-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
          The Agentic Brief
        </p>
        <p className="mt-3 leading-relaxed text-muted">
          Agentic AI in four minutes a morning, curated by a pipeline I built and
          reviewed before it goes out.
        </p>
        <SubscribeForm compact />
      </aside>
    );
  }

  return (
    <section
      aria-labelledby={headingId}
      className="relative border border-line bg-surface px-6 py-8 sm:px-8"
    >
      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
        Subscribe
      </p>
      <h2
        id={headingId}
        className="mt-3 font-serif text-2xl leading-snug tracking-tight text-ink"
      >
        Get the brief in your inbox
      </h2>
      <p className="mt-3 max-w-prose leading-relaxed text-muted">
        Pick daily, weekly, or both. Nothing is gated either way: every issue is
        on the site and in the feeds.
      </p>
      <ul className="mt-5 space-y-2 text-sm leading-relaxed text-muted">
        <li>Weekdays at 8:45am IST, one lead story and 6 to 9 items.</li>
        <li>Sundays, an argued synthesis rather than a recap.</li>
        <li>One click to leave, and quiet days say so in the subject line.</li>
      </ul>

      <SubscribeForm />

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-[0.18em]">
        {latestIssueHref ? (
          <Link
            href={latestIssueHref}
            className="text-accent transition-colors hover:text-ink"
          >
            Read the latest issue →
          </Link>
        ) : null}
        <a
          href="/newsletter/feed.xml"
          className="text-muted transition-colors hover:text-ink"
        >
          Subscribe by RSS →
        </a>
      </div>
    </section>
  );
}

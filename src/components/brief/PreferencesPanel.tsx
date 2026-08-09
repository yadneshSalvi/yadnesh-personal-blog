"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CADENCE_CHOICES, isCadence, type BriefCadence } from "@/lib/brief/cadence";

type Loaded = {
  email: string;
  cadence: BriefCadence;
  status: "pending" | "confirmed" | "unsubscribed";
};

type Phase =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; state: Loaded }
  | { kind: "gone"; email: string; previous: BriefCadence };

const inputClass =
  "rounded-sm border border-line px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors disabled:opacity-60";

function ErrorNote({ message }: { message: string }) {
  return (
    <div className="mt-8 space-y-4 leading-relaxed text-muted">
      <p>{message}</p>
      <p>
        <Link
          href="/brief"
          className="text-accent underline decoration-accent/40 underline-offset-[3px] transition-colors hover:decoration-accent"
        >
          Back to the brief
        </Link>
      </p>
    </div>
  );
}

export default function PreferencesPanel() {
  const params = useSearchParams();
  const token = params.get("token");
  const unsubMode = params.get("mode") === "unsub";

  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [cadence, setCadence] = useState<BriefCadence>("weekly");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch(
          `/api/brief/preferences?token=${encodeURIComponent(token)}`,
        );
        const data = (await response.json().catch(() => ({}))) as Partial<Loaded> & {
          ok?: boolean;
          error?: string;
        };
        if (cancelled) return;
        if (!response.ok || !data.ok || !data.email || !isCadence(data.cadence)) {
          setPhase({
            kind: "error",
            message: data.error || "That link isn't valid any more.",
          });
          return;
        }
        setCadence(data.cadence);
        setPhase({
          kind: "ready",
          state: {
            email: data.email,
            cadence: data.cadence,
            status: data.status ?? "confirmed",
          },
        });
      } catch {
        if (!cancelled) {
          setPhase({ kind: "error", message: "Couldn't reach the server. Try again." });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const post = useCallback(
    async (body: Record<string, unknown>) => {
      const response = await fetch("/api/brief/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...body }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "That didn't go through.");
      }
      return data;
    },
    [token],
  );

  async function saveCadence() {
    if (phase.kind !== "ready" || busy) return;
    setBusy(true);
    setNotice("");
    try {
      await post({ action: "cadence", cadence });
      setPhase({ kind: "ready", state: { ...phase.state, cadence } });
      setNotice("Saved. The next issue follows the new schedule.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "That didn't go through.");
    } finally {
      setBusy(false);
    }
  }

  async function unsubscribe() {
    if (phase.kind !== "ready" || busy) return;
    setBusy(true);
    setNotice("");
    try {
      await post({ action: "unsubscribe" });
      setPhase({ kind: "gone", email: phase.state.email, previous: phase.state.cadence });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "That didn't go through.");
    } finally {
      setBusy(false);
    }
  }

  async function resubscribeAt(next: BriefCadence) {
    if (phase.kind !== "gone" || busy) return;
    setBusy(true);
    setNotice("");
    try {
      await post({ action: "resubscribe", cadence: next });
      setNotice(
        "Check your inbox. One click on that link puts you on the quieter schedule, and nothing arrives until you make it.",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "That didn't go through.");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <ErrorNote message="This page needs the link from one of your emails. Every issue footer has one." />
    );
  }

  if (phase.kind === "loading") {
    return <p className="mt-8 leading-relaxed text-muted">Reading your subscription.</p>;
  }

  if (phase.kind === "error") {
    return <ErrorNote message={phase.message} />;
  }

  // The downgrade offer only ever appears after leaving has already worked.
  if (phase.kind === "gone") {
    return (
      <div className="mt-8 space-y-5 leading-relaxed text-muted">
        <p className="text-ink">
          Done. {phase.email} is off the list, and nothing else will arrive.
        </p>
        <p>
          If the problem was volume rather than the writing, the quieter option
          is still there. Picking one sends a fresh confirmation link, and
          nothing resumes until you click it.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => resubscribeAt("weekly")}
            disabled={busy}
            className={`${inputClass} text-accent hover:bg-accent hover:text-paper`}
          >
            Sundays only
          </button>
          <button
            type="button"
            onClick={() => resubscribeAt("daily")}
            disabled={busy}
            className={`${inputClass} text-muted hover:text-ink`}
          >
            Weekdays only
          </button>
        </div>
        {notice ? <p className="text-sm text-faint">{notice}</p> : null}
        <p>
          <Link
            href="/brief/archive"
            className="text-accent underline decoration-accent/40 underline-offset-[3px] transition-colors hover:decoration-accent"
          >
            The archive stays open
          </Link>
          , ungated, with an RSS feed if you&apos;d rather read it there.
        </p>
      </div>
    );
  }

  const { state } = phase;

  return (
    <div className="mt-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
        {state.email}
      </p>

      {state.status === "unsubscribed" ? (
        <p className="mt-4 leading-relaxed text-muted">
          This address is currently unsubscribed. Picking a cadence below will
          not restart delivery: subscribing again from the brief page and
          confirming the email is the only way back on.
        </p>
      ) : null}

      {unsubMode ? (
        <p className="mt-4 leading-relaxed text-muted">
          One button ends it. No form, no reason required.
        </p>
      ) : null}

      <fieldset className="mt-6">
        <legend className="font-mono text-[11px] uppercase tracking-[0.18em] text-faint">
          How often
        </legend>
        <div className="mt-3 space-y-3">
          {CADENCE_CHOICES.map((choice) => (
            <label
              key={choice.value}
              className="flex cursor-pointer items-start gap-2 text-sm text-muted"
            >
              <input
                type="radio"
                name="cadence"
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

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={saveCadence}
          disabled={busy || cadence === state.cadence}
          className={`${inputClass} border-accent text-accent hover:bg-accent hover:text-paper`}
        >
          {busy ? "Saving" : "Save cadence"}
        </button>
        <button
          type="button"
          onClick={unsubscribe}
          disabled={busy}
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted underline underline-offset-4 transition-colors hover:text-ink"
        >
          Unsubscribe from everything
        </button>
      </div>

      {notice ? <p className="mt-4 text-sm text-muted">{notice}</p> : null}
    </div>
  );
}

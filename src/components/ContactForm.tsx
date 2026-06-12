"use client";

import { useMemo, useState } from "react";

type SubmitState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export default function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [botToggle, setBotToggle] = useState(false);
  // Honeypot: should stay empty; bots often fill all inputs
  const [handle, setHandle] = useState("");

  const [submitState, setSubmitState] = useState<SubmitState>({ status: "idle" });

  const isValid = useMemo(() => {
    if (!name.trim() || !email.trim() || !message.trim()) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return false;
    if (!botToggle) return false;
    return true;
  }, [name, email, message, botToggle]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!isValid || submitState.status === "sending") return;
    setSubmitState({ status: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message, botToggle, handle }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed: ${res.status}`);
      }
      setSubmitState({ status: "success", message: "Message transmitted successfully. Check your inbox." });
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setBotToggle(false);
      setHandle("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setSubmitState({ status: "error", message });
    }
  }

  const inputClass =
    "w-full rounded-sm border border-line bg-transparent px-3 py-2 text-sm text-ink placeholder:text-faint outline-none transition-colors focus:border-accent";
  const labelClass =
    "font-mono text-[11px] uppercase tracking-[0.18em] text-faint";

  return (
    <form className="space-y-5" method="post" onSubmit={onSubmit} noValidate>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="name" className={labelClass}>
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ada Lovelace"
            className={inputClass}
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.dev"
            className={inputClass}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="subject" className={labelClass}>
            Subject
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Let's talk about…"
            className={inputClass}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="message" className={labelClass}>
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={7}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Suggestions encouraged, doubts welcome."
            className={inputClass}
          />
        </div>

        {/* Anti-bot toggle + honeypot */}
        <div className="sm:col-span-2">
          <div className="flex items-center justify-between rounded-sm border border-line px-3 py-2.5">
            <div className="space-y-0.5">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
                sudo human --enable
              </p>
              <p className="font-mono text-[11px] text-faint">
                prove you are carbon-based: flip the switch
              </p>
            </div>
            <button
              type="button"
              onClick={() => setBotToggle((v) => !v)}
              aria-pressed={botToggle}
              className={
                "relative inline-flex h-7 w-14 items-center rounded-full border transition-colors " +
                (botToggle
                  ? "border-accent bg-accent/15"
                  : "border-line bg-surface")
              }
            >
              <span
                className={
                  "inline-block h-5 w-5 translate-x-1 transform rounded-full transition-all " +
                  (botToggle ? "translate-x-8 bg-accent" : "bg-faint")
                }
              />
            </button>
          </div>
          {/* Honeypot field (hidden from humans) */}
          <input
            tabIndex={-1}
            aria-hidden="true"
            autoComplete="off"
            name="handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="hidden"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        {submitState.status === "sending" ? (
          <p className="font-mono text-[11px] text-muted">
            status: <span className="text-accent">transmitting…</span> spinning
            up carrier pigeons
          </p>
        ) : submitState.status === "success" ? (
          <p className="font-mono text-[11px] text-accent">
            status: success — {submitState.message}
          </p>
        ) : submitState.status === "error" ? (
          <p className="font-mono text-[11px] text-red-700 dark:text-red-400">
            status: error — {submitState.message}
          </p>
        ) : (
          <p className="font-mono text-[11px] text-faint">
            status: awaiting transmission
          </p>
        )}
        <button
          type="submit"
          disabled={!isValid || submitState.status === "sending"}
          className={
            "rounded-sm px-5 py-2 font-mono text-xs uppercase tracking-[0.15em] transition-colors " +
            (isValid && submitState.status !== "sending"
              ? "bg-accent text-paper hover:opacity-90"
              : "cursor-not-allowed border border-line text-faint")
          }
        >
          {submitState.status === "sending" ? "Sending…" : "Send →"}
        </button>
      </div>
    </form>
  );
}



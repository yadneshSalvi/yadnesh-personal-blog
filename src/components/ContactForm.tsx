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

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="border-b border-zinc-200 bg-zinc-50/70 px-4 py-2 text-xs uppercase tracking-wider text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
        <div className="flex items-center gap-3">
          <div className="h-4 w-1.5 rounded bg-gradient-to-b from-blue-500 to-cyan-400 opacity-70" />
          <span className="font-mono font-semibold">compose message</span>
        </div>
      </div>

      <div className="p-4">
        <form className="space-y-4" method="post" onSubmit={onSubmit} noValidate>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="name" className="font-mono text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
                name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-blue-500/40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:bg-zinc-950"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="email" className="font-mono text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
                email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.dev"
                className="w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-blue-500/40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:bg-zinc-950"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="subject" className="font-mono text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
                subject
              </label>
              <input
                id="subject"
                name="subject"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Let's talk about..."
                className="w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-blue-500/40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:bg-zinc-950"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label htmlFor="message" className="font-mono text-xs uppercase tracking-wider font-semibold text-zinc-700 dark:text-zinc-300">
                message
              </label>
              <textarea
                id="message"
                name="message"
                rows={7}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={'// write your message here\n/* suggestions encouraged, doubts welcome */'}
                className="w-full rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-900 placeholder-zinc-400 outline-none transition-colors focus:bg-white focus:ring-2 focus:ring-blue-500/40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus:bg-zinc-950"
              />
            </div>

            {/* Creative anti-bot toggle + honeypot */}
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900">
                <div className="space-y-0.5">
                  <p className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    sudo human --enable
                  </p>
                  <p className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                    prove you are carbon-based: flip the quantum switch
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBotToggle((v) => !v)}
                  aria-pressed={botToggle}
                  className={
                    "relative inline-flex h-7 w-14 items-center rounded-full border transition-colors " +
                    (botToggle
                      ? "border-green-500/60 bg-green-500/20"
                      : "border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-950")
                  }
                >
                  <span className={
                    "inline-block h-5 w-5 translate-x-1 transform rounded-full bg-zinc-400 transition-transform " +
                    (botToggle ? "translate-x-8 bg-green-400" : "")
                  } />
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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {submitState.status === "sending" ? (
              <p className="font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                status: <span className="text-blue-600 dark:text-blue-400">transmitting…</span> spinning up carrier pigeons
              </p>
            ) : submitState.status === "success" ? (
              <p className="font-mono text-[11px] text-green-700 dark:text-green-400">
                status: success — {submitState.message}
              </p>
            ) : submitState.status === "error" ? (
              <p className="font-mono text-[11px] text-red-700 dark:text-red-400">
                status: error — {submitState.message}
              </p>
            ) : (
              <p className="font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
                status: <span className="text-amber-600 dark:text-amber-400">transport offline</span> — sending will be wired up next
              </p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={!isValid || submitState.status === "sending"}
                className={
                  "rounded-md border px-3 py-2 text-sm transition-colors " +
                  (isValid && submitState.status !== "sending"
                    ? "border-blue-500/60 bg-blue-500/10 text-blue-700 hover:bg-blue-500/15 dark:border-blue-400/60 dark:bg-blue-400/10 dark:text-blue-300 dark:hover:bg-blue-400/20"
                    : "cursor-not-allowed border-zinc-300 bg-zinc-100 text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-600")
                }
              >
                <span className="font-mono font-semibold">{submitState.status === "sending" ? "sending…" : "send ▷"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}



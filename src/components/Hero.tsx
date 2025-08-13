"use client";

import Link from "next/link";
import { useTheme } from "next-themes";

export default function Hero() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <section
      className={
        [
          "relative overflow-hidden rounded-none border-0 p-8 sm:p-10 md:p-12 text-center",
          "border-zinc-200/80 dark:border-zinc-800/80",
          "w-full min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center",
          isDark ? "bg-zinc-900" : "bg-white",
        ].join(" ")
      }
    >
      <div
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden
      >
        <div className="absolute inset-0 [background:linear-gradient(to_right,rgba(0,0,0,0.20)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.20)_1px,transparent_1px)] [background-size:32px_32px] dark:[background:linear-gradient(to_right,rgba(255,255,255,0.25)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.25)_1px,transparent_1px)]" />
        <div className="absolute inset-0 [background:radial-gradient(520px_220px_at_20%_8%,rgba(6,182,212,0.10),transparent_60%),radial-gradient(520px_220px_at_80%_8%,rgba(168,85,247,0.10),transparent_60%)] dark:[background:radial-gradient(520px_220px_at_20%_8%,rgba(6,182,212,0.14),transparent_60%),radial-gradient(520px_220px_at_80%_8%,rgba(99,102,241,0.16),transparent_60%)]" />
      </div>
      {isDark ? (
        <div
          className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(400px_200px_at_20%_0%,black,transparent_70%)]"
          aria-hidden
        >
          <div className="absolute -left-10 -top-10 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="absolute -right-10 -top-10 h-80 w-80 rounded-full bg-purple-500/15 blur-3xl" />
          <div className="absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />
        </div>
      ) : null}

      <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl md:text-5xl">
        <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent font-[var(--font-geist-mono)]">
          An opinionated blog on
          <br />
          AI Engineering
        </span>
      </h1>
      <p className="mt-3 max-w-prose mx-auto text-sm text-zinc-600 sm:text-base dark:text-zinc-400">
        Notes, experiments on AI Agents, RAG, Fine-tuning, and more.
      </p>
      <Link
        href="/blog"
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-md border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-700 shadow-sm transition duration-200 hover:border-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-800 hover:shadow-[0_0_30px_rgba(6,182,212,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 dark:text-cyan-300 dark:hover:text-cyan-200"
      >
        Read blogs
        <span aria-hidden>→</span>
      </Link>
    </section>
  );
}



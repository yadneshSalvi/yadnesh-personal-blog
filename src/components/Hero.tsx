import Link from "next/link";
import type { SVGProps } from "react";

const STACK = ["Claude Agent SDK", "Codex app-server", "LangGraph", "RAG", "FastAPI", "Python", "Next.js"];

export default function Hero() {
  return (
    <section className="relative flex w-full min-h-[calc(100vh-3.5rem)] items-center justify-center px-6 py-16">
      {/* signature grid + cyan/purple gradient blobs */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
        <div className="absolute inset-0 [background:linear-gradient(to_right,rgba(0,0,0,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.06)_1px,transparent_1px)] [background-size:32px_32px] dark:[background:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)]" />
        <div className="absolute inset-0 [background:radial-gradient(420px_220px_at_22%_22%,rgba(6,182,212,0.18),transparent_60%),radial-gradient(420px_220px_at_78%_22%,rgba(168,85,247,0.18),transparent_60%)]" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-3xl">
        <div className="rounded-xl border border-zinc-200 bg-white/85 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/70">
          {/* terminal chrome */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </div>
            <span className="font-[var(--font-geist-mono)] text-[11px] text-zinc-500 dark:text-zinc-400">
              ~/yadnesh — zsh
            </span>
            <span className="w-10" />
          </div>

          {/* body */}
          <div className="p-6 sm:p-8 font-[var(--font-geist-mono)] text-[15px] leading-8 text-zinc-700 dark:text-zinc-300">
            <div className="flex items-start gap-6 sm:gap-7">
              {/* YS monogram avatar */}
              <div className="hidden shrink-0 sm:block">
                <div className="relative" style={{ width: 84, height: 84 }}>
                  <div
                    className="absolute inset-0 grid place-items-center rounded-full border border-zinc-300 font-[var(--font-geist-mono)] text-xl font-semibold text-cyan-600 dark:border-zinc-700 dark:text-cyan-300"
                    style={{ background: "rgba(127,127,127,0.04)" }}
                  >
                    <span>YS</span>
                  </div>
                  <span
                    aria-hidden
                    className="absolute bottom-1 right-1 block h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-950"
                    title="online"
                  />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p>
                  <span className="select-none text-zinc-400">$</span> whoami
                </p>
                <h1 className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
                  Yadnesh Salvi
                </h1>

                <p className="mt-3">
                  <span className="select-none text-zinc-400">$</span> cat about.md
                </p>
                <p className="mt-1">
                  <span className="text-cyan-500 dark:text-cyan-400">›</span>{" "}
                  AI/ML Engineer ·{" "}
                  <span className="text-zinc-900 dark:text-zinc-100">5+ yrs</span> shipping NLP, AI Agents &amp; Full-stack applications
                  <br />
                  <span className="text-cyan-500 dark:text-cyan-400">›</span>{" "}
                  IISc Bangalore · IIT Delhi
                  <br />
                  <span className="text-cyan-500 dark:text-cyan-400">›</span>{" "}
                  Currently writing about what works in AI Engineering
                </p>

                <p className="mt-4">
                  <span className="select-none text-zinc-400">$</span> ls ./stack
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {STACK.map((s) => (
                    <span
                      key={s}
                      className="rounded border border-zinc-200 bg-zinc-100/70 px-2 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                <p className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="select-none text-zinc-400">$</span>
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                    open ./blog
                  </span>
                  <span
                    aria-hidden
                    className="inline-block h-4 w-2 animate-pulse bg-zinc-700 dark:bg-zinc-300"
                  />
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <Link
                    href="#blog"
                    className="inline-flex items-center gap-2 rounded-md border border-cyan-400/40 bg-cyan-500/10 px-3 py-1.5 text-[13px] font-medium text-cyan-700 transition hover:border-cyan-400 hover:bg-cyan-500/20 hover:shadow-[0_0_30px_rgba(6,182,212,0.20)] dark:text-cyan-300 dark:hover:text-cyan-200"
                  >
                    Read posts <span aria-hidden>→</span>
                  </Link>
                  <Link
                    href="/about"
                    className="text-[13px] text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400"
                  >
                    /about
                  </Link>
                  <span aria-hidden className="text-zinc-300 dark:text-zinc-700">
                    ·
                  </span>
                  <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
                    <a
                      href="https://github.com/yadneshSalvi"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="GitHub"
                      className="hover:text-zinc-800 dark:hover:text-zinc-200"
                    >
                      <GitHubIcon className="h-3.5 w-3.5" />
                    </a>
                    <a
                      href="https://www.linkedin.com/in/yadnesh-salvi-bb5151ba"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="LinkedIn"
                      className="hover:text-zinc-800 dark:hover:text-zinc-200"
                    >
                      <LinkedInIcon className="h-3.5 w-3.5" />
                    </a>
                    <a
                      href="https://x.com/yadnesh_sa88965"
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Twitter / X"
                      className="hover:text-zinc-800 dark:hover:text-zinc-200"
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* scroll hint */}
        <div className="mt-6 text-center">
          <span className="font-[var(--font-geist-mono)] text-xs uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">
            ↓ scroll for /blog
          </span>
        </div>
      </div>
    </section>
  );
}

function GitHubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2c-5.523 0-10 4.477-10 10 0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.605-3.369-1.342-3.369-1.342-.455-1.156-1.111-1.464-1.111-1.464-.909-.62.069-.607.069-.607 1.004.071 1.532 1.032 1.532 1.032.893 1.53 2.341 1.087 2.91.832.091-.647.35-1.087.636-1.337-2.22-.252-4.555-1.11-4.555-4.944 0-1.091.39-1.984 1.029-2.684-.103-.253-.446-1.27.098-2.646 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844a9.56 9.56 0 0 1 2.504.337c1.909-1.294 2.748-1.025 2.748-1.025.546 1.376.203 2.393.1 2.646.64.7 1.028 1.593 1.028 2.684 0 3.842-2.339 4.689-4.566 4.936.36.31.68.92.68 1.855 0 1.338-.012 2.418-.012 2.747 0 .267.18.577.688.479C19.138 20.164 22 16.417 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

function LinkedInIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4.983 3.5C4.983 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.483 1.12 2.483 2.5zM.3 8.5h4.4V24H.3V8.5zM8.7 8.5h4.216v2.108h.061c.588-1.117 2.026-2.296 4.17-2.296 4.458 0 5.279 2.936 5.279 6.754V24H18.02v-6.931c0-1.653-.03-3.777-2.303-3.777-2.306 0-2.659 1.799-2.659 3.658V24H8.7V8.5z" />
    </svg>
  );
}

function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M3 3h3.9l5.4 7.6L18.6 3H22l-7.8 10.8L22 21h-3.9l-6-8.4L5.4 21H2l8.3-11.4L3 3z" />
    </svg>
  );
}

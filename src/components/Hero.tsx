import Link from "next/link";

const STACK = [
  "Claude Agent SDK",
  "Codex App Server",
  "LangGraph",
  "RAG",
  "FastAPI",
  "Python",
  "Next.js",
];

const SOCIALS = [
  { label: "GitHub", href: "https://github.com/yadneshSalvi" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/yadnesh-salvi-bb5151ba" },
  { label: "X", href: "https://x.com/yadnesh_sa88965" },
];

export default function Hero() {
  return (
    <section className="px-6 pt-20 sm:pt-28">
      <div className="mx-auto max-w-3xl">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
          Yadnesh Salvi · AI Engineer · Mumbai
        </p>

        <h1 className="mt-6 font-serif text-[2.6rem] leading-[1.08] tracking-tight text-ink sm:text-6xl sm:leading-[1.05]">
          <em className="text-accent">Tinkering</em> with AI and Code
        </h1>

        <p className="mt-8 max-w-xl text-lg leading-relaxed text-muted">
          Five years shipping NLP, agents, and retrieval systems — trained at
          IISc Bangalore and IIT Delhi. This is where I write down what
          actually works in AI engineering, and what quietly doesn&apos;t.
        </p>

        <div className="mt-10 flex flex-wrap items-baseline gap-x-8 gap-y-4">
          <Link
            href="/blog"
            className="group font-mono text-xs uppercase tracking-[0.18em] text-accent"
          >
            Read the writing{" "}
            <span
              aria-hidden
              className="inline-block transition-transform group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
          <Link
            href="/about"
            className="font-mono text-xs uppercase tracking-[0.18em] text-muted transition-colors hover:text-ink"
          >
            About me
          </Link>
          <span className="flex flex-wrap items-baseline gap-x-5">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className="font-mono text-xs uppercase tracking-[0.18em] text-faint transition-colors hover:text-ink"
              >
                {s.label}
                <span aria-hidden className="ml-0.5">
                  ↗
                </span>
              </a>
            ))}
          </span>
        </div>

        <div className="mt-16 flex flex-wrap items-baseline gap-x-4 gap-y-2 border-t border-line pt-5 pb-16 sm:pb-20">
          <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-faint">
            Stack
          </span>
          <span className="font-mono text-xs text-muted">
            {STACK.join("  ·  ")}
          </span>
        </div>
      </div>
    </section>
  );
}

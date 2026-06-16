import Link from "next/link";

const NAV = [
  { href: "/blog", label: "Writing" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/search", label: "Search" },
];

const SOCIALS = [
  { label: "GitHub", href: "https://github.com/yadneshSalvi" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/yadnesh-salvi-bb5151ba" },
  { label: "X", href: "https://x.com/yadnesh_sa88965" },
];

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-serif text-xl italic tracking-tight text-ink">
              Yadnesh Salvi
            </p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
              Notes on AI engineering.
            </p>
          </div>

          <div className="flex gap-16">
            <nav className="flex flex-col gap-2.5">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-ink"
                >
                  {item.label}
                </Link>
              ))}
              <a
                href="/feed.xml"
                className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-ink"
              >
                RSS
              </a>
            </nav>
            <nav className="flex flex-col gap-2.5">
              {SOCIALS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-ink"
                >
                  {item.label}
                  <span aria-hidden className="ml-0.5">
                    ↗
                  </span>
                </a>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-5 font-mono text-[11px] tracking-[0.08em] text-faint sm:flex-row sm:items-center sm:justify-between">
          <span>© {year} Yadnesh Salvi · Mumbai, India</span>
          <span>
            Set in Newsreader &amp; Geist · Built with{" "}
            <a
              href="https://nextjs.org"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-ink"
            >
              Next.js
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}

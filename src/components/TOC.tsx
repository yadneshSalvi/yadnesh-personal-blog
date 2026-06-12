"use client";

import { useEffect, useState } from "react";
import Slugger from "github-slugger";
import clsx from "clsx";

type Heading = { id: string; text: string; level: number };

function collectHeadings(container: HTMLElement): Heading[] {
  const headings = Array.from(
    container.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6")
  ).filter((h) => h.textContent && h.textContent.trim().length > 0);

  const slugger = new Slugger();
  const results: Heading[] = [];
  for (const el of headings) {
    const level = Number(el.tagName[1]);
    const text = el.textContent!.trim();
    // Ensure element has an id
    const id = el.id || slugger.slug(text);
    el.id = id;
    results.push({ id, text, level });
  }
  return results;
}

export default function TOC({ contentSelector = "#post-content" }: { contentSelector?: string }) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const el = document.querySelector(contentSelector) as HTMLElement | null;
    if (!el) return;
    const collected = collectHeadings(el);
    setHeadings(collected);

    // The active section is the last heading scrolled past the reading line
    // (just below the sticky header), so highlighting tracks long sections too.
    let ticking = false;
    const updateActive = () => {
      ticking = false;
      let current: string | null = null;
      for (const h of collected) {
        const node = document.getElementById(h.id);
        if (!node) continue;
        if (node.getBoundingClientRect().top <= 104) current = h.id;
        else break;
      }
      setActiveId(current ?? collected[0]?.id ?? null);
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(updateActive);
      }
    };

    updateActive();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [contentSelector]);

  if (headings.length === 0) return null;

  return (
    <nav
      className={clsx(
        "sticky top-20 hidden shrink-0 self-start transition-[width] duration-300 lg:block",
        collapsed
          ? "w-0 overflow-visible"
          : "max-h-[calc(100vh-6rem)] w-64 overflow-auto pr-10"
      )}
    >
      {collapsed ? (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label="Expand contents"
          title="Expand contents"
          className="rounded p-1 text-faint transition-colors hover:bg-surface hover:text-ink"
        >
          <PanelIcon open={false} />
        </button>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
              Contents
            </span>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label="Collapse contents"
              title="Collapse contents"
              className="rounded p-1 text-faint transition-colors hover:bg-surface hover:text-ink"
            >
              <PanelIcon open />
            </button>
          </div>
          <ul className="space-y-1 border-l border-line">
            {headings.map((h) => (
              <li key={h.id}>
                <a
                  href={`#${h.id}`}
                  className={clsx(
                    "-ml-px block border-l py-1 text-[13px] leading-snug transition-colors",
                    activeId === h.id
                      ? "border-accent text-accent"
                      : "border-transparent text-muted hover:text-ink",
                    h.level <= 2 && "pl-3",
                    h.level === 3 && "pl-6",
                    h.level >= 4 && "pl-9"
                  )}
                >
                  {h.text}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </nav>
  );
}

function PanelIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
      {open ? <path d="M15.5 10l-2 2 2 2" /> : <path d="M14 10l2 2-2 2" />}
    </svg>
  );
}

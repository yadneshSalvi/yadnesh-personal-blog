"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  const containerRef = useRef<HTMLElement | null>(null);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const el = document.querySelector(contentSelector) as HTMLElement | null;
    if (!el) return;
    containerRef.current = el;
    setHeadings(collectHeadings(el));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.target as HTMLElement).offsetTop - (b.target as HTMLElement).offsetTop);
        if (visible[0]) setActiveId((visible[0].target as HTMLElement).id);
      },
      { rootMargin: "0px 0px -70% 0px", threshold: [0, 1] }
    );

    const hs = el.querySelectorAll("h1, h2, h3, h4, h5, h6");
    hs.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [contentSelector]);

  const items = useMemo(() => headings, [headings]);

  if (items.length === 0) return null;

  return (
    <nav className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 overflow-auto pr-4 text-sm text-zinc-400 lg:block">
      <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500">On this page</div>
      <ul className="space-y-1">
        {items.map((h) => (
          <li key={h.id} className={clsx({})}>
            <a
              href={`#${h.id}`}
              className={clsx(
                "block rounded px-2 py-1 hover:text-zinc-200",
                activeId === h.id ? "bg-zinc-800 text-zinc-100" : "text-zinc-400",
                h.level === 1 && "pl-2 font-medium",
                h.level === 2 && "pl-4",
                h.level === 3 && "pl-6",
                h.level >= 4 && "pl-8"
              )}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}



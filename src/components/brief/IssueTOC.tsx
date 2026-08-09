"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import PanelIcon from "@/components/PanelIcon";
import type { IssueTocItem } from "./tocItems";

/**
 * The issue rail. Same look, breakpoint, and scrollspy as the blog's TOC, but
 * fed a prepared list instead of scraping headings: an issue's blocks are
 * mono kickers, not <h2>s, so there is nothing for a heading walk to find.
 */
export default function IssueTOC({
  items,
  label = "On this page",
}: {
  items: IssueTocItem[];
  label?: string;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let ticking = false;

    // The active entry is the last block scrolled past the reading line just
    // below the sticky header, so long sections stay highlighted throughout.
    const updateActive = () => {
      ticking = false;
      let current: string | null = null;
      for (const item of items) {
        const node = document.getElementById(item.id);
        if (!node) continue;
        if (node.getBoundingClientRect().top <= 104) current = item.id;
        else break;
      }
      setActiveId(current ?? items[0]?.id ?? null);
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
  }, [items]);

  if (items.length === 0) return null;

  return (
    <nav
      aria-label={label}
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
          aria-label={`Expand ${label.toLowerCase()}`}
          title={`Expand ${label.toLowerCase()}`}
          className="rounded p-1 text-faint transition-colors hover:bg-surface hover:text-ink"
        >
          <PanelIcon open={false} />
        </button>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
              {label}
            </span>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label={`Collapse ${label.toLowerCase()}`}
              title={`Collapse ${label.toLowerCase()}`}
              className="rounded p-1 text-faint transition-colors hover:bg-surface hover:text-ink"
            >
              <PanelIcon open />
            </button>
          </div>
          <ul className="space-y-1 border-l border-line">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className={clsx(
                    "-ml-px block border-l py-1 text-[13px] leading-snug transition-colors",
                    activeId === item.id
                      ? "border-accent text-accent"
                      : "border-transparent text-muted hover:text-ink",
                    item.level <= 2 ? "pl-3" : "pl-6"
                  )}
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </nav>
  );
}

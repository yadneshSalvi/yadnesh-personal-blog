"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Slugger from "github-slugger";
import clsx from "clsx";
import PanelIcon from "@/components/PanelIcon";

type Heading = { id: string; text: string; level: number };

type TOCProps = {
  contentSelector?: string;
  initialHeadings?: Heading[];
  /** Rail heading, e.g. "Contents" (default) or "On this page" */
  label?: string;
  /**
   * Which side of the article the rail sits on. The right rail only appears
   * from xl up (series pages show the chapter rail from lg, this from xl).
   */
  side?: "left" | "right";
};

const EMPTY_HEADINGS: Heading[] = [];

function collectHeadings(
  container: HTMLElement,
  fallbackHeadings: Heading[]
): Heading[] {
  const headings = Array.from(
    container.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6")
  ).filter((h) => h.textContent && h.textContent.trim().length > 0);

  const slugger = new Slugger();
  const results: Heading[] = [];
  for (const [index, el] of headings.entries()) {
    const level = Number(el.tagName[1]);
    const text = normalizeHeadingText(el.textContent!);
    const fallback = fallbackHeadings[index];
    const fallbackMatches =
      fallback && fallback.level === level && fallback.text === text;
    const generatedId = fallbackMatches ? fallback.id : slugger.slug(text);
    if (fallbackMatches) slugger.slug(text);
    // Ensure element IDs match the server-derived TOC whenever possible.
    const id = el.id || generatedId;
    el.id = id;
    results.push({ id, text, level });
  }
  return results;
}

function normalizeHeadingText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export default function TOC({
  contentSelector = "#post-content",
  initialHeadings = EMPTY_HEADINGS,
  label = "Contents",
  side = "left",
}: TOCProps) {
  const pathname = usePathname();
  const [headings, setHeadings] = useState<Heading[]>(() => initialHeadings);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    let animationFrame = 0;
    let disposed = false;
    let observer: MutationObserver | null = null;
    let cleanupScrollListeners = () => {};
    const timeouts: number[] = [];

    const scrollToHash = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return;
      let targetId = hash;
      try {
        targetId = decodeURIComponent(hash);
      } catch {
        targetId = hash;
      }
      const target = document.getElementById(targetId);
      target?.scrollIntoView();
    };

    const rebuild = () => {
      if (disposed) return;
      cleanupScrollListeners();
      const el = document.querySelector(contentSelector) as HTMLElement | null;
      if (!el) {
        setHeadings(initialHeadings);
        setActiveId(initialHeadings[0]?.id ?? null);
        return;
      }

      const collected = collectHeadings(el, initialHeadings);
      const nextHeadings = collected.length > 0 ? collected : initialHeadings;
      setHeadings(nextHeadings);

      // The active section is the last heading scrolled past the reading line
      // (just below the sticky header), so highlighting tracks long sections too.
      let ticking = false;
      const updateActive = () => {
        ticking = false;
        let current: string | null = null;
        for (const h of nextHeadings) {
          const node = document.getElementById(h.id);
          if (!node) continue;
          if (node.getBoundingClientRect().top <= 104) current = h.id;
          else break;
        }
        setActiveId(current ?? nextHeadings[0]?.id ?? null);
      };
      const onScroll = () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(updateActive);
        }
      };

      updateActive();
      animationFrame = requestAnimationFrame(scrollToHash);
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      window.addEventListener("hashchange", scrollToHash);
      cleanupScrollListeners = () => {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
        window.removeEventListener("hashchange", scrollToHash);
      };
    };

    const scheduleRebuild = () => {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        rebuild();
        timeouts.push(window.setTimeout(rebuild, 50));
        timeouts.push(window.setTimeout(rebuild, 250));
      });
    };

    scheduleRebuild();
    observer = new MutationObserver(scheduleRebuild);
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("pageshow", scheduleRebuild);
    window.addEventListener("popstate", scheduleRebuild);

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      for (const timeout of timeouts) window.clearTimeout(timeout);
      observer?.disconnect();
      cleanupScrollListeners();
      window.removeEventListener("pageshow", scheduleRebuild);
      window.removeEventListener("popstate", scheduleRebuild);
    };
  }, [contentSelector, initialHeadings, pathname]);

  if (headings.length === 0) return null;

  const isRight = side === "right";

  return (
    <nav
      aria-label={label}
      className={clsx(
        "sticky top-20 hidden shrink-0 self-start transition-[width] duration-300",
        isRight ? "xl:block" : "lg:block",
        collapsed
          ? clsx("w-0 overflow-visible", isRight && "flex justify-end")
          : clsx(
              "max-h-[calc(100vh-6rem)] w-64 overflow-auto",
              isRight ? "pl-10" : "pr-10"
            )
      )}
    >
      {collapsed ? (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label={`Expand ${label.toLowerCase()}`}
          title={`Expand ${label.toLowerCase()}`}
          className={clsx(
            "rounded p-1 text-faint transition-colors hover:bg-surface hover:text-ink",
            isRight && "-ml-6"
          )}
        >
          <PanelIcon open={false} mirrored={isRight} />
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
              <PanelIcon open mirrored={isRight} />
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

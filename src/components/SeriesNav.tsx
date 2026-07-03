"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import PanelIcon from "@/components/PanelIcon";

export type SeriesNavPart = {
  slug: string;
  part: number;
  title: string;
};

export type SeriesNavStage = {
  name: string;
  from: number;
  to: number;
};

type SeriesNavProps = {
  seriesName: string;
  seriesSlug: string;
  /** Planned total, so unpublished chapters render as "coming soon" */
  totalParts: number;
  parts: SeriesNavPart[];
  currentSlug: string;
  /** Optional act grouping; renders a divider before each act's first part */
  stages?: SeriesNavStage[];
};

/**
 * Left rail on series chapters: every part of the series with the current
 * one marked, past parts dimmed one step, future parts two. Collapsible to
 * a slim toggle, mirroring the TOC rail on the right.
 */
function StageDivider({ name, first }: { name: string; first: boolean }) {
  return (
    <div
      className={clsx(
        "-ml-px border-l border-transparent pb-1.5 pl-3",
        first ? "" : "mt-3 border-t border-t-line pt-3"
      )}
    >
      <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-faint/80">
        {name}
      </span>
    </div>
  );
}

export default function SeriesNav({
  seriesName,
  seriesSlug,
  totalParts,
  parts,
  currentSlug,
  stages,
}: SeriesNavProps) {
  const [collapsed, setCollapsed] = useState(false);
  const currentIndex = parts.findIndex((p) => p.slug === currentSlug);
  const currentPart = currentIndex >= 0 ? parts[currentIndex].part : null;
  const comingSoon = Math.max(0, totalParts - parts.length);

  return (
    <nav
      aria-label="Series chapters"
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
          aria-label="Expand series chapters"
          title="Expand series chapters"
          className="rounded p-1 text-faint transition-colors hover:bg-surface hover:text-ink"
        >
          <PanelIcon open={false} />
        </button>
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-faint">
              In this series
            </span>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              aria-label="Collapse series chapters"
              title="Collapse series chapters"
              className="rounded p-1 text-faint transition-colors hover:bg-surface hover:text-ink"
            >
              <PanelIcon open />
            </button>
          </div>

          <Link
            href={`/series/${seriesSlug}`}
            className="block font-serif text-[15px] italic leading-snug text-ink transition-colors hover:text-accent"
          >
            {seriesName}
          </Link>
          {currentPart !== null ? (
            <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
              Part {currentPart} of {totalParts}
            </p>
          ) : null}

          <ol className="mt-5 space-y-1 border-l border-line">
            {parts.map((p, i) => {
              const isCurrent = i === currentIndex;
              const isPast = currentIndex >= 0 && i < currentIndex;
              const stage = stages?.find((s) => s.from === p.part);
              return (
                <li key={p.slug}>
                  {stage ? (
                    <StageDivider name={stage.name} first={i === 0} />
                  ) : null}
                  <Link
                    href={`/blog/${p.slug}`}
                    aria-current={isCurrent ? "page" : undefined}
                    className={clsx(
                      "-ml-px flex gap-2.5 border-l py-1 pl-3 text-[13px] leading-snug transition-colors",
                      isCurrent
                        ? "border-accent font-medium text-accent"
                        : isPast
                          ? "border-transparent text-muted hover:border-line hover:text-ink"
                          : "border-transparent text-faint hover:border-line hover:text-ink"
                    )}
                  >
                    <span className="pt-px font-mono text-[10px] leading-[1.8] tabular-nums">
                      {String(p.part).padStart(2, "0")}
                    </span>
                    <span>{p.title}</span>
                  </Link>
                </li>
              );
            })}
            {Array.from({ length: comingSoon }, (_, i) => {
              const n = parts.length + i + 1;
              const stage = stages?.find((s) => s.from === n);
              return (
                <li key={`soon-${n}`}>
                  {stage ? (
                    <StageDivider
                      name={stage.name}
                      first={n === 1 && parts.length === 0}
                    />
                  ) : null}
                  <span className="-ml-px flex gap-2.5 border-l border-transparent py-1 pl-3 text-[13px] leading-snug text-faint/70">
                    <span className="pt-px font-mono text-[10px] leading-[1.8] tabular-nums">
                      {String(n).padStart(2, "0")}
                    </span>
                    <span className="italic">Coming soon</span>
                  </span>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </nav>
  );
}

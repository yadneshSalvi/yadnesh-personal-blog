"use client";

import type { PlanBlock } from "@/lib/types";
import { Markdown } from "@/components/Markdown";

// The contractor's written estimate. By the time this card renders, the
// agent has already stopped (the gate denied ExitPlanMode with a receipt
// message), so there is nothing to resolve: Implement and Refine write
// the NEXT message instead. That's the plan-mode contract: proposing is
// this turn's job; acting is a decision you take in your own time.
export function PlanCard({
  block,
  busy,
  onImplement,
  onRefine,
}: {
  block: PlanBlock;
  busy: boolean;
  onImplement: () => void;
  onRefine: () => void;
}) {
  return (
    <div className="my-2 max-w-xl overflow-hidden rounded-lg border-2 border-accent/50 bg-white dark:bg-stone-900">
      <div className="flex items-center gap-2.5 border-b border-stone-200 px-3 py-2 dark:border-stone-800">
        <span className="size-2 rounded-full bg-accent" />
        <span className="text-[13px] font-medium text-stone-700 dark:text-stone-200">
          Proposed plan
        </span>
        <span className="ml-auto font-mono text-[11px] uppercase tracking-wider text-stone-400 dark:text-stone-500">
          read-only run
        </span>
      </div>
      <div className="max-h-80 overflow-auto px-3.5 py-2">
        <Markdown text={block.markdown} />
      </div>
      {!block.settled && (
        <div className="flex flex-wrap items-center gap-3 border-t border-stone-200 px-3 py-2.5 dark:border-stone-800">
          <button
            type="button"
            disabled={busy}
            onClick={onImplement}
            className="rounded-lg bg-accent px-4 py-1.5 text-[13px] font-semibold text-white disabled:opacity-40"
          >
            Implement this plan
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onRefine}
            className="rounded-lg border border-stone-300 px-4 py-1.5 text-[13px] font-medium text-stone-600 hover:border-accent hover:text-accent disabled:opacity-40 dark:border-stone-700 dark:text-stone-300"
          >
            Refine it
          </button>
          <span className="text-[12px] text-stone-400 dark:text-stone-500">
            Implementing runs with approvals on, as usual.
          </span>
        </div>
      )}
    </div>
  );
}

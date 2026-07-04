"use client";

import type { AnalysisSummary } from "@/lib/types";

// Part 13: the form under the essay. The prose reply above this card is
// for you; this is the same analysis as data, straight from the complete
// event's structured_output. Other code would read the JSON; the UI, as
// the first consumer of the contract, renders it as the turn's ledger.
export function SummaryCard({ summary }: { summary: AnalysisSummary }) {
  return (
    <div className="my-2 max-w-xl rounded-lg border border-stone-200 bg-stone-50/80 px-3.5 py-2.5 dark:border-stone-800 dark:bg-stone-900/40">
      <p className="font-mono text-[11px] uppercase tracking-wider text-stone-400 dark:text-stone-500">
        Summary
      </p>
      <p className="mt-1 text-[13px] font-medium text-stone-700 dark:text-stone-200">
        {summary.headline}
      </p>
      <dl className="mt-1.5">
        {summary.key_metrics.map((m) => (
          <div key={m.label} className="flex items-baseline justify-between gap-4 py-0.5">
            <dt className="text-[12px] text-stone-500 dark:text-stone-400">{m.label}</dt>
            <dd className="font-mono text-[12px] text-stone-700 dark:text-stone-200">
              {m.value.toLocaleString("en-US", { maximumFractionDigits: 2 })}
              <span className="ml-1 text-stone-400 dark:text-stone-500">{m.unit}</span>
            </dd>
          </div>
        ))}
      </dl>
      {summary.caveats.length > 0 && (
        <ul className="mt-1.5 border-t border-dashed border-stone-200 pt-1.5 dark:border-stone-800">
          {summary.caveats.map((c) => (
            <li key={c} className="text-[12px] italic text-stone-400 dark:text-stone-500">
              caveat: {c}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

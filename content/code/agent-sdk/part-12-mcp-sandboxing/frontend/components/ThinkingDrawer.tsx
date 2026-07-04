"use client";

import { useState } from "react";
import type { ThinkingBlock } from "@/lib/types";

// The scratchpad, folded away. Reasoning is useful to HAVE and noisy to
// READ, so the default is a one-line drawer that admits thinking exists;
// the click is for the days you want to check the working. Faint mono,
// deliberately unglamorous: this is margin scribble, not the answer.
export function ThinkingDrawer({
  block,
  live,
}: {
  block: ThinkingBlock;
  live: boolean;
}) {
  const [open, setOpen] = useState(false);
  const words = block.text.split(/\s+/).filter(Boolean).length;

  return (
    <div className="my-1.5 max-w-xl">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300"
      >
        <span
          className={`size-1.5 rounded-full ${live ? "animate-pulse bg-accent" : "bg-stone-300 dark:bg-stone-600"}`}
        />
        {live ? "Thinking…" : `Thought for ${words} words`}
        <span className="text-stone-300 dark:text-stone-600">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <pre className="mt-1.5 max-h-56 overflow-auto rounded-lg border border-dashed border-stone-200 bg-stone-50/80 px-3 py-2 font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-stone-400 dark:border-stone-800 dark:bg-stone-900/40 dark:text-stone-500">
          {block.text}
        </pre>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import type { ToolBlock } from "@/lib/types";
import { toolLabel } from "@/lib/toolLabel";

function StatusIcon({ block }: { block: ToolBlock }) {
  if (!block.done) {
    return (
      <span className="size-3.5 shrink-0 animate-spin rounded-full border-2 border-stone-300 border-t-accent dark:border-stone-600" />
    );
  }
  if (block.isError) {
    return <span className="shrink-0 text-sm leading-none text-red-600 dark:text-red-400">&#x2715;</span>;
  }
  return <span className="shrink-0 text-sm leading-none text-green-700 dark:text-green-400">&#x2713;</span>;
}

// A pre-styled slab of tool output. max-h + overflow keep a 2,000-char
// result from flooding the chat; the wire already clipped anything bigger.
function Payload({ label, text, tone }: { label: string; text: string; tone?: "error" }) {
  return (
    <div>
      <p className="mb-1 font-mono text-[11px] uppercase tracking-wider text-stone-400 dark:text-stone-500">
        {label}
      </p>
      <pre
        className={`max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-md bg-stone-100 p-2.5 font-mono text-xs leading-relaxed dark:bg-stone-800/80 ${
          tone === "error" ? "text-red-700 dark:text-red-400" : "text-stone-700 dark:text-stone-300"
        }`}
      >
        {text}
      </pre>
    </div>
  );
}

export function ToolBadge({ block }: { block: ToolBlock }) {
  const [open, setOpen] = useState(false);
  return (
    // Part 11: a subagent's call is the same badge, indented under the
    // delegation call with a hairline and a name tag. Nesting is one
    // level deep by design; the roster has no sub-subagents.
    <div
      className={`my-1.5 max-w-xl overflow-hidden rounded-lg border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900 ${
        block.parentId ? "ml-7 border-l-2 border-l-stone-300 dark:border-l-stone-600" : ""
      }`}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-stone-50 dark:hover:bg-stone-800/60"
      >
        <StatusIcon block={block} />
        {block.agentName && (
          <span className="shrink-0 rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-stone-500 dark:bg-stone-800 dark:text-stone-400">
            {block.agentName}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-[13px] text-stone-600 dark:text-stone-300">
          {toolLabel(block)}
        </span>
        <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-stone-400 dark:text-stone-500">
          {block.name}
        </span>
        <svg
          viewBox="0 0 16 16"
          className={`size-3 shrink-0 fill-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M4.4 6 8 9.6 11.6 6l.9.9L8 11.4 3.5 6.9z" />
        </svg>
      </button>
      {open && (
        <div className="space-y-2.5 border-t border-stone-200 px-3 py-2.5 dark:border-stone-800">
          <Payload label="input" text={JSON.stringify(block.input, null, 2)} />
          {block.result !== undefined && (
            <Payload
              label={block.isError ? "error" : "result"}
              text={block.result}
              tone={block.isError ? "error" : undefined}
            />
          )}
        </div>
      )}
    </div>
  );
}

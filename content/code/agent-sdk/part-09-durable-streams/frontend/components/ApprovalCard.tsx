"use client";

import { useState } from "react";
import type { ApprovalBlock } from "@/lib/types";

// One paused tool call, rendered as a decision. While this card is pending,
// the agent is genuinely stopped server-side: a can_use_tool callback is
// awaiting a Future that only the buttons below (or a timeout) can resolve.
export function ApprovalCard({
  block,
  onDecide,
}: {
  block: ApprovalBlock;
  onDecide: (id: string, decision: "allow" | "deny", always: boolean) => void;
}) {
  const [always, setAlways] = useState(false);
  const [clicked, setClicked] = useState(false);

  if (block.status !== "pending") {
    const allowed = block.status === "allowed";
    return (
      <div className="my-1.5 flex max-w-xl items-center gap-2.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 dark:border-stone-800 dark:bg-stone-900/60">
        <span
          className={`text-sm leading-none ${allowed ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
        >
          {allowed ? "✓" : "✕"}
        </span>
        <span className="text-[13px] text-stone-500 dark:text-stone-400">
          {allowed ? "Approved" : block.reason === "timeout" ? "Denied (nobody answered in time)" : "Denied"}
        </span>
        <span className="ml-auto font-mono text-[11px] uppercase tracking-wider text-stone-400 dark:text-stone-500">
          {block.toolName}
        </span>
      </div>
    );
  }

  const preview = JSON.stringify(block.toolInput, null, 2);
  return (
    <div className="my-2 max-w-xl overflow-hidden rounded-lg border-2 border-accent/50 bg-white dark:bg-stone-900">
      <div className="flex items-center gap-2.5 border-b border-stone-200 px-3 py-2 dark:border-stone-800">
        <span className="size-2 animate-pulse rounded-full bg-accent" />
        <span className="text-[13px] font-medium text-stone-700 dark:text-stone-200">
          Approval needed
        </span>
        <span className="ml-auto font-mono text-[11px] uppercase tracking-wider text-stone-400 dark:text-stone-500">
          {block.toolName}
        </span>
      </div>
      <pre className="max-h-40 overflow-auto bg-stone-100 px-3 py-2 font-mono text-[12px] leading-relaxed break-all whitespace-pre-wrap text-stone-600 dark:bg-stone-800/80 dark:text-stone-300">
        {preview.length > 1200 ? preview.slice(0, 1200) + "\n…" : preview}
      </pre>
      <div className="flex flex-wrap items-center gap-3 px-3 py-2.5">
        <button
          type="button"
          disabled={clicked}
          onClick={() => {
            setClicked(true);
            onDecide(block.id, "allow", always);
          }}
          className="rounded-lg bg-accent px-4 py-1.5 text-[13px] font-semibold text-white disabled:opacity-40"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={clicked}
          onClick={() => {
            setClicked(true);
            onDecide(block.id, "deny", false);
          }}
          className="rounded-lg border border-stone-300 px-4 py-1.5 text-[13px] font-medium text-stone-600 hover:border-red-400 hover:text-red-600 disabled:opacity-40 dark:border-stone-700 dark:text-stone-300"
        >
          Deny
        </button>
        <label className="flex cursor-pointer items-center gap-1.5 text-[12px] text-stone-500 dark:text-stone-400">
          <input
            type="checkbox"
            checked={always}
            onChange={(e) => setAlways(e.target.checked)}
            className="size-3.5 accent-[var(--accent)]"
          />
          Don&apos;t ask again for {block.toolName} in this conversation
        </label>
      </div>
    </div>
  );
}

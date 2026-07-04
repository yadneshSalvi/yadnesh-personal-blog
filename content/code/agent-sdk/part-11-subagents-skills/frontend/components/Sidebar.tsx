"use client";

import { useState } from "react";
import type { Conversation } from "@/lib/api";

function timeAgo(ms: number): string {
  const s = Math.max(1, Math.round((Date.now() - ms) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 fill-stone-400 hover:fill-accent">
      <path d="M11.3 2.1 13.9 4.7 5.6 13H3v-2.6l8.3-8.3zm1.1-1.1 1.5-1 1.1 1.1-1 1.5-1.6-1.6z" />
    </svg>
  );
}

function BranchIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 fill-none stroke-stone-400 hover:stroke-accent" strokeWidth="1.6">
      <circle cx="4" cy="3.5" r="1.8" />
      <circle cx="4" cy="12.5" r="1.8" />
      <circle cx="12" cy="8" r="1.8" />
      <path d="M4 5.3v5.4M5.7 4.2 10.3 7M5.7 11.8 10.3 9" />
    </svg>
  );
}

// The conversations rail. Everything it shows comes from the SDK's own
// session store; the "New analysis" button is the only client-side state.
export function Sidebar({
  conversations,
  activeId,
  onNew,
  onOpen,
  onRename,
  onFork,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onNew: () => void;
  onOpen: (c: Conversation) => void;
  onRename: (c: Conversation, title: string) => void;
  onFork: (c: Conversation) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-stone-200 dark:border-stone-800">
      <div className="p-3">
        <button
          type="button"
          onClick={onNew}
          className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-700 hover:border-accent hover:text-accent dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200"
        >
          + New analysis
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {conversations.length === 0 && (
          <p className="px-2 pt-2 text-[13px] text-stone-400 dark:text-stone-500">
            No conversations yet.
          </p>
        )}
        {conversations.map((c) => (
          <div
            key={c.session_id}
            className={`group relative mb-0.5 rounded-lg ${
              c.session_id === activeId
                ? "bg-stone-100 dark:bg-stone-800/70"
                : "hover:bg-stone-100/70 dark:hover:bg-stone-800/40"
            }`}
          >
            {editing === c.session_id ? (
              <form
                className="px-2.5 py-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  setEditing(null);
                  if (draft.trim() && draft.trim() !== c.title) onRename(c, draft.trim());
                }}
              >
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => setEditing(null)}
                  className="w-full rounded border border-accent bg-white px-1.5 py-0.5 text-[13px] outline-none dark:bg-stone-900"
                />
              </form>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onOpen(c)}
                  className="w-full px-2.5 py-2 text-left"
                >
                  <span className="block truncate text-[13px] text-stone-700 dark:text-stone-200">
                    {c.title}
                  </span>
                  <span className="block font-mono text-[10.5px] text-stone-400 dark:text-stone-500">
                    {timeAgo(c.last_modified)}
                  </span>
                </button>
                <span className="absolute right-2 top-2 hidden gap-1.5 group-hover:flex">
                  <button
                    type="button"
                    title="Rename"
                    onClick={() => {
                      setEditing(c.session_id);
                      setDraft(c.title);
                    }}
                  >
                    <PencilIcon />
                  </button>
                  <button type="button" title="Duplicate chat" onClick={() => onFork(c)}>
                    <BranchIcon />
                  </button>
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}

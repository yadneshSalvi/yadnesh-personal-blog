"use client";

import { useEffect } from "react";

// The app's one notification surface: a small self-dismissing banner.
// Part 3 built it for failures; Part 4 gives it a second tone, because
// uploads deserve a receipt too, not only a complaint.
export function Toast({
  message,
  tone = "error",
  onDismiss,
}: {
  message: string;
  tone?: "error" | "success";
  onDismiss: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const border =
    tone === "error"
      ? "border-red-200 dark:border-red-900/60"
      : "border-green-200 dark:border-green-900/60";

  return (
    <div
      role="status"
      className={`fixed bottom-6 right-6 z-50 flex max-w-sm items-start gap-3 rounded-lg border bg-white px-4 py-3 shadow-lg dark:bg-stone-900 ${border}`}
    >
      {tone === "error" ? (
        <svg viewBox="0 0 20 20" className="mt-0.5 size-4 shrink-0 fill-red-600 dark:fill-red-400">
          <path d="M10 1.5 19 18H1L10 1.5zm-.9 6v5h1.8v-5H9.1zm0 6.4v1.8h1.8v-1.8H9.1z" />
        </svg>
      ) : (
        <svg viewBox="0 0 20 20" className="mt-0.5 size-4 shrink-0 fill-green-700 dark:fill-green-400">
          <path d="M10 1a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm4.2 6.3-5 6.1-3.4-3 1.2-1.35 2 1.8 3.8-4.7 1.4 1.15z" />
        </svg>
      )}
      <p className="min-w-0 flex-1 break-words text-sm text-stone-700 dark:text-stone-200">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
      >
        &#x2715;
      </button>
    </div>
  );
}

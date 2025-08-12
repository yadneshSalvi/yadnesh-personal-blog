import clsx from "clsx";
import type { ReactNode } from "react";

type CalloutType = "note" | "info" | "tip" | "success" | "warning" | "caution" | "error";

export type CalloutProps = {
  type?: CalloutType;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
};

const typeStyles: Record<CalloutType, { border: string; bg: string; text: string; icon: ReactNode; label: string }> = {
  note: {
    border: "border-zinc-700",
    bg: "bg-zinc-900/50",
    text: "text-zinc-200",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
        <path d="M11 7h2v2h-2zM11 11h2v6h-2z" />
        <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 .001-16.001A8 8 0 0 1 12 20Z" />
      </svg>
    ),
    label: "Note",
  },
  info: {
    border: "border-sky-700/50",
    bg: "bg-sky-900/30",
    text: "text-sky-100",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
        <path d="M11 10h2v8h-2zM11 6h2v2h-2z" />
        <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 .001-16.001A8 8 0 0 1 12 20Z" />
      </svg>
    ),
    label: "Info",
  },
  tip: {
    border: "border-emerald-700/50",
    bg: "bg-emerald-900/30",
    text: "text-emerald-100",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
        <path d="M9 21h6v-2H9v2Zm3-19A7 7 0 0 0 5 9c0 2.76 2 4.5 3 5v3h8v-3c1-.5 3-2.24 3-5a7 7 0 0 0-7-7Z" />
      </svg>
    ),
    label: "Tip",
  },
  success: {
    border: "border-green-700/50",
    bg: "bg-green-900/30",
    text: "text-green-100",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
        <path d="M9 16.17 5.53 12.7l-1.41 1.41L9 19 20.88 7.12l-1.41-1.41z" />
      </svg>
    ),
    label: "Success",
  },
  warning: {
    border: "border-amber-700/50",
    bg: "bg-amber-900/30",
    text: "text-amber-100",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
        <path d="M1 21h22L12 2 1 21Zm12-3h-2v-2h2v2Zm0-4h-2v-4h2v4Z" />
      </svg>
    ),
    label: "Warning",
  },
  caution: {
    border: "border-orange-700/50",
    bg: "bg-orange-900/30",
    text: "text-orange-100",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
        <path d="M12 5 1 21h22L12 5Zm0 6h2v5h-2v-5Zm0 7h2v2h-2v-2Z" />
      </svg>
    ),
    label: "Caution",
  },
  error: {
    border: "border-rose-700/50",
    bg: "bg-rose-900/30",
    text: "text-rose-100",
    icon: (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden>
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm3.54 13.54-1.41 1.41L12 13.41l-2.12 2.12-1.41-1.41L10.59 12 8.46 9.88l1.41-1.41L12 10.59l2.12-2.12 1.41 1.41L13.41 12l2.13 2.12Z" />
      </svg>
    ),
    label: "Error",
  },
};

export default function Callout({ type = "note", title, children, className }: CalloutProps) {
  const styles = typeStyles[type];
  return (
    <aside
      className={clsx(
        "not-prose relative overflow-hidden rounded-lg border p-4",
        styles.bg,
        styles.border,
        className
      )}
      role={type === "error" ? "alert" : "note"}
      aria-label={typeof title === "string" ? title : styles.label}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className={clsx("inline-flex h-5 w-5 items-center justify-center", styles.text)}>{styles.icon}</span>
        <span className={clsx("text-sm font-medium", styles.text)}>{title ?? styles.label}</span>
      </div>
      <div className="text-sm text-zinc-200">{children}</div>
    </aside>
  );
}



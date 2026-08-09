"use client";

import { useState } from "react";
import type { BriefIssue } from "@/lib/brief/schema";
import IssueList from "./IssueList";

const CADENCES = [
  { key: "all", label: "All" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
] as const;

type Cadence = (typeof CADENCES)[number]["key"];

/** Cadence chips filter within the current page. Pagination stays server-rendered. */
export default function ArchiveBrowser({ issues }: { issues: BriefIssue[] }) {
  const [cadence, setCadence] = useState<Cadence>("all");
  const shown =
    cadence === "all" ? issues : issues.filter((issue) => issue.type === cadence);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {CADENCES.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setCadence(option.key)}
            aria-pressed={cadence === option.key}
            className={`rounded-sm border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.16em] transition-colors ${
              cadence === option.key
                ? "border-accent text-accent"
                : "border-line text-muted hover:border-accent hover:text-accent"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      <div className="mt-6">
        <IssueList issues={shown} />
      </div>
    </div>
  );
}

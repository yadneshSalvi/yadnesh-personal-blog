"use client";

import { useEffect, useState } from "react";
import type { Artifact } from "@/lib/types";
import { fileUrl } from "@/lib/api";
import { Markdown } from "@/components/Markdown";

function kb(size: number): string {
  return size < 1024 ? `${size} B` : `${(size / 1024).toFixed(1)} KB`;
}

function KindIcon({ kind }: { kind: Artifact["kind"] }) {
  const cls = "size-3.5 shrink-0 fill-stone-400 dark:fill-stone-500";
  if (kind === "image") {
    return (
      <svg viewBox="0 0 16 16" className={cls}>
        <path d="M2 2h12v12H2V2zm1.5 1.5v7.6l2.6-2.6 2.2 2.2 3.4-3.4 1.8 1.8V3.5h-10zm2.7 3.1a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 16 16" className={cls}>
      <path d="M4 1h5.5L13 4.5V15H4V1zm5 1.5V5h2.5L9 2.5zM5.5 7h5v1.2h-5V7zm0 2.6h5v1.2h-5V9.6zm0 2.6h3.4v1.2H5.5v-1.2z" />
    </svg>
  );
}

// One deliverable, previewed. Images render straight off the workspace
// URL; markdown and everything else get fetched as text first.
function Preview({ workspaceId, artifact }: { workspaceId: string; artifact: Artifact }) {
  const [text, setText] = useState<string | null>(null);
  const url = fileUrl(workspaceId, artifact.path, artifact.updatedAt);

  useEffect(() => {
    if (artifact.kind === "image") return;
    let stale = false;
    setText(null);
    fetch(url)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error(`${res.status}`))))
      .then((body) => !stale && setText(body))
      .catch(() => !stale && setText("Could not load this file."));
    return () => {
      stale = true;
    };
  }, [url, artifact.kind]);

  if (artifact.kind === "image") {
    return (
      <a href={url} target="_blank" rel="noreferrer" title="Open full size">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={artifact.path}
          className="w-full cursor-zoom-in rounded-lg border border-stone-200 bg-white dark:border-stone-700"
        />
      </a>
    );
  }
  if (text === null) {
    return <p className="text-[13px] text-stone-400 dark:text-stone-500">Loading&#8230;</p>;
  }
  if (artifact.kind === "markdown") {
    return <Markdown text={text} />;
  }
  return (
    <pre className="max-h-96 overflow-auto rounded-lg bg-stone-100 p-3 font-mono text-[12px] leading-relaxed break-all whitespace-pre-wrap text-stone-600 dark:bg-stone-800/80 dark:text-stone-300">
      {text.length > 4000 ? text.slice(0, 4000) + "\n…" : text}
    </pre>
  );
}

// The right-hand panel: what the analyst has handed back this session.
// It renders only once the first artifact_update lands.
export function ArtifactsPanel({
  workspaceId,
  artifacts,
  selected,
  onSelect,
}: {
  workspaceId: string;
  artifacts: Artifact[];
  selected: string | null;
  onSelect: (path: string) => void;
}) {
  const active = artifacts.find((a) => a.path === selected) ?? artifacts[0];
  return (
    <aside className="flex w-[380px] shrink-0 flex-col border-l border-stone-200 dark:border-stone-800">
      <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3 dark:border-stone-800">
        <h2 className="text-[13px] font-semibold tracking-tight">Artifacts</h2>
        <span className="font-mono text-[11px] text-stone-400 dark:text-stone-500">
          {artifacts.length} file{artifacts.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="border-b border-stone-200 dark:border-stone-800">
        {artifacts.map((artifact) => (
          <button
            key={artifact.path}
            type="button"
            onClick={() => onSelect(artifact.path)}
            className={`flex w-full items-center gap-2.5 px-4 py-2 text-left hover:bg-stone-100 dark:hover:bg-stone-800/60 ${
              artifact.path === active?.path ? "bg-stone-100 dark:bg-stone-800/60" : ""
            }`}
          >
            <KindIcon kind={artifact.kind} />
            <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-stone-700 dark:text-stone-200">
              {artifact.path}
            </span>
            <span className="shrink-0 font-mono text-[11px] text-stone-400 dark:text-stone-500">
              {kb(artifact.size)}
            </span>
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {active && <Preview workspaceId={workspaceId} artifact={active} />}
      </div>
    </aside>
  );
}

"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import mermaid from "mermaid";
import clsx from "clsx";

type MermaidProps = {
  chart: string;
  className?: string;
  // Keep type loose to avoid typing on mermaid versions
  config?: Record<string, unknown>;
  title?: string;
  showCopy?: boolean;
  collapsible?: boolean;
  initialCollapsed?: boolean;
};

export default function Mermaid({ chart, className, config, title = "Mermaid", showCopy = true, collapsible = true, initialCollapsed = false }: MermaidProps) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(collapsible ? initialCollapsed : false);
  const id = useId().replace(/:/g, "");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "loose", ...config });
        const { svg } = await mermaid.render(`mmd-${id}`, chart);
        if (!mounted || !elRef.current) return;
        elRef.current.innerHTML = svg;
        setError(null);
      } catch (e) {
        if (!mounted) return;
        setError((e as Error)?.message || "Failed to render diagram");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [chart, id, config]);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(chart);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // noop
    }
  }, [chart]);

  return (
    <div className={clsx("not-prose w-full", className)}>
      <div className="flex items-center justify-between rounded-t-md border border-b-0 border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-zinc-300">
        <div className="truncate font-medium">{title}</div>
        <div className="flex items-center gap-1.5">
          {collapsible && (
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="rounded px-2 py-1 text-xs text-zinc-300 outline-none transition hover:bg-zinc-800 active:bg-zinc-700"
              aria-expanded={!collapsed}
              aria-label={collapsed ? "Expand diagram" : "Collapse diagram"}
            >
              {collapsed ? "Expand" : "Collapse"}
            </button>
          )}
          {showCopy && (
            <button
              type="button"
              onClick={onCopy}
              className="rounded px-2 py-1 text-xs text-zinc-300 outline-none transition hover:bg-zinc-800 active:bg-zinc-700"
              aria-label="Copy diagram source"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>
      </div>

      <div className={clsx("relative overflow-hidden rounded-b-md border border-zinc-800 bg-zinc-900/40", collapsed && "max-h-80")}>        
        <div
          ref={elRef}
          className="mx-auto w-full overflow-x-auto p-3 [&_svg]:h-auto [&_svg]:max-w-full [&_svg]:mx-auto"
          aria-live="polite"
        />
        {collapsed && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-zinc-900/80 to-transparent" />
        )}
      </div>
      {error ? <div className="mt-2 text-sm text-rose-400">{error}</div> : null}
    </div>
  );
}



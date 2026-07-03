"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Highlight, themes, Language, PrismTheme } from "prism-react-renderer";

type CodeBlockProps = {
  code: string;
  language: Language | string;
  filename?: string;
  showCopy?: boolean;
  collapsible?: boolean;
  initialCollapsed?: boolean;
  wrapLongLines?: boolean;
  className?: string;
  /** Full contents of the file this snippet belongs to (companion repo). Enables the "View full file" toggle. */
  fullCode?: string;
  /** Repo-relative path shown as the header label in full-file view, e.g. "part-05-streaming/backend/app/main.py" */
  repoPath?: string;
  /** Link for the GitHub icon in the header (exact file, with line anchor). */
  githubUrl?: string;
  /** 1-based line numbers to highlight in full-file view (the lines this section added/changed). */
  highlightLines?: number[];
};

// Map common aliases to Prism languages
const LANGUAGE_ALIASES: Record<string, Language> = {
  ts: "tsx",
  tsx: "tsx",
  typescript: "tsx",
  js: "jsx",
  javascript: "jsx",
  shell: "bash",
  sh: "bash",
  csharp: "cs",
  md: "markdown",
  html: "markup",
};

const THEME: PrismTheme = themes.vsDark as unknown as PrismTheme;

export function CodeBlock({
  code,
  language,
  filename,
  showCopy = true,
  collapsible = false,
  initialCollapsed = false,
  wrapLongLines = true,
  className,
  fullCode,
  repoPath,
  githubUrl,
  highlightLines,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(collapsible ? initialCollapsed : false);
  const [showFull, setShowFull] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const firstHighlightRef = useRef<HTMLDivElement>(null);

  const prismLanguage = useMemo<Language>(() => {
    const normalized = String(language || "").toLowerCase();
    return (LANGUAGE_ALIASES[normalized] || (normalized as Language) || "tsx");
  }, [language]);

  const highlightSet = useMemo(() => new Set(highlightLines ?? []), [highlightLines]);
  const firstHighlightLine = useMemo(
    () => (highlightLines && highlightLines.length ? Math.min(...highlightLines) : null),
    [highlightLines]
  );
  const hasFullFile = typeof fullCode === "string" && fullCode.length > 0;
  const displayedCode = showFull && hasFullFile ? (fullCode as string) : code;

  // When the full file opens, bring the first highlighted (newly added) line into view.
  useEffect(() => {
    if (!showFull) return;
    const container = scrollRef.current;
    const target = firstHighlightRef.current;
    if (container && target) {
      container.scrollTop = Math.max(0, target.offsetTop - container.clientHeight / 3);
    }
  }, [showFull]);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(displayedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // noop
    }
  }, [displayedCode]);

  const headerLabel =
    showFull && hasFullFile && repoPath
      ? repoPath
      : filename || (typeof language === "string" ? language.toUpperCase() : String(language));

  return (
    <div className={clsx("group/box w-full text-[13px]", className)}>
      <div
        className={clsx(
          "flex items-center justify-between rounded-t-md border border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-zinc-300",
          collapsed ? "rounded-b-md" : "border-b-0"
        )}
      >
        <div className="truncate font-medium">{headerLabel}</div>
        <div className="flex items-center gap-1.5">
          {collapsible && (
            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="rounded px-2 py-1 text-xs text-zinc-300 outline-none ring-0 transition hover:bg-zinc-800 active:bg-zinc-700"
              aria-expanded={!collapsed}
              aria-label={collapsed ? "Expand code" : "Collapse code"}
            >
              {collapsed ? "Expand" : "Collapse"}
            </button>
          )}
          {hasFullFile && (
            <button
              type="button"
              onClick={() => setShowFull((f) => !f)}
              className={clsx(
                "rounded px-2 py-1 text-xs outline-none ring-0 transition hover:bg-zinc-800 active:bg-zinc-700",
                showFull ? "text-[#e5825a]" : "text-zinc-300"
              )}
              aria-pressed={showFull}
              aria-label={showFull ? "Show only this snippet" : "Show the whole file"}
            >
              {showFull ? "View snippet" : "View full file"}
            </button>
          )}
          {showCopy && (
            <button
              type="button"
              onClick={onCopy}
              className="rounded px-2 py-1 text-xs text-zinc-300 outline-none ring-0 transition hover:bg-zinc-800 active:bg-zinc-700"
              aria-label="Copy code"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          )}
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded p-1 text-zinc-300 outline-none ring-0 transition hover:bg-zinc-800 hover:text-zinc-100 active:bg-zinc-700"
              aria-label="Open this file on GitHub"
              title="Open this file on GitHub"
            >
              <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
              </svg>
            </a>
          )}
        </div>
      </div>

      <div
        ref={scrollRef}
        className={clsx(
          "relative rounded-b-md border border-zinc-800",
          showFull ? "max-h-[26rem] overflow-y-auto" : "overflow-hidden",
          collapsed && "hidden"
        )}
      >
        <Highlight theme={THEME} code={displayedCode.trimEnd()} language={prismLanguage}>
          {({ className: preClass, style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className={clsx(
                preClass,
                "m-0 w-full overflow-x-auto bg-[#1e1e1e] p-4",
                wrapLongLines && !showFull ? "whitespace-pre-wrap break-words" : "whitespace-pre"
              )}
              style={style}
            >
              <code className="block">
                {tokens.map((line, i) => {
                  const lineNo = i + 1;
                  const isHighlighted = showFull && highlightSet.has(lineNo);
                  const { className: lineClass, ...lineProps } = getLineProps({ line });
                  return (
                    <div
                      key={i}
                      {...lineProps}
                      ref={showFull && lineNo === firstHighlightLine ? firstHighlightRef : undefined}
                      className={clsx(
                        lineClass,
                        showFull && "pl-3.5 -ml-4 -mr-4 pr-4 border-l-2 border-transparent",
                        isHighlighted && "border-l-[#e5825a] bg-[#e5825a]/10"
                      )}
                    >
                      {showFull && (
                        <span className="mr-4 inline-block w-8 select-none text-right text-zinc-600">
                          {lineNo}
                        </span>
                      )}
                      {line.map((token, key) => (
                        <span key={key} {...getTokenProps({ token })} />
                      ))}
                    </div>
                  );
                })}
              </code>
            </pre>
          )}
        </Highlight>

      </div>
    </div>
  );
}

export default CodeBlock;



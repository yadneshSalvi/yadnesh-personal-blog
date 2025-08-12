"use client";

import { useCallback, useMemo, useState } from "react";
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
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(collapsible ? initialCollapsed : false);

  const prismLanguage = useMemo<Language>(() => {
    const normalized = String(language || "").toLowerCase();
    return (LANGUAGE_ALIASES[normalized] || (normalized as Language) || "tsx");
  }, [language]);

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // noop
    }
  }, [code]);

  const headerLabel = filename || (typeof language === "string" ? language.toUpperCase() : String(language));

  return (
    <div className={clsx("group/box w-full text-[13px]", className)}>
      <div className="flex items-center justify-between rounded-t-md border border-b-0 border-zinc-800 bg-zinc-900/80 px-3 py-1.5 text-zinc-300">
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
        </div>
      </div>

      <div
        className={clsx(
          "relative overflow-hidden rounded-b-md border border-zinc-800",
          collapsed && "max-h-60"
        )}
      >
        <Highlight theme={THEME} code={code.trimEnd()} language={prismLanguage}>
          {({ className: preClass, style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className={clsx(
                preClass,
                "m-0 w-full overflow-x-auto bg-[#1e1e1e] p-4",
                wrapLongLines ? "whitespace-pre-wrap break-words" : "whitespace-pre"
              )}
              style={style}
            >
              <code className="block">
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line })}>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </div>
                ))}
              </code>
            </pre>
          )}
        </Highlight>

        {collapsed && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#1e1e1e] to-transparent" />
        )}
      </div>
    </div>
  );
}

export default CodeBlock;



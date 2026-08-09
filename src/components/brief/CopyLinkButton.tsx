"use client";

import { useState } from "react";

/**
 * Copies an absolute permalink to a story anchor. Sits beside each story so a
 * single item can be shared without screenshotting the issue.
 */
export default function CopyLinkButton({
  anchor,
  label,
}: {
  anchor: string;
  label: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${anchor}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy link to ${label}`}
      className="shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-faint transition-colors hover:text-accent"
    >
      {copied ? "Copied" : "Link"}
    </button>
  );
}

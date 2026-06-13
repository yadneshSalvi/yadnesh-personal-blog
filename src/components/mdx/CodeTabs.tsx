"use client";

import * as React from "react";
import clsx from "clsx";

/**
 * Provider tabs for tutorial snippets (OpenAI / Anthropic).
 * The reader picks once; the choice persists in localStorage and a custom
 * event flips every CodeTabs instance on the page in sync.
 */

const STORAGE_KEY = "llm-provider";
const SYNC_EVENT = "llm-provider-change";

export type TabProps = {
  label: string;
  children?: React.ReactNode;
};

export function Tab({ children }: TabProps) {
  return <>{children}</>;
}

export default function CodeTabs({ children }: { children?: React.ReactNode }) {
  const tabs = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<TabProps> =>
      React.isValidElement<TabProps>(child) &&
      typeof (child.props as TabProps).label === "string"
  );
  const labels = tabs.map((tab) => tab.props.label);
  const labelKey = labels.join("|");
  const [active, setActive] = React.useState(0);
  const tabRefs = React.useRef<(HTMLButtonElement | null)[]>([]);

  React.useEffect(() => {
    const indexFor = (value: string | null) =>
      labelKey
        .split("|")
        .findIndex((label) => label.toLowerCase() === value?.toLowerCase());

    const stored = indexFor(window.localStorage.getItem(STORAGE_KEY));
    if (stored >= 0) setActive(stored);

    const onSync = (event: Event) => {
      const idx = indexFor((event as CustomEvent<string>).detail);
      if (idx >= 0) setActive(idx);
    };
    window.addEventListener(SYNC_EVENT, onSync);
    return () => window.removeEventListener(SYNC_EVENT, onSync);
  }, [labelKey]);

  const select = (idx: number) => {
    setActive(idx);
    const value = labels[idx].toLowerCase();
    window.localStorage.setItem(STORAGE_KEY, value);
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: value }));
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    event.preventDefault();
    const next =
      event.key === "ArrowRight"
        ? (active + 1) % tabs.length
        : (active - 1 + tabs.length) % tabs.length;
    select(next);
    tabRefs.current[next]?.focus();
  };

  if (tabs.length === 0) return null;

  return (
    <div className="not-prose my-6">
      <div
        role="tablist"
        aria-label="LLM provider"
        className="flex gap-6 border-b border-line"
        onKeyDown={onKeyDown}
      >
        {labels.map((label, idx) => (
          <button
            key={label}
            ref={(el) => {
              tabRefs.current[idx] = el;
            }}
            role="tab"
            id={`tab-${idx}-${labelKey}`}
            aria-selected={idx === active}
            tabIndex={idx === active ? 0 : -1}
            onClick={() => select(idx)}
            className={clsx(
              "-mb-px cursor-pointer border-b pb-2 font-mono text-[11px] uppercase tracking-[0.15em] transition-colors",
              idx === active
                ? "border-accent text-accent"
                : "border-transparent text-faint hover:text-ink"
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {tabs.map((tab, idx) => (
        <div
          key={labels[idx]}
          role="tabpanel"
          aria-labelledby={`tab-${idx}-${labelKey}`}
          hidden={idx !== active}
        >
          {tab.props.children}
        </div>
      ))}
    </div>
  );
}

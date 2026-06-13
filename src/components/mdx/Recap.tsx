import * as React from "react";
import clsx from "clsx";

/**
 * The "What you built" recap at the close of each tutorial part.
 * A soft green panel with check-mark bullets, using the same palette as the
 * `success` Callout so it reads as native to the ink & paper system.
 *
 * Authored in MDX as:
 *   <Recap part={1} items={["A backend on `localhost:8000` ...", "..."]} />
 */

export type RecapProps = {
  /** Optional ordinal shown as a faint "PART n" tag in the header. */
  part?: number;
  /** Heading text; defaults to "What you built". */
  title?: string;
  /** One string per capability. Inline `code` (backticks) is rendered. */
  items: string[];
};

/** Render a plain string with `backtick` spans turned into <code>. */
function withInlineCode(text: string, codeClassName: string): React.ReactNode {
  return text.split("`").map((part, i) =>
    i % 2 === 1 ? (
      <code key={i} className={codeClassName}>
        {part}
      </code>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

const Check = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden className={className}>
    <path d="M9 16.17 5.53 12.7l-1.41 1.41L9 19 20.88 7.12l-1.41-1.41z" />
  </svg>
);

export default function Recap({ part, title = "What you built", items }: RecapProps) {
  const codeClass =
    "rounded bg-green-100 px-1 py-0.5 font-mono text-[0.85em] text-green-900 dark:bg-green-900/40 dark:text-green-100";

  return (
    <section
      className={clsx(
        "not-prose my-10 overflow-hidden rounded-lg border",
        "border-green-200 bg-green-50/80 dark:border-green-800/40 dark:bg-green-950/30"
      )}
    >
      <div className="flex items-center justify-between gap-4 px-6 pt-5">
        <h2 className="m-0 flex items-center gap-2 scroll-mt-24 font-mono text-[11px] font-medium uppercase tracking-[0.2em] text-green-700 dark:text-green-300">
          <Check className="text-green-600 dark:text-green-400" />
          {title}
        </h2>
        {part != null ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-green-600/70 dark:text-green-400/60">
            Part {part}
          </span>
        ) : null}
      </div>

      <ul className="space-y-3 px-6 pb-6 pt-4">
        {items.map((item, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-[3px] shrink-0 text-green-600 dark:text-green-400">
              <Check />
            </span>
            <span className="text-[15px] leading-relaxed text-green-900/90 dark:text-green-50/90">
              {withInlineCode(item, codeClass)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

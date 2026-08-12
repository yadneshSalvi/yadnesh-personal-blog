/**
 * The department head. Where `Kicker` labels a sub-block in faint mono,
 * this opens a whole department: a rule across the measure, the label in ink,
 * an accent tick, and the story count on the right.
 *
 * The `border-t` is doing structural work, not decoration. Story lists already
 * close with `border-b border-line`, so a rule on top turns each department
 * into a ruled block instead of one more paragraph in a stack.
 */
export default function SectionHead({
  label,
  count,
}: {
  label: string;
  /** Rendered zero-padded on the right. Omit for blocks that hold no list. */
  count?: number;
}) {
  return (
    <header className="border-t border-line pt-4">
      <div className="flex items-baseline justify-between gap-4">
        <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.25em] text-ink">
          <span aria-hidden className="h-px w-6 bg-accent" />
          {label}
        </p>
        {typeof count === "number" ? (
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] tabular-nums text-faint">
            {String(count).padStart(2, "0")}
          </p>
        ) : null}
      </div>
    </header>
  );
}

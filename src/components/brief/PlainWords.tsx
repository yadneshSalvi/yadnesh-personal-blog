/**
 * The plain-words bullets themselves, without any disclosure machinery around
 * them. Server-safe on purpose: the story page renders this list expanded and
 * has no reason to ship a toggle's worth of JavaScript to do it.
 *
 * The look is a fourth register. Reporting is plain, opinion carries a 2px
 * accent rule (`EditorNote`), humor sits in a filled surface box (`HedgeBlock`),
 * and a reading aid gets a hairline and mono markers.
 */
export default function PlainWordsList({
  bullets,
  id,
  inert,
}: {
  bullets: string[];
  id?: string;
  /** Set while the panel is collapsed, so its text leaves the a11y tree. */
  inert?: boolean;
}) {
  return (
    <ul id={id} inert={inert} className="space-y-2 border-l border-line pl-5">
      {bullets.map((bullet, i) => (
        <li
          key={i}
          className="grid grid-cols-[0.75rem_1fr] gap-x-2 text-[0.95rem] leading-relaxed text-muted"
        >
          <span aria-hidden className="pt-[0.35em] font-mono text-[10px] text-faint">
            ·
          </span>
          <span>{bullet}</span>
        </li>
      ))}
    </ul>
  );
}

import clsx from "clsx";

/**
 * Sidebar panel glyph used by the collapsible rails (TOC, SeriesNav).
 * `open` flips the chevron; `mirrored` flips the whole glyph for
 * right-hand rails so the panel edge matches the side it controls.
 */
export default function PanelIcon({
  open,
  mirrored = false,
}: {
  open: boolean;
  mirrored?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={clsx("h-4 w-4", mirrored && "-scale-x-100")}
      aria-hidden
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9 4v16" />
      {open ? <path d="M15.5 10l-2 2 2 2" /> : <path d="M14 10l2 2-2 2" />}
    </svg>
  );
}

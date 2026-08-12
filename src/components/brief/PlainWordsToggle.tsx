"use client";

import { useId, useState } from "react";
import clsx from "clsx";
import PlainWordsList from "./PlainWords";

/**
 * "In plain words": the same story, restated for somebody who does not already
 * know what a harness or a reward hack is.
 *
 * Collapsed by default. An issue carries six to nine of these, and a page that
 * opens all of them has quietly doubled its own length, which is the one thing
 * a four-minute brief cannot do.
 *
 * The open/close animation is the grid-rows trick (0fr to 1fr), the only way to
 * animate to an automatic height without measuring the content first. The
 * transition lives in globals.css behind a reduced-motion query; here the state
 * is just a data attribute.
 *
 * `inert` while collapsed matters more than it looks: a grid row of 0fr clips
 * the panel visually but leaves it in the accessibility tree, so without it a
 * screen reader would read out bullets that are not on screen.
 */
export default function PlainWordsToggle({ bullets }: { bullets: string[] }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  if (bullets.length === 0) return null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={panelId}
        className={clsx(
          "-ml-1 inline-flex items-center gap-1.5 rounded-sm px-1 py-1 font-mono text-[11px] uppercase tracking-[0.18em] transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
          open ? "text-accent" : "text-faint hover:text-ink",
        )}
      >
        {/* A rotating text glyph rather than an icon component: nothing else in
            the brief ships an SVG icon, and a mono chevron matches the register
            of the label it sits next to. */}
        <span
          aria-hidden
          className={clsx("transition-transform duration-200", open && "rotate-90")}
        >
          &rsaquo;
        </span>
        In plain words
      </button>
      <div id={panelId} data-open={open} className="disclosure-grid">
        <div>
          <div
            className={clsx(
              "mt-3 transition-opacity duration-200",
              open ? "opacity-100" : "opacity-0",
            )}
          >
            <PlainWordsList bullets={bullets} inert={!open} />
          </div>
        </div>
      </div>
    </div>
  );
}

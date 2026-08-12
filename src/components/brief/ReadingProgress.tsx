/**
 * A hairline of accent under the sticky header that fills as the page scrolls.
 *
 * There is no JavaScript here and no scroll listener anywhere: the whole effect
 * is a CSS scroll-driven animation declared in globals.css.
 *
 * The empty state and the transform origin belong to `.read-progress` and are
 * deliberately not Tailwind utilities. `scale-x-0` compiles to the independent
 * `scale` property, which multiplies with the keyframe's `transform` and pins
 * the bar at zero width at every scroll position. It looks correct in the
 * computed styles and paints nothing.
 *
 * The offset is the header's height plus its bottom border, not `top-14`. The
 * header is h-14 of content inside a bordered box, so it ends at 57px, and a
 * bar at 56px lands inside that border and is painted over by it: 1px of accent
 * hidden under 1px of rule, correct in every measurement and invisible on the
 * page. Sitting below the border also keeps this out of any stacking argument
 * with the header or the cover's lightbox.
 */
export default function ReadingProgress() {
  return (
    <div
      aria-hidden
      className="read-progress pointer-events-none fixed inset-x-0 top-[calc(3.5rem+1px)] z-30 h-px bg-accent"
    />
  );
}

import Image from "next/image";
import clsx from "clsx";
import type { BriefArtwork } from "@/lib/brief/schema";

/**
 * One piece of artwork in whichever paper the reader is on, filling a box the
 * caller has already sized.
 *
 * Two variants render and CSS picks: `dark:hidden` on the light file, `hidden
 * dark:block` on the dark one. `hidden` is `display:none`, so exactly one of
 * them is in the accessibility tree at a time and a screen reader reads the alt
 * text once. That single alt is correct for both by construction, because the
 * dark file is a duotone remap of the light one: same composition, same
 * subject, different ink.
 *
 * `fill` rather than width and height. The parent carries the aspect ratio, so
 * the space is reserved by CSS and a generator that changes its output size
 * cannot shift the layout.
 *
 * With no dark variant the single file gets the knockback the memes use. That
 * is the degradation path rather than the norm, since the pipeline computes a
 * dark variant for everything it draws.
 */
export default function ThemedArt({
  art,
  className,
  sizes,
  priority,
}: {
  art: BriefArtwork;
  /** Applied to the image itself. Should carry object-fit. */
  className?: string;
  sizes: string;
  priority?: boolean;
}) {
  // alt is passed explicitly on each of these rather than spread in with the
  // rest: the jsx-a11y rule cannot see through a spread and flags every one of
  // them as missing it.
  const shared = { fill: true, sizes, priority };

  if (!art.dark) {
    return (
      <Image
        {...shared}
        alt={art.alt}
        src={art.light}
        className={clsx(className, "dark:brightness-[0.85]")}
      />
    );
  }

  return (
    <>
      <Image
        {...shared}
        alt={art.alt}
        src={art.light}
        className={clsx(className, "dark:hidden")}
      />
      <Image
        {...shared}
        alt={art.alt}
        src={art.dark}
        className={clsx(className, "hidden dark:block")}
      />
    </>
  );
}

// src/lib/brief/artwork.ts
//
// The `sizes` strings and CSS aspect boxes for issue covers and story pictures.
//
// There are no pixel dimensions in here, and that is the point. Every thumbnail
// renders through next/image's `fill` into a box whose shape CSS already
// declares, so the layout reserves exactly the right space no matter what the
// generator emitted: a cover arrives as 1536x864 today because gpt-image-1 has
// no native 16:9 and the pipeline center-crops a 3:2 render, and none of that
// reaches this file.
//
// Keeping dimensions out also keeps node:fs out, which this module cannot
// afford: it is reachable from IssueList, which renders inside the archive's
// client component. Measuring here once pulled the filesystem into the client
// bundle and took every newsletter page down with it.
//
// The cover is the single exception and measures in IssueCover, a server
// component, because its lightbox needs the real pixel size to open at.

/** The cover runs at the article's full measure, which tops out at 768px. */
export const COVER_SIZES = "(max-width: 1024px) calc(100vw - 3rem), 768px";

/** The gutter thumbnail: 4.5rem, 8.5rem, 10.5rem at the three breakpoints. */
export const STORY_IMAGE_SIZES =
  "(max-width: 640px) 72px, (max-width: 1024px) 136px, 168px";

/** The landing hero, which is the widest an image gets on this site. */
export const HERO_SIZES = "(max-width: 640px) calc(100vw - 3rem), 768px";

/** The compact card and the archive row thumbnail. */
export const LIST_THUMB_SIZES = "(max-width: 640px) 80px, 208px";

/** A story page's own picture, capped at max-w-lg so it never upscales. */
export const STORY_PAGE_IMAGE_SIZES =
  "(max-width: 640px) calc(100vw - 3rem), 512px";

/**
 * The two boxes, as Tailwind classes. `relative` is required by `fill`, and
 * pairing it with the ratio here means a component can never declare one
 * without the other.
 */
export const COVER_BOX = "relative aspect-[16/9]";
export const STORY_IMAGE_BOX = "relative aspect-[4/3]";

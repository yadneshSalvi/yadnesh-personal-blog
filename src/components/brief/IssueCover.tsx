import clsx from "clsx";
import ZoomableImage from "@/components/ZoomableImage";
import type { BriefArtwork } from "@/lib/brief/schema";
import { COVER_BOX, COVER_SIZES } from "@/lib/brief/artwork";
import { publicImageSize } from "@/lib/brief/imageSize";

/**
 * The one dominant element on an issue page. It sits under the deck, at the
 * article's full measure, and nothing else on the page competes with it: the
 * lead story does not carry a picture of its own, because this is it.
 *
 * The only artwork on the site that measures its own file. Everything else
 * fills a CSS box and never needs a pixel count, but the lightbox has to know
 * what size to open at, and passing it a ratio would make it open barely larger
 * than the inline image. Measuring is safe here and nowhere else: this is a
 * server component, while the thumbnails reach code that the archive's client
 * component pulls into the browser bundle.
 *
 * The box is still declared in CSS. A measurement that somehow failed would
 * fall back to a square, and pinning the aspect here means that would crop the
 * cover rather than reshape the page around it.
 *
 * No caption. A caption would make this read as a figure inside the article
 * rather than the cover of it. The one line underneath is the same disclosure
 * the memes carry, because the art is generated and saying so is the brand.
 *
 * No entrance animation either, on purpose: this is the page's largest paint,
 * and fading it in would both delay that measurement and risk showing a
 * half-transparent cover to anyone whose scroll position starts inside the
 * animation's range.
 */
export default function IssueCover({
  cover,
  title,
}: {
  cover: BriefArtwork;
  title: string;
}) {
  const { width, height } = publicImageSize(cover.light);

  return (
    <figure className="mt-10">
      <ZoomableImage
        src={cover.light}
        srcDark={cover.dark ?? undefined}
        alt={cover.alt}
        width={width}
        height={height}
        priority
        frameClassName={`${COVER_BOX} overflow-hidden rounded-sm border border-line`}
        imageClassName={clsx(
          "absolute inset-0 h-full w-full object-cover",
          !cover.dark && "dark:brightness-[0.9]",
        )}
        sizes={COVER_SIZES}
        zoomLabel={`Enlarge the cover for ${title}`}
      />
      <figcaption className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-faint">
        Drawn by an image model.
      </figcaption>
    </figure>
  );
}

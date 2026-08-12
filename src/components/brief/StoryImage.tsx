import type { BriefArtwork } from "@/lib/brief/schema";
import { STORY_IMAGE_BOX, STORY_IMAGE_SIZES } from "@/lib/brief/artwork";
import ThemedArt from "./ThemedArt";

/**
 * The picture that hangs in a story row's right-hand gutter.
 *
 * Deliberately not interactive. Only the headline is a link, so a hover
 * response here would promise a click target that isn't there. The cards that
 * ARE entirely clickable (the landing hero, archive rows) do get one.
 */
export default function StoryImage({ image }: { image: BriefArtwork }) {
  return (
    <div
      className={`${STORY_IMAGE_BOX} overflow-hidden rounded-sm border border-line`}
    >
      <ThemedArt
        art={image}
        sizes={STORY_IMAGE_SIZES}
        className="object-cover"
      />
    </div>
  );
}

/**
 * What sits in the gutter of a story that has no picture, inside a section
 * where other stories do.
 *
 * A section reserves the gutter for all of its rows or none of them, which is
 * what keeps the headlines' left edge from moving. That leaves a hole on the
 * rows without art, and a hole reads as a missing image. A short rule at the
 * headline's cap height reads as a mark somebody made on purpose.
 */
export function GutterTick() {
  return <span aria-hidden className="mt-[0.6rem] block h-px w-6 bg-line" />;
}

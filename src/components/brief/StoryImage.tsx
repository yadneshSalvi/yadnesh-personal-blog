import type { BriefArtwork } from "@/lib/brief/schema";
import { STORY_IMAGE_BOX, STORY_IMAGE_SIZES } from "@/lib/brief/artwork";
import ThemedArt from "./ThemedArt";

/**
 * The diagram that belongs to a story, set as a plate under its summary.
 *
 * It is not a thumbnail and it is deliberately not in a side gutter. What the
 * pipeline draws are captioned diagrams: a sandbox with the word SANDBOX on it,
 * a BEFORE and AFTER pair, a memory grid with labelled cells. Their words are
 * load-bearing, and at the 168px a gutter can spare, a cap height of 80 source
 * pixels lands at seven on screen. A picture whose labels cannot be read is
 * worse than no picture, because it advertises information it withholds.
 *
 * Half the measure on a wide screen, the full measure on a phone. That is the
 * inversion of a thumbnail's usual behaviour and it is the right one here:
 * small screens have the least room to spare and the most need for the art to
 * be legible when it does appear.
 */
export default function StoryImage({ image }: { image: BriefArtwork }) {
  return (
    <figure
      className={`${STORY_IMAGE_BOX} mt-4 w-full overflow-hidden rounded-sm border border-line sm:w-80`}
    >
      <ThemedArt
        art={image}
        sizes={STORY_IMAGE_SIZES}
        className="object-cover"
      />
    </figure>
  );
}

import type { BriefArtwork } from "@/lib/brief/schema";
import { STORY_IMAGE_BOX, STORY_IMAGE_SIZES } from "@/lib/brief/artwork";
import ThemedArt from "./ThemedArt";

/**
 * The diagram that belongs to a story. It fills whatever column it is given:
 * half the row in the title band from md up, the full measure below that.
 *
 * Its size is the caller's decision because legibility is the constraint that
 * matters. What the pipeline draws are captioned diagrams, a cube labelled
 * SANDBOX, a BEFORE and AFTER pair, a memory grid with labelled cells, and
 * their words are load-bearing. A cap height of 80 source pixels needs roughly
 * a 300px frame to stay readable; at thumbnail size it is mush, and a picture
 * whose labels cannot be read is worse than no picture because it advertises
 * information it withholds. Small screens therefore get the full measure
 * rather than a half-width miniature.
 */
export default function StoryImage({ image }: { image: BriefArtwork }) {
  return (
    <figure
      className={`${STORY_IMAGE_BOX} mt-4 w-full overflow-hidden rounded-sm border border-line md:mt-0`}
    >
      <ThemedArt
        art={image}
        sizes={STORY_IMAGE_SIZES}
        className="object-cover"
      />
    </figure>
  );
}

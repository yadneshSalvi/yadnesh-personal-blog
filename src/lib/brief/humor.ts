// src/lib/brief/humor.ts
//
// The labels the humor blocks are known by. They live here rather than in the
// components because the TOC rail names the same blocks, and the rail must not
// drag a server-only module (the image measurer) into the client bundle.

/** A daily runs a meme of the day; a weekly runs one of the week. */
export function memeLabel(type: "daily" | "weekly"): string {
  return type === "weekly" ? "Meme of the week" : "Meme of the day";
}

export const COMIC_LABEL = "The comic";
export const HEDGE_LABEL = "Hedge of the day";

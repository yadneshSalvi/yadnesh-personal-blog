// src/lib/brief/mdLinks.ts
//
// The through line is the one place the composer writes markdown links
// ([label](href)) into prose. Everything else in an issue is plain strings.
// This is the whole grammar we accept: a bracketed label and an https or
// site-relative href. Anything else stays literal text, so a malformed or
// hostile href ("javascript:", a bare word) can never become a link.
//
// Pure module, no imports: the render sites include the email renderer and
// the feed renderer, which node's type stripping loads directly.

export type MdSegment = { text: string; href: string | null };

const MD_LINK = /\[([^\]\n]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]*)\)/g;

export function parseMdLinks(text: string): MdSegment[] {
  const segments: MdSegment[] = [];
  let last = 0;
  for (const match of text.matchAll(MD_LINK)) {
    const index = match.index ?? 0;
    if (index > last) segments.push({ text: text.slice(last, index), href: null });
    segments.push({ text: match[1], href: match[2] });
    last = index + match[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), href: null });
  return segments;
}

/** The prose with link syntax removed, for word counts and drop-cap checks. */
export function stripMdLinks(text: string): string {
  return parseMdLinks(text)
    .map((segment) => segment.text)
    .join("");
}

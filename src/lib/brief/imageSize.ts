// src/lib/brief/imageSize.ts
//
// Intrinsic pixel size of a committed image, read at build time.
//
// next/image wants a width and a height, and a meme's aspect ratio is whatever
// the drawing turned out to be. Guessing gives every meme a layout shift the
// moment it loads and hands the zoom dialog the wrong shape, so the file header
// is read straight off disk instead.
//
// Both formats the pipeline can emit are parsed here (png, and all three webp
// variants) so that switching format is a content decision with no code
// coupling. Anything unrecognised falls back to a 4:3 box rather than throwing;
// a missing file is already a CI failure, so this path should be unreachable.

import fs from "node:fs";
import path from "node:path";

export type ImageSize = { width: number; height: number };

/**
 * Used only when a file cannot be measured at render time. CI refuses to let an
 * unmeasurable image reach main, so this is a seatbelt rather than a code path
 * anyone should hit.
 *
 * It is square on purpose: the pipeline renders every meme at 1024x1024 from a
 * constant, so a square guess is wrong by nothing on the normal case, whereas
 * the 4:3 box this used to fall back to was guaranteed wrong on every single
 * drawing the generator produces.
 */
export const FALLBACK_IMAGE_SIZE: ImageSize = { width: 1024, height: 1024 };

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Enough for a PNG's IHDR and for the largest of the webp headers. */
const HEADER_BYTES = 32;

function pngSize(header: Buffer): ImageSize | null {
  // Fixed layout: 8-byte signature, 4-byte chunk length, "IHDR", then width and
  // height as big-endian 32-bit integers.
  if (header.length < 24) return null;
  if (!header.subarray(0, 8).equals(PNG_SIGNATURE)) return null;
  return { width: header.readUInt32BE(16), height: header.readUInt32BE(20) };
}

/**
 * WebP is a RIFF container whose fourth chunk tag says which of three encodings
 * follows, and each one stores its dimensions somewhere different:
 *
 *   VP8X  extended (what an alpha or animated file uses): canvas size minus one,
 *         as two 24-bit little-endian integers.
 *   VP8   lossy: a 3-byte frame tag, a 3-byte start code, then two 16-bit
 *         little-endian values whose low 14 bits are the dimensions.
 *   VP8L  lossless: a signature byte, then 28 bits packing width-1 and height-1
 *         into 14 bits each.
 */
function webpSize(header: Buffer): ImageSize | null {
  if (header.length < 30) return null;
  if (header.toString("ascii", 0, 4) !== "RIFF") return null;
  if (header.toString("ascii", 8, 12) !== "WEBP") return null;

  switch (header.toString("ascii", 12, 16)) {
    case "VP8X":
      return {
        width: header.readUIntLE(24, 3) + 1,
        height: header.readUIntLE(27, 3) + 1,
      };
    case "VP8 ": {
      if (header[23] !== 0x9d || header[24] !== 0x01 || header[25] !== 0x2a) {
        return null;
      }
      return {
        width: header.readUInt16LE(26) & 0x3fff,
        height: header.readUInt16LE(28) & 0x3fff,
      };
    }
    case "VP8L": {
      if (header[20] !== 0x2f) return null;
      const bits = header.readUInt32LE(21);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >>> 14) & 0x3fff) + 1,
      };
    }
    default:
      return null;
  }
}

/**
 * The real intrinsic size of `/images/brief/memes/2026-08-12/one.webp`, or null
 * when the file is missing, truncated, or in a format this cannot read.
 *
 * CI calls this one and treats null as a validation error, because a wrong
 * aspect ratio that ships silently is exactly the bug that survives to
 * production. `root` exists so the validator can resolve against the repo it is
 * checking rather than whatever directory it was invoked from.
 */
export function measurePublicImage(
  sitePath: string,
  root: string = process.cwd(),
): ImageSize | null {
  const file = path.join(root, "public", sitePath.replace(/^\/+/, ""));

  let handle: number | null = null;
  try {
    handle = fs.openSync(file, "r");
    const buffer = Buffer.alloc(HEADER_BYTES);
    const read = fs.readSync(handle, buffer, 0, HEADER_BYTES, 0);
    const header = buffer.subarray(0, read);

    const size = pngSize(header) ?? webpSize(header);
    if (!size || size.width <= 0 || size.height <= 0) return null;
    return size;
  } catch {
    return null;
  } finally {
    if (handle !== null) fs.closeSync(handle);
  }
}

/**
 * The render-time wrapper: same measurement, but a page never dies over a bad
 * image. It says so loudly instead, because the only way to get here is for an
 * unmeasurable file to have slipped past CI.
 */
export function publicImageSize(sitePath: string): ImageSize {
  const size = measurePublicImage(sitePath);
  if (size) return size;
  console.warn(
    `[brief] could not read the dimensions of ${sitePath}; falling back to ` +
      `${FALLBACK_IMAGE_SIZE.width}x${FALLBACK_IMAGE_SIZE.height}. If the art is not square, ` +
      `its layout box is now the wrong shape. This should have failed validation.`,
  );
  return FALLBACK_IMAGE_SIZE;
}

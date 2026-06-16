// scripts/compress-covers.mjs
// One-off: recompress the oversized photographic cover PNGs to JPEG (q82, max 1400px).
// These covers also serve as Open Graph images, so JPEG is chosen for universal
// social-card compatibility. Run: `node scripts/compress-covers.mjs`.
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

// [source PNG (relative to repo root), output JPEG]
const jobs = [
  ["public/images/series/langgraph/cover.png", "public/images/series/langgraph/cover.jpg"],
  ["public/vibecoding.png", "public/vibecoding.jpg"],
  ["public/why-this-blog2.png", "public/why-this-blog2.jpg"],
];

for (const [src, out] of jobs) {
  const buf = fs.readFileSync(path.join(root, src)); // read fully first (safe to overwrite dir)
  await sharp(buf)
    .resize({ width: 1400, withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(path.join(root, out));
  const size = fs.statSync(path.join(root, out)).size;
  console.log(`${out} — ${(size / 1024) | 0} KB`);
}

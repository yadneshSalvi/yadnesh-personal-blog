// scripts/gen-og-default.mjs
// One-off generator for the default Open Graph share image (public/og-default.png).
// Ink-and-paper brand. 1200×630 PNG. Run: `node scripts/gen-og-default.mjs`.
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "..", "public", "og-default.png");

// Brand tokens (from src/app/globals.css :root)
const PAPER = "#faf9f6";
const INK = "#1f1c19";
const MUTED = "#5b554c";
const FAINT = "#8f887a";
const LINE = "#e7e3d9";
const ACCENT = "#b3441a";

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="${PAPER}"/>
  <rect x="0" y="0" width="1200" height="10" fill="${ACCENT}"/>
  <rect x="56" y="56" width="1088" height="518" fill="none" stroke="${LINE}" stroke-width="2"/>

  <!-- eyebrow -->
  <text x="110" y="170" font-family="Helvetica, Arial, sans-serif" font-size="30"
        letter-spacing="8" fill="${FAINT}" font-weight="600">YADNESH SALVI</text>

  <!-- title -->
  <text x="106" y="320" font-family="Georgia, 'Times New Roman', serif" font-size="92"
        fill="${INK}" font-weight="700">Notes on AI</text>
  <text x="106" y="420" font-family="Georgia, 'Times New Roman', serif" font-size="92"
        fill="${INK}" font-weight="700">Engineering</text>

  <!-- subtitle -->
  <text x="110" y="490" font-family="Georgia, 'Times New Roman', serif" font-size="32"
        font-style="italic" fill="${MUTED}">Agents · RAG · Fine-tuning · what survives production</text>

  <!-- footer -->
  <circle cx="118" cy="540" r="7" fill="${ACCENT}"/>
  <text x="138" y="549" font-family="Helvetica, Arial, sans-serif" font-size="26"
        fill="${FAINT}" letter-spacing="1">yadneshsalvi.com</text>
</svg>`;

await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(OUT);
const meta = await sharp(OUT).metadata();
console.log(`Wrote ${OUT} — ${meta.width}×${meta.height}, format ${meta.format}`);

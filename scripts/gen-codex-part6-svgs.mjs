/**
 * Part 6 SVG assets for "Codex App Server in Production".
 * Everything mirrors REAL runs (2026-07-07, codex-cli 0.142.4 /
 * gpt-5.4-mini behind the part-06 backend, clean CODEX_HOME): the kernel
 * refusal string ("zsh:1: operation not permitted:
 * /Users/yadneshsalvi/pagewright-escape-test.txt"), the curl exit code 6
 * ("Could not resolve host: fonts.googleapis.com"), the zero-item forced
 * write (4,359 ms), the read-only proposal, the trusted-mode font install
 * (32s, @fontsource tarball staged in /private/tmp), and the receipts
 * (thread-cumulative totals 46,334 -> 1,090,668) are measured values from
 * the capture traces (p6-sse-*.txt, p6-raw-*.jsonl). Hosts shown
 * reader-world (localhost:3000).
 *
 * Usage: node scripts/gen-codex-part6-svgs.mjs
 */
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";

const BASE = "/Users/yadneshsalvi/code/yadnesh-personal-blog/public/images/series/codex";
const P1 = `${BASE}/part-1`;
const OUT = `${BASE}/part-6`;
mkdirSync(OUT, { recursive: true });

const MONO = `font-family="'SF Mono', Menlo, Consolas, monospace"`;
const SANS = `font-family="-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"`;
const SERIF = `font-family="Georgia, 'Times New Roman', serif"`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---- shared palettes (ink & paper tokens, same as Parts 1-5) ----
const D = {
  light: {
    paper: "#faf9f6", line: "#e7e3d9", ink: "#1f1c19", muted: "#5b554c",
    faint: "#8f887a", accent: "#b3441a", surface: "#f1efe9",
    chip: "#ffffff", accentTint: "#f6e7df", accentLine: "#dcb09a",
    green: "#3f6212", greenTint: "#f2f7e8", red: "#b91c1c", redTint: "#fbeaea",
    amber: "#92600a", amberTint: "#fdf3e0", amberLine: "#e4c27e",
    sky: "#0e6ea8", skyTint: "#e8f3fa", skyLine: "#9cc8e3",
  },
  dark: {
    paper: "#151311", line: "#2b2723", ink: "#ebe7df", muted: "#a49c90",
    faint: "#756d62", accent: "#e5825a", surface: "#1d1a17",
    chip: "#211e1a", accentTint: "#2a201a", accentLine: "#5e463a",
    green: "#a3c57d", greenTint: "#1d2314", red: "#e08585", redTint: "#2a1717",
    amber: "#dcae62", amberTint: "#26200f", amberLine: "#6b5426",
    sky: "#6fb3dd", skyTint: "#101c24", skyLine: "#2d4c60",
  },
};
const TT = {
  bg: "#1a1816", chrome: "#211e1a", dot: "#3a3530", label: "#756d62",
  text: "#d8d2c6", faint: "#756d62", accent: "#e5825a", green: "#8fb573",
  blue: "#6fa8dc", red: "#d97676",
};

// App-window chrome + UI palettes (stone tokens, same as Parts 3-5 captures)
const CH = {
  light: { chromeBg: "#f3f1ec", chromeLine: "#e2ded4", dots: "#d6d1c5", urlFill: "#ffffff", urlStroke: "#e2ded4", urlText: "#5b554c" },
  dark: { chromeBg: "#211e1a", chromeLine: "#2b2723", dots: "#3a3530", urlFill: "#1a1816", urlStroke: "#3a3530", urlText: "#a49c90" },
};
const U = {
  light: {
    pageBg: "#fafaf9", ink: "#1c1917", muted: "#57534e", faint: "#a8a29e",
    line: "#e7e5e4", badgeBg: "#ffffff", preBg: "#f5f5f4", preText: "#44403c",
    userBubble: "#1c1917", userText: "#fafaf9",
    green: "#15803d", accent: "#0f6c6c",
    inputBg: "#ffffff", placeholder: "#a8a29e", btnText: "#ffffff",
    codeBg: "#f5f5f4", panel: "#f5f5f4",
    amberText: "#92400e", amberLine: "#fcd34d",
    skyText: "#0369a1", skyLine: "#7dd3fc",
    segBg: "#ffffff", segActive: "#1c1917", segActiveText: "#fafaf9",
  },
  dark: {
    pageBg: "#0c0a09", ink: "#e7e5e4", muted: "#d6d3d1", faint: "#78716c",
    line: "#292524", badgeBg: "#1c1917", preBg: "#292524", preText: "#d6d3d1",
    userBubble: "#f5f5f4", userText: "#1c1917",
    green: "#4ade80", accent: "#4fb8b3",
    inputBg: "#1c1917", placeholder: "#78716c", btnText: "#ffffff",
    codeBg: "#292524", panel: "#1c1917",
    amberText: "#fcd34d", amberLine: "#78591b",
    skyText: "#7dd3fc", skyLine: "#0c4a6e",
    segBg: "#1c1917", segActive: "#f5f5f4", segActiveText: "#1c1917",
  },
};

// The Beanline site's own colors (a rendered site looks the same in both
// blog themes, like a real iframe). Sampled from the real preview.
const BSITE = { paper: "#f4ead9", card: "#fbf5ea", text: "#241c14", muted: "#5c4f40", accent: "#8a4a22" };

/* ============================================================
   1. COVER: templated from the Part 1 cover.
   ============================================================ */
function cover(theme) {
  const accent = theme === "light" ? "#b3441a" : "#e5825a";
  let svg = readFileSync(`${P1}/cover-${theme}.svg`, "utf8");
  svg = svg
    .replace(">01</text>", ">06</text>")
    .replace("PART 1 OF 13", "PART 6 OF 13")
    .replace(
      `Your first <tspan font-style="italic" fill="${accent}">thread</tspan>`,
      `What the builder may <tspan font-style="italic" fill="${accent}">touch</tspan>`
    )
    .replace(
      "Speak raw JSON-RPC to the engine inside Codex. Get a website back.",
      "Read-only, standard, trusted: OS walls the model cannot argue with."
    );
  return svg;
}

/* ============================================================
   2. Shared app-window pieces (Part 3-5 conventions + the Part 6
   mode picker in the header and the mode chip in the chat header)
   ============================================================ */
const W = 1120;
const CHROME_H = 56, HEADER_H = 46, CHATBAR_H = 34;
const SB_W = 200;
const CHAT_X = SB_W, CHAT_W = 440;
const PV_X = SB_W + CHAT_W;
const PV_W = W - PV_X;

function chrome(theme) {
  const c = CH[theme];
  return `<rect x="0" y="0" width="${W}" height="${CHROME_H}" fill="${c.chromeBg}"/>
  <line x1="0" y1="${CHROME_H}" x2="${W}" y2="${CHROME_H}" stroke="${c.chromeLine}" stroke-width="1.5"/>
  <circle cx="30" cy="28" r="7" fill="${c.dots}"/><circle cx="56" cy="28" r="7" fill="${c.dots}"/><circle cx="82" cy="28" r="7" fill="${c.dots}"/>
  <rect x="320" y="13" width="420" height="30" rx="15" fill="${c.urlFill}" stroke="${c.urlStroke}"/>
  <text x="530" y="33" ${MONO} font-size="14" fill="${c.urlText}" text-anchor="middle">localhost:3000</text>`;
}

// The header now holds the wristband rack: blurb + three-segment picker.
function appHeader(theme, { activeMode, blurb }) {
  const t = U[theme];
  const y = CHROME_H;
  const segs = [
    { id: "read-only", label: "Read-only", w: 82 },
    { id: "standard", label: "Standard", w: 78 },
    { id: "trusted", label: "Trusted", w: 70 },
  ];
  const pickerW = segs.reduce((a, s) => a + s.w, 0) + 10;
  const px = W - 16 - pickerW;
  let sx = px + 5;
  let picker = `<rect x="${px}" y="${y + 8}" width="${pickerW}" height="30" rx="9" fill="${t.segBg}" stroke="${t.line}"/>`;
  for (const s of segs) {
    const active = s.id === activeMode;
    if (active) picker += `\n  <rect x="${sx}" y="${y + 12}" width="${s.w}" height="22" rx="6" fill="${t.segActive}"/>`;
    picker += `\n  <text x="${sx + s.w / 2}" y="${y + 27}" ${SANS} font-size="11.5" font-weight="600" fill="${active ? t.segActiveText : t.muted}" text-anchor="middle">${s.label}</text>`;
    sx += s.w;
  }
  return `<line x1="0" y1="${y + HEADER_H}" x2="${W}" y2="${y + HEADER_H}" stroke="${t.line}" stroke-width="1"/>
  <circle cx="24" cy="${y + HEADER_H / 2}" r="5" fill="${t.accent}"/>
  <text x="38" y="${y + HEADER_H / 2 + 5}" ${SANS} font-size="15" font-weight="700" fill="${t.ink}">Pagewright</text>
  <text x="150" y="${y + HEADER_H / 2 + 5}" ${MONO} font-size="11" fill="${t.faint}">the site builder</text>
  <text x="${px - 12}" y="${y + HEADER_H / 2 + 4}" ${SANS} font-size="11" fill="${t.faint}" text-anchor="end">${esc(blurb)}</text>
  ${picker}`;
}

// The slim chat-column header: project name + the mode chip.
function chatBar(theme, { name, mode }) {
  const t = U[theme];
  const y = CHROME_H + HEADER_H;
  const chipColors = {
    "read-only": { text: t.skyText, line: t.skyLine },
    standard: { text: t.faint, line: t.line },
    trusted: { text: t.amberText, line: t.amberLine },
  }[mode];
  const chipW = mode.length * 6.6 + 18;
  const cx = PV_X - 16 - chipW;
  return `<line x1="${CHAT_X}" y1="${y + CHATBAR_H}" x2="${PV_X}" y2="${y + CHATBAR_H}" stroke="${t.line}" stroke-width="1"/>
  <text x="${CHAT_X + 16}" y="${y + 22}" ${SANS} font-size="12.5" font-weight="600" fill="${t.ink}">${esc(name)}</text>
  <rect x="${cx}" y="${y + 7}" width="${chipW}" height="20" rx="10" fill="none" stroke="${chipColors.line}"/>
  <text x="${cx + chipW / 2}" y="${y + 21}" ${MONO} font-size="10.5" fill="${chipColors.text}" text-anchor="middle">${mode}</text>`;
}

function sidebar(theme, h, rows) {
  const t = U[theme];
  const top = CHROME_H + HEADER_H;
  let s = `<line x1="${SB_W}" y1="${top}" x2="${SB_W}" y2="${h}" stroke="${t.line}" stroke-width="1"/>`;
  let y = top + 12;
  for (const r of rows) {
    const rh = 64;
    if (r.active) {
      s += `<rect x="8" y="${y}" width="${SB_W - 16}" height="${rh}" rx="8" fill="${t.accent}" opacity="0.07"/>
  <rect x="8" y="${y}" width="${SB_W - 16}" height="${rh}" rx="8" fill="none" stroke="${t.accent}" stroke-opacity="0.4"/>`;
    }
    s += `<text x="18" y="${y + 19}" ${SANS} font-size="12.5" font-weight="600" fill="${r.active ? t.accent : t.ink}">${esc(r.name)}</text>
  <text x="18" y="${y + 35}" ${SANS} font-size="10.5" fill="${t.faint}">${esc(r.sub)}</text>
  <text x="18" y="${y + 53}" ${SANS} font-size="10" fill="${t.faint}">${esc(r.time)}</text>`;
    if (r.forkChip) {
      s += `<rect x="${SB_W - 48}" y="${y + 41}" width="34" height="16" rx="3.5" fill="none" stroke="${t.line}"/>
  <text x="${SB_W - 31}" y="${y + 52.5}" ${SANS} font-size="9.5" fill="${t.muted}" text-anchor="middle">Fork</text>`;
    }
    y += rh + 8;
  }
  const by = h - 84;
  s += `<line x1="0" y1="${by}" x2="${SB_W}" y2="${by}" stroke="${t.line}" stroke-width="1"/>
  <rect x="12" y="${by + 10}" width="${SB_W - 24}" height="26" rx="7" fill="${t.inputBg}" stroke="${t.line}"/>
  <text x="22" y="${by + 27}" ${SANS} font-size="11" fill="${t.muted}">blank workspace</text>
  <path d="M ${SB_W - 30} ${by + 21} l 4.5 5 l 4.5 -5" fill="none" stroke="${t.faint}" stroke-width="1.4"/>
  <rect x="12" y="${by + 44}" width="${SB_W - 24}" height="28" rx="7" fill="${t.accent}"/>
  <text x="${SB_W / 2}" y="${by + 62}" ${SANS} font-size="11.5" font-weight="600" fill="#ffffff" text-anchor="middle">New project</text>`;
  return s;
}

// ---- chat-column content pieces ----
const CC_X = CHAT_X + 16, CC_W = CHAT_W - 32;

function userBubble(theme, y, lines) {
  const t = U[theme];
  const widest = Math.max(...lines.map((l) => l.length));
  const bw = Math.min(Math.ceil(widest * 6.6) + 30, CC_W * 0.94);
  const bh = 14 + lines.length * 19;
  const x = CC_X + CC_W - bw;
  let body = "";
  lines.forEach((l, i) => {
    body += `\n  <text x="${x + 15}" y="${y + 22 + i * 19}" ${SANS} font-size="12.5" fill="${t.userText}">${esc(l)}</text>`;
  });
  return { svg: `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="14" fill="${t.userBubble}"/>${body}`, h: bh };
}

function proseRich(theme, y, rows) {
  const t = U[theme];
  const lh = 21;
  let s = "";
  rows.forEach((segs, i) => {
    let x = CC_X;
    const yy = y + 14 + i * lh;
    for (const seg of Array.isArray(segs) ? segs : [segs]) {
      if (typeof seg === "string") {
        s += `\n  <text x="${x}" y="${yy}" ${SANS} font-size="13" fill="${t.ink}">${esc(seg)}</text>`;
        x += Math.ceil(seg.length * 6.35);
      } else {
        const cw = Math.ceil(seg.code.length * 6.9) + 8;
        s += `\n  <rect x="${x}" y="${yy - 12}" width="${cw}" height="17" rx="4" fill="${t.codeBg}"/>
  <text x="${x + 4}" y="${yy}" ${MONO} font-size="11.5" fill="${t.preText}">${esc(seg.code)}</text>`;
        x += cw + 3;
      }
    }
  });
  return { svg: s, h: rows.length * lh };
}

function preBlock(theme, y, lines) {
  const t = U[theme];
  const lh = 19;
  const bh = 16 + lines.length * lh;
  let body = "";
  lines.forEach((l, i) => {
    body += `\n  <text x="${CC_X + 14}" y="${y + 22 + i * lh}" ${MONO} font-size="11" fill="${t.preText}">${esc(l)}</text>`;
  });
  return {
    svg: `<rect x="${CC_X}" y="${y}" width="${CC_W - 20}" height="${bh}" rx="8" fill="${t.preBg}"/>${body}`,
    h: bh,
  };
}

function bulletRow(theme, y, segs) {
  const t = U[theme];
  const p = proseRich(theme, y, [segs]);
  return {
    svg: `<circle cx="${CC_X + 4}" cy="${y + 10}" r="2" fill="${t.ink}"/>
  <g transform="translate(14,0)">${p.svg}</g>`,
    h: p.h,
  };
}

function thinkingRow(theme, y) {
  const t = U[theme];
  return {
    svg: `<circle cx="${CC_X + 4}" cy="${y + 8}" r="2.5" fill="${t.faint}"/>
  <text x="${CC_X + 14}" y="${y + 12}" ${SANS} font-size="10.5" font-weight="600" letter-spacing="1.5" fill="${t.faint}">THINKING</text>
  <path d="M ${CC_X + 88} ${y + 6} l 4 4.5 l 4 -4.5" fill="none" stroke="${t.faint}" stroke-width="1.3"/>`,
    h: 18,
  };
}

function commandBadge(theme, y, label, { failed = false } = {}) {
  const t = U[theme];
  const bh = 34;
  const mark = failed
    ? `<text x="${CC_X + 14}" y="${y + 21.5}" ${SANS} font-size="12.5" fill="#dc2626">&#x2715;</text>`
    : `<text x="${CC_X + 14}" y="${y + 21.5}" ${SANS} font-size="12.5" fill="${t.green}">&#x2713;</text>`;
  return {
    svg: `<rect x="${CC_X}" y="${y}" width="${CC_W - 20}" height="${bh}" rx="8" fill="${t.badgeBg}" stroke="${failed ? "#dc2626" : t.line}" stroke-opacity="${failed ? 0.45 : 1}"/>
  ${mark}
  <text x="${CC_X + 30}" y="${y + 21.5}" ${SANS} font-size="12.5" fill="${t.ink}">${esc(label)}</text>
  <text x="${CC_X + CC_W - 104}" y="${y + 21}" ${SANS} font-size="9.5" letter-spacing="1" fill="${t.faint}">COMMAND</text>
  <path d="M ${CC_X + CC_W - 36} ${y + 15} l 4 4.5 l 4 -4.5" fill="none" stroke="${t.faint}" stroke-width="1.3"/>`,
    h: bh,
  };
}

function receipt(theme, y, text) {
  const t = U[theme];
  return { svg: `<text x="${CC_X}" y="${y + 12}" ${MONO} font-size="11" fill="${t.faint}">${esc(text)}</text>`, h: 16 };
}

function chatFooter(theme, h, { hint = null } = {}) {
  const t = U[theme];
  const y = h - 62;
  const btnW = 62, btnX = PV_X - 16 - btnW;
  const hintRow = hint
    ? `<text x="${CC_X}" y="${y - 8}" ${SANS} font-size="10.5" fill="${t.skyText}">${esc(hint)}</text>`
    : "";
  return `${hintRow}
  <line x1="${CHAT_X}" y1="${y}" x2="${PV_X}" y2="${y}" stroke="${t.line}" stroke-width="1"/>
  <rect x="${CC_X}" y="${y + 12}" width="${CC_W - btnW - 10}" height="36" rx="10" fill="${t.inputBg}" stroke="${t.line}" stroke-width="1.5"/>
  <text x="${CC_X + 13}" y="${y + 35}" ${SANS} font-size="12.5" fill="${t.placeholder}">Describe the site you want&#8230;</text>
  <rect x="${btnX}" y="${y + 12}" width="${btnW}" height="36" rx="10" fill="${t.accent}" opacity="0.45"/>
  <text x="${btnX + btnW / 2}" y="${y + 35}" ${SANS} font-size="12.5" font-weight="600" fill="${t.btnText}" text-anchor="middle">Send</text>`;
}

// The preview pane rendering the real Beanline page (serif headings after
// the font turn), plus the files pane listing the two woff2 files.
function previewPane(theme, h, { projectId }) {
  const t = U[theme];
  const top = CHROME_H + HEADER_H;
  const urlH = 34;
  const filesH = 128;
  const siteY = top + urlH, siteH = h - siteY - filesH;
  const cx = PV_X + 28;
  const cardW = PV_W - 56;
  const mid = PV_X + PV_W / 2;
  return `<line x1="${PV_X}" y1="${top}" x2="${PV_X}" y2="${h}" stroke="${t.line}" stroke-width="1"/>
  <text x="${PV_X + 16}" y="${top + 22}" ${MONO} font-size="11.5" fill="${t.faint}">/preview/${projectId}/</text>
  <rect x="${W - 118}" y="${top + 6}" width="56" height="22" rx="6" fill="none" stroke="${t.line}"/>
  <text x="${W - 90}" y="${top + 21}" ${SANS} font-size="10.5" fill="${t.muted}" text-anchor="middle">Reload</text>
  <rect x="${W - 56}" y="${top + 6}" width="40" height="22" rx="6" fill="none" stroke="${t.line}" opacity="0.55"/>
  <text x="${W - 36}" y="${top + 21}" ${SANS} font-size="10.5" fill="${t.faint}" text-anchor="middle" opacity="0.8">Diff</text>
  <line x1="${PV_X}" y1="${siteY}" x2="${W}" y2="${siteY}" stroke="${t.line}" stroke-width="1"/>
  <!-- the rendered site keeps its own colors in both themes, like a real iframe -->
  <rect x="${PV_X + 1}" y="${siteY + 1}" width="${PV_W - 1}" height="${siteH - 1}" fill="${BSITE.paper}"/>
  <rect x="${cx}" y="${siteY + 22}" width="${cardW}" height="128" rx="10" fill="${BSITE.card}"/>
  <text x="${mid}" y="${siteY + 84}" ${SERIF} font-size="42" font-weight="700" fill="${BSITE.text}" text-anchor="middle">Beanline</text>
  <text x="${mid}" y="${siteY + 116}" ${SERIF} font-size="14" fill="${BSITE.accent}" text-anchor="middle">Fresh brews, calm mornings, and a warm place to pause.</text>
  <rect x="${cx}" y="${siteY + 166}" width="${cardW}" height="118" rx="10" fill="${BSITE.card}"/>
  <text x="${cx + 22}" y="${siteY + 200}" ${SERIF} font-size="20" font-weight="700" fill="${BSITE.text}">About Beanline</text>
  <text x="${cx + 22}" y="${siteY + 226}" ${SERIF} font-size="12" fill="${BSITE.muted}">Beanline is a small neighborhood coffee shop serving</text>
  <text x="${cx + 22}" y="${siteY + 245}" ${SERIF} font-size="12" fill="${BSITE.muted}">carefully made espresso, smooth filter coffee, and</text>
  <text x="${cx + 22}" y="${siteY + 264}" ${SERIF} font-size="12" fill="${BSITE.muted}">simple pastries. The pace stays slow on purpose.</text>
  <rect x="${cx}" y="${siteY + 300}" width="${cardW}" height="44" rx="10" fill="${BSITE.card}"/>
  <text x="${mid}" y="${siteY + 327}" ${SERIF} font-size="12.5" fill="${BSITE.text}" text-anchor="middle">Beanline Coffee Shop &#183; Open daily &#183; 7:00 AM to 6:00 PM</text>
  <!-- the files pane (app UI, themed) -->
  <line x1="${PV_X}" y1="${h - filesH}" x2="${W}" y2="${h - filesH}" stroke="${t.line}" stroke-width="1"/>
  <rect x="${PV_X + 1}" y="${h - filesH + 1}" width="${PV_W - 1}" height="${filesH - 1}" fill="${t.panel}" opacity="0.35"/>
  <text x="${PV_X + 16}" y="${h - filesH + 24}" ${MONO} font-size="10.5" letter-spacing="1.5" fill="${t.faint}">FILES</text>
  <text x="${W - 16}" y="${h - filesH + 24}" ${MONO} font-size="10.5" fill="${t.faint}" text-anchor="end">3</text>
  <text x="${PV_X + 16}" y="${h - filesH + 46}" ${MONO} font-size="11" fill="${t.faint}">fonts/</text>
  <text x="${PV_X + 28}" y="${h - filesH + 66}" ${MONO} font-size="11" fill="${t.ink}">playfair-display-latin-400-normal.woff2</text>
  <text x="${W - 16}" y="${h - filesH + 66}" ${MONO} font-size="10" fill="${t.faint}" text-anchor="end">21.3 kB</text>
  <text x="${PV_X + 28}" y="${h - filesH + 86}" ${MONO} font-size="11" fill="${t.ink}">playfair-display-latin-700-normal.woff2</text>
  <text x="${W - 16}" y="${h - filesH + 86}" ${MONO} font-size="10" fill="${t.faint}" text-anchor="end">22.7 kB</text>
  <text x="${PV_X + 16}" y="${h - filesH + 106}" ${MONO} font-size="11" fill="${t.ink}">index.html</text>
  <text x="${W - 16}" y="${h - filesH + 106}" ${MONO} font-size="10" fill="${t.faint}" text-anchor="end">3.2 kB</text>`;
}

/* ============================================================
   3. browser-readonly: the dessert. Read-only active in the picker,
   the refusal-with-a-proposal, the planning hint, the Playfair
   preview (mirrors the real capture p6-e2e.png).
   ============================================================ */
function browserReadonly(theme) {
  const t = U[theme];
  const h = 780;
  let y = CHROME_H + HEADER_H + CHATBAR_H + 18;
  const parts = [];
  const add = (p, gap = 13) => { parts.push(p.svg); y += p.h + gap; };

  // the tail of the previous (Trusted) turn, like the real capture
  add(proseRich(theme, y, [["Files added:"]]), 4);
  add(bulletRow(theme, y, [{ code: "fonts/playfair-display-latin-400-normal.woff2" }]), 2);
  add(bulletRow(theme, y, [{ code: "fonts/playfair-display-latin-700-normal.woff2" }]), 6);
  add(receipt(theme, y, "1,057,275 tokens · 32s"), 16);
  add(userBubble(theme, y, ["Rewrite the about section opening", "sentence to be friendlier."]));
  add(thinkingRow(theme, y), 9);
  add(proseRich(theme, y, [
    ["I can't apply the edit in this read-only"],
    ["session, but the friendliest replacement for"],
    ["the opening sentence is:"],
  ]), 10);
  add(preBlock(theme, y, [
    "Beanline is your cozy neighborhood",
    "coffee shop, serving carefully made",
    "espresso and simple pastries.",
  ]), 10);
  add(proseRich(theme, y, [
    ["If you want, I can also rewrite the full"],
    ["about paragraph to match that tone."],
  ]), 8);
  add(receipt(theme, y, "1,090,668 tokens · 4s"), 0);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">
  <rect width="${W}" height="${h}" fill="${t.pageBg}"/>
  ${chrome(theme)}
  ${appHeader(theme, { activeMode: "read-only", blurb: "Look and plan: the OS refuses every write." })}
  ${sidebar(theme, h, [
    { name: "Sandbox test", sub: "Create index.html for a small coffee s…", time: "just now", active: true, forkChip: true },
  ])}
  ${chatBar(theme, { name: "Sandbox test", mode: "read-only" })}
  ${parts.join("\n  ")}
  ${chatFooter(theme, h, { hint: "Planning mode: the builder reads and plans, the OS refuses every write." })}
  ${previewPane(theme, h, { projectId: "f25ea11b" })}
</svg>`;
}

/* ============================================================
   4. browser-fonts: the trusted payoff. The Standard-mode refusal
   above, the retry under Trusted, the woff2 files in the tree
   (mirrors the real capture p6-trusted-fonts.png).
   ============================================================ */
function browserFonts(theme) {
  const t = U[theme];
  const h = 780;
  let y = CHROME_H + HEADER_H + CHATBAR_H + 16;
  const parts = [];
  const add = (p, gap = 13) => { parts.push(p.svg); y += p.h + gap; };

  add(userBubble(theme, y, ["Download the Playfair Display woff2 files", "with curl into fonts/ and wire them up", "with @font-face."]));
  add(commandBadge(theme, y, 'curl -fsSL "https://fonts.googleapis…"', { failed: true }), 10);
  add(proseRich(theme, y, [
    ["I couldn't complete the self-hosted font"],
    ["download in this sandbox. Exact ", { code: "curl" }, " error:"],
  ]), 9);
  add(preBlock(theme, y, ["curl: (6) Could not resolve host:", "fonts.googleapis.com"]), 14);
  add(userBubble(theme, y, ["Try again now: download the Playfair", "Display woff2 files with curl into fonts/", "and wire them up with @font-face."]));
  add(commandBadge(theme, y, "tar -xzf /private/tmp/playfair-display.tgz…"), 10);
  add(proseRich(theme, y, [["Done. What changed:"]]), 6);
  add(bulletRow(theme, y, ["Downloaded the font files into ", { code: "fonts/" }, "."]), 4);
  add(bulletRow(theme, y, ["Wired up ", { code: "@font-face" }, " in ", { code: "index.html" }, "."]), 4);
  add(bulletRow(theme, y, ["Set the headings to Playfair Display."]), 8);
  add(receipt(theme, y, "1,057,275 tokens · 32s"), 0);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">
  <rect width="${W}" height="${h}" fill="${t.pageBg}"/>
  ${chrome(theme)}
  ${appHeader(theme, { activeMode: "trusted", blurb: "Same workspace walls, with the network door open." })}
  ${sidebar(theme, h, [
    { name: "Sandbox test", sub: "Create index.html for a small coffee s…", time: "1m ago", active: true, forkChip: true },
  ])}
  ${chatBar(theme, { name: "Sandbox test", mode: "trusted" })}
  ${parts.join("\n  ")}
  ${chatFooter(theme, h)}
  ${previewPane(theme, h, { projectId: "f25ea11b" })}
</svg>`;
}

/* ============================================================
   5. fig-grid: two dials, one grid
   ============================================================ */
function figGrid(theme) {
  const t = D[theme];
  const w = 1240, h = 800;
  const label = (x, y, txt, size = 13, fill = t.ink, anchor = "middle", font = MONO) =>
    `<text x="${x}" y="${y}" ${font} font-size="${size}" fill="${fill}" text-anchor="${anchor}">${txt}</text>`;

  const cols = ["untrusted", "on-failure", "on-request", "never"];
  const rows = [
    ["readOnly", "look and plan"],
    ["workspaceWrite", "network off"],
    ["workspaceWrite", "network on"],
    ["dangerFullAccess", "no walls"],
  ];
  const gx = 330, gy = 170, cw = 200, rh = 110;

  let grid = "";
  // column headers + consent axis
  grid += label(gx + (cols.length * cw) / 2, gy - 56, "CONSENT &#183; approvalPolicy &#183; when does a human get asked?", 11.5, t.faint);
  cols.forEach((c, i) => {
    grid += label(gx + i * cw + cw / 2, gy - 22, c, 13, t.muted);
  });
  // row labels + containment axis
  grid += `<text x="64" y="${gy + (rows.length * rh) / 2}" ${MONO} font-size="11.5" fill="${t.faint}" text-anchor="middle" transform="rotate(-90 64 ${gy + (rows.length * rh) / 2})">CONTAINMENT &#183; sandboxPolicy &#183; what may commands touch?</text>`;
  rows.forEach((r, i) => {
    const yy = gy + i * rh + rh / 2;
    grid += label(gx - 26, yy - 4, r[0], 13, i === 3 ? t.red : t.muted, "end");
    grid += label(gx - 26, yy + 16, r[1], 11, t.faint, "end");
  });
  // cells
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < cols.length; c++) {
      const x = gx + c * cw, y = gy + r * rh;
      const danger = r === 3;
      grid += `<rect x="${x}" y="${y}" width="${cw}" height="${rh}" fill="${danger ? t.redTint : "none"}" fill-opacity="${danger ? 0.45 : 0}" stroke="${t.line}" stroke-width="1"/>`;
    }
  }
  // the three product postures, all in the "never" column today
  const chip = (col, row, name, fg, bg, line) => {
    const x = gx + col * cw + cw / 2, y = gy + row * rh + rh / 2;
    return `<rect x="${x - 74}" y="${y - 22}" width="148" height="44" rx="10" fill="${bg}" stroke="${line}" stroke-width="1.5"/>
    ${label(x, y - 1, name, 13.5, fg, "middle", SANS + ' font-weight="700"')}
    ${label(x, y + 15, "in Pagewright", 9.5, t.faint)}`;
  };
  grid += chip(3, 0, "Read-only", t.sky, t.skyTint, t.skyLine);
  grid += chip(3, 1, "Standard", t.ink, t.surface, t.faint);
  grid += chip(3, 2, "Trusted", t.amber, t.amberTint, t.amberLine);
  // Part 7 arrow: Standard's consent dial moves to on-request
  const ay = gy + 1 * rh + rh / 2;
  const ax1 = gx + 3 * cw + cw / 2 - 82, ax2 = gx + 2 * cw + cw / 2 + 46;
  grid += `<line x1="${ax1}" y1="${ay}" x2="${ax2 + 8}" y2="${ay}" stroke="${t.accent}" stroke-width="1.5" stroke-dasharray="5 4"/>
  <path d="M ${ax2} ${ay} l 11 -5 l 0 10 z" fill="${t.accent}"/>
  ${label(gx + 2 * cw + cw / 2, ay + 28, "Part 7 moves Standard's", 10.5, t.accent)}
  ${label(gx + 2 * cw + cw / 2, ay + 44, "consent dial here", 10.5, t.accent)}`;
  // dangerFullAccess note
  grid += label(gx + (cols.length * cw) / 2, gy + 3 * rh + rh / 2 + 2, "not offered: no cell in this row exists in the product", 11.5, t.red);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
  <rect width="${w}" height="${h}" fill="${t.paper}"/>
  <text x="48" y="52" ${MONO} font-size="12" letter-spacing="2.5" fill="${t.faint}">TWO DIALS, ONE GRID &#183; EVERY TURN SITS IN EXACTLY ONE CELL</text>
  <line x1="48" y1="66" x2="${w - 48}" y2="66" stroke="${t.line}" stroke-width="1.5"/>
  ${grid}
  ${label(w / 2, h - 60, "The sandbox contains; approvals ask. Independent dials: Act I ran entirely in Standard's cell,", 12, t.muted)}
  ${label(w / 2, h - 38, "contained but never asked. Part 6 wires the containment column; Part 7 wires the asking.", 12, t.muted)}
</svg>`;
}

/* ============================================================
   6. fig-walls: how the box is built + what the wire shows
   ============================================================ */
function figWalls(theme) {
  const t = D[theme];
  const w = 1240, h = 780;
  const label = (x, y, txt, size = 13, fill = t.ink, anchor = "middle", font = MONO) =>
    `<text x="${x}" y="${y}" ${font} font-size="${size}" fill="${fill}" text-anchor="${anchor}">${txt}</text>`;

  // ---- left: the box ----
  const bx = 70, by = 130, bw = 500, bh = 330;
  let box = "";
  // outer wall (solid top/right/bottom, dashed-open left for reads)
  box += `<path d="M ${bx} ${by} L ${bx + bw} ${by} L ${bx + bw} ${by + bh} L ${bx} ${by + bh}" fill="none" stroke="${t.red}" stroke-width="3"/>`;
  box += `<line x1="${bx}" y1="${by}" x2="${bx}" y2="${by + bh}" stroke="${t.amber}" stroke-width="2" stroke-dasharray="7 7"/>`;
  // bench inside
  box += `<rect x="${bx + 150}" y="${by + 90}" width="${bw - 210}" height="${bh - 180}" rx="10" fill="${t.greenTint}" stroke="${t.green}" stroke-width="1.5"/>`;
  box += label(bx + 150 + (bw - 210) / 2, by + 90 + (bh - 180) / 2 - 16, "the workspace", 14, t.green, "middle", SANS + ' font-weight="700"');
  box += label(bx + 150 + (bw - 210) / 2, by + 90 + (bh - 180) / 2 + 6, "writableRoots: [projects/{id}/site]", 11, t.muted);
  box += label(bx + 150 + (bw - 210) / 2, by + 90 + (bh - 180) / 2 + 26, "+ /tmp (excludeSlashTmp defaults off)", 10.5, t.amber);
  // wall labels
  box += label(bx + bw / 2, by - 14, "WRITES outside the bench: blocked at the syscall", 11.5, t.red);
  box += `<text x="${bx + bw + 16}" y="${by + bh / 2 - 8}" ${MONO} font-size="11.5" fill="${t.red}" transform="rotate(90 ${bx + bw + 16} ${by + bh / 2 - 8})" text-anchor="middle">NETWORK incl. DNS: blocked until networkAccess</text>`;
  box += label(bx + bw / 2, by + bh + 24, "the same wall all the way around: no writes land outside writableRoots", 10.5, t.faint);
  box += `<text x="${bx - 18}" y="${by + bh / 2}" ${MONO} font-size="11.5" fill="${t.amber}" transform="rotate(-90 ${bx - 18} ${by + bh / 2})" text-anchor="middle">READS: open. the whole disk is visible</text>`;
  // platform chips
  box += `<rect x="${bx}" y="${by + bh + 48}" width="240" height="54" rx="10" fill="${t.chip}" stroke="${t.line}" stroke-width="1.5"/>`;
  box += label(bx + 120, by + bh + 70, "macOS: Seatbelt", 12.5, t.ink);
  box += label(bx + 120, by + bh + 90, "(sandbox-exec profiles)", 10.5, t.faint);
  box += `<rect x="${bx + 260}" y="${by + bh + 48}" width="240" height="54" rx="10" fill="${t.chip}" stroke="${t.line}" stroke-width="1.5"/>`;
  box += label(bx + 380, by + bh + 70, "Linux: Landlock + seccomp", 12.5, t.ink);
  box += label(bx + 380, by + bh + 90, "(kernel 5.13+; Part 13 re-verifies)", 10.5, t.faint);
  box += label(bx + bw / 2, by + bh + 130, "a refusal is a kernel error, not a model decision", 11.5, t.muted);

  // ---- right: what the wire shows ----
  const rx = 660, rw = 532;
  let wire = `<rect x="${rx}" y="106" width="${rw}" height="556" rx="12" fill="${t.surface}" stroke="${t.line}" stroke-width="1.5"/>`;
  wire += label(rx + 24, 138, "WHAT THE WIRE SHOWS WHEN A WALL IS HIT", 11.5, t.faint, "start");
  const row = (y, title, titleColor, lines, badge, badgeColor) => {
    let s = `<rect x="${rx + 24}" y="${y}" width="${rw - 48}" height="128" rx="10" fill="${t.chip}" stroke="${t.line}" stroke-width="1.5"/>`;
    s += label(rx + 44, y + 30, title, 13, titleColor, "start", SANS + ' font-weight="700"');
    const bw2 = badge.length * 6.6 + 20;
    s += `<rect x="${rx + rw - 72 - bw2}" y="${y + 14}" width="${bw2}" height="24" rx="12" fill="none" stroke="${badgeColor}"/>`;
    s += label(rx + rw - 72 - bw2 / 2, y + 30, badge, 10.5, badgeColor);
    lines.forEach((l, i) => {
      s += label(rx + 44, y + 58 + i * 20, l, 11.5, t.muted, "start");
    });
    return s;
  };
  wire += row(158, "1 &#183; Blocked network", t.ink, [
    "commandExecution completes: status \"failed\",",
    "exitCode 6, aggregatedOutput carries the curl error.",
    "The one wall with real item telemetry.",
  ], "ITEM ON THE WIRE", t.green);
  wire += row(306, "2 &#183; Blocked write, natural", t.ink, [
    "Usually never happens: the model reads its",
    "writableRoots and declines up front. No failed item,",
    "no item at all. The wall worked by being known.",
  ], "NO ITEM", t.amber);
  wire += row(454, "3 &#183; Blocked write, forced", t.ink, [
    "Runs via the unifiedExec path: ZERO commandExecution",
    "items emitted. \"zsh:1: operation not permitted: ...\"",
    "appears only inside the agent's narration text.",
  ], "ZERO ITEMS", t.red);
  wire += label(rx + rw / 2, 636, "no sandbox_blocked event exists at this pin (0.142.4):", 11.5, t.muted);
  wire += label(rx + rw / 2, 654, "your telemetry is exit codes plus the narration", 11.5, t.muted);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
  <rect width="${w}" height="${h}" fill="${t.paper}"/>
  <text x="48" y="52" ${MONO} font-size="12" letter-spacing="2.5" fill="${t.faint}">HOW THE BOX IS BUILT &#183; workspaceWrite, DRAWN HONESTLY</text>
  <line x1="48" y1="66" x2="${w - 48}" y2="66" stroke="${t.line}" stroke-width="1.5"/>
  ${box}
  ${wire}
  ${label(w / 2, h - 34, "Writes and network are walls; reads are a policy gap you design around. And only one of the three refusals is visible as an item.", 12, t.faint)}
</svg>`;
}

/* ============================================================
   7. TERMINALS (dark only, real captures)
   ============================================================ */
function termChrome(w, label) {
  return `<rect width="${w}" height="48" fill="${TT.chrome}"/>
  <circle cx="28" cy="24" r="7" fill="${TT.dot}"/>
  <circle cx="52" cy="24" r="7" fill="${TT.dot}"/>
  <circle cx="76" cy="24" r="7" fill="${TT.dot}"/>
  <text x="${w / 2}" y="30" ${MONO} font-size="15" fill="${TT.label}" text-anchor="middle" letter-spacing="1">${label}</text>`;
}
function term(label, lines, w = 1040) {
  const lh = 28, top = 88;
  const h = top + lines.length * lh + 28;
  let body = "";
  lines.forEach((l, i) => {
    body += `\n    <text x="32" y="${top + i * lh}" xml:space="preserve">${l}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" ${MONO}>
  <rect width="${w}" height="${h}" fill="${TT.bg}"/>
  ${termChrome(w, label)}
  <g font-size="14.5" fill="${TT.text}">${body}
  </g>
</svg>`;
}
const F = (c, s) => `<tspan fill="${c}">${s}</tspan>`;

const termNetwall = () =>
  term("terminal &#183; a blocked curl is an ordinary failed command", [
    `${F(TT.faint, "# Standard mode. The agent reaches for Google Fonts; DNS does not resolve")}`,
    `${F(TT.faint, "# inside the box. The notification is a NORMAL item/completed:")}`,
    `${F(TT.faint, "←")} {"method": ${F(TT.accent, '"item/completed"')}, "params": {"item": {`,
    `      "type": ${F(TT.blue, '"commandExecution"')},`,
    `      "command": "/bin/zsh -lc \\"curl -fsSL 'https://fonts.googleapis.com/css2`,
    `                  ?family=Playfair+Display:wght@400;700&amp;display=swap'\\"",`,
    `      "status": ${F(TT.red, '"failed"')},`,
    `      "exitCode": ${F(TT.red, "6")},`,
    `      "aggregatedOutput": "${F(TT.red, "curl: (6) Could not resolve host: fonts.googleapis.com")}\\n",`,
    `      …}}}`,
    ``,
    `${F(TT.faint, '# no sandbox flag, no special status. "failed" + exit 6 is all the protocol')}`,
    `${F(TT.faint, "# says. This is the ONLY kind of sandbox wall that shows up as an item.")}`,
  ]);

const termEscape = () =>
  term("terminal &#183; the forced write: what the wire does NOT show", [
    `${F(TT.faint, '# Standard mode. "Save a note at ~/pagewright-escape-test.txt. If the write')}`,
    `${F(TT.faint, '# fails, run it anyway and show me the exact error output."')}`,
    `${F(TT.faint, "←")} {"method": ${F(TT.accent, '"turn/started"')}, …}`,
    `${F(TT.faint, "←")} {"method": ${F(TT.accent, '"item/completed"')}, "params": {"item": {"type": ${F(TT.blue, '"reasoning"')}, …}}}`,
    `${F(TT.faint, "←")} {"method": ${F(TT.accent, '"item/completed"')}, "params": {"item": {"type": ${F(TT.blue, '"agentMessage"')},`,
    `      "text": "I’m trying the write to \`~/pagewright-escape-test.txt\` directly`,
    `               first, then I’ll report the exact shell output if it fails."}}}`,
    `${F(TT.faint, "←")} {"method": ${F(TT.accent, '"item/completed"')}, "params": {"item": {"type": ${F(TT.blue, '"agentMessage"')},`,
    `      "text": "The write failed with this exact shell error:`,
    `               ${F(TT.red, "zsh:1: operation not permitted: /Users/yadneshsalvi/pagewright-")}`,
    `               ${F(TT.red, "escape-test.txt")}"}}}`,
    `${F(TT.faint, "←")} {"method": ${F(TT.accent, '"turn/completed"')}, "params": {"turn": {"status": "completed",`,
    `      "durationMs": ${F(TT.green, "4359")}}}}`,
    ``,
    `${F(TT.faint, "# the command RAN, and the kernel refused it. Count the commandExecution")}`,
    `${F(TT.faint, "# items above: ZERO. The narration is the only witness.")}`,
    ``,
    `$ ls ~/pagewright-escape-test.txt`,
    `${F(TT.red, "ls: /Users/yadneshsalvi/pagewright-escape-test.txt: No such file or directory")}`,
  ]);

/* ============================================================
   write everything
   ============================================================ */
for (const theme of ["light", "dark"]) {
  writeFileSync(`${OUT}/cover-${theme}.svg`, cover(theme));
  writeFileSync(`${OUT}/fig-grid-${theme}.svg`, figGrid(theme));
  writeFileSync(`${OUT}/fig-walls-${theme}.svg`, figWalls(theme));
  writeFileSync(`${OUT}/browser-readonly-${theme}.svg`, browserReadonly(theme));
  writeFileSync(`${OUT}/browser-fonts-${theme}.svg`, browserFonts(theme));
}
writeFileSync(`${OUT}/term-netwall.svg`, termNetwall());
writeFileSync(`${OUT}/term-escape.svg`, termEscape());
console.log("part-6 SVGs written to", OUT);

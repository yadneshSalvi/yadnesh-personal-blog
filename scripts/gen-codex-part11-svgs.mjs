/**
 * Part 11 SVG assets for "Codex App Server in Production".
 * Everything mirrors REAL runs (2026-07-09, codex-cli 0.142.4 /
 * gpt-5.4-mini behind the part-11 backend, clean CODEX_HOME):
 * - the canonical publish arc (p11-sse-review.txt, project e73f589c):
 *   build 224,574 tokens / 67s -> first inspection 32s -> the planted
 *   [P1] ("Resolve the logo's blue/green brand clash before launch",
 *   assets/logo.svg:2-8, #2F5233 vs #1E3A5F) -> publish blocked ->
 *   Fix findings turn 180,916 tokens / 21s -> re-inspection 21s, clean
 *   -> manifest -> published at /p/harbor-and-vine/.
 * - the e2e screenshots (p11-e2e-report.png, p11-e2e-published.png).
 * - the gate 409s captured live (p11-gate-*.txt) and the forced publish
 *   (p11-publish-forced.txt).
 * - the break-it probes (p11-schema-fail.txt): enum [] -> completed with
 *   schema-violating JSON in 34s; minLength 10 / maxLength 2 -> free-form
 *   JSON with different keys in 47s.
 * - the review-model proof (p11-review-model-proof.txt): review/start
 *   takes no model param; a bogus review_model config key fails the
 *   review turn with model_not_found. Latency A/B 30s vs 26-28s.
 * - the smoke run (p11-smoke-run.txt): 3 briefs x 6 checks, all green,
 *   183s total.
 * Hosts shown reader-world (localhost:3000). Same deliberate
 * substitution as Parts 7-10: the running app and the reviewer letter
 * some seams with an em-dash ("Publish is blocked — ...", "title — path");
 * house rule bans that glyph in drawn SVG text, so these captures letter
 * a middot / colon instead.
 *
 * Usage: node scripts/gen-codex-part11-svgs.mjs
 */
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";

const BASE = "/Users/yadneshsalvi/code/yadnesh-personal-blog/public/images/series/codex";
const P1 = `${BASE}/part-1`;
const OUT = `${BASE}/part-11`;
mkdirSync(OUT, { recursive: true });

const MONO = `font-family="'SF Mono', Menlo, Consolas, monospace"`;
const SANS = `font-family="-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"`;
const SERIF = `font-family="Georgia, 'Times New Roman', serif"`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---- shared palettes (ink & paper tokens, same as Parts 1-10) ----
const D = {
  light: {
    paper: "#faf9f6", line: "#e7e3d9", ink: "#1f1c19", muted: "#5b554c",
    faint: "#8f887a", accent: "#b3441a", surface: "#f1efe9",
    chip: "#ffffff", accentTint: "#f6e7df", accentLine: "#dcb09a",
    green: "#3f6212", greenTint: "#f2f7e8", red: "#b91c1c", redTint: "#fbeaea",
    redLine: "#dfa3a3",
    amber: "#92600a", amberTint: "#fdf3e0", amberLine: "#e4c27e",
    sky: "#0e6ea8", skyTint: "#e8f3fa", skyLine: "#9cc8e3",
  },
  dark: {
    paper: "#151311", line: "#2b2723", ink: "#ebe7df", muted: "#a49c90",
    faint: "#756d62", accent: "#e5825a", surface: "#1d1a17",
    chip: "#211e1a", accentTint: "#2a201a", accentLine: "#5e463a",
    green: "#a3c57d", greenTint: "#1d2314", red: "#e08585", redTint: "#2a1717",
    redLine: "#6b3838",
    amber: "#dcae62", amberTint: "#26200f", amberLine: "#6b5426",
    sky: "#6fb3dd", skyTint: "#101c24", skyLine: "#2d4c60",
  },
};
const TT = {
  bg: "#1a1816", chrome: "#211e1a", dot: "#3a3530", label: "#756d62",
  text: "#d8d2c6", faint: "#756d62", accent: "#e5825a", green: "#8fb573",
  blue: "#6fa8dc", red: "#d97676", amber: "#dcae62",
};

// App-window chrome + UI palettes (stone tokens, same as Parts 3-10)
const CH = {
  light: { chromeBg: "#f3f1ec", chromeLine: "#e2ded4", dots: "#d6d1c5", urlFill: "#ffffff", urlStroke: "#e2ded4", urlText: "#5b554c" },
  dark: { chromeBg: "#211e1a", chromeLine: "#2b2723", dots: "#3a3530", urlFill: "#1a1816", urlStroke: "#3a3530", urlText: "#a49c90" },
};
const U = {
  light: {
    pageBg: "#fafaf9", ink: "#1c1917", muted: "#57534e", faint: "#a8a29e",
    line: "#e7e5e4", badgeBg: "#ffffff", preBg: "#1c1917", preText: "#f5f5f4",
    userBubble: "#1c1917", userText: "#fafaf9",
    green: "#15803d", red: "#b91c1c", accent: "#0f6c6c",
    inputBg: "#ffffff", placeholder: "#a8a29e", btnText: "#ffffff",
    codeBg: "#f5f5f4", codeText: "#44403c", panel: "#f5f5f4",
    amberText: "#92400e", amberBg: "#fffbeb", amberLine: "#fbbf24", amberDot: "#f59e0b",
    segBg: "#ffffff", segActive: "#1c1917", segActiveText: "#fafaf9",
    sky: "#0369a1", skyBg: "#f0f9ff", skyLine: "#7dd3fc", skyDot: "#0ea5e9",
    tickDone: "#0f6c6c", tickPendingRing: "#d6d3d1",
    redChipBg: "#fee2e2", redChipText: "#991b1b", redLine2: "#fca5a5",
    greenLine: "#86efac", greenBg: "#f0fdf4",
  },
  dark: {
    pageBg: "#0c0a09", ink: "#e7e5e4", muted: "#d6d3d1", faint: "#78716c",
    line: "#292524", badgeBg: "#1c1917", preBg: "#1c1917", preText: "#e7e5e4",
    userBubble: "#f5f5f4", userText: "#1c1917",
    green: "#4ade80", red: "#f87171", accent: "#4fb8b3",
    inputBg: "#1c1917", placeholder: "#78716c", btnText: "#ffffff",
    codeBg: "#292524", codeText: "#d6d3d1", panel: "#1c1917",
    amberText: "#fcd34d", amberBg: "#2a2008", amberLine: "#a16207", amberDot: "#f59e0b",
    segBg: "#1c1917", segActive: "#f5f5f4", segActiveText: "#1c1917",
    sky: "#38bdf8", skyBg: "#082635", skyLine: "#155e82", skyDot: "#0ea5e9",
    tickDone: "#4fb8b3", tickPendingRing: "#57534e",
    redChipBg: "#450a0a", redChipText: "#fca5a5", redLine2: "#7f1d1d",
    greenLine: "#166534", greenBg: "#0a1f10",
  },
};

/* ============================================================
   1. COVER: templated from the Part 1 cover.
   ============================================================ */
function cover(theme) {
  const accent = theme === "light" ? "#b3441a" : "#e5825a";
  let svg = readFileSync(`${P1}/cover-${theme}.svg`, "utf8");
  svg = svg
    .replace(">01</text>", ">11</text>")
    .replace("PART 1 OF 13", "PART 11 OF 13")
    .replace(
      `font-size="92" fill="${theme === "light" ? "#1f1c19" : "#ebe7df"}" letter-spacing="-1">Your first <tspan font-style="italic" fill="${accent}">thread</tspan>`,
      `font-size="88" fill="${theme === "light" ? "#1f1c19" : "#ebe7df"}" letter-spacing="-1">Trust, but <tspan font-style="italic" fill="${accent}">verify</tspan>`
    )
    .replace(
      "Speak raw JSON-RPC to the engine inside Codex. Get a website back.",
      "Fresh eyes, a signed manifest, and a Publish button that gets earned."
    );
  return svg;
}

/* ============================================================
   2. Shared app-window pieces (Parts 3-10 conventions), plus the
   Part 11 newcomers: the report card, the publish bar, and the
   published card.
   ============================================================ */
const W = 1120;
const CHROME_H = 56, HEADER_H = 46;
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

function appHeader(theme, { activeMode, blurb, gauge = null }) {
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
  let gaugeSvg = "";
  let blurbAnchor = px - 12;
  if (gauge) {
    const label = `${gauge.turn}`;
    const label2 = `${gauge.thread} thread`;
    const gw = (label.length + label2.length + 3) * 6.6 + 26;
    const gx = px - 12 - gw;
    gaugeSvg = `<rect x="${gx}" y="${y + 9}" width="${gw}" height="28" rx="8" fill="none" stroke="${t.line}" stroke-width="1.3"/>
  <text x="${gx + 13}" y="${y + 27}" ${MONO} font-size="11" fill="${t.muted}">${esc(label)}</text>
  <text x="${gx + 13 + (label.length + 1) * 6.6}" y="${y + 27}" ${MONO} font-size="11" fill="${t.faint}">&#183; ${esc(label2)}</text>`;
    blurbAnchor = gx - 12;
  }
  return `<line x1="0" y1="${y + HEADER_H}" x2="${W}" y2="${y + HEADER_H}" stroke="${t.line}" stroke-width="1"/>
  <circle cx="24" cy="${y + HEADER_H / 2}" r="5" fill="${t.accent}"/>
  <text x="38" y="${y + HEADER_H / 2 + 5}" ${SANS} font-size="15" font-weight="700" fill="${t.ink}">Pagewright</text>
  <text x="150" y="${y + HEADER_H / 2 + 5}" ${MONO} font-size="11" fill="${t.faint}">the site builder</text>
  <text x="${blurbAnchor}" y="${y + HEADER_H / 2 + 4}" ${SANS} font-size="11" fill="${t.faint}" text-anchor="end">${esc(blurb)}</text>
  ${gaugeSvg}
  ${picker}`;
}

function chatBar(theme, { name, mode }) {
  const t = U[theme];
  const y = CHROME_H + HEADER_H;
  const CHATBAR_H = 34;
  const chipW = mode.length * 6.6 + 18;
  const cx = PV_X - 16 - chipW;
  return `<line x1="${CHAT_X}" y1="${y + CHATBAR_H}" x2="${PV_X}" y2="${y + CHATBAR_H}" stroke="${t.line}" stroke-width="1"/>
  <text x="${CHAT_X + 16}" y="${y + 22}" ${SANS} font-size="12.5" font-weight="600" fill="${t.ink}">${esc(name)}</text>
  <rect x="${cx}" y="${y + 7}" width="${chipW}" height="20" rx="10" fill="none" stroke="${t.line}"/>
  <text x="${cx + chipW / 2}" y="${y + 21}" ${MONO} font-size="10.5" fill="${t.faint}" text-anchor="middle">${mode}</text>`;
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
  <text x="18" y="${y + 53}" ${SANS} font-size="10" fill="${t.faint}">${esc(r.time)}</text>
  <rect x="${SB_W - 48}" y="${y + 41}" width="34" height="16" rx="3.5" fill="none" stroke="${t.line}"/>
  <text x="${SB_W - 31}" y="${y + 52.5}" ${SANS} font-size="9.5" fill="${t.muted}" text-anchor="middle">Fork</text>`;
    y += rh + 8;
  }
  const by = h - 84;
  s += `<line x1="0" y1="${by}" x2="${SB_W}" y2="${by}" stroke="${t.line}" stroke-width="1"/>
  <rect x="12" y="${by + 10}" width="${SB_W - 24}" height="26" rx="7" fill="${t.inputBg}" stroke="${t.line}"/>
  <text x="22" y="${by + 27}" ${SANS} font-size="11" fill="${t.muted}">harbor-and-vine brief</text>
  <path d="M ${SB_W - 30} ${by + 21} l 4.5 5 l 4.5 -5" fill="none" stroke="${t.faint}" stroke-width="1.4"/>
  <rect x="12" y="${by + 44}" width="${SB_W - 24}" height="28" rx="7" fill="${t.accent}"/>
  <text x="${SB_W / 2}" y="${by + 62}" ${SANS} font-size="11.5" font-weight="600" fill="#ffffff" text-anchor="middle">New project</text>`;
  return s;
}

// ---- chat-column content pieces ----
const CC_X = CHAT_X + 16, CC_W = CHAT_W - 32;

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
  <text x="${x + 4}" y="${yy}" ${MONO} font-size="11.5" fill="${t.codeText}">${esc(seg.code)}</text>`;
        x += cw + 3;
      }
    }
  });
  return { svg: s, h: rows.length * lh };
}

function commandBadge(theme, y, label, { state = "done", kind = "COMMAND" } = {}) {
  const t = U[theme];
  const bh = 34;
  let mark;
  if (state === "spin") {
    mark = `<circle cx="${CC_X + 19}" cy="${y + 17}" r="6" fill="none" stroke="${t.faint}" stroke-width="2" stroke-dasharray="7 5"/>`;
  } else {
    mark = `<text x="${CC_X + 14}" y="${y + 21.5}" ${SANS} font-size="12.5" fill="${t.green}">&#x2713;</text>`;
  }
  return {
    svg: `<rect x="${CC_X}" y="${y}" width="${CC_W - 20}" height="${bh}" rx="8" fill="${t.badgeBg}" stroke="${t.line}"/>
  ${mark}
  <text x="${CC_X + 30}" y="${y + 21.5}" ${SANS} font-size="12" fill="${t.ink}">${esc(label)}</text>
  <text x="${CC_X + CC_W - 96}" y="${y + 21}" ${SANS} font-size="9.5" letter-spacing="1" fill="${t.faint}">${kind}</text>
  <path d="M ${CC_X + CC_W - 36} ${y + 15} l 4 4.5 l 4 -4.5" fill="none" stroke="${t.faint}" stroke-width="1.3"/>`,
    h: bh,
  };
}

function receiptRow(theme, y, parts, { first = null } = {}) {
  const t = U[theme];
  let s = "", x = CC_X;
  parts.forEach((p, i) => {
    const fill = i === 0 && first ? first : t.faint;
    s += `\n  <text x="${x}" y="${y + 12}" ${MONO} font-size="11" fill="${fill}">${esc(p)}</text>`;
    x += (p.length + 1) * 6.6;
    if (i < parts.length - 1) {
      s += `\n  <text x="${x}" y="${y + 12}" ${MONO} font-size="11" fill="${t.faint}">&#183;</text>`;
      x += 13;
    }
  });
  return { svg: s, h: 16 };
}

// The Part 11 report card (mirrors p11-e2e-report.png / the canonical
// run's parsed finding).
function reportCard(theme, y, { clean = false }) {
  const t = U[theme];
  const x = CC_X, w = CC_W - 10;
  let s = "";
  let yy = y;
  const borderColor = clean ? t.greenLine : t.redLine2;
  // header strip
  s += `<rect x="${x}" y="${yy}" width="${w}" height="30" fill="${clean ? t.greenBg : t.panel}" opacity="0.8"/>
  <text x="${x + 14}" y="${yy + 19}" ${MONO} font-size="9.5" letter-spacing="1.2" fill="${t.faint}">INSPECTOR'S REPORT</text>
  <text x="${x + w - 12}" y="${yy + 19}" ${MONO} font-size="9" fill="${t.faint}" text-anchor="end">${clean ? "0 blocker &#183; 0 should-fix &#183; 0 minor" : "1 blocker &#183; 0 should-fix &#183; 0 minor"}</text>`;
  yy += 30;
  if (clean) {
    s += `<text x="${x + 14}" y="${yy + 22}" ${SANS} font-size="12" fill="${t.green}">No findings. The site matches the brief, the references</text>
  <text x="${x + 14}" y="${yy + 40}" ${SANS} font-size="12" fill="${t.green}">resolve, and nothing blocks publishing.</text>`;
    yy += 54;
  } else {
    s += `<text x="${x + 14}" y="${yy + 18}" ${SANS} font-size="9.5" letter-spacing="1" font-weight="500" fill="${t.faint}">BLOCKERS &#183; MUST FIX BEFORE PUBLISHING</text>`;
    yy += 26;
    // the P1 row: chip, title, body (from the live parsed finding), location
    s += `<rect x="${x + 12}" y="${yy + 2}" width="24" height="16" rx="3.5" fill="${t.redChipBg}"/>
  <text x="${x + 24}" y="${yy + 14}" ${MONO} font-size="9.5" font-weight="600" fill="${t.redChipText}" text-anchor="middle">P1</text>
  <text x="${x + 44}" y="${yy + 15}" ${SANS} font-size="12" font-weight="600" fill="${t.ink}">Resolve the logo's blue/green brand clash</text>
  <text x="${x + 44}" y="${yy + 31}" ${SANS} font-size="12" font-weight="600" fill="${t.ink}">before launch</text>`;
    yy += 42;
    const body = [
      "assets/logo.svg:2-8 The brief makes `#2F5233` the house",
      "color, but the logo asset shown in the hero and footer",
      "(`assets/logo.svg`) uses `#1E3A5F` for both the mark and",
      "the wordmark, and the client-supplied copy in",
      "`brief/assets/logo.svg` matches that blue version. Because",
      "the live page ships the blue logo unchanged, the client",
      "needs to choose before this goes live.",
    ];
    body.forEach((l, i) => {
      s += `<text x="${x + 44}" y="${yy + i * 15.5}" ${SANS} font-size="10.5" fill="${t.muted}">${esc(l)}</text>`;
    });
    yy += body.length * 15.5 + 6;
    s += `<rect x="${x + 44}" y="${yy - 4}" width="118" height="17" rx="4" fill="${t.codeBg}"/>
  <text x="${x + 50}" y="${yy + 8}" ${MONO} font-size="10" fill="${t.codeText}">assets/logo.svg:2</text>`;
    yy += 24;
  }
  // the raw fold
  s += `<line x1="${x}" y1="${yy}" x2="${x + w}" y2="${yy}" stroke="${t.line}"/>
  <text x="${x + 14}" y="${yy + 18}" ${MONO} font-size="10" fill="${t.faint}">&#9656; the reviewer's words, unparsed</text>`;
  yy += 28;
  if (!clean) {
    s += `<line x1="${x}" y1="${yy}" x2="${x + w}" y2="${yy}" stroke="${t.line}"/>`;
    yy += 9;
    s += `<rect x="${x + 12}" y="${yy}" width="88" height="26" rx="8" fill="${t.segActive}"/>
  <text x="${x + 56}" y="${yy + 17}" ${SANS} font-size="11.5" font-weight="600" fill="${t.segActiveText}" text-anchor="middle">Fix findings</text>`;
    yy += 36;
  }
  const h = yy - y;
  return {
    svg: `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${t.badgeBg}"/>
  <clipPath id="rc-${theme}-${y}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/></clipPath>
  <g clip-path="url(#rc-${theme}-${y})">${s}</g>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${borderColor}" stroke-width="1.6"/>`,
    h,
  };
}

// The Part 11 published card (mirrors p11-e2e-published.png).
function publishedCard(theme, y) {
  const t = U[theme];
  const x = CC_X, w = CC_W - 10;
  const accent = "#2F5233";
  const h = 148;
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${t.badgeBg}" stroke="${t.line}"/>
  <path d="M ${x + 10} ${y} h ${w - 20} a 10 10 0 0 1 10 10 v 0 h -${w} v 0 a 10 10 0 0 1 10 -10 z" fill="${accent}"/>
  <text x="${x + 14}" y="${y + 26}" ${MONO} font-size="9.5" letter-spacing="1.2" fill="${t.green}">PUBLISHED</text>
  <text x="${x + 14}" y="${y + 50}" ${SANS} font-size="14" font-weight="700" fill="${t.ink}">Harbor &amp; Vine</text>
  <text x="${x + 14}" y="${y + 70}" ${SANS} font-size="11" fill="${t.muted}">A calm one-page site for a dockside wine bar and kitchen,</text>
  <text x="${x + 14}" y="${y + 86}" ${SANS} font-size="11" fill="${t.muted}">with seasonal small plates, evening hours, and a subtle</text>
  <text x="${x + 14}" y="${y + 102}" ${SANS} font-size="11" fill="${t.muted}">harbor-side mood.</text>
  <rect x="${x + 14}" y="${y + 112}" width="142" height="24" rx="7" fill="${t.segActive}"/>
  <text x="${x + 85}" y="${y + 128}" ${MONO} font-size="10.5" fill="${t.segActiveText}" text-anchor="middle">/p/harbor-and-vine/</text>
  <rect x="${x + 166}" y="${y + 112}" width="78" height="24" rx="5" fill="none" stroke="${t.line}"/>
  <text x="${x + 205}" y="${y + 128}" ${MONO} font-size="10" fill="${t.muted}" text-anchor="middle">index.html</text>`;
  return { svg: s, h };
}

// The Part 11 plan panel (the inspector's own checklist, from the e2e
// screenshots).
function planPanel(theme, y, steps, { progress, explanation }) {
  const t = U[theme];
  const x = CHAT_X, w = CHAT_W;
  let s = `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${t.line}"/>
  <text x="${x + 18}" y="${y + 24}" ${MONO} font-size="10" letter-spacing="1.5" fill="${t.faint}">THE BUILDER'S PLAN</text>
  <text x="${x + 176}" y="${y + 24}" ${MONO} font-size="10" fill="${t.faint}">${progress}</text>
  <path d="M ${x + w - 28} ${y + 22} l 4.5 -5 l 4.5 5" fill="none" stroke="${t.faint}" stroke-width="1.3"/>`;
  let yy = y + 42;
  for (const st of steps) {
    if (st.status === "completed") {
      s += `<circle cx="${x + 25}" cy="${yy}" r="7" fill="${t.tickDone}"/>
  <path d="M ${x + 21.5} ${yy} l 2.6 2.8 l 4.6 -5.4" fill="none" stroke="#ffffff" stroke-width="1.6"/>
  <text x="${x + 40}" y="${yy + 4}" ${SANS} font-size="11.5" fill="${t.faint}" text-decoration="line-through">${esc(st.step)}</text>`;
    } else if (st.status === "inProgress") {
      s += `<circle cx="${x + 25}" cy="${yy}" r="4.5" fill="${t.tickDone}"/>
  <text x="${x + 40}" y="${yy + 4}" ${SANS} font-size="11.5" font-weight="600" fill="${t.ink}">${esc(st.step)}</text>`;
    } else {
      s += `<circle cx="${x + 25}" cy="${yy}" r="5" fill="none" stroke="${t.tickPendingRing}" stroke-width="2"/>
  <text x="${x + 40}" y="${yy + 4}" ${SANS} font-size="11.5" fill="${t.muted}">${esc(st.step)}</text>`;
    }
    yy += 24;
  }
  let h = yy - y + 2;
  if (explanation) {
    s += `<text x="${x + 18}" y="${yy + 8}" ${SANS} font-size="10.5" font-style="italic" fill="${t.faint}">${esc(explanation)}</text>`;
    h += 20;
  }
  return { svg: `<rect x="${x + 1}" y="${y}" width="${w - 1}" height="${h}" fill="${t.panel}" opacity="0.5"/>${s}`, h };
}

// The Part 11 publish bar: pinned between the transcript and the
// composer pills. state: "blocked" | "clean".
function publishBar(theme, y, state) {
  const t = U[theme];
  const x = CHAT_X, w = CHAT_W;
  const BH = 42;
  let msg;
  if (state === "blocked") {
    msg = `<text x="${x + 18}" y="${y + 26}" ${SANS} font-size="11.5" fill="${t.red}">Publish is blocked: 1 blocker finding to fix.</text>`;
  } else {
    msg = `<text x="${x + 18}" y="${y + 26}" ${SANS} font-size="11.5" fill="${t.green}">Inspection clean: ready to publish.</text>`;
  }
  const pubX = x + w - 16 - 58;
  const reX = pubX - 8 - 74;
  return {
    svg: `<rect x="${x + 1}" y="${y}" width="${w - 1}" height="${BH}" fill="${t.panel}" opacity="0.6"/>
  <line x1="${x}" y1="${y}" x2="${x + w}" y2="${y}" stroke="${t.line}"/>
  ${msg}
  <rect x="${reX}" y="${y + 8}" width="74" height="26" rx="8" fill="none" stroke="${t.line}"/>
  <text x="${reX + 37}" y="${y + 25}" ${SANS} font-size="11" font-weight="500" fill="${t.muted}" text-anchor="middle">Re-inspect</text>
  <rect x="${pubX}" y="${y + 8}" width="58" height="26" rx="8" fill="${t.accent}" opacity="${state === "blocked" ? 0.4 : 1}"/>
  <text x="${pubX + 29}" y="${y + 25}" ${SANS} font-size="11" font-weight="600" fill="#ffffff" text-anchor="middle">Publish</text>`,
    h: BH,
  };
}

// Footer: Plan-first pill + care picker + composer (Part 10's footer).
function chatFooter(theme, h) {
  const t = U[theme];
  const y = h - 62 - 34;
  let s = `<line x1="${CHAT_X}" y1="${y}" x2="${PV_X}" y2="${y}" stroke="${t.line}" stroke-width="1"/>`;
  const yy = y + 10;
  const pillW = 78;
  s += `<rect x="${CC_X}" y="${yy}" width="${pillW}" height="22" rx="11" fill="none" stroke="${t.line}"/>
  <circle cx="${CC_X + 13}" cy="${yy + 11}" r="2.5" fill="${t.tickPendingRing}"/>
  <text x="${CC_X + 22}" y="${yy + 15}" ${SANS} font-size="11" font-weight="500" fill="${t.muted}">Plan first</text>`;
  const levels = [
    { label: "Quick", w: 48 }, { label: "Standard", w: 64 },
    { label: "Thorough", w: 66 }, { label: "Max", w: 38 },
  ];
  const cw = levels.reduce((a, l) => a + l.w, 0) + 8;
  let cx = PV_X - 16 - cw + 4;
  s += `<rect x="${PV_X - 16 - cw}" y="${yy - 1}" width="${cw}" height="24" rx="8" fill="none" stroke="${t.line}"/>`;
  for (const l of levels) {
    const active = l.label === "Standard";
    if (active) s += `<rect x="${cx}" y="${yy + 2}" width="${l.w}" height="18" rx="6" fill="${t.segActive}"/>`;
    s += `<text x="${cx + l.w / 2}" y="${yy + 15}" ${SANS} font-size="10.5" font-weight="600" fill="${active ? t.segActiveText : t.muted}" text-anchor="middle">${l.label}</text>`;
    cx += l.w;
  }
  const ry = h - 50;
  const sendW = 62;
  const sendX = PV_X - 16 - sendW;
  s += `<rect x="${CC_X}" y="${ry}" width="${sendX - 10 - CC_X}" height="36" rx="10" fill="${t.inputBg}" stroke="${t.line}" stroke-width="1.5"/>
  <text x="${CC_X + 13}" y="${ry + 23}" ${SANS} font-size="12" fill="${t.placeholder}">Describe the site you want&#8230;</text>
  <rect x="${sendX}" y="${ry}" width="${sendW}" height="36" rx="10" fill="${t.accent}" opacity="0.45"/>
  <text x="${sendX + sendW / 2}" y="${ry + 23}" ${SANS} font-size="12.5" font-weight="600" fill="${t.btnText}" text-anchor="middle">Send</text>`;
  return { svg: s, top: y };
}

// The Harbor & Vine preview pane. logoColor is the whole story:
// #1E3A5F (the planted navy) before the fix, #2F5233 after.
function previewShell(theme, h, { projectId, files, logoColor }) {
  const t = U[theme];
  const top = CHROME_H + HEADER_H;
  const urlH = 34;
  const filesH = 60 + files.list.length * 20;
  const siteY = top + urlH, siteH = h - siteY - filesH;
  let filesRows = "";
  files.list.forEach((f, i) => {
    const yy = h - filesH + 46 + i * 20;
    filesRows += `<text x="${PV_X + 16 + (f.indent || 0) * 14}" y="${yy}" ${MONO} font-size="11" fill="${t.muted}">${esc(f.name)}</text>`;
    if (f.badge) {
      filesRows += `<rect x="${W - 16 - 54 - f.size.length * 6}" y="${yy - 11}" width="50" height="15" rx="3" fill="${t.amberBg}" stroke="${t.amberLine}" stroke-opacity="0.6"/>
  <text x="${W - 16 - 29 - f.size.length * 6}" y="${yy}" ${MONO} font-size="9" fill="${t.amberText}" text-anchor="middle">updated</text>`;
    }
    filesRows += `<text x="${W - 16}" y="${yy}" ${MONO} font-size="10" fill="${t.faint}" text-anchor="end">${esc(f.size)}</text>`;
  });
  // The site: off-white paper, serif, green accents; the logo mark's
  // color is the parameter.
  const sx = PV_X + 14, sw = PV_W - 28;
  const paper = "#f7f5f0", green = "#2F5233", inkc = "#26221c";
  const lx = sx + 26, ly = siteY + 36;
  const siteSvg = `<rect x="${sx}" y="${siteY + 12}" width="${sw}" height="${siteH - 24}" rx="10" fill="${paper}" stroke="${t.line}"/>
  <g fill="none" stroke="${logoColor}" stroke-width="2.4">
    <path d="M ${lx} ${ly + 30} C ${lx + 6} ${ly + 16}, ${lx + 18} ${ly + 16}, ${lx + 24} ${ly + 30}"/>
    <line x1="${lx + 12}" y1="${ly + 4}" x2="${lx + 12}" y2="${ly + 24}"/>
    <circle cx="${lx + 12}" cy="${ly}" r="4"/>
    <path d="M ${lx + 24} ${ly + 30} C ${lx + 29} ${ly + 24}, ${lx + 33} ${ly + 27}, ${lx + 31} ${ly + 33}"/>
  </g>
  <text x="${lx + 44}" y="${ly + 24}" ${SERIF} font-size="17" fill="${logoColor}" letter-spacing="0.5">Harbor &amp; Vine</text>
  <text x="${sx + 26}" y="${siteY + 106}" ${SERIF} font-size="10.5" letter-spacing="2.5" fill="${green}">DOCKSIDE WINE BAR AND KITCHEN</text>
  <text x="${sx + 24}" y="${siteY + 152}" ${SERIF} font-size="40" font-weight="700" fill="${green}">Harbor &amp; Vine</text>
  <text x="${sx + 26}" y="${siteY + 182}" ${SERIF} font-size="14" fill="${inkc}">Wine at the water's edge</text>
  <rect x="${sx + 26}" y="${siteY + 200}" width="132" height="36" rx="18" fill="${green}"/>
  <text x="${sx + 92}" y="${siteY + 223}" ${SERIF} font-size="13" fill="#ffffff" text-anchor="middle">Reserve a table</text>
  <line x1="${sx + 24}" y1="${siteY + 262}" x2="${sx + sw - 24}" y2="${siteY + 262}" stroke="${green}" stroke-opacity="0.2"/>
  <text x="${sx + 26}" y="${siteY + 292}" ${SERIF} font-size="12.5" fill="${inkc}">Low light, dark wood, and the quiet pull</text>
  <text x="${sx + 26}" y="${siteY + 312}" ${SERIF} font-size="12.5" fill="${inkc}">of the harbor just beyond the glass.</text>
  <text x="${sx + 26}" y="${siteY + 344}" ${SERIF} font-size="12.5" fill="${inkc}">The room is set for long dinners and</text>
  <text x="${sx + 26}" y="${siteY + 364}" ${SERIF} font-size="12.5" fill="${inkc}">careful pours.</text>`;
  return `<line x1="${PV_X}" y1="${top}" x2="${PV_X}" y2="${h}" stroke="${t.line}" stroke-width="1"/>
  <text x="${PV_X + 16}" y="${top + 22}" ${MONO} font-size="11.5" fill="${t.faint}">/preview/${projectId}/</text>
  <rect x="${W - 118}" y="${top + 6}" width="56" height="22" rx="6" fill="none" stroke="${t.line}"/>
  <text x="${W - 90}" y="${top + 21}" ${SANS} font-size="10.5" fill="${t.muted}" text-anchor="middle">Reload</text>
  <rect x="${W - 56}" y="${top + 6}" width="40" height="22" rx="6" fill="none" stroke="${t.line}" opacity="0.55"/>
  <text x="${W - 33}" y="${top + 21}" ${SANS} font-size="10.5" fill="${t.faint}" text-anchor="middle" opacity="0.9">Diff</text>
  <line x1="${PV_X}" y1="${siteY}" x2="${W}" y2="${siteY}" stroke="${t.line}" stroke-width="1"/>
  ${siteSvg}
  <line x1="${PV_X}" y1="${h - filesH}" x2="${W}" y2="${h - filesH}" stroke="${t.line}" stroke-width="1"/>
  <rect x="${PV_X + 1}" y="${h - filesH + 1}" width="${PV_W - 1}" height="${filesH - 1}" fill="${t.panel}" opacity="0.35"/>
  <text x="${PV_X + 16}" y="${h - filesH + 24}" ${MONO} font-size="10.5" letter-spacing="1.5" fill="${t.faint}">FILES</text>
  <text x="${W - 16}" y="${h - filesH + 24}" ${MONO} font-size="10.5" fill="${t.faint}" text-anchor="end">${files.count}</text>
  ${filesRows}`;
}

const HV_FILES = {
  count: 4,
  list: [
    { name: "assets/", size: "" },
    { name: "logo.svg", size: "511 B", indent: 1 },
    { name: "brief/", size: "" },
    { name: "assets/", size: "", indent: 1 },
    { name: "logo.svg", size: "511 B", indent: 2 },
    { name: "brief.md", size: "1.0 kB", indent: 1 },
    { name: "index.html", size: "10.5 kB", badge: true },
  ],
};

/* ============================================================
   3. browser-report: the planted flaw on screen. P1 card, blocked
   bar, and the navy logo on the green site (mirrors
   p11-e2e-report.png at the blocked moment).
   ============================================================ */
function browserReport(theme) {
  const t = U[theme];
  const h = 900;
  let y = CHROME_H + HEADER_H + 34 + 14;
  const parts = [];
  const add = (p, gap = 12) => { parts.push(p.svg); y += p.h + gap; };

  add(proseRich(theme, y, [
    ["The site is built to the brief: hero, kitchen, hours and"],
    ["tides, and the footer with the client's logo."],
  ]), 6);
  add(receiptRow(theme, y, ["224,574 tokens this turn", "67s"]), 14);
  add(commandBadge(theme, y, 'Running: "cat assets/logo.svg; cat brief/…"'), 8);
  add(reportCard(theme, y, { clean: false }), 8);
  add(receiptRow(theme, y, ["inspection (fresh eyes)", "32s"], { first: t.sky }), 0);

  const footer = chatFooter(theme, h);
  const bar = publishBar(theme, footer.top - 42, "blocked");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">
  <rect width="${W}" height="${h}" fill="${t.pageBg}"/>
  ${chrome(theme)}
  ${appHeader(theme, { activeMode: "standard", blurb: "Write inside this workspace; the network stays off.", gauge: { turn: "224.6k", thread: "224.6k" } })}
  ${sidebar(theme, h, [
    { name: "Harbor And Vine", sub: "Read brief/brief.md and build the site…", time: "2m ago", active: true },
  ])}
  ${chatBar(theme, { name: "Harbor And Vine", mode: "standard" })}
  ${parts.join("\n  ")}
  ${bar.svg}
  ${footer.svg}
  ${previewShell(theme, h, { projectId: "e73f589c", files: HV_FILES, logoColor: "#1E3A5F" })}
</svg>`;
}

/* ============================================================
   4. browser-published: the clean re-inspection and the published
   card (mirrors p11-e2e-published.png).
   ============================================================ */
function browserPublished(theme) {
  const t = U[theme];
  const h = 900;
  let y = CHROME_H + HEADER_H + 34 + 14;
  const parts = [];
  const add = (p, gap = 12) => { parts.push(p.svg); y += p.h + gap; };

  add(receiptRow(theme, y, ["fix findings", "180,916 tokens this turn", "21s"]), 14);
  add(commandBadge(theme, y, 'Running: "find . -maxdepth 3 -type f | sort"'), 8);
  add(commandBadge(theme, y, `Running: "echo '--- assets/logo.svg ---'; cat…"`), 8);
  add(reportCard(theme, y, { clean: true }), 8);
  add(receiptRow(theme, y, ["inspection (fresh eyes)", "21s"], { first: t.sky }), 16);
  add(publishedCard(theme, y), 0);

  const footer = chatFooter(theme, h);
  const bar = publishBar(theme, footer.top - 42, "clean");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">
  <rect width="${W}" height="${h}" fill="${t.pageBg}"/>
  ${chrome(theme)}
  ${appHeader(theme, { activeMode: "standard", blurb: "Write inside this workspace; the network stays off.", gauge: { turn: "180.9k", thread: "405.5k" } })}
  ${sidebar(theme, h, [
    { name: "Harbor And Vine", sub: "Read brief/brief.md and build the site…", time: "6m ago", active: true },
  ])}
  ${chatBar(theme, { name: "Harbor And Vine", mode: "standard" })}
  ${parts.join("\n  ")}
  ${bar.svg}
  ${footer.svg}
  ${previewShell(theme, h, { projectId: "e73f589c", files: HV_FILES, logoColor: "#2F5233" })}
</svg>`;
}

/* ============================================================
   5. fig-inspector: review/start end to end, with the model truth
   and the latency honesty.
   ============================================================ */
function figInspector(theme) {
  const t = D[theme];
  const w = 1240, h = 1040;
  const label = (x, y, txt, size = 13, fill = t.ink, anchor = "middle", font = MONO) =>
    `<text x="${x}" y="${y}" ${font} font-size="${size}" fill="${fill}" text-anchor="${anchor}">${txt}</text>`;
  const box = (x, y, bw, bh, fill, stroke, sw = 1.5) =>
    `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const arrow = (x1, y1, x2, y2, color = t.faint) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5"/>
     <path d="M ${x2} ${y2} l -5 -8 l 10 0 z" fill="${color}" transform="rotate(${(Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI - 90} ${x2} ${y2})"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
  <rect width="${w}" height="${h}" fill="${t.paper}"/>
  <text x="48" y="52" ${MONO} font-size="12" letter-spacing="2.5" fill="${t.faint}">THE INSPECTOR &#183; A DIFFERENT CLIPBOARD FROM THE BUILDER'S</text>
  <line x1="48" y1="66" x2="${w - 48}" y2="66" stroke="${t.line}" stroke-width="1.5"/>

  <!-- the request -->
  ${box(48, 90, 660, 140, t.chip, t.line)}
  ${label(70, 118, "POST /projects/{id}/review &#8594; review/start", 13.5, t.ink, "start")}
  ${label(70, 146, `{"threadId": "&#8230;", "target": {"type": "custom",`, 12.5, t.muted, "start")}
  ${label(70, 168, `"instructions": "You are the pre-publish inspector&#8230;"}}`, 12.5, t.muted, "start")}
  ${label(70, 198, "custom = free-form instructions, NO git required. The other targets", 11, t.muted, "start", SANS)}
  ${label(70, 214, "(uncommittedChanges, baseBranch, commit) all assume a repo.", 11, t.muted, "start", SANS)}

  <!-- the model truth, alongside -->
  ${box(740, 90, 452, 140, "none", t.amberLine, 1.4)}
  ${label(762, 118, "THE MODEL TRUTH (verified live)", 10.5, t.amber, "start")}
  ${label(762, 144, "review/start takes NO model param: extras are", 11.5, t.muted, "start", SANS)}
  ${label(762, 162, "silently ignored. The lever is one level up:", 11.5, t.muted, "start", SANS)}
  ${label(762, 186, `thread/start config {"review_model": "gpt-5.4-mini"}`, 11.5, t.ink, "start")}
  ${label(762, 210, "proof: a bogus review_model &#8594; model_not_found", 11, t.amber, "start")}

  ${arrow(378, 230, 378, 262)}

  <!-- enteredReviewMode -->
  ${box(48, 262, 660, 64, t.skyTint, t.skyLine, 2)}
  ${label(70, 288, "item: enteredReviewMode", 13, t.sky, "start")}
  ${label(70, 310, `{"review": &lt;our instructions, echoed back&gt;} &#183; the report card opens "running"`, 11.5, t.muted, "start")}

  ${arrow(378, 326, 378, 358)}

  <!-- the investigation -->
  ${box(48, 358, 660, 150, t.chip, t.line)}
  ${label(70, 386, "THE INVESTIGATION (real commands, canonical run)", 10.5, t.faint, "start")}
  ${label(70, 412, "find . -maxdepth 3 -type f | sort", 12, t.muted, "start")}
  ${label(70, 436, "sed -n '1,220p' brief/brief.md &#183; sed -n '1,260p' index.html", 12, t.muted, "start")}
  ${label(70, 460, "cat assets/logo.svg   # it reads the client's own SVG, fill by fill", 12, t.green, "start")}
  ${label(70, 488, "ordinary commandExecution items: the Part 3 badges render them unchanged", 11, t.muted, "start", SANS)}

  <!-- latency strip, alongside -->
  ${box(740, 262, 452, 246, t.surface, t.line)}
  ${label(762, 290, "LATENCY, HONESTLY", 10.5, t.faint, "start")}
  ${label(762, 318, "canonical run: 32s (flawed), 21s (clean)", 12, t.ink, "start")}
  ${label(762, 342, "A/B same site: default model 30s,", 12, t.muted, "start")}
  ${label(762, 364, "review_model gpt-5.4-mini 26-28s", 12, t.muted, "start")}
  ${label(762, 390, "measured range on one-page sites: 20-90s", 12, t.ink, "start")}
  ${label(762, 416, "(the spike once saw ~4 minutes on a busier", 11, t.muted, "start", SANS)}
  ${label(762, 432, "workspace)", 11, t.muted, "start", SANS)}
  ${label(762, 462, "So the UI sets expectations: a progress row,", 11, t.muted, "start", SANS)}
  ${label(762, 478, "an elapsed clock, and no spinner lies.", 11, t.muted, "start", SANS)}

  ${arrow(378, 508, 378, 540)}

  <!-- exitedReviewMode -->
  ${box(48, 540, 660, 118, t.accentTint, t.accentLine, 2)}
  ${label(70, 568, "item: exitedReviewMode", 13, t.accent, "start")}
  ${label(70, 592, `{"review": "The page is mostly compliant, but it ships a logo whose`, 11.5, t.muted, "start")}
  ${label(70, 612, `colors conflict&#8230; - [P1] Resolve the logo's blue/green brand clash&#8230;"}`, 11.5, t.muted, "start")}
  ${label(70, 640, "the findings are TAGGED PROSE, not JSON: a summary + [P1]/[P2]/[P3] bullets", 11, t.accent, "start", SANS)}

  ${arrow(378, 658, 378, 690)}

  <!-- the parser -->
  ${box(48, 690, 660, 128, t.chip, t.line)}
  ${label(70, 718, "app/review.py &#183; parse_findings()", 13, t.ink, "start")}
  ${label(70, 744, `regex the tags &#8594; {severity, title, body, location} &#183; counts {P1: 1}`, 12, t.muted, "start")}
  ${label(70, 768, "keep the raw text: the prose is the truth, the rows are a convenience", 11.5, t.green, "start", SANS)}
  ${label(70, 792, "unparseable segments become whole-body findings: nothing silently vanishes", 11, t.muted, "start", SANS)}

  ${box(740, 690, 452, 128, t.surface, t.line)}
  ${label(762, 718, "ONTO THE WIRE (Part 9's log)", 10.5, t.faint, "start")}
  ${label(762, 744, "review_state {phase: entered}", 12, t.muted, "start")}
  ${label(762, 768, "review_finding &#215; N &#183; review_state {exited,", 12, t.muted, "start")}
  ${label(762, 792, "counts, raw} &#8594; the card in EVERY tab, replay too", 12, t.muted, "start")}

  <!-- the fresh-clipboard footer -->
  ${box(48, 846, w - 96, 92, t.greenTint, t.line, 1.2)}
  ${label(70, 874, "WHY NOT ASK THE BUILDER TO CHECK ITS OWN WORK?", 10.5, t.green, "start")}
  ${label(70, 898, "Fresh context is the point. The builder's thread carries every decision it already made; asked to re-check, it defends them.", 11.5, t.muted, "start", SANS)}
  ${label(70, 918, "review/start runs with a clean slate against the FILES, the same lesson the sibling series taught with subagents.", 11.5, t.muted, "start", SANS)}

  <rect x="48" y="${h - 76}" width="${w - 96}" height="52" rx="10" fill="${t.surface}" stroke="${t.line}"/>
  ${label(68, h - 50, "delivery: inline (default; the review runs as a turn on your thread, same consumer, same log) or detached (a fresh", 11.5, t.muted, "start")}
  ${label(68, h - 32, "thread, returned as reviewThreadId). Pagewright uses inline: one project, one transcript, the inspection on the record.", 11.5, t.muted, "start")}
</svg>`;
}

/* ============================================================
   6. fig-gate: the four honest refusals and the loud escape hatch.
   ============================================================ */
function figGate(theme) {
  const t = D[theme];
  const w = 1240, h = 980;
  const label = (x, y, txt, size = 13, fill = t.ink, anchor = "middle", font = MONO) =>
    `<text x="${x}" y="${y}" ${font} font-size="${size}" fill="${fill}" text-anchor="${anchor}">${txt}</text>`;
  const box = (x, y, bw, bh, fill, stroke, sw = 1.5) =>
    `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const arrow = (x1, y1, x2, y2, color = t.faint) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5"/>
     <path d="M ${x2} ${y2} l -5 -8 l 10 0 z" fill="${color}" transform="rotate(${(Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI - 90} ${x2} ${y2})"/>`;

  const RY = 200, RH = 118, RW = 278, GAP = 20;
  const reasons = [
    ["NEVER INSPECTED", ["“the site has never been", "inspected: run the review", "first”"], "no review entry in the registry"],
    ["BLOCKERS", ["“the last inspection found 1", "blocker finding(s) [P1]: fix", "them and re-inspect”"], "review.P1 > 0"],
    ["STALE", ["“the site changed after the", "last inspection: re-run the", "review”"], "built_at_ms > review.at_ms"],
    ["BRIEF/ REFS", ["“the site references the", "brief/ folder, which does", "not ship: copy those assets”"], "one grep over href/src"],
  ];
  let cards = "";
  reasons.forEach((r, i) => {
    const x = 48 + i * (RW + GAP);
    cards += box(x, RY, RW, RH, t.redTint, t.redLine, 1.4);
    cards += label(x + 16, RY + 26, r[0], 10.5, t.red, "start");
    r[1].forEach((l, j) => {
      cards += label(x + 16, RY + 50 + j * 18, l, 11, t.muted, "start", SANS);
    });
    cards += label(x + 16, RY + 106, r[2], 10, t.faint, "start");
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
  <rect width="${w}" height="${h}" fill="${t.paper}"/>
  <text x="48" y="52" ${MONO} font-size="12" letter-spacing="2.5" fill="${t.faint}">THE GATE &#183; POST /publish EARNS ITS 200</text>
  <line x1="48" y1="66" x2="${w - 48}" y2="66" stroke="${t.line}" stroke-width="1.5"/>

  ${box(48, 90, w - 96, 64, t.chip, t.line)}
  ${label(70, 118, `POST /projects/{id}/publish {"force": false} &#8594; gate_reasons(entry)`, 13.5, t.ink, "start")}
  ${label(70, 140, "three registry checks and one grep: no protocol call, no model, no tokens. Every refusal below was captured live.", 11, t.muted, "start", SANS)}

  ${arrow(w / 2, 154, w / 2, 200)}
  ${cards}

  ${label(w / 2, RY + RH + 34, "any reason + force:false &#8594; HTTP 409 {&quot;detail&quot;: {&quot;reasons&quot;: [&#8230;]}} &#183; the UI never offers a click it knows will 409", 11.5, t.red)}

  <!-- the earned check callout -->
  ${box(48, RY + RH + 56, w - 96, 62, "none", t.amberLine, 1.3)}
  ${label(70, RY + RH + 82, "THE FOURTH CHECK WAS EARNED, NOT DESIGNED", 10.5, t.amber, "start")}
  ${label(70, RY + RH + 102, "A live build hotlinked brief/assets/logo.svg. The workspace preview served it fine; publishing strips brief/, so only the LIVE copy broke.", 11.5, t.muted, "start", SANS)}

  <!-- the green lane -->
  ${arrow(w / 2, RY + RH + 118, w / 2, RY + RH + 156)}
  ${box(48, 494, 560, 150, t.greenTint, t.line, 1.4)}
  ${label(70, 522, "REASONS EMPTY &#8594; THE MANIFEST TURN", 10.5, t.green, "start")}
  ${label(70, 548, "run_schema_turn(): read-only, effort low,", 12, t.ink, "start")}
  ${label(70, 572, "outputSchema = the manifest &#183; pydantic validates", 12, t.ink, "start")}
  ${label(70, 596, "one retry on any failure, then surface a 502", 12, t.muted, "start")}
  ${label(70, 622, "then the fifteen-line copy: site/ &#8594; published/{slug}/ (minus brief/)", 11, t.muted, "start", SANS)}

  ${box(632, 494, 560, 150, t.chip, t.line)}
  ${label(654, 522, "THE 200 (live)", 10.5, t.faint, "start")}
  ${label(654, 548, `{"slug": "harbor-and-vine", "url": "/p/harbor-and-vine/",`, 11.5, t.muted, "start")}
  ${label(654, 572, `"manifest": {"title": "Harbor &amp; Vine", &#8230;,`, 11.5, t.muted, "start")}
  ${label(654, 596, `"accent": "#2F5233"}, "forced": false}`, 11.5, t.muted, "start")}
  ${label(654, 622, "mounted at /p/{slug}/ &#183; a card on the /p/ index", 11, t.muted, "start", SANS)}

  <!-- the force lane -->
  ${box(48, 676, w - 96, 176, "none", t.redLine, 1.4)}
  ${label(70, 704, "THE ESCAPE HATCH: force: true (captured live)", 10.5, t.red, "start")}
  ${label(70, 732, "The copy still happens: but nothing is quiet about it.", 12, t.muted, "start", SANS)}
  ${label(70, 760, `server log:  WARNING &#8230; FORCED publish of project 77fddc5a past the gate: the last inspection found 1 blocker&#8230;`, 11.5, t.ink, "start")}
  ${label(70, 786, `the stream:  publish_state {"phase": "forced", "reasons": [&#8230;]} &#8594; every tab sees the overrule`, 11.5, t.ink, "start")}
  ${label(70, 812, `the record:  the registry entry is stamped "forced": true &#183; the /p/ index card says "published with --force"`, 11.5, t.ink, "start")}
  ${label(70, 838, "products need escape hatches; escape hatches need witnesses.", 11.5, t.red, "start", SANS)}

  <rect x="48" y="${h - 100}" width="${w - 96}" height="56" rx="10" fill="${t.surface}" stroke="${t.line}"/>
  ${label(68, h - 74, "Staleness is stamped conservatively: EVERY completed non-review turn sets built_at_ms, even one that changed nothing.", 11.5, t.muted, "start")}
  ${label(68, h - 54, "“Is the review older than the last turn” is cheap and honest; “did that turn REALLY change a file” is a rabbit hole.", 11.5, t.accent, "start")}
</svg>`;
}

/* ============================================================
   7. fig-schema-truth: the two break-it probes and the wall.
   ============================================================ */
function figSchemaTruth(theme) {
  const t = D[theme];
  const w = 1240, h = 900;
  const label = (x, y, txt, size = 13, fill = t.ink, anchor = "middle", font = MONO) =>
    `<text x="${x}" y="${y}" ${font} font-size="${size}" fill="${fill}" text-anchor="${anchor}">${txt}</text>`;
  const box = (x, y, bw, bh, fill, stroke, sw = 1.5) =>
    `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const arrow = (x1, y1, x2, y2, color = t.faint) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5"/>
     <path d="M ${x2} ${y2} l -5 -8 l 10 0 z" fill="${color}" transform="rotate(${(Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI - 90} ${x2} ${y2})"/>`;

  const LX = 48, LW = 556, RX = 636, RW = 556;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
  <rect width="${w}" height="${h}" fill="${t.paper}"/>
  <text x="48" y="52" ${MONO} font-size="12" letter-spacing="2.5" fill="${t.faint}">OUTPUTSCHEMA &#183; A REQUEST, NOT A GUARANTEE (TWO LIVE PROBES)</text>
  <line x1="48" y1="66" x2="${w - 48}" y2="66" stroke="${t.line}" stroke-width="1.5"/>

  ${label(LX, 104, "PROBE A &#183; NO LEGAL VALUE EXISTS", 11, t.accent, "start")}
  ${label(RX, 104, "PROBE B &#183; CONTRADICTORY BOUNDS", 11, t.accent, "start")}

  ${box(LX, 120, LW, 96, t.chip, t.line)}
  ${label(LX + 20, 148, `"impossible": {"type": "string", "enum": []}`, 12.5, t.ink, "start")}
  ${label(LX + 20, 172, "required, and the enum is empty: NOTHING", 11.5, t.muted, "start", SANS)}
  ${label(LX + 20, 190, "the model writes can satisfy this schema.", 11.5, t.muted, "start", SANS)}

  ${box(RX, 120, RW, 96, t.chip, t.line)}
  ${label(RX + 20, 148, `"summary": {"minLength": 10, "maxLength": 2}`, 12.5, t.ink, "start")}
  ${label(RX + 20, 172, "at least ten characters AND at most two:", 11.5, t.muted, "start", SANS)}
  ${label(RX + 20, 190, "a shape no string can have.", 11.5, t.muted, "start", SANS)}

  ${arrow(LX + LW / 2, 216, LX + LW / 2, 252)}
  ${arrow(RX + RW / 2, 216, RX + RW / 2, 252)}

  ${box(LX, 252, LW, 150, t.redTint, t.redLine, 1.6)}
  ${label(LX + 20, 280, "WHAT THE WIRE DID (34s)", 10.5, t.red, "start")}
  ${label(LX + 20, 306, `turn/completed &#183; status: "completed"`, 12.5, t.ink, "start")}
  ${label(LX + 20, 330, "no error field, no complaint, and the final text:", 11.5, t.muted, "start", SANS)}
  ${label(LX + 20, 356, `{"title": "index.html", "impossible": ""}`, 12.5, t.red, "start")}
  ${label(LX + 20, 384, `"" is not in the (empty) enum: the JSON VIOLATES the schema`, 11, t.muted, "start", SANS)}

  ${box(RX, 252, RW, 150, t.redTint, t.redLine, 1.6)}
  ${label(RX + 20, 280, "WHAT THE WIRE DID (47s)", 10.5, t.red, "start")}
  ${label(RX + 20, 306, `turn/completed &#183; status: "completed"`, 12.5, t.ink, "start")}
  ${label(RX + 20, 330, "the model abandons the shape entirely: free-form", 11.5, t.muted, "start", SANS)}
  ${label(RX + 20, 356, `{"file": "index.html", "document": {"type": "html"&#8230;`, 12.5, t.red, "start")}
  ${label(RX + 20, 384, "different keys, no trace of the schema you sent", 11, t.muted, "start", SANS)}

  ${arrow(w / 2, 402, w / 2, 442)}

  <!-- the wall -->
  ${box(48, 442, w - 96, 130, t.accentTint, t.accentLine, 2)}
  ${label(70, 470, "THE WALL: VALIDATE ON YOUR SIDE, ALWAYS", 10.5, t.accent, "start")}
  ${label(70, 498, "Manifest.model_validate(_scrub(json.loads(text)))   # pydantic, at OUR edge", 12.5, t.ink, "start")}
  ${label(70, 526, "the schema constrains the model's grammar; it does not constrain your trust. _scrub strips the markdown links", 11.5, t.muted, "start", SANS)}
  ${label(70, 546, `the model tucks into string values ("[Beanline](https://&#8230;)" &#8594; "Beanline"): the other sharp edge, also live.`, 11.5, t.muted, "start", SANS)}

  ${arrow(w / 2, 572, w / 2, 612)}

  <!-- the policy -->
  ${box(48, 612, w - 96, 156, t.chip, t.line)}
  ${label(70, 640, "THE RETRY-OR-SURFACE POLICY (written down, not improvised)", 10.5, t.faint, "start")}
  ${label(70, 668, "for attempt in (1, 2):  # exactly one retry", 12.5, t.ink, "start")}
  ${label(70, 694, "&#8230;turn errors OR the JSON fails validation &#8594; publish_state manifest_retry &#8594; try once more", 12, t.muted, "start")}
  ${label(70, 720, `&#8230;still failing &#8594; HTTP 502 "the manifest failed twice: &#8230;" &#183; the human decides`, 12, t.muted, "start")}
  ${label(70, 748, "zero retries turns every hiccup into a support ticket; silent loops hide real problems. One retry, then the truth.", 11.5, t.green, "start", SANS)}

  <rect x="48" y="${h - 100}" width="${w - 96}" height="56" rx="10" fill="${t.surface}" stroke="${t.line}"/>
  ${label(68, h - 74, "The happy path is real too: with a satisfiable schema the final agentMessage.text IS the conformant JSON string,", 11.5, t.muted, "start")}
  ${label(68, h - 54, "verified on every manifest in this part. The probes exist so you design for the day it isn't.", 11.5, t.accent, "start")}
</svg>`;
}

/* ============================================================
   8. term captures (dark only).
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

// The planted flaw, verbatim from the canonical run's
// exitedReviewMode.review (the seam the reviewer letters with an
// em-dash is drawn as a middot, per the house glyph rule).
const termFinding = () =>
  term("exitedReviewMode.review &#183; the planted flaw, caught (canonical run)", [
    `${F(TT.faint, "# the findings text, as the engine handed it back: summary first, then the bullet")}`,
    `The page is mostly compliant, but it ships a logo whose colors conflict with the`,
    `brief's stated brand palette, and that contradiction is visible in both the hero`,
    `and footer. That is a ${F(TT.red, "publish-blocking brand issue")} under the review rules.`,
    ``,
    `Review comment:`,
    ``,
    `- ${F(TT.red, "[P1]")} ${F(TT.accent, "Resolve the logo's blue/green brand clash before launch")} &#183;`,
    `  ${F(TT.blue, "assets/logo.svg:2-8")}`,
    `  The brief makes ${F(TT.green, "`#2F5233`")} the house color, but the logo asset shown in the`,
    `  hero and footer (${F(TT.blue, "`assets/logo.svg`")}) uses ${F(TT.blue, "`#1E3A5F`")} for both the mark and`,
    `  the wordmark, and the client-supplied copy in ${F(TT.blue, "`brief/assets/logo.svg`")}`,
    `  matches that blue version. Because the live page ships the blue logo`,
    `  unchanged, the site presents a brand color that conflicts with the brief;`,
    `  ${F(TT.amber, "the client needs to choose")} whether to recolor the logo or update the`,
    `  brand rule before publishing.`,
  ]);

// The smoke run, from p11-smoke-run.txt (harbor block + the total).
const termSmoke = () =>
  term("uv run python ../scripts/smoke_eval.py &#183; ephemeral threads, real turns", [
    `smoke eval &#183; 3 brief(s) &#183; model gpt-5.4-mini`,
    ``,
    `${F(TT.faint, "── harbor-and-vine ───────────────────────────────────")}`,
    `  ${F(TT.green, "PASS")}  ephemeral thread (no rollout path)   None`,
    `  ${F(TT.green, "PASS")}  build turn completed                 44s`,
    `  ${F(TT.green, "PASS")}  index.html exists`,
    `  ${F(TT.green, "PASS")}  internal references resolve`,
    `  ${F(TT.green, "PASS")}  manifest validates                   'Harbor &amp; Vine' &#183; accent ${F(TT.green, "#2F5233")}`,
    `  ${F(TT.green, "PASS")}  llm judge: page matches brief        The page includes all required`,
    `        sections, uses the requested forest green and off-white palette, keeps`,
    `        a system serif stack&#8230;`,
    ``,
    `${F(TT.faint, "── beanline &#8230; ──  ── paper-crane &#8230; ──   (the same six checks each)")}`,
    ``,
    `${F(TT.green, "all green")} &#183; 183s total`,
    `${F(TT.faint, "$ echo $?")}  0   ${F(TT.faint, "# exits nonzero on any failure: cron-able, CI-able")}`,
  ]);

/* ============================================================
   write everything
   ============================================================ */
for (const theme of ["light", "dark"]) {
  writeFileSync(`${OUT}/cover-${theme}.svg`, cover(theme));
  writeFileSync(`${OUT}/fig-inspector-${theme}.svg`, figInspector(theme));
  writeFileSync(`${OUT}/fig-gate-${theme}.svg`, figGate(theme));
  writeFileSync(`${OUT}/fig-schema-truth-${theme}.svg`, figSchemaTruth(theme));
  writeFileSync(`${OUT}/browser-report-${theme}.svg`, browserReport(theme));
  writeFileSync(`${OUT}/browser-published-${theme}.svg`, browserPublished(theme));
}
writeFileSync(`${OUT}/term-finding.svg`, termFinding());
writeFileSync(`${OUT}/term-smoke.svg`, termSmoke());
console.log("part-11 SVGs written to", OUT);

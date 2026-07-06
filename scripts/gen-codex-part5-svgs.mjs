/**
 * Part 5 SVG assets for "Codex App Server in Production".
 * Everything mirrors REAL runs (2026-07-07, codex-cli 0.142.4 /
 * gpt-5.4-mini behind the part-05 backend, clean CODEX_HOME): the thread
 * ids (019f38ce…, 019f38d2…), the -32600 error strings, the auto-title
 * "Build a tiny one-page site for Paper Crane from", the accent hexes
 * (#26428B -> #1D326A on the original, #1F4D2F on the fork), the md5s
 * (337f4416… at fork time, d12bebce… after divergence), and the receipts
 * (157,210 tokens / 50s build; 46,480 tokens / 9s post-reset answer) are
 * measured values from the capture runs. Hosts shown reader-world
 * (localhost:3000 / :8000).
 *
 * Usage: node scripts/gen-codex-part5-svgs.mjs
 */
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";

const BASE = "/Users/yadneshsalvi/code/yadnesh-personal-blog/public/images/series/codex";
const P1 = `${BASE}/part-1`;
const OUT = `${BASE}/part-5`;
mkdirSync(OUT, { recursive: true });

const MONO = `font-family="'SF Mono', Menlo, Consolas, monospace"`;
const SANS = `font-family="-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---- shared palettes (ink & paper tokens, same as Parts 1-3) ----
const D = {
  light: {
    paper: "#faf9f6", line: "#e7e3d9", ink: "#1f1c19", muted: "#5b554c",
    faint: "#8f887a", accent: "#b3441a", surface: "#f1efe9",
    chip: "#ffffff", accentTint: "#f6e7df", accentLine: "#dcb09a",
    green: "#3f6212", greenTint: "#f2f7e8", red: "#b91c1c", redTint: "#fbeaea",
    amber: "#92600a", amberTint: "#fdf3e0", amberLine: "#e4c27e",
  },
  dark: {
    paper: "#151311", line: "#2b2723", ink: "#ebe7df", muted: "#a49c90",
    faint: "#756d62", accent: "#e5825a", surface: "#1d1a17",
    chip: "#211e1a", accentTint: "#2a201a", accentLine: "#5e463a",
    green: "#a3c57d", greenTint: "#1d2314", red: "#e08585", redTint: "#2a1717",
    amber: "#dcae62", amberTint: "#26200f", amberLine: "#6b5426",
  },
};
const TT = {
  bg: "#1a1816", chrome: "#211e1a", dot: "#3a3530", label: "#756d62",
  text: "#d8d2c6", faint: "#756d62", accent: "#e5825a", green: "#8fb573",
  blue: "#6fa8dc", red: "#d97676",
};

// App-window chrome + UI palettes (stone tokens, same as Part 3's captures)
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
    amberText: "#92400e", amberBg: "#fffbeb", amberLine: "#fcd34d",
  },
  dark: {
    pageBg: "#0c0a09", ink: "#e7e5e4", muted: "#d6d3d1", faint: "#78716c",
    line: "#292524", badgeBg: "#1c1917", preBg: "#292524", preText: "#d6d3d1",
    userBubble: "#f5f5f4", userText: "#1c1917",
    green: "#4ade80", accent: "#4fb8b3",
    inputBg: "#1c1917", placeholder: "#78716c", btnText: "#ffffff",
    codeBg: "#292524", panel: "#1c1917",
    amberText: "#fcd34d", amberBg: "#2a2008", amberLine: "#78591b",
  },
};

// The two sites' own colors (a rendered site looks the same in both blog
// themes, like a real iframe): Paper Crane paper + the two accents.
const SITE = { paper: "#fcfbf8", text: "#1f2430", muted: "#5f6678", blue: "#1D326A", green: "#1F4D2F" };

/* ============================================================
   1. COVER: templated from the Part 1 cover.
   ============================================================ */
function cover(theme) {
  const accent = theme === "light" ? "#b3441a" : "#e5825a";
  let svg = readFileSync(`${P1}/cover-${theme}.svg`, "utf8");
  svg = svg
    .replace(">01</text>", ">05</text>")
    .replace("PART 1 OF 13", "PART 5 OF 13")
    .replace(
      `Your first <tspan font-style="italic" fill="${accent}">thread</tspan>`,
      `Threads that <tspan font-style="italic" fill="${accent}">persist</tspan>`
    )
    .replace(
      "Speak raw JSON-RPC to the engine inside Codex. Get a website back.",
      "One thread per project: resume across restarts, fork into two drafts."
    );
  return svg;
}

/* ============================================================
   2. Shared app-window pieces for the two browser captures
   ============================================================ */
const W = 1120;
const CHROME_H = 56, HEADER_H = 46;
const SB_W = 200;               // sidebar
const CHAT_X = SB_W, CHAT_W = 440;
const PV_X = SB_W + CHAT_W;     // preview pane
const PV_W = W - PV_X;

function chrome(theme) {
  const c = CH[theme];
  return `<rect x="0" y="0" width="${W}" height="${CHROME_H}" fill="${c.chromeBg}"/>
  <line x1="0" y1="${CHROME_H}" x2="${W}" y2="${CHROME_H}" stroke="${c.chromeLine}" stroke-width="1.5"/>
  <circle cx="30" cy="28" r="7" fill="${c.dots}"/><circle cx="56" cy="28" r="7" fill="${c.dots}"/><circle cx="82" cy="28" r="7" fill="${c.dots}"/>
  <rect x="320" y="13" width="480" height="30" rx="15" fill="${c.urlFill}" stroke="${c.urlStroke}"/>
  <text x="560" y="33" ${MONO} font-size="14" fill="${c.urlText}" text-anchor="middle">localhost:3000</text>`;
}

function appHeader(theme) {
  const t = U[theme];
  const y = CHROME_H;
  return `<line x1="0" y1="${y + HEADER_H}" x2="${W}" y2="${y + HEADER_H}" stroke="${t.line}" stroke-width="1"/>
  <circle cx="24" cy="${y + HEADER_H / 2}" r="5" fill="${t.accent}"/>
  <text x="38" y="${y + HEADER_H / 2 + 5}" ${SANS} font-size="15" font-weight="700" fill="${t.ink}">Pagewright</text>
  <text x="150" y="${y + HEADER_H / 2 + 5}" ${MONO} font-size="11" fill="${t.faint}">the site builder</text>`;
}

// The projects sidebar: rows + the New project controls at the bottom.
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
  // bottom controls
  const by = h - 84;
  s += `<line x1="0" y1="${by}" x2="${SB_W}" y2="${by}" stroke="${t.line}" stroke-width="1"/>
  <rect x="12" y="${by + 10}" width="${SB_W - 24}" height="26" rx="7" fill="${t.inputBg}" stroke="${t.line}"/>
  <text x="22" y="${by + 27}" ${SANS} font-size="11" fill="${t.muted}">blank workspace</text>
  <path d="M ${SB_W - 30} ${by + 21} l 4.5 5 l 4.5 -5" fill="none" stroke="${t.faint}" stroke-width="1.4"/>
  <rect x="12" y="${by + 44}" width="${SB_W - 24}" height="28" rx="7" fill="${t.accent}"/>
  <text x="${SB_W / 2}" y="${by + 62}" ${SANS} font-size="11.5" font-weight="600" fill="#ffffff" text-anchor="middle">New project</text>`;
  return s;
}

// ---- chat-column content pieces (x-window: CHAT_X+16 .. PV_X-16) ----
const CC_X = CHAT_X + 16, CC_W = CHAT_W - 32;

function userBubble(theme, y, lines) {
  const t = U[theme];
  const widest = Math.max(...lines.map((l) => l.length));
  const bw = Math.min(Math.ceil(widest * 6.6) + 30, CC_W * 0.92);
  const bh = 14 + lines.length * 19;
  const x = CC_X + CC_W - bw;
  let body = "";
  lines.forEach((l, i) => {
    body += `\n  <text x="${x + 15}" y="${y + 22 + i * 19}" ${SANS} font-size="12.5" fill="${t.userText}">${esc(l)}</text>`;
  });
  return { svg: `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="14" fill="${t.userBubble}"/>${body}`, h: bh };
}

// Prose with optional mono chips: segments are strings or {code: "…"}.
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

function thinkingRow(theme, y) {
  const t = U[theme];
  return {
    svg: `<circle cx="${CC_X + 4}" cy="${y + 8}" r="2.5" fill="${t.faint}"/>
  <text x="${CC_X + 14}" y="${y + 12}" ${SANS} font-size="10.5" font-weight="600" letter-spacing="1.5" fill="${t.faint}">THINKING</text>
  <path d="M ${CC_X + 88} ${y + 6} l 4 4.5 l 4 -4.5" fill="none" stroke="${t.faint}" stroke-width="1.3"/>`,
    h: 18,
  };
}

function commandBadge(theme, y, label) {
  const t = U[theme];
  const bh = 34;
  return {
    svg: `<rect x="${CC_X}" y="${y}" width="${CC_W - 20}" height="${bh}" rx="8" fill="${t.badgeBg}" stroke="${t.line}"/>
  <text x="${CC_X + 14}" y="${y + 21.5}" ${SANS} font-size="12.5" fill="${t.green}">&#x2713;</text>
  <text x="${CC_X + 30}" y="${y + 21.5}" ${SANS} font-size="12.5" fill="${t.ink}">${esc(label)}</text>
  <text x="${CC_X + CC_W - 104}" y="${y + 21}" ${SANS} font-size="9.5" letter-spacing="1" fill="${t.faint}">COMMAND</text>
  <path d="M ${CC_X + CC_W - 36} ${y + 15} l 4 4.5 l 4 -4.5" fill="none" stroke="${t.faint}" stroke-width="1.3"/>`,
    h: bh,
  };
}

function amberNotice(theme, y, text) {
  const t = U[theme];
  const bw = Math.ceil(text.length * 5.9) + 28;
  const x = CHAT_X + (CHAT_W - bw) / 2;
  return {
    svg: `<rect x="${x}" y="${y}" width="${bw}" height="24" rx="12" fill="${t.amberBg}" stroke="${t.amberLine}"/>
  <text x="${x + bw / 2}" y="${y + 16}" ${SANS} font-size="11" fill="${t.amberText}" text-anchor="middle">${esc(text)}</text>`,
    h: 24,
  };
}

function receipt(theme, y, text) {
  const t = U[theme];
  return { svg: `<text x="${CC_X}" y="${y + 12}" ${MONO} font-size="11" fill="${t.faint}">${esc(text)}</text>`, h: 16 };
}

function chatFooter(theme, h, { stop = false } = {}) {
  const t = U[theme];
  const y = h - 62;
  const btnW = 62, btnX = PV_X - 16 - btnW;
  const btn = stop
    ? `<rect x="${btnX}" y="${y + 12}" width="${btnW}" height="36" rx="10" fill="none" stroke="${t.line}" stroke-width="1.5"/>
  <text x="${btnX + btnW / 2}" y="${y + 35}" ${SANS} font-size="12.5" font-weight="600" fill="#dc2626" text-anchor="middle">Stop</text>`
    : `<rect x="${btnX}" y="${y + 12}" width="${btnW}" height="36" rx="10" fill="${t.accent}" opacity="0.45"/>
  <text x="${btnX + btnW / 2}" y="${y + 35}" ${SANS} font-size="12.5" font-weight="600" fill="${t.btnText}" text-anchor="middle">Send</text>`;
  return `<line x1="${CHAT_X}" y1="${y}" x2="${PV_X}" y2="${y}" stroke="${t.line}" stroke-width="1"/>
  <rect x="${CC_X}" y="${y + 12}" width="${CC_W - btnW - 10}" height="36" rx="10" fill="${t.inputBg}" stroke="${t.line}" stroke-width="1.5"/>
  <text x="${CC_X + 13}" y="${y + 35}" ${SANS} font-size="12.5" fill="${t.placeholder}">Describe the site you want&#8230;</text>
  ${btn}`;
}

// ---- the preview pane: url row + the rendered site + the files pane ----
function previewPane(theme, h, { projectId, accent, working = false } = {}) {
  const t = U[theme];
  const top = CHROME_H + HEADER_H;
  const urlH = 34;
  const filesH = 128;
  const siteY = top + urlH, siteH = h - siteY - filesH;
  const cx = PV_X + 36; // site content left edge
  // crane mark from the real brief logo.svg (M16 56 L40 24 L52 44 L64 30 L58 58 Z)
  const crane = `<g transform="translate(${cx},${siteY + 58}) scale(0.55)" fill="none" stroke="${accent}" stroke-width="3" stroke-linejoin="round">
    <path d="M16 56 L 40 24 L 52 44 L 64 30 L 58 58 Z"/><line x1="40" y1="24" x2="46" y2="12"/></g>`;
  const btn2X = cx + 148;
  return `<line x1="${PV_X}" y1="${top}" x2="${PV_X}" y2="${h}" stroke="${t.line}" stroke-width="1"/>
  <text x="${PV_X + 16}" y="${top + 22}" ${MONO} font-size="11.5" fill="${t.faint}">/preview/${projectId}/</text>
  <rect x="${W - 118}" y="${top + 6}" width="56" height="22" rx="6" fill="none" stroke="${t.line}"/>
  <text x="${W - 90}" y="${top + 21}" ${SANS} font-size="10.5" fill="${t.muted}" text-anchor="middle">Reload</text>
  <rect x="${W - 56}" y="${top + 6}" width="40" height="22" rx="6" fill="none" stroke="${t.line}" opacity="0.55"/>
  <text x="${W - 36}" y="${top + 21}" ${SANS} font-size="10.5" fill="${t.faint}" text-anchor="middle" opacity="0.8">Diff</text>
  <line x1="${PV_X}" y1="${siteY}" x2="${W}" y2="${siteY}" stroke="${t.line}" stroke-width="1"/>
  <!-- the rendered site keeps its own colors in both themes, like a real iframe -->
  <rect x="${PV_X + 1}" y="${siteY + 1}" width="${PV_W - 1}" height="${siteH - 1}" fill="${SITE.paper}"/>
  ${crane}
  <text x="${cx + 44}" y="${siteY + 82}" ${SANS} font-size="14" letter-spacing="3" fill="${accent}">PAPER CRANE</text>
  <text x="${cx}" y="${siteY + 128}" ${SANS} font-size="11" font-weight="600" letter-spacing="2.5" fill="${accent}">STATIONERY STUDIO AND LETTERPRESS WORKSHOP</text>
  <text x="${cx}" y="${siteY + 178}" ${SANS} font-size="44" font-weight="800" letter-spacing="-1" fill="${SITE.text}">Paper Crane</text>
  <text x="${cx}" y="${siteY + 208}" ${SANS} font-size="15" fill="${SITE.muted}">Paper, pressed properly.</text>
  <rect x="${cx}" y="${siteY + 228}" width="132" height="34" rx="17" fill="${accent}"/>
  <text x="${cx + 66}" y="${siteY + 250}" ${SANS} font-size="13" font-weight="600" fill="#ffffff" text-anchor="middle">Visit the studio</text>
  <rect x="${btn2X}" y="${siteY + 228}" width="150" height="34" rx="17" fill="none" stroke="${accent}"/>
  <text x="${btn2X + 75}" y="${siteY + 250}" ${SANS} font-size="13" font-weight="600" fill="${accent}" text-anchor="middle">See what we make</text>
  <line x1="${cx}" y1="${siteY + siteH - 22}" x2="${W - 36}" y2="${siteY + siteH - 22}" stroke="${SITE.text}" stroke-opacity="0.12"/>
  <!-- the files pane (app UI, themed) -->
  <line x1="${PV_X}" y1="${h - filesH}" x2="${W}" y2="${h - filesH}" stroke="${t.line}" stroke-width="1"/>
  <rect x="${PV_X + 1}" y="${h - filesH + 1}" width="${PV_W - 1}" height="${filesH - 1}" fill="${t.panel}" opacity="0.35"/>
  <text x="${PV_X + 16}" y="${h - filesH + 24}" ${MONO} font-size="10.5" letter-spacing="1.5" fill="${t.faint}">FILES</text>
  <text x="${W - 16}" y="${h - filesH + 24}" ${MONO} font-size="10.5" fill="${t.faint}" text-anchor="end">3</text>
  <text x="${PV_X + 16}" y="${h - filesH + 46}" ${MONO} font-size="11" fill="${t.faint}">brief/assets/logo.svg</text>
  <text x="${W - 16}" y="${h - filesH + 46}" ${MONO} font-size="10" fill="${t.faint}" text-anchor="end">451 B</text>
  <text x="${PV_X + 16}" y="${h - filesH + 66}" ${MONO} font-size="11" fill="${t.faint}">brief/brief.md</text>
  <text x="${W - 16}" y="${h - filesH + 66}" ${MONO} font-size="10" fill="${t.faint}" text-anchor="end">929 B</text>
  <text x="${PV_X + 16}" y="${h - filesH + 86}" ${MONO} font-size="11" fill="${t.ink}">index.html</text>
  <text x="${W - 16}" y="${h - filesH + 86}" ${MONO} font-size="10" fill="${t.faint}" text-anchor="end">9.7 kB</text>`;
}

/* ============================================================
   3. browser-fork: the fork selected, inherited history, green site
   (mirrors the real capture p5v-fork-green-ui.png)
   ============================================================ */
function browserFork(theme) {
  const t = U[theme];
  const h = 780;
  let y = CHROME_H + HEADER_H + 22;
  const parts = [];
  const add = (p, gap = 14) => { parts.push(p.svg); y += p.h + gap; };

  add(userBubble(theme, y, ["And what was it before we darkened it?", "One short sentence."]));
  add(proseRich(theme, y, [["Before that, it was ", { code: "#26428B" }, "."]]), 18);
  add(userBubble(theme, y, ["Change the accent color to a deep forest", "green everywhere it appears. Nothing else."]));
  add(thinkingRow(theme, y), 10);
  add(commandBadge(theme, y, 'Running: "sed -n \'1,120p\' index.html"'), 10);
  add(proseRich(theme, y, [
    ["Changed the accent to deep forest green ", { code: "#1F4D2F" }],
    ["everywhere it was hardcoded in the site and logo"],
    ["asset, with nothing else altered."],
  ]), 8);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">
  <rect width="${W}" height="${h}" fill="${t.pageBg}"/>
  ${chrome(theme)}
  ${appHeader(theme)}
  ${sidebar(theme, h, [
    { name: "Paper Crane", sub: "Build a tiny one-page site for Paper C…", time: "2m ago" },
    { name: "Paper Crane (fork)", sub: "Build a tiny one-page site for Paper C…", time: "just now", active: true, forkChip: true },
  ])}
  ${parts.join("\n  ")}
  ${chatFooter(theme, h)}
  ${previewPane(theme, h, { projectId: "10c9bab1", accent: SITE.green })}
</svg>`;
}

/* ============================================================
   4. browser-reset: the amber notice + the agent re-deriving the
   answer from the workspace (mirrors p5v-reset-answer.png)
   ============================================================ */
function browserReset(theme) {
  const t = U[theme];
  const h = 780;
  let y = CHROME_H + HEADER_H + 20;
  const parts = [];
  const add = (p, gap = 13) => { parts.push(p.svg); y += p.h + gap; };

  add(amberNotice(theme, y, "History could not be restored. Files are intact."), 16);
  add(userBubble(theme, y, ["What accent color did we settle on?", "One short sentence."]));
  add(thinkingRow(theme, y), 8);
  add(proseRich(theme, y, [
    ["I'm checking the design source in the repo for the"],
    ["agreed accent color, then I'll answer in one sentence."],
  ]), 10);
  add(commandBadge(theme, y, "Listing files"), 8);
  add(commandBadge(theme, y, 'Running: "sed -n \'1,40p\' brief/brief.md"'), 10);
  add(proseRich(theme, y, [["We settled on ink blue, ", { code: "#26428B" }, "."]]), 6);
  add(receipt(theme, y, "46,480 tokens · 9s"), 0);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">
  <rect width="${W}" height="${h}" fill="${t.pageBg}"/>
  ${chrome(theme)}
  ${appHeader(theme)}
  ${sidebar(theme, h, [
    { name: "Paper Crane", sub: "Build a tiny one-page site for Paper C…", time: "just now", active: true, forkChip: true },
    { name: "Paper Crane (fork)", sub: "Build a tiny one-page site for Paper C…", time: "8m ago" },
  ])}
  ${parts.join("\n  ")}
  ${chatFooter(theme, h)}
  ${previewPane(theme, h, { projectId: "145d5abf", accent: SITE.blue })}
</svg>`;
}

/* ============================================================
   5. fig-thread-lifecycle: what every message does first
   ============================================================ */
function figLifecycle(theme) {
  const t = D[theme];
  const w = 1240, h = 730;
  const box = (x, y, bw, bh, fill, stroke) =>
    `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  const label = (x, y, txt, size = 13, fill = t.ink, anchor = "middle", font = MONO) =>
    `<text x="${x}" y="${y}" ${font} font-size="${size}" fill="${fill}" text-anchor="${anchor}">${txt}</text>`;
  const arrow = (x1, y1, x2, y2, color = t.faint) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5"/>
     <path d="M ${x2} ${y2} l -5 -8 l 10 0 z" fill="${color}" transform="rotate(${(Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI - 90} ${x2} ${y2})"/>`;

  const cxm = 430; // main flow column center
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
  <rect width="${w}" height="${h}" fill="${t.paper}"/>
  <text x="48" y="52" ${MONO} font-size="12" letter-spacing="2.5" fill="${t.faint}">ONE THREAD PER PROJECT &#183; WHAT ensure_thread() DOES BEFORE EVERY TURN</text>
  <line x1="48" y1="66" x2="${w - 48}" y2="66" stroke="${t.line}" stroke-width="1.5"/>

  <!-- incoming message -->
  ${box(cxm - 210, 92, 420, 44, t.chip, t.line)}
  ${label(cxm, 120, `POST /projects/145d5abf/chat &#183; "make the hero warmer"`, 12.5, t.muted)}
  ${arrow(cxm, 136, cxm, 168)}

  <!-- the bookmark check -->
  ${box(cxm - 170, 168, 340, 46, t.surface, t.line)}
  ${label(cxm, 197, `registry line has a thread_id?`, 13.5, t.ink)}

  <!-- no branch (first message) -->
  ${arrow(cxm - 170, 191, 138, 191)}
  ${label(196, 181, "no: first message", 11, t.faint)}
  ${box(28, 240, 200, 64, t.chip, t.line)}
  ${label(128, 266, "thread/start", 13.5, t.accent)}
  ${label(128, 288, "{cwd, sandbox, model}", 11, t.muted)}
  ${arrow(128, 191, 128, 240)}
  ${arrow(128, 304, 128, 344)}
  ${box(28, 344, 200, 56, t.chip, t.line)}
  ${label(128, 368, "save the new id", 11.5, t.muted)}
  ${label(128, 386, "in projects.json", 11.5, t.muted)}

  <!-- yes branch: resume -->
  ${arrow(cxm, 214, cxm, 246)}
  ${label(cxm + 12, 236, "yes", 11, t.faint, "start")}
  ${box(cxm - 170, 246, 340, 64, t.accentTint, t.accentLine)}
  ${label(cxm, 273, "thread/resume", 14, t.accent)}
  ${label(cxm, 294, `{"threadId": "019f38ce-b1cc-…"}`, 11.5, t.muted)}

  <!-- resume ok -->
  ${arrow(cxm, 310, cxm, 352)}
  ${label(cxm + 12, 338, "ok: the job folder reopens at the bookmark", 11, t.green, "start")}
  ${box(cxm - 170, 352, 340, 46, t.greenTint, t.line)}
  ${label(cxm, 381, "memory intact, across backend restarts", 12.5, t.green)}

  <!-- resume failed -->
  ${arrow(cxm + 170, 278, 800, 278)}
  ${label(cxm + 182, 264, `-32600 "no rollout found …"`, 11, t.red, "start")}
  ${box(800, 246, 300, 64, t.redTint, t.line)}
  ${label(950, 273, "the bookmark dangles", 12.5, t.red)}
  ${label(950, 293, "rollout deleted, or CODEX_HOME moved", 10.5, t.muted)}
  ${arrow(950, 310, 950, 344)}
  ${box(800, 344, 300, 82, t.chip, t.line)}
  ${label(950, 369, "thread/start (fresh)", 13, t.accent)}
  ${label(950, 389, "save the new id · same cwd", 11, t.muted)}
  ${label(950, 409, `emit {"type": "thread_reset"} on the wire`, 11, t.muted)}

  <!-- all roads to turn/start -->
  ${arrow(128, 400, 128, 470)}
  ${arrow(cxm, 398, cxm, 470)}
  ${arrow(950, 426, 950, 470)}
  <line x1="128" y1="470" x2="950" y2="470" stroke="${t.faint}" stroke-width="1.5"/>
  ${arrow(555, 470, 555, 502)}
  ${box(555 - 170, 502, 340, 46, t.chip, t.line)}
  ${label(555, 531, `turn/start {"threadId", input, summary}`, 12.5, t.ink)}

  <!-- the archive, feeding resume -->
  <g>
    ${box(820, 92, 372, 118, t.surface, t.line)}
    ${label(838, 118, "THE ROLLOUT ARCHIVE", 11, t.faint, "start")}
    ${label(838, 142, "$CODEX_HOME/sessions/2026/07/07/", 11.5, t.muted, "start")}
    ${label(838, 162, "rollout-…-019f38ce-b1cc-….jsonl", 11.5, t.accent, "start")}
    ${label(838, 188, "written by the engine, survives restarts;", 10.5, t.faint, "start")}
    ${label(838, 202, "the only state our backend adds is the bookmark", 10.5, t.faint, "start")}
  </g>
  <path d="M 820 155 C 730 175, 670 215, 608 254" fill="none" stroke="${t.faint}" stroke-width="1.2" stroke-dasharray="4 4"/>

  <!-- the wire -->
  <rect x="48" y="590" width="${w - 96}" height="88" rx="10" fill="${t.surface}" stroke="${t.line}"/>
  ${label(68, 618, "ON THE WIRE, WHEN THE FALLBACK FIRES (one new event type, nothing else changes):", 10.5, t.faint, "start")}
  ${label(68, 646, `data: {"type": "thread_reset", "message": "chat history could not be`, 12, t.muted, "start")}
  ${label(114, 666, `restored; the site files are intact"}`, 12, t.muted, "start")}
</svg>`;
}

/* ============================================================
   6. fig-fork: two photocopies, two owners
   ============================================================ */
function figFork(theme) {
  const t = D[theme];
  const w = 1240, h = 700;
  const label = (x, y, txt, size = 13, fill = t.ink, anchor = "middle", font = MONO) =>
    `<text x="${x}" y="${y}" ${font} font-size="${size}" fill="${fill}" text-anchor="${anchor}">${txt}</text>`;
  const swatch = (x, y, color) => `<rect x="${x}" y="${y}" width="16" height="16" rx="4" fill="${color}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
  <rect width="${w}" height="${h}" fill="${t.paper}"/>
  <text x="48" y="52" ${MONO} font-size="12" letter-spacing="2.5" fill="${t.faint}">FORK &#183; TWO PHOTOCOPIES, TWO OWNERS</text>
  <line x1="48" y1="66" x2="${w - 48}" y2="66" stroke="${t.line}" stroke-width="1.5"/>

  <!-- the original project -->
  <rect x="420" y="92" width="400" height="96" rx="12" fill="${t.chip}" stroke="${t.line}" stroke-width="1.5"/>
  ${label(620, 120, "PROJECT 145d5abf · Paper Crane", 13, t.ink)}
  ${label(620, 144, "conversation: thread 019f38ce-b1cc-…", 11.5, t.muted)}
  ${label(620, 164, "workspace: projects/145d5abf/site/", 11.5, t.muted)}

  <!-- two halves -->
  <path d="M 520 188 C 460 230, 380 260, 330 292" fill="none" stroke="${t.faint}" stroke-width="1.5"/>
  <path d="M 720 188 C 780 230, 860 260, 910 292" fill="none" stroke="${t.faint}" stroke-width="1.5"/>

  <rect x="80" y="292" width="500" height="128" rx="12" fill="${t.accentTint}" stroke="${t.accentLine}" stroke-width="1.5"/>
  ${label(100, 320, "THE ENGINE'S HALF", 11, t.accent, "start")}
  ${label(100, 346, "thread/fork {threadId, cwd: …/10c9bab1/site}", 12.5, t.ink, "start")}
  ${label(100, 370, "copies the conversation into a NEW rollout;", 11.5, t.muted, "start")}
  ${label(100, 388, "the fork answers questions it was never asked", 11.5, t.muted, "start")}
  ${label(100, 408, "thread/read shows forkedFromId · thread/list shows null", 10.5, t.faint, "start")}

  <rect x="660" y="292" width="500" height="128" rx="12" fill="${t.surface}" stroke="${t.line}" stroke-width="1.5"/>
  ${label(680, 320, "OUR HALF", 11, t.accent, "start")}
  ${label(680, 346, "shutil.copytree(site_dir(src), site_dir(new))", 12.5, t.ink, "start")}
  ${label(680, 370, "the workspace: fork copies the conversation,", 11.5, t.muted, "start")}
  ${label(680, 388, "NOT the files. The job site is ours to photocopy,", 11.5, t.muted, "start")}
  ${label(680, 408, "and cwd points the forked thread at the copy", 11.5, t.muted, "start")}

  <!-- the two drafts -->
  <path d="M 330 420 C 380 452, 430 470, 470 486" fill="none" stroke="${t.faint}" stroke-width="1.5"/>
  <path d="M 910 420 C 860 452, 810 470, 770 486" fill="none" stroke="${t.faint}" stroke-width="1.5"/>

  <rect x="180" y="486" width="400" height="120" rx="12" fill="${t.chip}" stroke="${t.line}" stroke-width="1.5"/>
  ${swatch(200, 506, "#1D326A")}
  ${label(226, 519, "DRAFT A · the original, ink blue", 12, t.ink, "start")}
  ${label(200, 546, "--ink: #1D326A", 12, t.muted, "start")}
  ${label(200, 570, "md5 337f4416…  →  337f4416…", 11.5, t.muted, "start")}
  ${label(200, 590, "(untouched by the fork's turn)", 10.5, t.faint, "start")}

  <rect x="660" y="486" width="400" height="120" rx="12" fill="${t.chip}" stroke="${t.line}" stroke-width="1.5"/>
  ${swatch(680, 506, "#1F4D2F")}
  ${label(706, 519, "DRAFT B · the fork, forest green", 12, t.ink, "start")}
  ${label(680, 546, "--ink: #1F4D2F", 12, t.muted, "start")}
  ${label(680, 570, "md5 337f4416…  →  d12bebce…", 11.5, t.muted, "start")}
  ${label(680, 590, "(one 10.5s turn later)", 10.5, t.faint, "start")}

  ${label(620, 656, "byte-identical at the moment of the fork; two work orders later, two different sites", 12, t.faint)}
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

const termMissingRollout = () =>
  term("terminal &#183; resuming a thread whose rollout is gone", [
    `${F(TT.faint, "# the project's saved thread, after its rollout file was deleted:")}`,
    `${F(TT.faint, "→")} {"id": 2, "method": ${F(TT.accent, '"thread/resume"')}, "params": {"threadId": "019f38ce-b1cc-77f2-…"}}`,
    `${F(TT.faint, "←")} {"id": 2, "error": {"code": ${F(TT.red, "-32600")},`,
    `        "message": ${F(TT.red, '"no rollout found for thread id 019f38ce-b1cc-77f2-…"')}}}`,
    ``,
    `${F(TT.faint, "# a well-formed thread id that never existed anywhere:")}`,
    `${F(TT.faint, "→")} {"id": 3, "method": ${F(TT.accent, '"thread/resume"')}, "params": {"threadId": "11111111-2222-7333-…"}}`,
    `${F(TT.faint, "←")} {"id": 3, "error": {"code": ${F(TT.red, "-32600")},`,
    `        "message": ${F(TT.red, '"no rollout found for thread id 11111111-2222-7333-…"')}}}`,
    `${F(TT.faint, "# same code, same wording. deleted and never-existed are indistinguishable.")}`,
    ``,
    `${F(TT.faint, "# thread/read on the same missing thread wears different words:")}`,
    `${F(TT.faint, "→")} {"id": 4, "method": ${F(TT.accent, '"thread/read"')}, "params": {"threadId": "019f38ce-…", "includeTurns": true}}`,
    `${F(TT.faint, "←")} {"id": 4, "error": {"code": ${F(TT.red, "-32600")}, "message": ${F(TT.red, '"thread not loaded: 019f38ce-…"')}}}`,
  ]);

const termThreadRead = () =>
  term("terminal &#183; thread/read replays the archive, no resume needed", [
    `${F(TT.faint, "→")} {"id": 2, "method": ${F(TT.accent, '"thread/read"')},`,
    `        "params": {"threadId": "019f38ce-b1cc-77f2-…", "includeTurns": ${F(TT.blue, "true")}}}`,
    `${F(TT.faint, "←")} {"id": 2, "result": {"thread": {`,
    `      "id": "019f38ce-b1cc-77f2-…",`,
    `      "name": ${F(TT.green, '"Build a tiny one-page site for Paper Crane from"')},  ${F(TT.faint, "# the auto-title")}`,
    `      "path": "…/sessions/2026/07/07/rollout-….jsonl",`,
    `      "turns": [{"id": "019f38ce-b254-…", "status": "completed", "items": [`,
    `        {"type": ${F(TT.blue, '"userMessage"')}, "content": [{"type": "text",`,
    `         "text": "Build a tiny one-page site for Paper Crane from the brief …"}]},`,
    `        {"type": ${F(TT.blue, '"reasoning"')}, …},`,
    `        {"type": ${F(TT.blue, '"agentMessage"')}, "phase": ${F(TT.accent, '"commentary"')}, "text": "I’m reading the brief …"},`,
    `        ${F(TT.faint, "… 16 items in this turn: 6 agentMessages, 5 reasoning stretches, 2 fileChanges …")}`,
    `        {"type": ${F(TT.blue, '"agentMessage"')}, "phase": ${F(TT.green, '"final_answer"')}, "text": "Built the one-page …"}`,
    `      ]}, …]}}}`,
    ``,
    `${F(TT.faint, "# this thread was NOT loaded in the engine: read serves straight from the rollout file")}`,
  ]);

/* ============================================================
   write everything
   ============================================================ */
for (const theme of ["light", "dark"]) {
  writeFileSync(`${OUT}/cover-${theme}.svg`, cover(theme));
  writeFileSync(`${OUT}/fig-thread-lifecycle-${theme}.svg`, figLifecycle(theme));
  writeFileSync(`${OUT}/fig-fork-${theme}.svg`, figFork(theme));
  writeFileSync(`${OUT}/browser-fork-${theme}.svg`, browserFork(theme));
  writeFileSync(`${OUT}/browser-reset-${theme}.svg`, browserReset(theme));
}
writeFileSync(`${OUT}/term-missing-rollout.svg`, termMissingRollout());
writeFileSync(`${OUT}/term-thread-read.svg`, termThreadRead());
console.log("part-5 SVGs written to", OUT);

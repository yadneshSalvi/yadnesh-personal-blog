/**
 * Part 4 SVG assets for "Codex App Server in Production".
 * Browser captures mirror REAL runs (2026-07-06, codex-cli 0.142.4 /
 * gpt-5.4-mini behind the part-04 backend + two-pane Next.js UI, clean
 * CODEX_HOME): every label, file size, badge, diff line, token count,
 * and duration is a measured value from the capture runs
 * (Beanline UI build, project 2de013ce: 110,990 tokens / 51s;
 * Beanline curl trace, project 26b630f1: 115,757 tokens / 44s;
 * fonts link run: 88,427 tokens / 15s;
 * fonts self-host wall run: 1,513,687 tokens / 277s, curl exit 6).
 * Hosts shown reader-world (localhost:3000 / :8000).
 *
 * Usage: node scripts/gen-codex-part4-svgs.mjs
 */
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";

const BASE = "/Users/yadneshsalvi/code/yadnesh-personal-blog/public/images/series/codex";
const P1 = `${BASE}/part-1`;
const OUT = `${BASE}/part-4`;
mkdirSync(OUT, { recursive: true });

const MONO = `font-family="'SF Mono', Menlo, Consolas, monospace"`;
const SANS = `font-family="-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"`;
const SERIF = `font-family="Georgia, 'Times New Roman', serif"`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ============================================================
   1. COVER: templated from the Part 1 cover.
   ============================================================ */
function cover(theme) {
  const accent = theme === "light" ? "#b3441a" : "#e5825a";
  let svg = readFileSync(`${P1}/cover-${theme}.svg`, "utf8");
  svg = svg
    .replace(">01</text>", ">04</text>")
    .replace("PART 1 OF 13", "PART 4 OF 13")
    .replace(
      `Your first <tspan font-style="italic" fill="${accent}">thread</tspan>`,
      `The live <tspan font-style="italic" fill="${accent}">preview</tspan>`
    )
    .replace(
      "Speak raw JSON-RPC to the engine inside Codex. Get a website back.",
      "One desk per client, a site behind glass, before/after photos on demand."
    );
  return svg;
}

/* ============================================================
   2. Shared two-pane app-window renderer (the Part 4 Pagewright UI)
   ============================================================ */
const CH = {
  light: { chromeBg: "#f3f1ec", chromeLine: "#e2ded4", dots: "#d6d1c5", urlFill: "#ffffff", urlStroke: "#e2ded4", urlText: "#5b554c" },
  dark: { chromeBg: "#211e1a", chromeLine: "#2b2723", dots: "#3a3530", urlFill: "#1a1816", urlStroke: "#3a3530", urlText: "#a49c90" },
};
const T = {
  light: {
    pageBg: "#fafaf9", ink: "#1c1917", muted: "#57534e", faint: "#a8a29e",
    line: "#e7e5e4", badgeBg: "#ffffff", preBg: "#f5f5f4", preText: "#44403c",
    userBubble: "#1c1917", userText: "#fafaf9",
    green: "#15803d", red: "#dc2626", redLine: "#fca5a5", accent: "#0f6c6c",
    inputBg: "#ffffff", placeholder: "#a8a29e", btnText: "#ffffff",
    previewWell: "#f5f5f4",
    addBg: "#dcfce7", addText: "#166534",
    diffHeadBg: "#f5f5f4", diffHeadText: "#44403c",
    diffAddBg: "#f0fdf4", diffAddText: "#166534",
    diffHunkBg: "rgba(15,108,108,0.10)",
    drawerBg: "#ffffff",
  },
  dark: {
    pageBg: "#0c0a09", ink: "#e7e5e4", muted: "#d6d3d1", faint: "#78716c",
    line: "#292524", badgeBg: "#1c1917", preBg: "#292524", preText: "#d6d3d1",
    userBubble: "#f5f5f4", userText: "#1c1917",
    green: "#4ade80", red: "#f87171", redLine: "#7f1d1d", accent: "#4fb8b3",
    inputBg: "#1c1917", placeholder: "#78716c", btnText: "#ffffff",
    previewWell: "#1c1917",
    addBg: "rgba(5,46,22,0.6)", addText: "#86efac",
    diffHeadBg: "#292524", diffHeadText: "#e7e5e4",
    diffAddBg: "rgba(5,46,22,0.4)", diffAddText: "#86efac",
    diffHunkBg: "rgba(79,184,179,0.12)",
    drawerBg: "#0c0a09",
  },
};

const W = 1280, CHROME_H = 56, HEADER_H = 52;
const CHAT_W = 560, CHAT_X = 30, CHAT_CW = 500;
const FILES_H = 208, TOOLBAR_H = 40, FOOTER_H = 64;

function chrome(theme) {
  const c = CH[theme];
  return `<rect x="0" y="0" width="${W}" height="${CHROME_H}" fill="${c.chromeBg}"/>
  <line x1="0" y1="${CHROME_H}" x2="${W}" y2="${CHROME_H}" stroke="${c.chromeLine}" stroke-width="1.5"/>
  <circle cx="30" cy="28" r="7" fill="${c.dots}"/><circle cx="56" cy="28" r="7" fill="${c.dots}"/><circle cx="82" cy="28" r="7" fill="${c.dots}"/>
  <rect x="400" y="13" width="480" height="30" rx="15" fill="${c.urlFill}" stroke="${c.urlStroke}"/>
  <text x="640" y="33" ${MONO} font-size="14" fill="${c.urlText}" text-anchor="middle">localhost:3000</text>`;
}

// The Part 4 header: brand left, the project bar right.
function appHeader(theme, { project = "Beanline", brief = "beanline brief" } = {}) {
  const t = T[theme];
  const y = CHROME_H, cy = y + HEADER_H / 2;
  const sel = (x, w, label) => `<rect x="${x}" y="${cy - 15}" width="${w}" height="30" rx="8" fill="${t.inputBg}" stroke="${t.line}" stroke-width="1.5"/>
  <text x="${x + 12}" y="${cy + 4.5}" ${SANS} font-size="12.5" fill="${t.muted}">${esc(label)}</text>
  <path d="M ${x + w - 20} ${cy - 3} l 5 6 l 5 -6" fill="none" stroke="${t.faint}" stroke-width="1.6"/>`;
  const btnW = 104, btnX = W - 24 - btnW;
  return `<line x1="0" y1="${y + HEADER_H}" x2="${W}" y2="${y + HEADER_H}" stroke="${t.line}" stroke-width="1"/>
  <circle cx="28" cy="${cy}" r="5" fill="${t.accent}"/>
  <text x="42" y="${cy + 5}" ${SANS} font-size="15" font-weight="700" fill="${t.ink}">Pagewright</text>
  <text x="150" y="${cy + 4.5}" ${MONO} font-size="12" fill="${t.faint}">the site builder</text>
  ${sel(btnX - 320, 130, project)}
  ${sel(btnX - 180, 168, brief)}
  <rect x="${btnX}" y="${cy - 15}" width="${btnW}" height="30" rx="8" fill="${t.accent}"/>
  <text x="${btnX + btnW / 2}" y="${cy + 4.5}" ${SANS} font-size="12.5" font-weight="600" fill="${t.btnText}" text-anchor="middle">New project</text>`;
}

// --- chat column pieces (x = CHAT_X, width CHAT_CW) ---
function userBubble(theme, y, lines) {
  const t = T[theme];
  const list = Array.isArray(lines) ? lines : [lines];
  const widest = Math.max(...list.map((l) => l.length));
  const bw = Math.min(Math.ceil(widest * 6.9) + 32, CHAT_CW * 0.92);
  const bh = 16 + list.length * 20;
  const x = CHAT_X + CHAT_CW - bw;
  let body = "";
  list.forEach((l, i) => {
    body += `\n  <text x="${x + 16}" y="${y + 24 + i * 20}" ${SANS} font-size="13" fill="${t.userText}">${esc(l)}</text>`;
  });
  return { svg: `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="16" fill="${t.userBubble}"/>${body}`, h: bh };
}

function prose(theme, y, lines) {
  const t = T[theme];
  const lh = 21;
  let s = "";
  lines.forEach((l, i) => {
    s += `\n  <text x="${CHAT_X}" y="${y + 15 + i * lh}" ${SANS} font-size="13.5" fill="${t.ink}">${esc(l)}</text>`;
  });
  return { svg: s, h: lines.length * lh };
}

function bullets(theme, y, items) {
  const t = T[theme];
  const lh = 22;
  let s = "";
  items.forEach((it, i) => {
    s += `\n  <circle cx="${CHAT_X + 7}" cy="${y + 10 + i * lh}" r="2.2" fill="${t.ink}"/>
  <text x="${CHAT_X + 19}" y="${y + 14.5 + i * lh}" ${SANS} font-size="13.5" fill="${t.ink}">${esc(it)}</text>`;
  });
  return { svg: s, h: items.length * lh };
}

function thinking(theme, y, { active = false } = {}) {
  const t = T[theme];
  const dot = active ? t.faint : t.line;
  return {
    svg: `<circle cx="${CHAT_X + 4}" cy="${y + 9}" r="2.8" fill="${dot}"/>
  <text x="${CHAT_X + 15}" y="${y + 13}" ${SANS} font-size="11" font-weight="600" letter-spacing="1.5" fill="${t.faint}">THINKING</text>
  <path d="M ${CHAT_X + 90} ${y + 6.5} l 4 4.5 l 4 -4.5" fill="none" stroke="${t.faint}" stroke-width="1.5"/>`,
    h: 18,
  };
}

function spinner(theme, x, cy) {
  const t = T[theme];
  return `<circle cx="${x}" cy="${cy}" r="6" fill="none" stroke="${t.line}" stroke-width="2.4"/>
  <path d="M ${x} ${cy - 6} A 6 6 0 0 1 ${x + 6} ${cy}" fill="none" stroke="${t.accent}" stroke-width="2.4" stroke-linecap="round"/>`;
}

// A command / files badge; optional exit chip and an expanded mono pane.
function badge(theme, y, { label, tag = "COMMAND", state, exit = null, expand = null }) {
  const t = T[theme];
  const bw = CHAT_CW, headH = 34;
  const isErr = state === "err";
  let icon;
  if (state === "spin") icon = spinner(theme, CHAT_X + 18, y + headH / 2);
  else icon = `<text x="${CHAT_X + 13}" y="${y + headH / 2 + 4.5}" ${SANS} font-size="13" fill="${isErr ? t.red : t.green}">${isErr ? "&#x2715;" : "&#x2713;"}</text>`;
  const exitChip = exit !== null
    ? `<text x="${CHAT_X + bw - 96}" y="${y + 21}" ${MONO} font-size="10" fill="${t.red}" text-anchor="end">exit ${exit}</text>`
    : "";
  let body = "";
  let bh = headH;
  if (expand) {
    const lh = 18;
    const paneH = expand.length * lh + 18;
    body = `<line x1="${CHAT_X}" y1="${y + headH}" x2="${CHAT_X + bw}" y2="${y + headH}" stroke="${t.line}" stroke-width="1"/>
  <rect x="${CHAT_X + 10}" y="${y + headH + 10}" width="${bw - 20}" height="${paneH}" rx="7" fill="${t.preBg}"/>`;
    expand.forEach((l, i) => {
      body += `\n  <text x="${CHAT_X + 22}" y="${y + headH + 28 + i * lh}" ${MONO} font-size="11" fill="${t.preText}" xml:space="preserve">${esc(l)}</text>`;
    });
    bh = headH + 10 + paneH + 10;
  }
  return {
    svg: `<rect x="${CHAT_X}" y="${y}" width="${bw}" height="${bh}" rx="9" fill="${t.badgeBg}" stroke="${isErr ? t.redLine : t.line}" stroke-width="1.5"/>
  ${icon}
  <text x="${CHAT_X + 32}" y="${y + 21.5}" ${SANS} font-size="12" fill="${t.muted}">${esc(label)}</text>
  ${exitChip}
  <text x="${CHAT_X + bw - 34}" y="${y + 21}" ${MONO} font-size="9.5" letter-spacing="1" fill="${t.faint}" text-anchor="end">${tag}</text>
  <path d="M ${CHAT_X + bw - 24} ${y + 14} l 4.5 5.5 l 4.5 -5.5" fill="none" stroke="${t.faint}" stroke-width="1.7"/>
  ${body}`,
    h: bh,
  };
}

function workingRow(theme, y, secs) {
  const t = T[theme];
  return {
    svg: `<circle cx="${CHAT_X + 5}" cy="${y + 9}" r="4" fill="${t.accent}"/>
  <text x="${CHAT_X + 17}" y="${y + 13.5}" ${SANS} font-size="12" fill="${t.faint}">Building&#8230; ${secs}s</text>`,
    h: 18,
  };
}

function receipt(theme, y, text) {
  const t = T[theme];
  return { svg: `<text x="${CHAT_X}" y="${y + 11}" ${MONO} font-size="11.5" fill="${t.faint}">${esc(text)}</text>`, h: 15 };
}

function chatFooter(theme, h, { working = false } = {}) {
  const t = T[theme];
  const y = h - FOOTER_H;
  const btnW = 66, btnX = CHAT_X + CHAT_CW - btnW;
  const btn = working
    ? `<rect x="${btnX}" y="${y + 14}" width="${btnW}" height="36" rx="10" fill="none" stroke="${t.line}" stroke-width="1.5"/>
  <text x="${btnX + btnW / 2}" y="${y + 37}" ${SANS} font-size="13" font-weight="600" fill="${t.muted}" text-anchor="middle">Stop</text>`
    : `<rect x="${btnX}" y="${y + 14}" width="${btnW}" height="36" rx="10" fill="${t.accent}" opacity="0.45"/>
  <text x="${btnX + btnW / 2}" y="${y + 37}" ${SANS} font-size="13" font-weight="600" fill="${t.btnText}" text-anchor="middle">Send</text>`;
  return `<line x1="0" y1="${y}" x2="${CHAT_W}" y2="${y}" stroke="${t.line}" stroke-width="1"/>
  <rect x="${CHAT_X}" y="${y + 14}" width="${CHAT_CW - btnW - 10}" height="36" rx="10" fill="${t.inputBg}" stroke="${t.line}" stroke-width="1.5"/>
  <text x="${CHAT_X + 14}" y="${y + 37}" ${SANS} font-size="13" fill="${t.placeholder}">Describe the site you want&#8230;</text>
  ${btn}`;
}

// --- the right pane ---
function previewToolbar(theme, { path, diffDot = false }) {
  const t = T[theme];
  const y = CHROME_H + HEADER_H;
  const btn = (x, w, label, dot) => `<rect x="${x}" y="${y + 8}" width="${w}" height="24" rx="7" fill="none" stroke="${t.line}" stroke-width="1.4"/>
  ${dot ? `<circle cx="${x + 14}" cy="${y + 20}" r="2.5" fill="${t.accent}"/>` : ""}
  <text x="${x + (dot ? 23 : 12)}" y="${y + 24}" ${SANS} font-size="11.5" fill="${t.muted}">${label}</text>`;
  return `<line x1="${CHAT_W}" y1="${y + TOOLBAR_H}" x2="${W}" y2="${y + TOOLBAR_H}" stroke="${t.line}" stroke-width="1"/>
  <text x="${CHAT_W + 20}" y="${y + 24.5}" ${MONO} font-size="11.5" fill="${t.faint}">${esc(path)}</text>
  ${btn(W - 148, 62, "Reload", false)}
  ${btn(W - 76, 52, "Diff", diffDot)}`;
}

// The Beanline site, drawn from the real generated index.html (project
// 2de013ce): cream page, rust accent, serif headings. The site keeps its
// own colors on both themes; an iframe does not theme with the app.
function beanlinePreview(theme, x, y, w, h) {
  const cream = "#faf6f0", rust = "#b3441a", ink = "#2b2b2b", muted = "rgba(43,43,43,0.72)";
  const cx = x + 44;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${T[theme].previewWell}"/>
  <rect x="${x + 16}" y="${y + 14}" width="${w - 32}" height="${h - 28}" rx="14" fill="${cream}"/>
  <circle cx="${cx + 12}" cy="${y + 52}" r="13" fill="none" stroke="${rust}" stroke-width="2.5"/>
  <path d="M ${cx + 12} ${y + 41} C ${cx + 6} ${y + 47}, ${cx + 18} ${y + 57}, ${cx + 12} ${y + 63}" fill="none" stroke="${rust}" stroke-width="2"/>
  <text x="${cx + 34}" y="${y + 58}" ${SERIF} font-size="19" font-weight="700" fill="${ink}">Beanline</text>
  <text x="${cx}" y="${y + 106}" ${SANS} font-size="11" letter-spacing="3" fill="${muted}">SPECIALTY COFFEE, SIX STORES, ESTABLISHED 2019</text>
  <text x="${cx}" y="${y + 152}" ${SERIF} font-size="40" fill="${ink}">Slow coffee</text>
  <text x="${cx}" y="${y + 198}" ${SERIF} font-size="40" fill="${ink}">for fast mornings</text>
  <text x="${cx}" y="${y + 234}" ${SANS} font-size="13" fill="${muted}">Beanline makes coffee, taken seriously. Warm service, careful brewing,</text>
  <text x="${cx}" y="${y + 254}" ${SANS} font-size="13" fill="${muted}">and a counter built for people who want the day to start with attention.</text>
  <rect x="${cx}" y="${y + 276}" width="132" height="38" rx="19" fill="${rust}"/>
  <text x="${cx + 66}" y="${y + 300}" ${SANS} font-size="13" font-weight="600" fill="#ffffff" text-anchor="middle">Find your store</text>`;
}

function emptyPreview(theme, x, y, w, h, note) {
  const t = T[theme];
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${t.previewWell}"/>
  <circle cx="${x + w / 2}" cy="${y + h / 2 - 26}" r="4.5" fill="${t.line}"/>
  <text x="${x + w / 2}" y="${y + h / 2 + 2}" ${SANS} font-size="13.5" font-weight="600" fill="${t.muted}" text-anchor="middle">Nothing to preview yet</text>
  <text x="${x + w / 2}" y="${y + h / 2 + 24}" ${SANS} font-size="12" fill="${t.faint}" text-anchor="middle">${esc(note)}</text>`;
}

// The files pane. rows: {name, depth, dir, size, badge, dim}
function filesPane(theme, h, rows, { clipW = W } = {}) {
  const t = T[theme];
  const y = h - FILES_H;
  const x = CHAT_W;
  let s = `<line x1="${x}" y1="${y}" x2="${W}" y2="${y}" stroke="${t.line}" stroke-width="1"/>
  <rect x="${x}" y="${y}" width="${W - x}" height="${FILES_H}" fill="${T[theme].pageBg}"/>
  <line x1="${x}" y1="${y}" x2="${W}" y2="${y}" stroke="${t.line}" stroke-width="1"/>
  <text x="${x + 20}" y="${y + 24}" ${MONO} font-size="10.5" letter-spacing="1.5" fill="${t.faint}">FILES</text>
  <text x="${Math.min(W, clipW) - 20}" y="${y + 24}" ${MONO} font-size="10.5" fill="${t.faint}" text-anchor="end">${rows.filter((r) => !r.dir).length}</text>`;
  rows.forEach((r, i) => {
    const ry = y + 46 + i * 20;
    const rx = x + 20 + r.depth * 14;
    const color = r.dir || r.dim ? t.faint : t.ink;
    s += `\n  <text x="${rx}" y="${ry}" ${MONO} font-size="11.5" fill="${color}">${esc(r.name)}</text>`;
    if (r.badge && W - 116 < clipW) {
      s += `\n  <rect x="${W - 156}" y="${ry - 11}" width="48" height="15" rx="3" fill="${t.addBg}"/>
  <text x="${W - 132}" y="${ry}" ${MONO} font-size="9.5" fill="${t.addText}" text-anchor="middle">${r.badge}</text>`;
    }
    if (r.size && W - 20 <= clipW) {
      s += `\n  <text x="${W - 20}" y="${ry}" ${MONO} font-size="9.5" fill="${t.faint}" text-anchor="end">${esc(r.size)}</text>`;
    }
  });
  return s;
}

// The diff drawer overlay: covers the right DRAWER_W px of the right
// pane, from below the app header to the bottom.
const DRAWER_W = 430;
function diffDrawer(theme, h, lines) {
  const t = T[theme];
  const x = W - DRAWER_W, y = CHROME_H + HEADER_H;
  const lh = 18.5;
  let s = `<rect x="${x}" y="${y}" width="${DRAWER_W}" height="${h - y}" fill="${t.drawerBg}"/>
  <line x1="${x}" y1="${y}" x2="${x}" y2="${h}" stroke="${t.line}" stroke-width="1.5"/>
  <text x="${x + 18}" y="${y + 24}" ${MONO} font-size="10.5" letter-spacing="1.5" fill="${t.faint}">THIS TURN'S DIFF</text>
  <text x="${x + DRAWER_W - 20}" y="${y + 25}" ${SANS} font-size="13" fill="${t.faint}" text-anchor="end">&#x2715;</text>
  <line x1="${x}" y1="${y + 38}" x2="${W}" y2="${y + 38}" stroke="${t.line}" stroke-width="1"/>`;
  lines.forEach((l, i) => {
    const ly = y + 50 + i * lh;
    if (ly > h - 14) return;
    let bg = "", color = t.muted;
    if (l.k === "file") { bg = t.diffHeadBg; color = t.diffHeadText; }
    if (l.k === "meta") color = t.faint;
    if (l.k === "hunk") { bg = t.diffHunkBg; color = t.accent; }
    if (l.k === "add") { bg = t.diffAddBg; color = t.diffAddText; }
    if (bg) s += `\n  <rect x="${x + 1}" y="${ly}" width="${DRAWER_W - 1}" height="${lh}" fill="${bg}"/>`;
    s += `\n  <text x="${x + 18}" y="${ly + 13.5}" ${MONO} font-size="11" ${l.k === "file" ? 'font-weight="700"' : ""} fill="${color}" xml:space="preserve">${esc(l.t)}</text>`;
  });
  return s;
}

// assemble a full window
function appWindow(theme, { h, chatPieces, working = false, right, header = {} }) {
  const t = T[theme];
  let cursor = CHROME_H + HEADER_H + 26;
  let chat = "";
  for (const p of chatPieces) {
    const [kind, args, gapBefore = 12] = p;
    if (chat) cursor += gapBefore;
    const fn = { userBubble, prose, bullets, thinking, badge, workingRow, receipt }[kind];
    const r = fn(theme, cursor, args);
    chat += "\n  " + r.svg;
    cursor += r.h;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" ${SANS}>
  <rect width="${W}" height="${h}" fill="${t.pageBg}"/>
  ${chrome(theme)}
  ${appHeader(theme, header)}
  ${chat}
  ${chatFooter(theme, h, { working })}
  <line x1="${CHAT_W}" y1="${CHROME_H + HEADER_H}" x2="${CHAT_W}" y2="${h}" stroke="${t.line}" stroke-width="1.5"/>
  ${right}
</svg>`;
}

/* ============================================================
   3. browser-hero: the dessert. End of the real UI Beanline build
   (project 2de013ce, 110,990 tokens / 51s), diff drawer open.
   ============================================================ */
const HERO_DIFF = [
  { k: "file", t: "diff --git a/index.html b/index.html" },
  { k: "meta", t: "new file mode 100644" },
  { k: "meta", t: "index 0000000..d059cfe" },
  { k: "meta", t: "--- /dev/null" },
  { k: "meta", t: "+++ b/index.html" },
  { k: "hunk", t: "@@ -0,0 +1,413 @@" },
  { k: "add", t: "+<!DOCTYPE html>" },
  { k: "add", t: '+<html lang="en">' },
  { k: "add", t: "+<head>" },
  { k: "add", t: '+  <meta charset="UTF-8" />' },
  { k: "add", t: '+  <meta name="viewport" content="width=device-width' },
  { k: "add", t: "+  <title>Beanline</title>" },
  { k: "add", t: "+  <style>" },
  { k: "add", t: "+    :root {" },
  { k: "add", t: "+      --rust: #b3441a;" },
  { k: "add", t: "+      --cream: #faf6f0;" },
  { k: "add", t: "+      --ink: #2b2b2b;" },
  { k: "add", t: "+      --muted: rgba(43, 43, 43, 0.72);" },
  { k: "add", t: "+      --line: rgba(179, 68, 26, 0.18);" },
  { k: "add", t: "+      --shadow: 0 22px 50px rgba(43, 43, 43, 0.08);" },
  { k: "add", t: "+    }" },
  { k: "add", t: "+" },
  { k: "add", t: "+    * {" },
  { k: "add", t: "+      box-sizing: border-box;" },
  { k: "add", t: "+    }" },
  { k: "add", t: "+" },
  { k: "add", t: "+    html {" },
  { k: "add", t: "+      scroll-behavior: smooth;" },
  { k: "add", t: "+    }" },
  { k: "add", t: "+" },
  { k: "add", t: "+    body {" },
  { k: "add", t: "+      margin: 0;" },
  { k: "add", t: "+      font-family: system-ui, -apple-system," },
  { k: "add", t: '+        BlinkMacSystemFont, "Segoe UI", sans-serif;' },
  { k: "add", t: "+      color: var(--ink);" },
  { k: "add", t: "+      background:" },
  { k: "add", t: "+        radial-gradient(circle at top left," },
  { k: "add", t: "+          rgba(179, 68, 26, 0.1), transparent 28%)," },
  { k: "add", t: "+        var(--cream);" },
  { k: "add", t: "+      line-height: 1.5;" },
  { k: "add", t: "+    }" },
  { k: "add", t: "+" },
  { k: "add", t: "+    img {" },
  { k: "add", t: "+      display: block;" },
  { k: "add", t: "+      max-width: 100%;" },
  { k: "add", t: "+    }" },
];

function browserHero(theme) {
  const h = 920;
  const pvY = CHROME_H + HEADER_H + TOOLBAR_H;
  const pvH = h - pvY - FILES_H;
  const right = `
  ${beanlinePreview(theme, CHAT_W, pvY, W - CHAT_W, pvH)}
  ${filesPane(theme, h, [
    { name: "brief/", depth: 0, dir: true },
    { name: "assets/", depth: 1, dir: true },
    { name: "copy.md", depth: 2, dim: true },
    { name: "logo.svg", depth: 2, dim: true },
    { name: "brief.md", depth: 1, dim: true },
    { name: "index.html", depth: 0 },
    { name: "logo.svg", depth: 0 },
  ], { clipW: W - DRAWER_W })}
  ${previewToolbar(theme, { path: "/preview/2de013ce/", diffDot: true })}
  ${diffDrawer(theme, h, HERO_DIFF)}`;
  return appWindow(theme, {
    h,
    right,
    chatPieces: [
      ["thinking", {}],
      ["prose", ["I've got the page structure. I'm creating index.html now with a", "self-contained layout, then I'll copy the logo SVG into the same", "directory so the hero and footer can reference it locally."], 10],
      ["badge", { label: "Creating index.html, Creating logo.svg", tag: "FILES", state: "ok" }, 14],
      ["thinking", {}, 14],
      ["badge", { label: `Running: "sed -n '1,260p' index.html"`, state: "ok" }, 12],
      ["badge", { label: "Running git status", state: "ok" }, 8],
      ["thinking", {}, 14],
      ["prose", ["Built the one-page Beanline site as a single index.html with inline", "CSS, semantic sections, and the requested warm editorial styling.", "I also copied the logo next to it as logo.svg so the hero and footer", "use a local asset."], 10],
      ["receipt", "110,990 tokens · 51s", 12],
    ],
  });
}

/* ============================================================
   4. browser-files: the same real build, drawer closed. The full
   preview, and the file tree with badges and sizes.
   ============================================================ */
function browserFiles(theme) {
  const h = 880;
  const pvY = CHROME_H + HEADER_H + TOOLBAR_H;
  const pvH = h - pvY - FILES_H;
  const right = `
  ${beanlinePreview(theme, CHAT_W, pvY, W - CHAT_W, pvH)}
  ${filesPane(theme, h, [
    { name: "brief/", depth: 0, dir: true },
    { name: "assets/", depth: 1, dir: true },
    { name: "copy.md", depth: 2, dim: true, size: "619 B" },
    { name: "logo.svg", depth: 2, dim: true, size: "417 B" },
    { name: "brief.md", depth: 1, dim: true, size: "1004 B" },
    { name: "index.html", depth: 0, badge: "added", size: "9.1 kB" },
    { name: "logo.svg", depth: 0, badge: "added", size: "417 B" },
  ])}
  ${previewToolbar(theme, { path: "/preview/2de013ce/", diffDot: true })}`;
  return appWindow(theme, {
    h,
    right,
    chatPieces: [
      ["userBubble", ["Read brief/brief.md and build the site it describes, single", "index.html, inline CSS, use brief/assets/logo.svg by copying", "it next to index.html"]],
      ["thinking", {}, 16],
      ["badge", { label: "Listing files", state: "ok" }, 10],
      ["badge", { label: `Running: "sed -n '1,220p' brief/brief.md"`, state: "ok" }, 8],
      ["badge", { label: `Running: "sed -n '1,220p' brief/assets/copy.md"`, state: "ok" }, 8],
      ["prose", ["The brief is straightforward: one static page, no external", "dependencies, with a warm editorial palette and the provided copy.", "I'm checking whether an index.html already exists, then I'll create", "the page and place a local copy of the logo alongside it."], 14],
      ["badge", { label: "Creating index.html, Creating logo.svg", tag: "FILES", state: "ok" }, 14],
      ["receipt", "110,990 tokens · 51s", 14],
    ],
  });
}

/* ============================================================
   5. browser-netwall: the break. The self-host fonts run: curl
   exit 6 behind the sandbox wall, the disk sweep, the honest
   refusal. Real run: 1,513,687 tokens / 277s.
   ============================================================ */
function browserNetwall(theme) {
  const h = 940;
  const pvY = CHROME_H + HEADER_H + TOOLBAR_H;
  const pvH = h - pvY - FILES_H;
  const right = `
  ${beanlinePreview(theme, CHAT_W, pvY, W - CHAT_W, pvH)}
  ${filesPane(theme, h, [
    { name: "brief/", depth: 0, dir: true },
    { name: "assets/", depth: 1, dir: true },
    { name: "copy.md", depth: 2, dim: true, size: "619 B" },
    { name: "logo.svg", depth: 2, dim: true, size: "417 B" },
    { name: "brief.md", depth: 1, dim: true, size: "1004 B" },
    { name: "index.html", depth: 0, size: "11.1 kB" },
    { name: "logo.svg", depth: 0, size: "417 B" },
  ])}
  ${previewToolbar(theme, { path: "/preview/26b630f1/", diffDot: false })}`;
  return appWindow(theme, {
    h,
    right,
    header: { project: "Beanline", brief: "blank workspace" },
    chatPieces: [
      ["userBubble", ["The Google Fonts link is a remote dependency. Download the", "Playfair Display woff2 files with curl into fonts/ and self-host", "them."]],
      ["thinking", {}, 16],
      ["prose", ["I have the font usage in hand. I'm fetching Google Fonts' CSS now", "so I can download the exact woff2 files that match the weights this", "page uses."], 10],
      ["badge", {
        label: "Creating folder css2?family=Playfair+Display:wght@400;5…",
        state: "err", exit: 6,
        expand: ["mkdir -p fonts && curl -L 'https://fonts.googleapis.com/", "css2?family=Playfair+Display:wght@400;500;600;700&display=swap'"],
      }, 14],
      ["prose", ["The direct curl fetch is blocked by DNS here, so I'm checking", "whether the font already exists on disk in a local cache or system", "font directory."], 14],
      ["badge", { label: "Listing files", state: "ok" }, 10],
      ["badge", { label: `Running: fc-match "Playfair Display" -f "%{file}\\n"`, state: "ok" }, 8],
      ["badge", { label: "Running: fc-list | rg -i 'Playfair'", state: "err", exit: 1 }, 8],
      ["prose", ["Blocked by the sandbox: curl to fonts.googleapis.com failed with", "DNS resolution, and I couldn't find any Playfair Display font", "binaries already cached locally to copy into fonts/. I did not", "fabricate font files. The fastest ways to finish this cleanly:"], 14],
      ["bullets", ["Enable network access for this workspace and I'll download them.", "Drop the woff2 files into fonts/ and I'll wire the @font-face rules.", "I can point the HTML at fonts/ now; the binaries come later."], 10],
      ["receipt", "1,513,687 tokens · 277s", 14],
    ],
  });
}

/* ============================================================
   6. fig-workspace-anatomy: one desk per client. The folder, the
   registry, and the two doors into it (cwd and the mount).
   ============================================================ */
function figWorkspaceAnatomy(theme) {
  const light = theme === "light";
  const D = light
    ? { paper: "#faf9f6", line: "#e7e3d9", ink: "#1f1c19", muted: "#5b554c", faint: "#8f887a", accent: "#b3441a", chip: "#ffffff", surface: "#f1efe9", accentTint: "#f6e7df", accentLine: "#dcb09a", green: "#3f6212" }
    : { paper: "#151311", line: "#2b2723", ink: "#ebe7df", muted: "#a49c90", faint: "#756d62", accent: "#e5825a", chip: "#211e1a", surface: "#1d1a17", accentTint: "#2a201a", accentLine: "#5e463a", green: "#a3c57d" };
  const w = 1240, h = 660;

  // left: the folder tree
  const treeX = 60, treeY = 96, treeW = 470, treeH = 436;
  const rows = [
    { t: "backend/projects/", c: D.ink, b: true },
    { t: "├─ projects.json", c: D.ink, note: "the registry: id, name, created_at" },
    { t: "├─ 2de013ce/", c: D.ink },
    { t: "│   └─ site/", c: D.accent, b: true, note: "the workspace: one job site" },
    { t: "│       ├─ brief/", c: D.ink },
    { t: "│       │   ├─ brief.md", c: D.muted, note: "seeded at creation" },
    { t: "│       │   └─ assets/logo.svg", c: D.muted },
    { t: "│       ├─ index.html", c: D.ink, note: "the agent's work" },
    { t: "│       └─ logo.svg", c: D.ink },
    { t: "└─ 26b630f1/ …", c: D.faint, note: "another client, another desk" },
  ];
  let tree = `<rect x="${treeX}" y="${treeY}" width="${treeW}" height="${treeH}" rx="14" fill="${D.chip}" stroke="${D.line}" stroke-width="1.5"/>
  <text x="${treeX + 22}" y="${treeY - 12}" ${MONO} font-size="11.5" letter-spacing="2" fill="${D.faint}">THE DESK</text>`;
  rows.forEach((r, i) => {
    const y = treeY + 40 + i * 38;
    tree += `\n  <text x="${treeX + 24}" y="${y}" ${MONO} font-size="13.5" ${r.b ? 'font-weight="700"' : ""} fill="${r.c}" xml:space="preserve">${esc(r.t)}</text>`;
    if (r.note) tree += `\n  <text x="${treeX + treeW - 22}" y="${y}" ${SANS} font-size="11.5" font-style="italic" fill="${D.faint}" text-anchor="end">${esc(r.note)}</text>`;
  });

  // right: the two doors
  const doorX = 640, doorW = 540;
  const door = (y, kicker, title, lines, code) => {
    let s = `<rect x="${doorX}" y="${y}" width="${doorW}" height="176" rx="14" fill="${D.surface}" stroke="${D.line}" stroke-width="1.5"/>
  <text x="${doorX + 22}" y="${y + 30}" ${MONO} font-size="11" letter-spacing="2" fill="${D.accent}">${kicker}</text>
  <text x="${doorX + 22}" y="${y + 56}" ${SANS} font-size="15.5" font-weight="700" fill="${D.ink}">${esc(title)}</text>`;
    lines.forEach((l, i) => {
      s += `\n  <text x="${doorX + 22}" y="${y + 80 + i * 20}" ${SANS} font-size="13" fill="${D.muted}">${esc(l)}</text>`;
    });
    s += `\n  <rect x="${doorX + 22}" y="${y + 124}" width="${doorW - 44}" height="34" rx="8" fill="${D.chip}" stroke="${D.line}"/>
  <text x="${doorX + 36}" y="${y + 146}" ${MONO} font-size="11" fill="${D.ink}">${esc(code)}</text>`;
    return s;
  };
  const doors =
    door(96, "DOOR 1 · THE ENGINE WRITES", "The thread's cwd points at the site folder", [
      "Every turn starts a thread whose working directory IS this",
      "project's workspace. Relative paths land on the right desk.",
    ], `thread/start {"cwd": ".../2de013ce/site", "sandbox": "workspace-write"}`) +
    door(300, "DOOR 2 · THE BROWSER READS", "The same folder, served at /preview/{id}/", [
      "A StaticFiles mount hands the folder to the iframe, html=True",
      "makes / serve index.html. No copy step, no build step.",
    ], `app.mount("/preview/2de013ce", StaticFiles(directory=site, html=True))`);

  // arrows into the site/ row (y of row index 3)
  const siteY = treeY + 40 + 3 * 38 - 5;
  const arrows = `
  <path d="M ${doorX - 8} 184 C ${doorX - 60} 184, ${treeX + treeW + 60} ${siteY}, ${treeX + treeW + 6} ${siteY}" fill="none" stroke="${D.accent}" stroke-width="2.2" marker-end="url(#arrp4a-${theme})"/>
  <path d="M ${treeX + treeW + 6} ${siteY + 14} C ${treeX + treeW + 70} ${siteY + 24}, ${doorX - 70} 388, ${doorX - 8} 388" fill="none" stroke="${D.accent}" stroke-width="2.2" marker-end="url(#arrp4a-${theme})" stroke-dasharray="7 5"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><marker id="arrp4a-${theme}" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="${D.accent}"/></marker></defs>
  <rect width="${w}" height="${h}" fill="${D.paper}"/>
  <text x="60" y="44" ${MONO} font-size="13" letter-spacing="2.5" fill="${D.faint}">ONE DESK PER CLIENT · THE PART 4 WORKSPACE</text>
  ${tree}
  ${doors}
  ${arrows}
  <rect x="60" y="${h - 92}" width="${w - 120}" height="52" rx="10" fill="${D.accentTint}" stroke="${D.accentLine}"/>
  <text x="82" y="${h - 70}" ${SANS} font-size="14" fill="${D.ink}">Same folder, two doors: the engine writes through <tspan ${MONO} font-size="12.5">cwd</tspan>, the browser reads through the mount. Switching projects</text>
  <text x="82" y="${h - 50}" ${SANS} font-size="14" fill="${D.ink}">switches everything at once, because everything hangs off one path. Part 5 adds the third door: the thread that reopens.</text>
</svg>`;
}

/* ============================================================
   7. fig-event-flow: three protocol signals become three product
   features (plus the catch-all that covers shell side effects).
   ============================================================ */
function figEventFlow(theme) {
  const light = theme === "light";
  const D = light
    ? { paper: "#faf9f6", line: "#e7e3d9", ink: "#1f1c19", muted: "#5b554c", faint: "#8f887a", accent: "#b3441a", chip: "#ffffff", surface: "#f1efe9", accentTint: "#f6e7df", accentLine: "#dcb09a", green: "#3f6212", greenTint: light ? "#eef2e3" : "#1d2314" }
    : { paper: "#151311", line: "#2b2723", ink: "#ebe7df", muted: "#a49c90", faint: "#756d62", accent: "#e5825a", chip: "#211e1a", surface: "#1d1a17", accentTint: "#2a201a", accentLine: "#5e463a", green: "#a3c57d", greenTint: "#1d2314" };
  const w = 1240, h = 780;
  const c1 = 60, c2 = 480, c3 = 880, cw1 = 380, cw2 = 360, cw3 = 300;

  const head = (x, txt) => `<text x="${x + 4}" y="86" ${MONO} font-size="11.5" letter-spacing="2" fill="${D.faint}">${txt}</text>`;

  const card = (x, y, cw, ch, title, rows, { hero = false, mono = true } = {}) => {
    let s = `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="12" fill="${D.chip}" stroke="${hero ? D.accentLine : D.line}" stroke-width="1.5"/>
  <text x="${x + 18}" y="${y + 27}" ${MONO} font-size="12.5" font-weight="700" fill="${hero ? D.accent : D.ink}">${esc(title)}</text>`;
    rows.forEach((r, i) => {
      s += `\n  <text x="${x + 18}" y="${y + 50 + i * 20}" ${mono ? MONO : SANS} font-size="${mono ? 11.5 : 12.5}" fill="${D.muted}" xml:space="preserve">${esc(r)}</text>`;
    });
    return s;
  };
  const arrow = (x1, y1, x2, y2, dashed = false) =>
    `<path d="M ${x1} ${y1} C ${x1 + 46} ${y1}, ${x2 - 46} ${y2}, ${x2} ${y2}" fill="none" stroke="${D.accent}" stroke-width="2.2" ${dashed ? 'stroke-dasharray="7 5"' : ""} marker-end="url(#arrp4b-${theme})"/>`;

  // lane rows
  let s = "";
  // lane 1: fileChange
  s += card(c1, 110, cw1, 128, "item/started + item/completed", [
    'item: {type: "fileChange",',
    '  changes: [{path: "/abs/.../site/',
    '    index.html", kind: {type: "add"}}]}',
    "paths arrive ABSOLUTE",
  ]);
  s += card(c2, 110, cw2, 128, 'file_change + preview_refresh', [
    '{"type": "file_change", "files":',
    '  [{"path": "index.html",',
    '    "kind": "add"}], "status": "done"}',
    'then {"type": "preview_refresh"}',
  ], { hero: true });
  s += card(c3, 110, cw3, 128, "The tree + the glass", [
    "file tree refetches /files;",
    "badge: added / updated / deleted",
    "iframe reloads: ?v=N+1",
    "(the cache-buster)",
  ], { mono: false });
  s += arrow(c1 + cw1, 174, c2, 174) + arrow(c2 + cw2, 174, c3, 174);

  // lane 2: diff
  s += card(c1, 292, cw1, 128, "turn/diff/updated", [
    "the turn's AGGREGATE unified diff,",
    "re-sent in full after every change;",
    "paths are git-repo-relative:",
    "a/part-04-.../site/index.html",
  ]);
  s += card(c2, 292, cw2, 128, "diff_updated", [
    '{"type": "diff_updated",',
    ' "unified_diff": "diff --git',
    '   a/index.html b/index.html\\n..."}',
    "backend strips the prefix first",
  ], { hero: true });
  s += card(c3, 292, cw3, 128, "The diff drawer", [
    "drawer re-renders the whole diff;",
    "the Diff button's dot lights up;",
    "60 lines of renderer, zero deps",
  ], { mono: false });
  s += arrow(c1 + cw1, 356, c2, 356) + arrow(c2 + cw2, 356, c3, 356);

  // lane 3: complete
  s += card(c1, 474, cw1, 128, "turn/completed", [
    'turn: {status: "completed",',
    "  durationMs: 44055}",
    "shell side effects (cp, rm, mkdir)",
    "emitted NO fileChange item",
  ]);
  s += card(c2, 474, cw2, 128, "complete", [
    '{"type": "complete",',
    ' "status": "completed",',
    ' "usage": {"totalTokens": 115757}}',
    "one event, unchanged since Part 2",
  ], { hero: true });
  s += card(c3, 474, cw3, 128, "The catch-all sweep", [
    "on complete, the UI refetches the",
    "tree AND bumps ?v= once more:",
    "whatever cp did, the desk shows it",
  ], { mono: false });
  s += arrow(c1 + cw1, 538, c2, 538) + arrow(c2 + cw2, 538, c3, 538);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><marker id="arrp4b-${theme}" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 z" fill="${D.accent}"/></marker></defs>
  <rect width="${w}" height="${h}" fill="${D.paper}"/>
  <text x="60" y="44" ${MONO} font-size="13" letter-spacing="2.5" fill="${D.faint}">THREE SIGNALS, THREE FEATURES · REAL PAYLOADS FROM THE BEANLINE RUNS</text>
  ${head(c1, "THE PROTOCOL SAYS")}
  ${head(c2, "THE ENVELOPE CARRIES")}
  ${head(c3, "THE UI DOES")}
  ${s}
  <rect x="60" y="${h - 132}" width="${w - 120}" height="76" rx="10" fill="${D.greenTint}" stroke="${D.line}"/>
  <text x="82" y="${h - 102}" ${SANS} font-size="14" fill="${D.ink}">The vocabulary grows by three (<tspan ${MONO} font-size="12.5">file_change</tspan>, <tspan ${MONO} font-size="12.5">diff_updated</tspan>, <tspan ${MONO} font-size="12.5">preview_refresh</tspan>) and changes nothing that exists.</text>
  <text x="82" y="${h - 78}" ${SANS} font-size="14" fill="${D.ink}">Part 2's curl still works against this backend, and Part 3's badges still render fileChange items. No client broke.</text>
</svg>`;
}

/* ============================================================
   8. TERMINAL (dark only): the raw stream of the Beanline curl
   run, 976 parcels compressed to the ones this part is about.
   ============================================================ */
const TT = {
  bg: "#1a1816", chrome: "#211e1a", dot: "#3a3530", label: "#756d62",
  text: "#d8d2c6", faint: "#756d62", accent: "#e5825a", green: "#8fb573",
  blue: "#6fa8dc", red: "#d97676",
};
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

const termDiffStream = () =>
  term("terminal · the three new parcels, live", [
    `${F(TT.faint, "$")} curl -N localhost:8000/projects/26b630f1/chat \\`,
    `    -d '{"message": "Read brief/brief.md and build the site it describes, &#8230;"}'`,
    ``,
    `data: {"type": ${F(TT.accent, '"session_start"')}, "session_id": "019f3899-a43b-&#8230;", "project_id": ${F(TT.green, '"26b630f1"')}}`,
    `${F(TT.faint, "# &#8230; the agent reads the brief: find, rg, and three sed readbacks &#8230;")}`,
    ``,
    `data: {"type": ${F(TT.accent, '"item_start"')}, "item_id": "call_kwKk1J&#8230;", "kind": ${F(TT.blue, '"fileChange"')}, &#8230;}`,
    `data: {"type": ${F(TT.accent, '"file_change"')}, "files": [{"path": ${F(TT.green, '"index.html"')}, "kind": ${F(TT.green, '"add"')}}],`,
    `       "status": "started"}`,
    `data: {"type": ${F(TT.accent, '"file_change"')}, "files": [&#8230;], "status": ${F(TT.green, '"done"')}}`,
    `data: {"type": ${F(TT.accent, '"preview_refresh"')}, "project_id": "26b630f1"}   ${F(TT.faint, "# the iframe reloads here")}`,
    `data: {"type": ${F(TT.accent, '"diff_updated"')}, "unified_diff": "diff --git a/index.html b/index.html\\n`,
    `       new file mode 100644\\n&#8230;"}          ${F(TT.faint, "# 12,056 chars, re-sent in full, 5x this turn")}`,
    ``,
    `${F(TT.faint, "# the logo lands by shell, not by patch: a command item, NO file_change parcel")}`,
    `data: {"type": ${F(TT.accent, '"item_start"')}, "kind": ${F(TT.blue, '"commandExecution"')},`,
    `       "detail": {"command": "/bin/zsh -lc 'cp brief/assets/logo.svg ./logo.svg &amp;&amp; ls -1'"}}`,
    ``,
    `${F(TT.faint, "# 976 parcels and 44 seconds after the prompt:")}`,
    `data: {"type": ${F(TT.green, '"complete"')}, "status": ${F(TT.green, '"completed"')}, "duration_ms": ${F(TT.accent, "44055")},`,
    `       "usage": {"totalTokens": ${F(TT.accent, "115757")}, "inputTokens": ${F(TT.accent, "110006")}, &#8230;}}`,
  ]);

/* ============================================================
   write everything
   ============================================================ */
for (const theme of ["light", "dark"]) {
  writeFileSync(`${OUT}/cover-${theme}.svg`, cover(theme));
  writeFileSync(`${OUT}/fig-workspace-anatomy-${theme}.svg`, figWorkspaceAnatomy(theme));
  writeFileSync(`${OUT}/fig-event-flow-${theme}.svg`, figEventFlow(theme));
  writeFileSync(`${OUT}/browser-hero-${theme}.svg`, browserHero(theme));
  writeFileSync(`${OUT}/browser-files-${theme}.svg`, browserFiles(theme));
  writeFileSync(`${OUT}/browser-netwall-${theme}.svg`, browserNetwall(theme));
}
writeFileSync(`${OUT}/term-diff-stream.svg`, termDiffStream());
console.log("codex part-4 svgs written to", OUT);

/**
 * Part 10 SVG assets for "Codex App Server in Production".
 * Everything mirrors REAL runs (2026-07-09, codex-cli 0.142.4 /
 * gpt-5.4-mini behind the part-10 backend, clean CODEX_HOME):
 * - the blueprint capture (p10-sse-plan.txt): plan_first=true sends the
 *   beanline brief out read-only; the plan arrives as numbered prose
 *   (zero plan_updates, zero file changes); the follow-up "Build it."
 *   runs at the project's own mode and emits exactly 2 plan_updates
 *   (3 steps: inProgress -> all completed).
 * - the e2e screenshots (p10-e2e-plan.png, 2/4 mid-build with all three
 *   tick states; p10-e2e-plan-done.png, 4/4 with the finished Beanline
 *   site and the 248,398-token Max receipt; p10-e2e-question.png, the
 *   amber card with three palettes + free text; p10-e2e-care.png, Max
 *   armed + Plan-first pill). Blueprint receipt from the e2e run:
 *   "blueprint (read-only) · 62,085 tokens this turn · 13s".
 * - the question round trip (p10-raw-question.jsonl frames 1050-1052):
 *   item/tool/requestUserInput id 0 with a questions ARRAY, our
 *   response {answers: {cafe_palette: {answers: ["Fresh Mint"]}}},
 *   then serverRequest/resolved. The app run (p10-sse-question.txt)
 *   honored "Midnight Velvet" in the built page.
 * - the effort A/B (p10-effort-ab.txt): low 38.6s / 154.0k total / 458
 *   reasoning vs xhigh 131.7s / 230.6k total / 11,432 reasoning; page
 *   9.6k vs 13.2k (+38%).
 * Hosts shown reader-world (localhost:3000). Same deliberate
 * substitution as Parts 7-9: the running app letters some labels with an
 * em-dash ("blueprint — read-only planning turn", the waiting chip);
 * house rule bans that glyph in drawn SVG text, so these captures letter
 * a middot / colon instead.
 *
 * Usage: node scripts/gen-codex-part10-svgs.mjs
 */
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";

const BASE = "/Users/yadneshsalvi/code/yadnesh-personal-blog/public/images/series/codex";
const P1 = `${BASE}/part-1`;
const OUT = `${BASE}/part-10`;
mkdirSync(OUT, { recursive: true });

const MONO = `font-family="'SF Mono', Menlo, Consolas, monospace"`;
const SANS = `font-family="-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"`;
const SERIF = `font-family="Georgia, 'Times New Roman', serif"`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---- shared palettes (ink & paper tokens, same as Parts 1-9) ----
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

// App-window chrome + UI palettes (stone tokens, same as Parts 3-9 captures)
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
  },
};

/* ============================================================
   1. COVER: templated from the Part 1 cover.
   ============================================================ */
function cover(theme) {
  const accent = theme === "light" ? "#b3441a" : "#e5825a";
  let svg = readFileSync(`${P1}/cover-${theme}.svg`, "utf8");
  svg = svg
    .replace(">01</text>", ">10</text>")
    .replace("PART 1 OF 13", "PART 10 OF 13")
    .replace(
      `font-size="92" fill="${theme === "light" ? "#1f1c19" : "#ebe7df"}" letter-spacing="-1">Your first <tspan font-style="italic" fill="${accent}">thread</tspan>`,
      `font-size="80" fill="${theme === "light" ? "#1f1c19" : "#ebe7df"}" letter-spacing="-1">Blueprint before <tspan font-style="italic" fill="${accent}">demolition</tspan>`
    )
    .replace(
      "Speak raw JSON-RPC to the engine inside Codex. Get a website back.",
      "A plan you can read, a question you can answer, a dial for care."
    );
  return svg;
}

/* ============================================================
   2. Shared app-window pieces (Parts 3-9 conventions), plus the
   Part 10 newcomers: the Plan-first pill, the care picker, the
   checklist panel, and the question card.
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
  <text x="22" y="${by + 27}" ${SANS} font-size="11" fill="${t.muted}">beanline brief</text>
  <path d="M ${SB_W - 30} ${by + 21} l 4.5 5 l 4.5 -5" fill="none" stroke="${t.faint}" stroke-width="1.4"/>
  <rect x="12" y="${by + 44}" width="${SB_W - 24}" height="28" rx="7" fill="${t.accent}"/>
  <text x="${SB_W / 2}" y="${by + 62}" ${SANS} font-size="11.5" font-weight="600" fill="#ffffff" text-anchor="middle">New project</text>`;
  return s;
}

// ---- chat-column content pieces ----
const CC_X = CHAT_X + 16, CC_W = CHAT_W - 32;

function userBubble(theme, y, lines, { blueprint = false } = {}) {
  const t = U[theme];
  const widest = Math.max(...lines.map((l) => l.length));
  const bw = Math.min(Math.ceil(widest * 6.6) + 30, CC_W * 0.94);
  const bh = 14 + lines.length * 19;
  const x = CC_X + CC_W - bw;
  let body = "";
  lines.forEach((l, i) => {
    body += `\n  <text x="${x + 15}" y="${y + 22 + i * 19}" ${SANS} font-size="12.5" fill="${t.userText}">${esc(l)}</text>`;
  });
  let chip = "";
  let h = bh;
  if (blueprint) {
    const label = "blueprint &#183; read-only planning turn";
    chip = `\n  <circle cx="${CC_X + CC_W - 218}" cy="${y + bh + 12}" r="2.5" fill="${t.skyDot}"/>
  <text x="${CC_X + CC_W - 210}" y="${y + bh + 16}" ${MONO} font-size="10.5" fill="${t.sky}">${label}</text>`;
    h = bh + 22;
  }
  return { svg: `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="14" fill="${t.userBubble}"/>${body}${chip}`, h };
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
      } else if (seg.num) {
        s += `\n  <text x="${x}" y="${yy}" ${SANS} font-size="13" font-weight="600" fill="${t.ink}">${esc(seg.num)}</text>`;
        x += Math.ceil(seg.num.length * 6.9);
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

function thinkingRow(theme, y) {
  const t = U[theme];
  return {
    svg: `<circle cx="${CC_X + 4}" cy="${y + 8}" r="3" fill="${t.faint}"/>
  <text x="${CC_X + 14}" y="${y + 12}" ${MONO} font-size="10.5" letter-spacing="1.5" fill="${t.faint}">THINKING</text>
  <path d="M ${CC_X + 86} ${y + 5} l 4 4.5 l 4 -4.5" fill="none" stroke="${t.faint}" stroke-width="1.3"/>`,
    h: 16,
  };
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
  <text x="${CC_X + 30}" y="${y + 21.5}" ${SANS} font-size="12.5" fill="${t.ink}">${esc(label)}</text>
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

function workingRow(theme, y, label) {
  const t = U[theme];
  return {
    svg: `<circle cx="${CC_X + 5}" cy="${y + 8}" r="3.5" fill="${t.accent}"/>
  <text x="${CC_X + 16}" y="${y + 12}" ${SANS} font-size="12" fill="${t.muted}">${esc(label)}</text>`,
    h: 16,
  };
}

// The Part 10 question card (mirrors p10-e2e-question.png).
function questionCard(theme, y, { header, question, options, picked, freeText = true }) {
  const t = U[theme];
  const x = CC_X, w = CC_W - 10;
  let s = "";
  let yy = y;
  // header strip
  s += `<rect x="${x}" y="${yy}" width="${w}" height="30" fill="${t.amberBg}"/>
  <circle cx="${x + 15}" cy="${yy + 15}" r="3.5" fill="${t.amberDot}"/>
  <text x="${x + 27}" y="${yy + 19}" ${MONO} font-size="9.5" letter-spacing="1.2" fill="${t.amberText}">THE BUILDER HAS A QUESTION</text>`;
  yy += 30 + 10;
  s += `<text x="${x + 14}" y="${yy + 8}" ${MONO} font-size="9.5" letter-spacing="1.2" fill="${t.faint}">${esc(header)}</text>`;
  yy += 20;
  s += `<text x="${x + 14}" y="${yy + 10}" ${SANS} font-size="12" fill="${t.ink}">${esc(question)}</text>`;
  yy += 24;
  for (const o of options) {
    const sel = o.label === picked;
    const oh = o.desc2 ? 52 : 36;
    s += `<rect x="${x + 12}" y="${yy}" width="${w - 24}" height="${oh}" rx="8" fill="${sel ? t.panel : "none"}" stroke="${sel ? t.ink : t.line}" stroke-width="${sel ? 1.5 : 1}"/>
  <circle cx="${x + 28}" cy="${yy + 18}" r="5.5" fill="none" stroke="${sel ? t.ink : t.faint}" stroke-width="1.4"/>`;
    if (sel) s += `<circle cx="${x + 28}" cy="${yy + 18}" r="3" fill="${t.ink}"/>`;
    s += `<text x="${x + 42}" y="${yy + 22}" ${SANS} font-size="11.5" font-weight="600" fill="${t.ink}">${esc(o.label)}</text>
  <text x="${x + 42 + o.label.length * 6.3 + 6}" y="${yy + 22}" ${SANS} font-size="11" fill="${t.muted}">&#183; ${esc(o.desc)}</text>`;
    if (o.desc2) s += `<text x="${x + 42}" y="${yy + 40}" ${SANS} font-size="11" fill="${t.muted}">${esc(o.desc2)}</text>`;
    yy += oh + 8;
  }
  if (freeText) {
    s += `<rect x="${x + 12}" y="${yy}" width="${w - 24}" height="30" rx="8" fill="${t.inputBg}" stroke="${t.line}"/>
  <text x="${x + 24}" y="${yy + 19}" ${SANS} font-size="11.5" fill="${t.placeholder}">Or type your own&#8230;</text>`;
    yy += 38;
  }
  s += `<line x1="${x}" y1="${yy}" x2="${x + w}" y2="${yy}" stroke="${t.line}"/>`;
  yy += 10;
  s += `<rect x="${x + 12}" y="${yy}" width="62" height="26" rx="8" fill="${t.segActive}"/>
  <text x="${x + 43}" y="${yy + 17}" ${SANS} font-size="11.5" font-weight="600" fill="${t.segActiveText}" text-anchor="middle">Answer</text>`;
  yy += 36;
  const h = yy - y;
  return {
    svg: `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${t.badgeBg}" stroke="${t.amberLine}" stroke-width="1.6"/>
  <clipPath id="qc-${theme}-${y}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/></clipPath>
  <g clip-path="url(#qc-${theme}-${y})">${s}</g>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${t.amberLine}" stroke-width="1.6"/>`,
    h,
  };
}

// The Part 10 checklist panel: pinned above the composer (2/4 with all
// three tick states, or 4/4 all done). Full chat width, like the app.
function planPanel(theme, y, steps, { progress, explanation }) {
  const t = U[theme];
  const x = CHAT_X, w = CHAT_W;
  let s = `<rect x="${x}" y="${y}" width="${w}" height="1" fill="${t.line}"/>
  <rect x="${x}" y="${y}" width="${w}" height="${0}" fill="none"/>
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

// The Part 10 footer: waiting chip (optional) + Plan-first pill + care
// picker row + composer.
function chatFooter10(theme, h, {
  running = false, planFirst = false, care = "Standard",
  waitingQuestion = false, planPanelH = 0,
} = {}) {
  const t = U[theme];
  const extras = (waitingQuestion ? 26 : 0);
  const y = h - 62 - 34 - extras;
  let s = `<line x1="${CHAT_X}" y1="${y}" x2="${PV_X}" y2="${y}" stroke="${t.line}" stroke-width="1"/>`;
  let yy = y + 10;
  if (waitingQuestion) {
    s += `<circle cx="${CC_X + 5}" cy="${yy + 7}" r="3" fill="${t.amberDot}"/>
  <text x="${CC_X + 15}" y="${yy + 11}" ${SANS} font-size="11" fill="${t.amberText}">The builder is waiting for your answer: the card above has the choices.</text>`;
    yy += 26;
  }
  // Plan-first pill
  const pillW = 78;
  if (planFirst) {
    s += `<rect x="${CC_X}" y="${yy}" width="${pillW}" height="22" rx="11" fill="${t.skyBg}" stroke="${t.skyLine}"/>
  <circle cx="${CC_X + 13}" cy="${yy + 11}" r="2.5" fill="${t.skyDot}"/>
  <text x="${CC_X + 22}" y="${yy + 15}" ${SANS} font-size="11" font-weight="500" fill="${t.sky}">Plan first</text>`;
  } else {
    s += `<rect x="${CC_X}" y="${yy}" width="${pillW}" height="22" rx="11" fill="none" stroke="${t.line}"/>
  <circle cx="${CC_X + 13}" cy="${yy + 11}" r="2.5" fill="${t.tickPendingRing}"/>
  <text x="${CC_X + 22}" y="${yy + 15}" ${SANS} font-size="11" font-weight="500" fill="${t.muted}">Plan first</text>`;
  }
  // care picker
  const levels = [
    { label: "Quick", w: 48 }, { label: "Standard", w: 64 },
    { label: "Thorough", w: 66 }, { label: "Max", w: 38 },
  ];
  const cw = levels.reduce((a, l) => a + l.w, 0) + 8;
  let cx = PV_X - 16 - cw + 4;
  s += `<rect x="${PV_X - 16 - cw}" y="${yy - 1}" width="${cw}" height="24" rx="8" fill="none" stroke="${t.line}"/>`;
  for (const l of levels) {
    const active = l.label === care;
    if (active) s += `<rect x="${cx}" y="${yy + 2}" width="${l.w}" height="18" rx="6" fill="${t.segActive}"/>`;
    s += `<text x="${cx + l.w / 2}" y="${yy + 15}" ${SANS} font-size="10.5" font-weight="600" fill="${active ? t.segActiveText : t.muted}" text-anchor="middle">${l.label}</text>`;
    cx += l.w;
  }
  // composer row
  const ry = h - 50;
  const sendW = 62, stopW = 58;
  const sendX = PV_X - 16 - sendW;
  const placeholder = running
    ? "Steer the build: it lands mid-turn&#8230;"
    : planFirst
      ? "Describe the job: the builder will propose a plan, not build&#8230;"
      : "Describe the site you want&#8230;";
  let btns = `<rect x="${sendX}" y="${ry}" width="${sendW}" height="36" rx="10" fill="${t.accent}" opacity="${running ? 0.9 : 0.45}"/>
  <text x="${sendX + sendW / 2}" y="${ry + 23}" ${SANS} font-size="12.5" font-weight="600" fill="${t.btnText}" text-anchor="middle">Send</text>`;
  let inputRight = sendX - 10;
  if (running) {
    const stopX = sendX - 10 - stopW;
    btns += `\n  <rect x="${stopX}" y="${ry}" width="${stopW}" height="36" rx="10" fill="none" stroke="${t.line}" stroke-width="1.5"/>
  <text x="${stopX + stopW / 2}" y="${ry + 23}" ${SANS} font-size="12.5" font-weight="600" fill="${t.muted}" text-anchor="middle">Stop</text>`;
    inputRight = stopX - 10;
  }
  s += `<rect x="${CC_X}" y="${ry}" width="${inputRight - CC_X}" height="36" rx="10" fill="${t.inputBg}" stroke="${t.line}" stroke-width="1.5"/>
  <text x="${CC_X + 13}" y="${ry + 23}" ${SANS} font-size="12" fill="${t.placeholder}">${placeholder}</text>
  ${btns}`;
  return { svg: s, top: y - planPanelH };
}

function previewShell(theme, h, { projectId, files, site = null, diffOn = false }) {
  const t = U[theme];
  const top = CHROME_H + HEADER_H;
  const urlH = 34;
  const filesH = files.list.length > 0 ? 60 + files.list.length * 20 : 96;
  const siteY = top + urlH, siteH = h - siteY - filesH;
  let filesRows = "";
  if (files.list.length === 0) {
    filesRows = `<text x="${PV_X + 16}" y="${h - filesH + 46}" ${SANS} font-size="11" fill="${t.faint}">The workspace is empty.</text>`;
  } else {
    files.list.forEach((f, i) => {
      const yy = h - filesH + 46 + i * 20;
      filesRows += `<text x="${PV_X + 16 + (f.indent || 0) * 14}" y="${yy}" ${MONO} font-size="11" fill="${t.muted}">${esc(f.name)}</text>`;
      if (f.badge) {
        filesRows += `<rect x="${W - 16 - 54 - f.size.length * 6}" y="${yy - 11}" width="50" height="15" rx="3" fill="${t.amberBg}" stroke="${t.amberLine}" stroke-opacity="0.6"/>
  <text x="${W - 16 - 29 - f.size.length * 6}" y="${yy}" ${MONO} font-size="9" fill="${t.amberText}" text-anchor="middle">updated</text>`;
      }
      filesRows += `<text x="${W - 16}" y="${yy}" ${MONO} font-size="10" fill="${t.faint}" text-anchor="end">${esc(f.size)}</text>`;
    });
  }
  let siteSvg;
  if (site === "beanline") {
    // The finished Beanline page (mirrors p10-e2e-plan-done.png): cream
    // hero, logo mark, kicker, big serif headline, prose, rust CTA.
    const sx = PV_X + 14, sw = PV_W - 28;
    const cream = "#faf6f0", rust = "#b3441a", inkc = "#2b2b2b";
    siteSvg = `<rect x="${sx}" y="${siteY + 12}" width="${sw}" height="${siteH - 24}" rx="10" fill="${cream}" stroke="${t.line}"/>
  <circle cx="${sx + 40}" cy="${siteY + 52}" r="14" fill="none" stroke="${rust}" stroke-width="2"/>
  <path d="M ${sx + 40} ${siteY + 40} c -6 8 -6 16 0 24 c 6 -8 6 -16 0 -24" fill="none" stroke="${rust}" stroke-width="1.6"/>
  <text x="${sx + 62}" y="${siteY + 58}" ${SERIF} font-size="17" fill="${inkc}">Beanline</text>
  <text x="${sx + 26}" y="${siteY + 92}" ${SANS} font-size="10" letter-spacing="2" font-weight="700" fill="${rust}">SPECIALTY COFFEE CHAIN SINCE 2019</text>
  <text x="${sx + 24}" y="${siteY + 138}" ${SERIF} font-size="38" font-weight="700" fill="${inkc}">Slow coffee</text>
  <text x="${sx + 24}" y="${siteY + 180}" ${SERIF} font-size="38" font-weight="700" fill="${inkc}">for fast</text>
  <text x="${sx + 24}" y="${siteY + 222}" ${SERIF} font-size="38" font-weight="700" fill="${inkc}">mornings</text>
  <text x="${sx + 26}" y="${siteY + 252}" ${SANS} font-size="11.5" fill="${inkc}" opacity="0.8">Beanline is coffee, taken seriously. We keep the room</text>
  <text x="${sx + 26}" y="${siteY + 270}" ${SANS} font-size="11.5" fill="${inkc}" opacity="0.8">warm, the service unhurried, and the details exact.</text>
  <rect x="${sx + 26}" y="${siteY + 288}" width="128" height="34" rx="17" fill="${rust}"/>
  <text x="${sx + 90}" y="${siteY + 310}" ${SANS} font-size="12" font-weight="600" fill="#ffffff" text-anchor="middle">Find your store</text>
  <line x1="${sx + 24}" y1="${siteY + 344}" x2="${sx + sw - 24}" y2="${siteY + 344}" stroke="${rust}" stroke-opacity="0.2"/>
  <text x="${sx + 26}" y="${siteY + 370}" ${SANS} font-size="11.5" fill="${inkc}" opacity="0.8">Four signature drinks. Six neighborhood stores. One</text>
  <text x="${sx + 26}" y="${siteY + 388}" ${SANS} font-size="11.5" fill="${inkc}" opacity="0.8">clear point of view: thoughtful coffee at day's pace.</text>`;
  } else {
    siteSvg = `<circle cx="${PV_X + PV_W / 2}" cy="${siteY + siteH / 2 - 34}" r="4" fill="${t.faint}" opacity="0.7"/>
  <text x="${PV_X + PV_W / 2}" y="${siteY + siteH / 2}" ${SANS} font-size="14" font-weight="600" fill="${t.muted}" text-anchor="middle">Nothing to preview yet</text>
  <text x="${PV_X + PV_W / 2}" y="${siteY + siteH / 2 + 22}" ${SANS} font-size="11.5" fill="${t.faint}" text-anchor="middle">Ask for a site and watch it appear here.</text>`;
  }
  return `<line x1="${PV_X}" y1="${top}" x2="${PV_X}" y2="${h}" stroke="${t.line}" stroke-width="1"/>
  <text x="${PV_X + 16}" y="${top + 22}" ${MONO} font-size="11.5" fill="${t.faint}">/preview/${projectId}/</text>
  <rect x="${W - 118}" y="${top + 6}" width="56" height="22" rx="6" fill="none" stroke="${t.line}"/>
  <text x="${W - 90}" y="${top + 21}" ${SANS} font-size="10.5" fill="${t.muted}" text-anchor="middle">Reload</text>
  <rect x="${W - 56}" y="${top + 6}" width="40" height="22" rx="6" fill="none" stroke="${t.line}" opacity="${diffOn ? 1 : 0.55}"/>
  ${diffOn ? `<circle cx="${W - 47}" cy="${top + 17}" r="2.5" fill="${t.accent}"/>` : ""}
  <text x="${W - 33}" y="${top + 21}" ${SANS} font-size="10.5" fill="${diffOn ? t.muted : t.faint}" text-anchor="middle" opacity="0.9">Diff</text>
  <line x1="${PV_X}" y1="${siteY}" x2="${W}" y2="${siteY}" stroke="${t.line}" stroke-width="1"/>
  ${siteSvg}
  <line x1="${PV_X}" y1="${h - filesH}" x2="${W}" y2="${h - filesH}" stroke="${t.line}" stroke-width="1"/>
  <rect x="${PV_X + 1}" y="${h - filesH + 1}" width="${PV_W - 1}" height="${filesH - 1}" fill="${t.panel}" opacity="0.35"/>
  <text x="${PV_X + 16}" y="${h - filesH + 24}" ${MONO} font-size="10.5" letter-spacing="1.5" fill="${t.faint}">FILES</text>
  <text x="${W - 16}" y="${h - filesH + 24}" ${MONO} font-size="10.5" fill="${t.faint}" text-anchor="end">${files.count}</text>
  ${filesRows}`;
}

/* ============================================================
   3. browser-checklist: mid-build, 2/4, all three tick states
   (mirrors p10-e2e-plan.png).
   ============================================================ */
function browserChecklist(theme) {
  const t = U[theme];
  const h = 900;
  let y = CHROME_H + HEADER_H + 34 + 16;
  const parts = [];
  const add = (p, gap = 13) => { parts.push(p.svg); y += p.h + gap; };

  // The tail of the blueprint turn (numbered prose), then its receipt,
  // then "Build it." and the build turn ticking.
  add(proseRich(theme, y, [
    [{ num: "8." }, " Finish with a footer: logo, daily hours, address,"],
    ["    and the tagline, quieter than the hero."],
    [{ num: "9." }, " Verify the output against the brief: one page,"],
    ["    all sections present, brand colors and type match."],
    ["I have not written any files in this turn. If you"],
    ["want, I can implement this next."],
  ]), 8);
  add(receiptRow(theme, y, ["blueprint (read-only)", "62,085 tokens this turn", "13s"], { first: U[theme].sky }), 16);
  add(userBubble(theme, y, ["Build it."]), 14);
  add(thinkingRow(theme, y), 8);
  add(proseRich(theme, y, [
    ["I'm moving from the brief into implementation now."],
    ["First I'll inspect the workspace, then add the"],
    ["single-page ", { code: "index.html" }, " that matches the brief."],
  ]), 10);
  add(commandBadge(theme, y, 'Running: "find . -maxdepth 2 -type f | sort"'), 6);
  add(commandBadge(theme, y, "Listing files"), 6);

  const footer = chatFooter10(theme, h, { running: true, planFirst: false, care: "Standard" });
  const panel = planPanel(theme, footer.top - 148, [
    { step: "Extract content, brand rules, and hard constraints", status: "completed" },
    { step: "Define the page structure and responsive layout", status: "completed" },
    { step: "Implement the single-file HTML/CSS build in index.html", status: "inProgress" },
    { step: "Validate the final structure against the brief", status: "pending" },
  ], { progress: "2/4", explanation: "Starting the actual build now that the constraints are clear." });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">
  <rect width="${W}" height="${h}" fill="${t.pageBg}"/>
  ${chrome(theme)}
  ${appHeader(theme, { activeMode: "standard", blurb: "Write inside this workspace; the network stays off.", gauge: { turn: "36.4k", thread: "98.5k" } })}
  ${sidebar(theme, h, [
    { name: "Beanline", sub: "Read brief/brief.md and tell me how y…", time: "2m ago", active: true },
    { name: "Palette question", sub: "Before building anything, ask me whi…", time: "13m ago" },
    { name: "Effort low", sub: "Read brief/brief.md and build the site…", time: "12m ago" },
    { name: "Effort xhigh", sub: "Read brief/brief.md and build the site…", time: "10m ago" },
  ])}
  ${chatBar(theme, { name: "Beanline", mode: "standard" })}
  ${parts.join("\n  ")}
  ${panel.svg}
  ${footer.svg}
  ${previewShell(theme, h, { projectId: "8fdec614", files: { count: 3, list: [
    { name: "brief/", size: "" },
    { name: "assets/", size: "", indent: 1 },
    { name: "copy.md", size: "619 B", indent: 2 },
    { name: "logo.svg", size: "417 B", indent: 2 },
    { name: "brief.md", size: "1004 B", indent: 1 },
  ] } })}
</svg>`;
}

/* ============================================================
   4. browser-question: the amber consultation card
   (mirrors p10-e2e-question.png).
   ============================================================ */
function browserQuestion(theme) {
  const t = U[theme];
  const h = 900;
  let y = CHROME_H + HEADER_H + 34 + 20;
  const parts = [];
  const add = (p, gap = 13) => { parts.push(p.svg); y += p.h + gap; };

  add(userBubble(theme, y, [
    "Before building anything, ask me which of three",
    "color palettes I prefer for a small cafe site. Then",
    "build index.html using my answer.",
  ]), 14);
  add(thinkingRow(theme, y), 8);
  add(proseRich(theme, y, [
    ["I need your palette choice before I touch the page."],
    ["I'll use your selection to build ", { code: "index.html" }, " , then"],
    ["verify the result."],
  ]), 12);
  add(questionCard(theme, y, {
    header: "PALETTE",
    question: "Which color palette should I use for the small cafe site?",
    options: [
      { label: "Warm Espresso", desc: "Coffee-brown, cream, and muted", desc2: "caramel tones for a cozy, classic feel." },
      { label: "Fresh Citrus", desc: "Soft sage, warm white, and citrus", desc2: "accents for a brighter, airy feel." },
      { label: "Midnight Brulee", desc: "Deep charcoal, espresso, and gold", desc2: "accents for a premium evening feel." },
    ],
    picked: "Fresh Citrus",
  }), 12);
  add(workingRow(theme, y, "Building… 7s"), 0);

  const footer = chatFooter10(theme, h, { running: true, planFirst: false, care: "Standard", waitingQuestion: true });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">
  <rect width="${W}" height="${h}" fill="${t.pageBg}"/>
  ${chrome(theme)}
  ${appHeader(theme, { activeMode: "standard", blurb: "Write inside this workspace; the network stays off." })}
  ${sidebar(theme, h, [
    { name: "Beanline", sub: "Read brief/brief.md and tell me how y…", time: "8m ago" },
    { name: "Palette question", sub: "Before building anything, ask me whi…", time: "just now", active: true },
    { name: "Effort low", sub: "Read brief/brief.md and build the site…", time: "7m ago" },
    { name: "Effort xhigh", sub: "Read brief/brief.md and build the site…", time: "4m ago" },
  ])}
  ${chatBar(theme, { name: "Palette question", mode: "standard" })}
  ${parts.join("\n  ")}
  ${footer.svg}
  ${previewShell(theme, h, { projectId: "6d121548", files: { count: 0, list: [] } })}
</svg>`;
}

/* ============================================================
   5. browser-care: Max armed + Plan-first pill + the built site
   (mirrors p10-e2e-care.png / p10-e2e-plan-done.png).
   ============================================================ */
function browserCare(theme) {
  const t = U[theme];
  const h = 900;
  let y = CHROME_H + HEADER_H + 34 + 16;
  const parts = [];
  const add = (p, gap = 13) => { parts.push(p.svg); y += p.h + gap; };

  add(proseRich(theme, y, [
    ["Implementation notes:"],
    [{ num: "1." }, " Single-file HTML with inline CSS only."],
    [{ num: "2." }, " Semantic structure throughout."],
    [{ num: "3." }, " Warm editorial palette and system serif/sans"],
    ["    typography, matching the brief."],
    [{ num: "4." }, " Responsive layout for desktop and mobile."],
    [{ num: "5." }, " Alt text included on both logo images."],
    ["I verified the content and constraints by inspection."],
    ["If you want, I can next tune the visual density or"],
    ["make the hero and menu more minimal."],
  ]), 8);
  add(receiptRow(theme, y, ["248,398 tokens this turn", "57s"]), 0);

  const footer = chatFooter10(theme, h, { running: false, planFirst: true, care: "Max" });
  const panel = planPanel(theme, footer.top - 148, [
    { step: "Extract content, brand rules, and hard constraints", status: "completed" },
    { step: "Define the page structure and responsive layout", status: "completed" },
    { step: "Implement the single-file HTML/CSS build in index.html", status: "completed" },
    { step: "Validate the final structure against the brief", status: "completed" },
  ], { progress: "4/4", explanation: "The page has been implemented and checked against the brief." });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">
  <rect width="${W}" height="${h}" fill="${t.pageBg}"/>
  ${chrome(theme)}
  ${appHeader(theme, { activeMode: "standard", blurb: "Write inside this workspace; the network stays off.", gauge: { turn: "248.4k", thread: "310.5k" } })}
  ${sidebar(theme, h, [
    { name: "Beanline", sub: "Read brief/brief.md and tell me how y…", time: "1m ago", active: true },
    { name: "Palette question", sub: "Before building anything, ask me whi…", time: "14m ago" },
    { name: "Effort low", sub: "Read brief/brief.md and build the site…", time: "14m ago" },
    { name: "Effort xhigh", sub: "Read brief/brief.md and build the site…", time: "11m ago" },
  ])}
  ${chatBar(theme, { name: "Beanline", mode: "standard" })}
  ${parts.join("\n  ")}
  ${panel.svg}
  ${footer.svg}
  ${previewShell(theme, h, { projectId: "8fdec614", site: "beanline", diffOn: true, files: { count: 4, list: [
    { name: "brief/", size: "" },
    { name: "brief.md", size: "1004 B", indent: 1 },
    { name: "index.html", size: "10.5 kB", badge: true },
  ] } })}
</svg>`;
}

/* ============================================================
   6. fig-blueprint-flow: the honest two-path story.
   ============================================================ */
function figBlueprintFlow(theme) {
  const t = D[theme];
  const w = 1240, h = 980;
  const label = (x, y, txt, size = 13, fill = t.ink, anchor = "middle", font = MONO) =>
    `<text x="${x}" y="${y}" ${font} font-size="${size}" fill="${fill}" text-anchor="${anchor}">${txt}</text>`;
  const box = (x, y, bw, bh, fill, stroke, sw = 1.5) =>
    `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const arrow = (x1, y1, x2, y2, color = t.faint, dash = "") =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" ${dash ? `stroke-dasharray="${dash}"` : ""}/>
     <path d="M ${x2} ${y2} l -5 -8 l 10 0 z" fill="${color}" transform="rotate(${(Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI - 90} ${x2} ${y2})"/>`;

  const LX = 48, LW = 556, RX = 636, RW = 556;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
  <rect width="${w}" height="${h}" fill="${t.paper}"/>
  <text x="48" y="52" ${MONO} font-size="12" letter-spacing="2.5" fill="${t.faint}">BLUEPRINT, THEN BUILD &#183; TWO TURNS, TWO WRISTBANDS</text>
  <line x1="48" y1="66" x2="${w - 48}" y2="66" stroke="${t.line}" stroke-width="1.5"/>

  <!-- the honesty strip -->
  ${box(48, 84, w - 96, 84, "none", t.redLine, 1.2).replace('stroke-width="1.2"', 'stroke-width="1.2" stroke-dasharray="7 5"')}
  ${label(70, 112, "WHAT THIS IS NOT", 10.5, t.red, "start")}
  ${label(70, 136, `There is no collaborationMode on turn/start in 0.142.4; the old "plan mode" param is gone. A blueprint is not a protocol mode:`, 12, t.muted, "start", SANS)}
  ${label(70, 156, "it is an ordinary turn wearing the look-only wristband. The OS enforces what a prompt could only request.", 12, t.muted, "start", SANS)}

  <!-- lane kickers -->
  ${label(LX, 208, "TURN 1 &#183; THE BLUEPRINT", 11, t.sky, "start")}
  ${label(RX, 208, `TURN 2 &#183; "BUILD IT."`, 11, t.accent, "start")}
  <line x1="${(LX + LW + RX) / 2}" y1="224" x2="${(LX + LW + RX) / 2}" y2="${h - 210}" stroke="${t.line}" stroke-dasharray="4 6"/>

  <!-- left lane: the blueprint turn -->
  ${box(LX, 224, LW, 74, t.chip, t.line)}
  ${label(LX + 20, 252, "POST /chat", 13, t.ink, "start")}
  ${label(LX + 118, 252, `{"message": "&#8230;", "plan_first": true}`, 12, t.accent, "start")}
  ${label(LX + 20, 278, "the toggle is one-shot: it arms exactly one turn, then disarms", 11, t.muted, "start", SANS)}

  ${arrow(LX + LW / 2, 298, LX + LW / 2, 330, t.faint)}

  ${box(LX, 330, LW, 128, t.skyTint, t.skyLine, 2)}
  ${label(LX + 20, 358, "turn/start", 13, t.sky, "start")}
  ${label(LX + 20, 382, `sandboxPolicy: {"type": "readOnly"}`, 12.5, t.ink, "start")}
  ${label(LX + 20, 402, `approvalPolicy: "never"`, 12.5, t.ink, "start")}
  ${label(LX + 20, 426, "+ the nudge, appended to the message: propose a numbered", 11, t.muted, "start", SANS)}
  ${label(LX + 20, 442, "plan first; do not write any files in this turn.", 11, t.muted, "start", SANS)}

  ${arrow(LX + LW / 2, 458, LX + LW / 2, 490, t.faint)}

  ${box(LX, 490, LW, 150, t.chip, t.line)}
  ${label(LX + 20, 518, "WHAT COMES BACK (live capture)", 10.5, t.faint, "start")}
  ${label(LX + 20, 542, "read-only exploration: rg --files, sed -n brief.md &#8230;", 11.5, t.muted, "start")}
  ${label(LX + 20, 566, "then the plan, as numbered prose through text_delta:", 11.5, t.muted, "start", SANS)}
  ${label(LX + 20, 590, `"1. Build a single index.html &#8230; 8. Add the last polish"`, 11.5, t.ink, "start")}
  ${label(LX + 20, 614, "701 text deltas &#183; 0 plan_updates &#183; 0 files changed", 11.5, t.sky, "start")}

  ${arrow(LX + LW / 2, 640, LX + LW / 2, 672, t.faint)}
  ${box(LX, 672, LW, 58, t.surface, t.line)}
  ${label(LX + 20, 696, "the receipt names the posture:", 11, t.muted, "start", SANS)}
  ${label(LX + 20, 716, "blueprint (read-only) &#183; 62,085 tokens this turn &#183; 13s", 11.5, t.sky, "start")}

  <!-- right lane: the build turn -->
  ${box(RX, 224, RW, 74, t.chip, t.line)}
  ${label(RX + 20, 252, "the approval is a reply, not a button:", 12, t.muted, "start", SANS)}
  ${label(RX + 20, 278, `POST /chat {"message": "Build it."}`, 12.5, t.ink, "start")}

  ${arrow(RX + RW / 2, 298, RX + RW / 2, 330, t.faint)}

  ${box(RX, 330, RW, 128, t.accentTint, t.accentLine, 2)}
  ${label(RX + 20, 358, "turn/start", 13, t.accent, "start")}
  ${label(RX + 20, 382, "sandboxPolicy: the project's own mode (workspaceWrite)", 12, t.ink, "start")}
  ${label(RX + 20, 406, "same thread: the model remembers the plan it just wrote,", 11, t.muted, "start", SANS)}
  ${label(RX + 20, 422, "so two words are enough to cash it in.", 11, t.muted, "start", SANS)}
  ${label(RX + 20, 444, "effort / summary ride along, per turn", 11, t.faint, "start")}

  ${arrow(RX + RW / 2, 458, RX + RW / 2, 490, t.faint)}

  ${box(RX, 490, RW, 150, t.chip, t.line)}
  ${label(RX + 20, 518, "WHAT COMES BACK (same capture, 54s)", 10.5, t.faint, "start")}
  ${label(RX + 20, 542, "turn/plan/updated &#8594; the checklist, whole, twice:", 11.5, t.muted, "start")}
  ${label(RX + 36, 566, "1st: [inProgress, pending, pending]", 11.5, t.ink, "start")}
  ${label(RX + 36, 590, "2nd: [completed, completed, completed]", 11.5, t.green, "start")}
  ${label(RX + 20, 614, "+ fileChange: index.html (594 lines) &#183; preview refresh", 11.5, t.accent, "start")}

  ${arrow(RX + RW / 2, 640, RX + RW / 2, 672, t.faint)}
  ${box(RX, 672, RW, 58, t.surface, t.line)}
  ${label(RX + 20, 696, "the estimate taped to the window, ticking itself:", 11, t.muted, "start", SANS)}
  ${label(RX + 20, 716, "THE BUILDER'S PLAN &#183; pending &#8594; inProgress &#8594; completed", 11.5, t.accent, "start")}

  <!-- the two-axes footer -->
  ${box(48, 764, w - 96, 92, t.greenTint, t.line, 1.2)}
  ${label(70, 792, "TWO AXES, NOT ONE", 10.5, t.green, "start")}
  ${label(70, 816, "Collaboration posture (plan first, then build) is a PRODUCT decision expressed in prompts and turn order. Containment (readOnly,", 11.5, t.muted, "start", SANS)}
  ${label(70, 836, "workspaceWrite) is an OS decision expressed in sandbox policy. The blueprint borrows the second to guarantee the first.", 11.5, t.muted, "start", SANS)}

  <rect x="48" y="${h - 100}" width="${w - 96}" height="56" rx="10" fill="${t.surface}" stroke="${t.line}"/>
  ${label(68, h - 76, "The plan tool never fires on its own: config include_plan_tool switches it on, developerInstructions asks for it,", 11.5, t.muted, "start")}
  ${label(68, h - 56, "and even then the checklist belongs to the BUILD turn. The blueprint arrives as prose. Both verified live.", 11.5, t.accent, "start")}
</svg>`;
}

/* ============================================================
   7. fig-question-roundtrip: requestUserInput end to end.
   ============================================================ */
function figQuestionRoundtrip(theme) {
  const t = D[theme];
  const w = 1240, h = 950;
  const label = (x, y, txt, size = 13, fill = t.ink, anchor = "middle", font = MONO) =>
    `<text x="${x}" y="${y}" ${font} font-size="${size}" fill="${fill}" text-anchor="${anchor}">${txt}</text>`;
  const box = (x, y, bw, bh, fill, stroke, sw = 1.5) =>
    `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const arrow = (x1, y1, x2, y2, color = t.faint, dash = "") =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" ${dash ? `stroke-dasharray="${dash}"` : ""}/>
     <path d="M ${x2} ${y2} l -5 -8 l 10 0 z" fill="${color}" transform="rotate(${(Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI - 90} ${x2} ${y2})"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
  <rect width="${w}" height="${h}" fill="${t.paper}"/>
  <text x="48" y="52" ${MONO} font-size="12" letter-spacing="2.5" fill="${t.faint}">ONE QUESTION, ROUND TRIP &#183; THE SEAM'S THIRD CUSTOMER</text>
  <line x1="48" y1="66" x2="${w - 48}" y2="66" stroke="${t.line}" stroke-width="1.5"/>

  <!-- the engine asks -->
  ${box(48, 92, 560, 168, t.amberTint, t.amberLine, 2)}
  ${label(70, 120, "SERVER &#8594; CLIENT REQUEST (id: 0, expects a response)", 10.5, t.amber, "start")}
  ${label(70, 146, "item/tool/requestUserInput", 14, t.ink, "start")}
  ${label(70, 172, `questions: [ {id: "cafe_palette", header: "Palette",`, 11.5, t.muted, "start")}
  ${label(70, 192, `question: "Which color palette&#8230;?", isOther: true,`, 11.5, t.muted, "start")}
  ${label(70, 212, `isSecret: false, options: [{label, description} &#215;3]} ]`, 11.5, t.muted, "start")}
  ${label(70, 240, "questions is an ARRAY: one request can carry a whole form", 11, t.amber, "start", SANS)}

  ${box(680, 92, 512, 168, t.chip, t.line)}
  ${label(702, 120, "MEANWHILE, THE TURN", 10.5, t.faint, "start")}
  ${label(702, 148, "The agent's tool call is FROZEN: it cannot see the", 12, t.muted, "start", SANS)}
  ${label(702, 168, "workspace, cannot run commands, cannot proceed until", 12, t.muted, "start", SANS)}
  ${label(702, 188, "the JSON-RPC response arrives. The notification pump", 12, t.muted, "start", SANS)}
  ${label(702, 208, "keeps running (the dispatch task is separate), so the", 12, t.muted, "start", SANS)}
  ${label(702, 228, "stream stays alive while the question hangs.", 12, t.muted, "start", SANS)}

  ${arrow(328, 260, 328, 296)}
  ${label(342, 284, "questions.ask() &#183; the Part 2 seam, third customer", 10.5, t.faint, "start")}

  <!-- the bridge -->
  ${box(48, 296, 560, 128, t.accentTint, t.accentLine, 2)}
  ${label(70, 324, "THE FUTURE BRIDGE (same rhythm as approvals)", 10.5, t.accent, "start")}
  ${label(70, 350, "register PendingQuestion &#183; publish question_request", 12, t.ink, "start")}
  ${label(70, 374, "to the event log &#183; await the Future (10 min timeout)", 12, t.ink, "start")}
  ${label(70, 400, "the card rides the same SSE stream as every other event", 11, t.muted, "start", SANS)}

  ${arrow(328, 424, 328, 460)}

  <!-- the card -->
  ${box(48, 460, 560, 128, t.chip, t.line)}
  ${label(70, 488, "EVERY TAB RENDERS THE CARD (Part 9's log)", 10.5, t.faint, "start")}
  ${label(70, 514, "radio options with descriptions &#183; free text if isOther", 12, t.muted, "start", SANS)}
  ${label(70, 538, "masked input if isSecret &#183; one Answer button", 12, t.muted, "start", SANS)}
  ${label(70, 564, "POST /projects/{id}/questions/{qid}/answer", 12.5, t.ink, "start")}

  <!-- the answer path -->
  ${arrow(608, 524, 700, 524, t.accent)}
  ${label(654, 510, "resolve()", 10.5, t.accent)}

  ${box(700, 460, 492, 128, t.surface, t.line, 2)}
  ${label(722, 488, "THE JSON-RPC RESPONSE (verbatim, frame 1051)", 10.5, t.faint, "start")}
  ${label(722, 516, `{"jsonrpc": "2.0", "id": 0, "result": {"answers":`, 12, t.ink, "start")}
  ${label(722, 540, `{"cafe_palette": {"answers": ["Fresh Mint"]}}}}`, 12, t.accent, "start")}
  ${label(722, 566, "note the double wrap: {answers: {qid: {answers: [&#8230;]}}}", 11, t.muted, "start", SANS)}

  ${arrow(946, 588, 946, 624, t.faint)}
  ${label(930, 612, "serverRequest/resolved &#183; the tool call unfreezes", 10.5, t.faint, "end")}

  ${box(48, 624, 1144, 92, t.greenTint, t.line, 1.2)}
  ${label(70, 652, "THE BUILD HONORS THE ANSWER (live)", 10.5, t.green, "start")}
  ${label(70, 676, `The app run picked "Midnight Velvet" (charcoal, caramel, muted rose) and the built index.html used exactly that palette:`, 11.5, t.muted, "start", SANS)}
  ${label(70, 696, "the chosen label appears in the page source. An answered question is a requirement, not a suggestion.", 11.5, t.muted, "start", SANS)}

  <!-- the no-decline strip -->
  ${box(48, 744, 1144, 108, "none", t.amberLine, 1.4)}
  ${label(70, 772, "THERE IS NO DECLINE", 10.5, t.amber, "start")}
  ${label(70, 796, "Approvals offer accept and decline; a question offers only answers. When nobody answers in time, the honest response is an", 11.5, t.muted, "start", SANS)}
  ${label(70, 816, `EMPTY sheet: {"answers": {}}. The agent proceeds on its own judgment, which is exactly what it would have done had it never`, 11.5, t.muted, "start", SANS)}
  ${label(70, 836, "asked. A timeout answers the protocol without inventing a preference the user never expressed.", 11.5, t.muted, "start", SANS)}

  <rect x="48" y="${h - 78}" width="${w - 96}" height="1" fill="${t.line}"/>
  ${label(48, h - 50, "Feature flag honesty: the request never fires on a default thread. thread/start opts in with", 12, t.muted, "start", SANS)}
  ${label(48, h - 28, `config {"features.default_mode_request_user_input": true}, and the engine answers with a warning: under development.`, 12, t.accent, "start", SANS)}
</svg>`;
}

/* ============================================================
   8. fig-effort-dial: the A/B, drawn with the real numbers.
   ============================================================ */
function figEffortDial(theme) {
  const t = D[theme];
  const w = 1240, h = 760;
  const label = (x, y, txt, size = 13, fill = t.ink, anchor = "middle", font = MONO) =>
    `<text x="${x}" y="${y}" ${font} font-size="${size}" fill="${fill}" text-anchor="${anchor}">${txt}</text>`;
  const box = (x, y, bw, bh, fill, stroke, sw = 1.5) =>
    `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;

  // Bars: pairs (low, xhigh), each row scaled to its own max.
  const rows = [
    { name: "wall time", low: "38.6s", high: "131.7s", lowF: 38.6 / 131.7, note: "3.4&#215;" },
    { name: "total tokens", low: "154.0k", high: "230.6k", lowF: 154.0 / 230.6, note: "1.5&#215;" },
    { name: "reasoning tokens", low: "458", high: "11,432", lowF: 458 / 11432, note: "25&#215;" },
    { name: "page size", low: "9.6 kB", high: "13.2 kB", lowF: 9.6 / 13.2, note: "+38%" },
  ];
  const BX = 300, BW = 700;
  let bars = "";
  rows.forEach((r, i) => {
    const y0 = 240 + i * 96;
    bars += label(BX - 24, y0 + 14, r.name, 12.5, t.muted, "end");
    // low bar
    bars += `<rect x="${BX}" y="${y0}" width="${Math.max(BW * r.lowF, 6)}" height="20" rx="5" fill="${t.sky}" opacity="0.85"/>`;
    bars += label(BX + Math.max(BW * r.lowF, 6) + 12, y0 + 15, `${r.low}  (low)`, 11.5, t.muted, "start");
    // xhigh bar
    bars += `<rect x="${BX}" y="${y0 + 28}" width="${BW}" height="20" rx="5" fill="${t.accent}"/>`;
    bars += label(BX + BW + 12, y0 + 43, `${r.high}  (xhigh)`, 11.5, t.ink, "start");
    bars += label(BX + BW + 12, y0 + 64, r.note, 12.5, t.accent, "start");
  });

  // The care-level mapping strip.
  const levels = [
    ["Quick", "low + concise"],
    ["Standard", "medium + detailed"],
    ["Thorough", "high + detailed"],
    ["Max", "xhigh + detailed"],
  ];
  let strip = "";
  const lw = 262, gap = 24, y0 = 96;
  const x0 = (w - (lw * 4 + gap * 3)) / 2;
  levels.forEach((l, i) => {
    const x = x0 + i * (lw + gap);
    const hot = i === 3;
    strip += box(x, y0, lw, 64, hot ? t.accentTint : t.chip, hot ? t.accentLine : t.line, hot ? 2 : 1.2);
    strip += label(x + lw / 2, y0 + 27, l[0], 13.5, hot ? t.accent : t.ink);
    strip += label(x + lw / 2, y0 + 49, `effort ${l[1]}`, 11, t.muted);
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
  <rect width="${w}" height="${h}" fill="${t.paper}"/>
  <text x="48" y="52" ${MONO} font-size="12" letter-spacing="2.5" fill="${t.faint}">THE REASONING DIAL &#183; SAME BRIEF, SAME MODEL, TWO SETTINGS</text>
  <line x1="48" y1="66" x2="${w - 48}" y2="66" stroke="${t.line}" stroke-width="1.5"/>
  ${strip}
  ${label(w / 2, 190, "gpt-5.4-mini &#183; the beanline brief &#183; fresh project each run &#183; summary detailed (live A/B)", 11.5, t.faint)}
  ${bars}
  <rect x="48" y="${h - 116}" width="${w - 96}" height="68" rx="10" fill="${t.surface}" stroke="${t.line}"/>
  ${label(68, h - 88, "Both runs completed the brief: hero, four drinks, six stores, footer. xhigh bought richer sectioning and typography detail,", 11.5, t.muted, "start")}
  ${label(68, h - 66, "and the receipt shows exactly what it cost: 25&#215; the reasoning tokens and 3.4&#215; the wall time for one page.", 11.5, t.accent, "start")}
</svg>`;
}

/* ============================================================
   9. term-question (dark only, verbatim frames 1050-1052 from
   p10-raw-question.jsonl, trimmed).
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

const termQuestion = () =>
  term("stdio &#183; item/tool/requestUserInput, one round trip (raw trace)", [
    `${F(TT.faint, "# the engine's request: a JSON-RPC REQUEST (it has an id), not a notification")}`,
    `&#8592; {"method": ${F(TT.accent, '"item/tool/requestUserInput"')}, "id": ${F(TT.amber, "0")}, "params": {`,
    `     "threadId": "019f4566-506e&#8230;", "turnId": "019f4566-51d7&#8230;", "itemId": "call_D4rg&#8230;",`,
    `     "questions": ${F(TT.blue, "[")} {"id": ${F(TT.accent, '"cafe_palette"')}, "header": "Palette",`,
    `        "question": "Which color palette should I use for the small cafe site?",`,
    `        "isOther": ${F(TT.green, "true")}, "isSecret": false, "options": [`,
    `          {"label": ${F(TT.green, '"Warm Roast"')},     "description": "Coffee brown, cream, terracotta&#8230;"},`,
    `          {"label": ${F(TT.green, '"Fresh Mint"')},     "description": "Soft mint, sage, warm white&#8230;"},`,
    `          {"label": ${F(TT.green, '"Midnight Velvet"')}, "description": "Deep charcoal, burgundy, blush&#8230;"}]} ${F(TT.blue, "]")},`,
    `     "autoResolutionMs": null}}   ${F(TT.faint, "# questions is an ARRAY: one request, many questions")}`,
    ``,
    `${F(TT.faint, "# our response quotes the id and wraps each answer list under its question id")}`,
    `&#8594; {"jsonrpc": "2.0", "id": ${F(TT.amber, "0")}, "result": {"answers": {"cafe_palette": {"answers": [${F(TT.green, '"Fresh Mint"')}]}}}}`,
    `&#8592; {"method": ${F(TT.blue, '"serverRequest/resolved"')}, "params": {"threadId": "019f4566&#8230;", "requestId": 0}}`,
    ``,
    `${F(TT.faint, "# and earlier on the same thread, the flag's price of admission, verbatim:")}`,
    `&#8592; {"method": ${F(TT.red, '"warning"')}, "params": {"message": "Under-development features enabled&#8230;"}}`,
  ]);

/* ============================================================
   write everything
   ============================================================ */
for (const theme of ["light", "dark"]) {
  writeFileSync(`${OUT}/cover-${theme}.svg`, cover(theme));
  writeFileSync(`${OUT}/fig-blueprint-flow-${theme}.svg`, figBlueprintFlow(theme));
  writeFileSync(`${OUT}/fig-question-roundtrip-${theme}.svg`, figQuestionRoundtrip(theme));
  writeFileSync(`${OUT}/fig-effort-dial-${theme}.svg`, figEffortDial(theme));
  writeFileSync(`${OUT}/browser-checklist-${theme}.svg`, browserChecklist(theme));
  writeFileSync(`${OUT}/browser-question-${theme}.svg`, browserQuestion(theme));
  writeFileSync(`${OUT}/browser-care-${theme}.svg`, browserCare(theme));
}
writeFileSync(`${OUT}/term-question.svg`, termQuestion());
console.log("part-10 SVGs written to", OUT);

/**
 * Part 8 SVG assets for "Codex App Server in Production".
 * Everything mirrors REAL runs (2026-07-07, codex-cli 0.142.4 /
 * gpt-5.4-mini behind the part-08 backend, clean CODEX_HOME): the
 * interrupt trace (p8-sse-interrupt.txt: the sleep-2 loop's item_start,
 * "wrote section 6" as the last streamed write, complete status
 * "interrupted" at 14.0s, no item_done ever, and all TEN sections in the
 * file afterwards), the raw steer race (p8-raw-steer.jsonl: turn/completed
 * and the -32600 "no active turn to steer" landing in the same logged
 * instant, id 5), the meter run (p8-sse-meter3-turnfield.txt: last 26,597
 * / total 242,573 then last 26,691 / total 269,264, receipt usage 53,288),
 * and the e2e screenshots (p8-e2e-stop.png: "stopped by you · 31,065
 * tokens this turn · 9s"; p8-e2e-steer.png: the steering chip mid-turn;
 * p8-e2e-gauge.png: gauge 52.6k · 216.0k thread with the breakdown open).
 * Hosts shown reader-world (localhost:3000). Same deliberate substitution
 * as Part 7: the running app letters two labels with an em-dash
 * ("steering — absorbed mid-turn", "Steer the build — it lands
 * mid-turn…"); house rule bans that glyph in drawn SVG text, so these
 * captures letter a middot / colon instead.
 *
 * Usage: node scripts/gen-codex-part8-svgs.mjs
 */
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";

const BASE = "/Users/yadneshsalvi/code/yadnesh-personal-blog/public/images/series/codex";
const P1 = `${BASE}/part-1`;
const OUT = `${BASE}/part-8`;
mkdirSync(OUT, { recursive: true });

const MONO = `font-family="'SF Mono', Menlo, Consolas, monospace"`;
const SANS = `font-family="-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---- shared palettes (ink & paper tokens, same as Parts 1-7) ----
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

// App-window chrome + UI palettes (stone tokens, same as Parts 3-7 captures)
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
    siteBg: "#faf6f0", siteInk: "#2d2016", siteAccent: "#9a5b2e", siteMuted: "#6d5a48",
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
    siteBg: "#faf6f0", siteInk: "#2d2016", siteAccent: "#9a5b2e", siteMuted: "#6d5a48",
  },
};

/* ============================================================
   1. COVER: templated from the Part 1 cover.
   ============================================================ */
function cover(theme) {
  const accent = theme === "light" ? "#b3441a" : "#e5825a";
  let svg = readFileSync(`${P1}/cover-${theme}.svg`, "utf8");
  svg = svg
    .replace(">01</text>", ">08</text>")
    .replace("PART 1 OF 13", "PART 8 OF 13")
    .replace(
      `font-size="92" fill="${theme === "light" ? "#1f1c19" : "#ebe7df"}" letter-spacing="-1">Your first <tspan font-style="italic" fill="${accent}">thread</tspan>`,
      `font-size="80" fill="${theme === "light" ? "#1f1c19" : "#ebe7df"}" letter-spacing="-1">Stop, <tspan font-style="italic" fill="${accent}">steer</tspan>, and the meter`
    )
    .replace(
      "Speak raw JSON-RPC to the engine inside Codex. Get a website back.",
      "Stop a turn honestly, steer it mid-swing, and meter every token."
    );
  return svg;
}

/* ============================================================
   2. Shared app-window pieces (Parts 3-7 conventions), plus the
   Part 8 newcomers: the header gauge, the Stop button, the
   steering chip, and the receipt line.
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

// The Part 8 header: gauge (this turn · this thread) to the left of the
// Part 6 mode picker. gauge: {turn, thread, highlight} or null.
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
    const stroke = gauge.highlight ? t.accent : t.line;
    const turnFill = gauge.highlight ? t.accent : t.muted;
    gaugeSvg = `<rect x="${gx}" y="${y + 9}" width="${gw}" height="28" rx="8" fill="none" stroke="${stroke}" stroke-width="1.3"/>
  <text x="${gx + 13}" y="${y + 27}" ${MONO} font-size="11" fill="${turnFill}">${esc(label)}</text>
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

// The gauge breakdown panel (mirrors p8-e2e-gauge.png: this turn / last
// request / this thread, in/cached/out/total columns).
function gaugePanel(theme, x, y, rows, contextWindow) {
  const t = U[theme];
  const w = 300, rowH = 22, headH = 30;
  const h = headH + rows.length * rowH + 34;
  const cols = [
    { label: "tokens", x: x + 14, anchor: "start" },
    { label: "in", x: x + w - 172, anchor: "end" },
    { label: "cached", x: x + w - 118, anchor: "end" },
    { label: "out", x: x + w - 72, anchor: "end" },
    { label: "total", x: x + w - 14, anchor: "end" },
  ];
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${t.badgeBg}" stroke="${t.line}" stroke-width="1.5"/>`;
  for (const c of cols) {
    s += `\n  <text x="${c.x}" y="${y + 19}" ${SANS} font-size="10" fill="${t.faint}" text-anchor="${c.anchor}">${c.label}</text>`;
  }
  rows.forEach((r, i) => {
    const yy = y + headH + 15 + i * rowH;
    const vals = [r.in, r.cached, r.out, r.total];
    s += `\n  <text x="${x + 14}" y="${yy}" ${SANS} font-size="10.5" fill="${t.faint}">${esc(r.label)}</text>`;
    vals.forEach((v, j) => {
      const bold = j === 3 ? ' font-weight="600"' : "";
      s += `\n  <text x="${cols[j + 1].x}" y="${yy}" ${MONO} font-size="10.5"${bold} fill="${j === 3 ? t.ink : t.muted}" text-anchor="end">${esc(v)}</text>`;
    });
  });
  s += `\n  <line x1="${x + 12}" y1="${y + h - 26}" x2="${x + w - 12}" y2="${y + h - 26}" stroke="${t.line}"/>
  <text x="${x + 14}" y="${y + h - 10}" ${SANS} font-size="10" fill="${t.faint}">context window: ${esc(contextWindow)} tokens</text>`;
  return s;
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
  <text x="22" y="${by + 27}" ${SANS} font-size="11" fill="${t.muted}">blank workspace</text>
  <path d="M ${SB_W - 30} ${by + 21} l 4.5 5 l 4.5 -5" fill="none" stroke="${t.faint}" stroke-width="1.4"/>
  <rect x="12" y="${by + 44}" width="${SB_W - 24}" height="28" rx="7" fill="${t.accent}"/>
  <text x="${SB_W / 2}" y="${by + 62}" ${SANS} font-size="11.5" font-weight="600" fill="#ffffff" text-anchor="middle">New project</text>`;
  return s;
}

// ---- chat-column content pieces ----
const CC_X = CHAT_X + 16, CC_W = CHAT_W - 32;

function userBubble(theme, y, lines, { steered = false } = {}) {
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
  if (steered) {
    // The app letters this chip with an em-dash; drawn SVG text uses a middot.
    const label = "steering &#183; absorbed mid-turn";
    chip = `\n  <circle cx="${CC_X + CC_W - 178}" cy="${y + bh + 13}" r="3" fill="${t.accent}"/>
  <text x="${CC_X + CC_W - 168}" y="${y + bh + 17}" ${MONO} font-size="10.5" fill="${t.accent}">${label}</text>`;
    h += 24;
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

// state: "spin" | "done" | {fail: exitCode}
function commandBadge(theme, y, label, { state = "done", kind = "COMMAND" } = {}) {
  const t = U[theme];
  const bh = 34;
  let mark, extra = "";
  if (state === "spin") {
    mark = `<circle cx="${CC_X + 19}" cy="${y + 17}" r="6" fill="none" stroke="${t.faint}" stroke-width="2" stroke-dasharray="7 5"/>`;
  } else if (typeof state === "object" && state.fail !== undefined) {
    mark = `<text x="${CC_X + 13}" y="${y + 21.5}" ${SANS} font-size="12.5" fill="${t.red}">&#x2715;</text>`;
    extra = `<text x="${CC_X + CC_W - 128}" y="${y + 21}" ${MONO} font-size="10" fill="${t.red}" text-anchor="end">exit ${state.fail}</text>`;
  } else {
    mark = `<text x="${CC_X + 14}" y="${y + 21.5}" ${SANS} font-size="12.5" fill="${t.green}">&#x2713;</text>`;
  }
  return {
    svg: `<rect x="${CC_X}" y="${y}" width="${CC_W - 20}" height="${bh}" rx="8" fill="${t.badgeBg}" stroke="${t.line}"/>
  ${mark}
  <text x="${CC_X + 30}" y="${y + 21.5}" ${SANS} font-size="12.5" fill="${t.ink}">${esc(label)}</text>
  ${extra}
  <text x="${CC_X + CC_W - 96}" y="${y + 21}" ${SANS} font-size="9.5" letter-spacing="1" fill="${t.faint}">${kind}</text>
  <path d="M ${CC_X + CC_W - 36} ${y + 15} l 4 4.5 l 4 -4.5" fill="none" stroke="${t.faint}" stroke-width="1.3"/>`,
    h: bh,
  };
}

function workingRow(theme, y, label) {
  const t = U[theme];
  return {
    svg: `<circle cx="${CC_X + 4}" cy="${y + 8}" r="3" fill="${t.accent}"/>
  <text x="${CC_X + 14}" y="${y + 12}" ${SANS} font-size="11.5" fill="${t.faint}">${esc(label)}</text>`,
    h: 16,
  };
}

// The Part 8 receipt line: "stopped by you · 31,065 tokens this turn · 9s"
function receiptRow(theme, y, parts, { stopped = false } = {}) {
  const t = U[theme];
  let s = "", x = CC_X;
  parts.forEach((p, i) => {
    const fill = i === 0 && stopped ? t.red : t.faint;
    s += `\n  <text x="${x}" y="${y + 12}" ${MONO} font-size="11" fill="${fill}">${esc(p)}</text>`;
    x += (p.length + 1) * 6.6;
    if (i < parts.length - 1) {
      s += `\n  <text x="${x}" y="${y + 12}" ${MONO} font-size="11" fill="${t.faint}">&#183;</text>`;
      x += 13;
    }
  });
  return { svg: s, h: 16 };
}

// footer states: idle (Send only) or running (Stop + Send + steer placeholder)
function chatFooter(theme, h, { running = false } = {}) {
  const t = U[theme];
  const y = h - 62;
  const sendW = 62, stopW = 58;
  const sendX = PV_X - 16 - sendW;
  // The app letters the running placeholder with an em-dash; drawn SVG
  // text uses a colon instead.
  const placeholder = running ? "Steer the build: it lands mid-turn&#8230;" : "Describe the site you want&#8230;";
  let btns = `<rect x="${sendX}" y="${y + 12}" width="${sendW}" height="36" rx="10" fill="${t.accent}" opacity="${running ? 0.9 : 0.45}"/>
  <text x="${sendX + sendW / 2}" y="${y + 35}" ${SANS} font-size="12.5" font-weight="600" fill="${t.btnText}" text-anchor="middle">Send</text>`;
  let inputRight = sendX - 10;
  if (running) {
    const stopX = sendX - 10 - stopW;
    btns += `\n  <rect x="${stopX}" y="${y + 12}" width="${stopW}" height="36" rx="10" fill="none" stroke="${t.line}" stroke-width="1.5"/>
  <text x="${stopX + stopW / 2}" y="${y + 35}" ${SANS} font-size="12.5" font-weight="600" fill="${t.muted}" text-anchor="middle">Stop</text>`;
    inputRight = stopX - 10;
  }
  return `<line x1="${CHAT_X}" y1="${y}" x2="${PV_X}" y2="${y}" stroke="${t.line}" stroke-width="1"/>
  <rect x="${CC_X}" y="${y + 12}" width="${inputRight - CC_X}" height="36" rx="10" fill="${t.inputBg}" stroke="${t.line}" stroke-width="1.5"/>
  <text x="${CC_X + 13}" y="${y + 35}" ${SANS} font-size="12.5" fill="${t.placeholder}">${placeholder}</text>
  ${btns}`;
}

// Preview column: url row + site area + files row.
function previewShell(theme, h, { projectId, diffDot = false, site = "", files }) {
  const t = U[theme];
  const top = CHROME_H + HEADER_H;
  const urlH = 34;
  const filesH = 96;
  const siteY = top + urlH, siteH = h - siteY - filesH;
  let filesRows = "";
  if (files.list.length === 0) {
    filesRows = `<text x="${PV_X + 16}" y="${h - filesH + 46}" ${SANS} font-size="11" fill="${t.faint}">The workspace is empty.</text>`;
  } else {
    files.list.forEach((f, i) => {
      const yy = h - filesH + 46 + i * 20;
      filesRows += `<text x="${PV_X + 16}" y="${yy}" ${MONO} font-size="11" fill="${t.muted}">${esc(f.name)}</text>`;
      if (f.badge) {
        const bw = f.badge.length * 6 + 12;
        filesRows += `<rect x="${W - 76 - bw}" y="${yy - 12}" width="${bw}" height="16" rx="4" fill="${t.amberBg}" stroke="${t.amberLine}" stroke-opacity="0.6"/>
  <text x="${W - 76 - bw / 2}" y="${yy}" ${MONO} font-size="9.5" fill="${t.amberText}" text-anchor="middle">${esc(f.badge)}</text>`;
      }
      filesRows += `<text x="${W - 16}" y="${yy}" ${MONO} font-size="10" fill="${t.faint}" text-anchor="end">${esc(f.size)}</text>`;
    });
  }
  const emptySite = site === ""
    ? `<circle cx="${PV_X + PV_W / 2}" cy="${siteY + siteH / 2 - 34}" r="4" fill="${t.faint}" opacity="0.7"/>
  <text x="${PV_X + PV_W / 2}" y="${siteY + siteH / 2}" ${SANS} font-size="14" font-weight="600" fill="${t.muted}" text-anchor="middle">Nothing to preview yet</text>
  <text x="${PV_X + PV_W / 2}" y="${siteY + siteH / 2 + 22}" ${SANS} font-size="11.5" fill="${t.faint}" text-anchor="middle">Ask for a site and watch it appear here.</text>`
    : site;
  return `<line x1="${PV_X}" y1="${top}" x2="${PV_X}" y2="${h}" stroke="${t.line}" stroke-width="1"/>
  <text x="${PV_X + 16}" y="${top + 22}" ${MONO} font-size="11.5" fill="${t.faint}">/preview/${projectId}/</text>
  <rect x="${W - 118}" y="${top + 6}" width="56" height="22" rx="6" fill="none" stroke="${t.line}"/>
  <text x="${W - 90}" y="${top + 21}" ${SANS} font-size="10.5" fill="${t.muted}" text-anchor="middle">Reload</text>
  <rect x="${W - 56}" y="${top + 6}" width="40" height="22" rx="6" fill="none" stroke="${t.line}" ${diffDot ? "" : 'opacity="0.55"'}/>
  ${diffDot ? `<circle cx="${W - 46}" cy="${top + 17}" r="2.5" fill="${t.accent}"/>` : ""}
  <text x="${W - (diffDot ? 32 : 36)}" y="${top + 21}" ${SANS} font-size="10.5" fill="${diffDot ? t.muted : t.faint}" text-anchor="middle" ${diffDot ? "" : 'opacity="0.8"'}>Diff</text>
  <line x1="${PV_X}" y1="${siteY}" x2="${W}" y2="${siteY}" stroke="${t.line}" stroke-width="1"/>
  ${emptySite}
  <line x1="${PV_X}" y1="${h - filesH}" x2="${W}" y2="${h - filesH}" stroke="${t.line}" stroke-width="1"/>
  <rect x="${PV_X + 1}" y="${h - filesH + 1}" width="${PV_W - 1}" height="${filesH - 1}" fill="${t.panel}" opacity="0.35"/>
  <text x="${PV_X + 16}" y="${h - filesH + 24}" ${MONO} font-size="10.5" letter-spacing="1.5" fill="${t.faint}">FILES</text>
  <text x="${W - 16}" y="${h - filesH + 24}" ${MONO} font-size="10.5" fill="${t.faint}" text-anchor="end">${files.list.length}</text>
  ${filesRows}`;
}

// The pottery site inside the preview iframe (mirrors the real e2e gauge
// run: Juniper Clay Studio, hero later steered to "Glaze & Kiln.").
function potterySite(theme, h) {
  const t = U[theme];
  const top = CHROME_H + HEADER_H + 34;
  const filesH = 96;
  const sh = h - top - filesH;
  const x = PV_X, wI = PV_W;
  return `<rect x="${x + 1}" y="${top + 1}" width="${wI - 1}" height="${sh - 1}" fill="${t.siteBg}"/>
  <text x="${x + 36}" y="${top + 54}" ${MONO} font-size="12" letter-spacing="3" fill="${t.siteAccent}">JUNIPER CLAY STUDIO</text>
  <text x="${x + 34}" y="${top + 116}" font-family="Georgia, 'Times New Roman', serif" font-size="52" fill="${t.siteInk}">Glaze &amp; Kiln.</text>
  <text x="${x + 36}" y="${top + 152}" font-family="Georgia, serif" font-size="14.5" fill="${t.siteMuted}">A tiny neighborhood pottery studio shaping bowls, cups, and</text>
  <text x="${x + 36}" y="${top + 174}" font-family="Georgia, serif" font-size="14.5" fill="${t.siteMuted}">vessels with slow attention, warm clay, and small-batch glazing.</text>
  <rect x="${x + 36}" y="${top + 206}" width="${wI - 190}" height="${sh - 240}" rx="14" fill="#f3e4d3" stroke="#e2cbb2"/>
  <path d="M ${x + wI / 2 - 130} ${top + sh - 160}
           h 180 c 0 44 -36 74 -90 74 c -54 0 -90 -30 -90 -74 z"
        fill="#c98d5f" stroke="#a96f43" stroke-width="2"/>
  <ellipse cx="${x + wI / 2 - 40}" cy="${top + sh - 160}" rx="90" ry="12" fill="#e0b58c" stroke="#a96f43" stroke-width="2"/>
  <rect x="${x + wI / 2 - 58}" y="${top + sh - 88}" width="36" height="18" fill="#c98d5f" stroke="#a96f43" stroke-width="2"/>
  <ellipse cx="${x + wI / 2 - 40}" cy="${top + sh - 66}" rx="46" ry="6" fill="#a96f43" opacity="0.35"/>`;
}

/* ============================================================
   3. browser-stop: the stopped-by-you state (mirrors p8-e2e-stop.png).
   ============================================================ */
const P8_ROWS = (active) => [
  { name: "interrupt-test", sub: "Build index.html for a design studio si…", time: "1d ago", active: active === 0 },
  { name: "steer-test", sub: "Build index.html for a bakery site with…", time: "1d ago", active: active === 1 },
  { name: "race-test", sub: "First run exactly this command: seq 1 …", time: "1d ago", active: active === 2 },
  { name: "meter-test", sub: "Write index.html containing only <h1>…", time: "1d ago", active: active === 3 },
  { name: "e2e gauge", sub: "Build index.html for a tiny pottery stu…", time: "just now", active: active === 4 },
  { name: "e2e stop", sub: "Run this exact command and then su…", time: "just now", active: active === 5 },
];

function browserStop(theme) {
  const t = U[theme];
  const h = 780;
  let y = CHROME_H + HEADER_H + 34 + 18;
  const parts = [];
  const add = (p, gap = 13) => { parts.push(p.svg); y += p.h + gap; };

  add(userBubble(theme, y, [
    "Run this exact command and then summarize its",
    'output: for i in $(seq 1 12); do echo "tick $i"',
    ">> ticks.txt; sleep 2; done . After it finishes,",
    "read ticks.txt and report the count.",
  ]));
  add(thinkingRow(theme, y), 8);
  add(proseRich(theme, y, [
    ["I'm going to run the loop exactly as written, then"],
    ["inspect ", { code: "ticks.txt" }, " and report both the command"],
    ["output behavior and the final line count."],
  ]), 10);
  add(commandBadge(theme, y, 'Running: for i in $(seq 1 12); do echo "tick…', { state: "spin" }), 4);
  parts.push(`<text x="${CC_X + CC_W - 20}" y="${y + 8}" ${SANS} font-size="9.5" fill="${t.faint}" text-anchor="end">&#8593; still spinning: its item_done never came</text>`);
  y += 16;
  add(proseRich(theme, y, [
    ["The loop is running; it's silent by design because"],
    ["it only appends to the file. I'll wait for completion,"],
    ["then read the file and count the lines."],
  ]), 10);
  add(receiptRow(theme, y, ["stopped by you", "31,065 tokens this turn", "9s"], { stopped: true }), 0);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">
  <rect width="${W}" height="${h}" fill="${t.pageBg}"/>
  ${chrome(theme)}
  ${appHeader(theme, { activeMode: "standard", blurb: "Write inside this workspace; the network stays off.", gauge: { turn: "31.1k", thread: "31.1k" } })}
  ${sidebar(theme, h, P8_ROWS(5))}
  ${chatBar(theme, { name: "e2e stop", mode: "standard" })}
  ${parts.join("\n  ")}
  ${chatFooter(theme, h)}
  ${previewShell(theme, h, { projectId: "64ec90a9", files: { list: [{ name: "ticks.txt", size: "21 B" }] } })}
</svg>`;
}

/* ============================================================
   4. browser-steer: the chip, mid-turn (mirrors p8-e2e-steer.png).
   ============================================================ */
function browserSteer(theme) {
  const t = U[theme];
  const h = 780;
  let y = CHROME_H + HEADER_H + 34 + 18;
  const parts = [];
  const add = (p, gap = 13) => { parts.push(p.svg); y += p.h + gap; };

  add(userBubble(theme, y, [
    "Build index.html for a small bookshop site with",
    "four sections: hero, staff picks, events, and",
    "visit us. Work one section at a time and save",
    "index.html after each section. Inline CSS, no",
    "external requests.",
  ]));
  add(thinkingRow(theme, y), 8);
  add(proseRich(theme, y, [
    ["I'm going to inspect the site structure, then build"],
    [{ code: "index.html" }, " incrementally so each section is"],
    ["added and saved before moving to the next."],
  ]), 10);
  add(commandBadge(theme, y, "Running: /bin/zsh -c pwd", { state: "done" }), 8);
  add(commandBadge(theme, y, "Running: /bin/zsh -c 'rg --files'", { state: { fail: 1 } }), 8);
  add(thinkingRow(theme, y), 8);
  add(workingRow(theme, y, "Building… 9s"), 18);
  add(userBubble(theme, y, ["Also add a footer that says STEERED BY HUMAN"], { steered: true }), 0);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">
  <rect width="${W}" height="${h}" fill="${t.pageBg}"/>
  ${chrome(theme)}
  ${appHeader(theme, { activeMode: "standard", blurb: "Write inside this workspace; the network stays off.", gauge: { turn: "15.5k", thread: "15.5k" } })}
  ${sidebar(theme, h, P8_ROWS(5).slice(0, 5).concat([{ name: "e2e steer", sub: "no conversation yet", time: "just now", active: true }]))}
  ${chatBar(theme, { name: "e2e steer", mode: "standard" })}
  ${parts.join("\n  ")}
  ${chatFooter(theme, h, { running: true })}
  ${previewShell(theme, h, { projectId: "2321d49e", files: { list: [] } })}
</svg>`;
}

/* ============================================================
   5. browser-gauge: the breakdown panel open (mirrors p8-e2e-gauge.png).
   ============================================================ */
function browserGauge(theme) {
  const t = U[theme];
  const h = 840;
  let y = CHROME_H + HEADER_H + 34 + 18;
  const parts = [];
  const add = (p, gap = 13) => { parts.push(p.svg); y += p.h + gap; };

  add(proseRich(theme, y, [
    ["Built ", { code: "index.html" }, " as a single self-contained"],
    ["page with inline CSS and no external requests:"],
    ["a hero, a classes section with three class cards,"],
    ["and a contact section with an inquiry form."],
  ]), 10);
  add(receiptRow(theme, y, ["163,335 tokens this turn", "40s"]), 16);
  add(userBubble(theme, y, [
    "Change the hero heading to say Glaze & Kiln.",
    "Just that one edit.",
  ]));
  add(thinkingRow(theme, y), 8);
  add(proseRich(theme, y, [
    ["I'm making the single text change in the hero"],
    ["heading and leaving everything else untouched."],
  ]), 10);
  add(commandBadge(theme, y, "Updating index.html", { kind: "FILES" }), 10);
  add(proseRich(theme, y, [
    ["Updated the hero heading to ", { code: "Glaze & Kiln." }, " in"],
    [{ code: "index.html" }, "."],
  ]), 10);
  add(receiptRow(theme, y, ["52,641 tokens this turn", "3s"]), 0);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">
  <rect width="${W}" height="${h}" fill="${t.pageBg}"/>
  ${chrome(theme)}
  ${appHeader(theme, { activeMode: "standard", blurb: "Write inside this workspace; the network stays off.", gauge: { turn: "52.6k", thread: "216.0k", highlight: true } })}
  ${sidebar(theme, h, P8_ROWS(4).slice(0, 5))}
  ${chatBar(theme, { name: "e2e gauge", mode: "standard" })}
  ${parts.join("\n  ")}
  ${chatFooter(theme, h)}
  ${previewShell(theme, h, { projectId: "7f265fe0", diffDot: true, site: potterySite(theme, h), files: { list: [{ name: "index.html", size: "13.4 kB", badge: "updated" }] } })}
  ${gaugePanel(theme, W - 620, CHROME_H + HEADER_H + 6, [
    { label: "this turn", in: "52.5k", cached: "40.7k", out: "172", total: "52.6k" },
    { label: "last request", in: "26.3k", cached: "26.0k", out: "58", total: "26.4k" },
    { label: "this thread", in: "209.1k", cached: "175.5k", out: "6.9k", total: "216.0k" },
  ], "258.4k")}
</svg>`;
}

/* ============================================================
   6. fig-steer-router: one endpoint, two verbs, a referee.
   ============================================================ */
function figSteerRouter(theme) {
  const t = D[theme];
  const w = 1240, h = 900;
  const label = (x, y, txt, size = 13, fill = t.ink, anchor = "middle", font = MONO) =>
    `<text x="${x}" y="${y}" ${font} font-size="${size}" fill="${fill}" text-anchor="${anchor}">${txt}</text>`;
  const box = (x, y, bw, bh, fill, stroke, sw = 1.5) =>
    `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const arrow = (x1, y1, x2, y2, color = t.faint, dash = "") =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" ${dash ? `stroke-dasharray="${dash}"` : ""}/>
     <path d="M ${x2} ${y2} l -5 -8 l 10 0 z" fill="${color}" transform="rotate(${(Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI - 90} ${x2} ${y2})"/>`;

  const CXm = w / 2;          // center lane
  const LX = 330, RX = 910;   // steer lane, new-turn lane

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
  <rect width="${w}" height="${h}" fill="${t.paper}"/>
  <text x="48" y="52" ${MONO} font-size="12" letter-spacing="2.5" fill="${t.faint}">THE ROUTER &#183; ONE ENDPOINT, TWO VERBS, AND A REFEREE</text>
  <line x1="48" y1="66" x2="${w - 48}" y2="66" stroke="${t.line}" stroke-width="1.5"/>

  <!-- the message -->
  ${box(CXm - 290, 92, 580, 74, t.chip, t.line)}
  ${label(CXm, 122, `"Also add a footer that says STEERED BY HUMAN" &#183; Send`, 13.5, t.ink)}
  ${label(CXm, 148, "the composer stays live during a run &#183; POST /projects/{id}/chat", 11.5, t.faint)}

  ${arrow(CXm, 166, CXm, 200)}

  <!-- the ledger check -->
  ${box(CXm - 290, 200, 580, 104, t.surface, t.line)}
  ${label(CXm, 230, "turns.active(project_id) ?", 16, t.ink)}
  ${label(CXm, 258, `the active-turn ledger: {"thread_id": "019f3917&#8230;", "turn_id": "019f3917-8ff9&#8230;"}`, 11.5, t.muted)}
  ${label(CXm, 280, "written when turn/start answers with turn.id &#183; erased when turn/completed arrives", 11, t.faint)}

  <!-- branch labels -->
  ${arrow(CXm - 200, 304, LX, 356, t.accent)}
  ${label(CXm - 320, 338, "a turn is LIVE", 12.5, t.accent)}
  ${arrow(CXm + 200, 304, RX, 356, t.faint)}
  ${label(CXm + 330, 338, "idle: no entry", 12.5, t.muted)}

  <!-- steer lane -->
  ${box(LX - 250, 356, 500, 128, t.accentTint, t.accentLine, 2)}
  ${label(LX, 386, `turn/steer`, 16, t.accent)}
  ${label(LX, 412, `{"threadId": &#8230;, "expectedTurnId": "019f3917-8ff9&#8230;",`, 12, t.ink)}
  ${label(LX, 434, `"input": [{"type": "text", "text": &#8230;}]}`, 12, t.ink)}
  ${label(LX, 464, "expectedTurnId is a PRECONDITION: it must name the live turn", 11, t.muted)}

  ${arrow(LX, 484, LX, 520, t.green)}
  ${label(LX - 130, 506, `ack: {"turnId": &#8230;}`, 11, t.green)}
  ${box(LX - 250, 520, 500, 96, t.chip, t.line)}
  ${label(LX, 548, `the endpoint answers plain JSON: {"steered": true}`, 12.5, t.ink)}
  ${label(LX, 572, "events keep riding the ORIGINAL turn's stream &#183; the chip renders", 11.5, t.muted)}
  ${label(LX, 594, "&#126;3s later the text resurfaces as a plain userMessage item", 11, t.faint)}

  <!-- new-turn lane -->
  ${box(RX - 190, 356, 380, 128, t.chip, t.line)}
  ${label(RX, 392, "turn/start", 16, t.ink)}
  ${label(RX, 420, "a brand-new turn, exactly as", 12, t.muted)}
  ${label(RX, 442, "every message since Part 2", 12, t.muted)}
  ${arrow(RX, 484, RX, 520, t.faint)}
  ${box(RX - 190, 520, 380, 96, t.chip, t.line)}
  ${label(RX, 552, "the response is an SSE stream", 12.5, t.ink)}
  ${label(RX, 576, "session_start &#8594; deltas &#8594; complete", 11.5, t.muted)}

  <!-- the race lane -->
  <path d="M ${LX + 250} 440 C ${CXm + 60} 460, ${CXm + 60} 620, ${RX - 240} 662" fill="none" stroke="${t.red}" stroke-width="1.5" stroke-dasharray="6 5"/>
  <path d="M ${RX - 240} 662 l -11 -3 l 7 -9 z" fill="${t.red}"/>
  ${box(RX - 230, 640, 460, 100, t.redTint, t.redLine, 1.5)}
  ${label(RX, 668, `-32600 &#183; "no active turn to steer"`, 13.5, t.red)}
  ${label(RX, 694, "the turn finished a beat before the steer landed: catch it,", 11.5, t.muted)}
  ${label(RX, 716, "clear the stale ledger line, fall back to turn/start above", 11.5, t.muted)}

  <!-- footer band -->
  <rect x="48" y="${h - 122}" width="${w - 96}" height="74" rx="10" fill="${t.surface}" stroke="${t.line}"/>
  ${label(68, h - 94, "The protocol referees the race, not our bookkeeping: the ledger can be honestly stale (a stalled viewer held", 11.5, t.muted, "start")}
  ${label(68, h - 72, "it for 100s in our probe), but a steer against a finished turn fails LOUDLY. Either verb runs the message;", 11.5, t.muted, "start")}
  ${label(68, h - 50, "the only visible difference is the chip: it stays when the steer was absorbed, it comes off on the fallback.", 11.5, t.accent, "start")}
</svg>`;
}

/* ============================================================
   7. fig-meter: three numbers, one honest receipt (real meter run).
   ============================================================ */
function figMeter(theme) {
  const t = D[theme];
  const w = 1240, h = 860;
  const label = (x, y, txt, size = 13, fill = t.ink, anchor = "middle", font = MONO) =>
    `<text x="${x}" y="${y}" ${font} font-size="${size}" fill="${fill}" text-anchor="${anchor}">${txt}</text>`;
  const box = (x, y, bw, bh, fill, stroke, sw = 1.5) =>
    `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const arrow = (x1, y1, x2, y2, color = t.faint) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5"/>
     <path d="M ${x2} ${y2} l -5 -8 l 10 0 z" fill="${color}" transform="rotate(${(Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI - 90} ${x2} ${y2})"/>`;

  const cardW = 262, cardH = 190, gap = 40;
  const totalW = cardW * 4 + gap * 3;
  const x0 = (w - totalW) / 2;
  const cy = 150;

  const card = (i, kicker, kickerColor, lines) => {
    const x = x0 + i * (cardW + gap);
    let s = box(x, cy, cardW, cardH, i === 0 ? "none" : t.chip, i === 0 ? t.faint : t.line, i === 0 ? 1.2 : 1.5);
    if (i === 0) s = `<rect x="${x}" y="${cy}" width="${cardW}" height="${cardH}" rx="12" fill="none" stroke="${t.faint}" stroke-width="1.2" stroke-dasharray="6 5"/>`;
    s += label(x + cardW / 2, cy + 30, kicker, 11, kickerColor);
    lines.forEach((l, j) => {
      s += label(x + cardW / 2, cy + 62 + j * 26, l.txt, l.size ?? 13, l.fill ?? t.ink);
    });
    if (i > 0) s += arrow(x - gap + 6, cy + cardH / 2, x - 6, cy + cardH / 2);
    return s;
  };

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
  <rect width="${w}" height="${h}" fill="${t.paper}"/>
  <text x="48" y="52" ${MONO} font-size="12" letter-spacing="2.5" fill="${t.faint}">THE METER &#183; THREE NUMBERS, ONE HONEST RECEIPT</text>
  <line x1="48" y1="66" x2="${w - 48}" y2="66" stroke="${t.line}" stroke-width="1.5"/>
  ${label(60, 106, 'One real turn ("add a one-line footer"), every tokenUsage note it produced, verbatim:', 12.5, t.muted, "start", SANS)}

  ${card(0, "BEFORE THIS TURN", t.faint, [
    { txt: "the thread's odometer", size: 11.5, fill: t.muted },
    { txt: "reads 215,976", size: 14, fill: t.muted },
    { txt: "", size: 11 },
    { txt: "(= first update's", size: 11, fill: t.faint },
    { txt: "total &#8722; last)", size: 11, fill: t.faint },
  ])}
  ${card(1, "tokenUsage UPDATE 1", t.accent, [
    { txt: "last: 26,597", size: 14 },
    { txt: "total: 242,573", size: 14 },
    { txt: "", size: 11 },
    { txt: "turn = 242,573 &#8722; 215,976", size: 11.5, fill: t.accent },
    { txt: "= 26,597", size: 13, fill: t.accent },
  ])}
  ${card(2, "tokenUsage UPDATE 2", t.accent, [
    { txt: "last: 26,691", size: 14 },
    { txt: "total: 269,264", size: 14 },
    { txt: "", size: 11 },
    { txt: "turn = 269,264 &#8722; 215,976", size: 11.5, fill: t.accent },
    { txt: "= 53,288", size: 13, fill: t.accent },
  ])}
  ${card(3, "THE RECEIPT (complete)", t.green, [
    { txt: `"usage": 53,288`, size: 14, fill: t.green },
    { txt: "tokens this turn", size: 11.5, fill: t.muted },
    { txt: "", size: 11 },
    { txt: `"thread_total":`, size: 12, fill: t.muted },
    { txt: "269,264", size: 13, fill: t.muted },
  ])}

  ${label(w / 2, 384, "242,573 + 26,691 = 269,264 &#183; total grows by exactly last, on every update, in every trace", 12, t.faint)}

  <!-- the three definitions -->
  ${(() => {
    const dw = 368, dh = 210, dgap = 36;
    const dx0 = (w - (dw * 3 + dgap * 2)) / 2;
    const dy = 430;
    const defs = [
      {
        name: ".last", sub: "ONE MODEL REQUEST", color: t.muted,
        lines: ["the most recent inference call.", "A build turn makes many of these.", "Bill with it and the receipt shows", "one request's sliver."],
      },
      {
        name: ".total", sub: "THE THREAD'S ODOMETER", color: t.muted,
        lines: ["lifetime, cumulative, never resets.", "Part 6 watched it hit 1.09M.", "Bill with it and the receipt charges", "the customer for all of history."],
      },
      {
        name: "turn", sub: "COMPUTED &#183; OURS", color: t.accent,
        lines: ["total now &#8722; total when the turn", "began. Not on the wire anywhere:", "run_turn computes it. The only", `number that means "this turn".`],
      },
    ];
    let s = "";
    defs.forEach((d, i) => {
      const x = dx0 + i * (dw + dgap);
      const hero = d.name === "turn";
      s += box(x, dy, dw, dh, hero ? t.accentTint : t.surface, hero ? t.accentLine : t.line, hero ? 2 : 1.5);
      s += label(x + 24, dy + 44, d.name, 22, hero ? t.accent : t.ink, "start");
      s += label(x + dw - 24, dy + 42, d.sub, 10.5, hero ? t.accent : t.faint, "end");
      d.lines.forEach((l, j) => {
        s += label(x + 24, dy + 84 + j * 24, l, 12.5, t.muted, "start", SANS);
      });
      return s;
    });
    return s;
  })()}

  <rect x="48" y="${h - 130}" width="${w - 96}" height="82" rx="10" fill="${t.surface}" stroke="${t.line}"/>
  ${label(68, h - 100, "Neither wire field means 'this turn'. The baseline falls out of the FIRST update (total &#8722; last), because", 11.5, t.muted, "start")}
  ${label(68, h - 78, "that update's last is already part of this turn's spend. Receipt = delta of totals. The gauge's quieter number", 11.5, t.muted, "start")}
  ${label(68, h - 56, "shows .total under its true name: the thread's lifetime bill, not this turn's.", 11.5, t.accent, "start")}
</svg>`;
}

/* ============================================================
   8. TERMINALS (dark only, real captures)
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

const termInterrupt = () =>
  term("curl -N &#183; the stream during an interrupt (project 5dec474b)", [
    `${F(TT.faint, "# the agent starts a sleepy loop; its output ticks in every 2 seconds:")}`,
    `data: {"type": ${F(TT.accent, '"item_start"')}, "item_id": ${F(TT.amber, '"call_E7wW…"')}, "kind": "commandExecution",`,
    `       "detail": {"command": "/bin/zsh -lc 'for i in $(seq 1 10); do`,
    `                  echo \\"&lt;h2&gt;Section $i&lt;/h2&gt;\\" &gt;&gt; index.html;`,
    `                  echo \\"wrote section $i\\"; ${F(TT.blue, "sleep 2")}; done'", "exit_code": null}}`,
    `data: {"type": "command_output_delta", "item_id": ${F(TT.amber, '"call_E7wW…"')}, "chunk": "wrote section 5\\n"}`,
    `data: {"type": "command_output_delta", "item_id": ${F(TT.amber, '"call_E7wW…"')}, "chunk": "wrote section 6\\n"}`,
    `${F(TT.faint, "# ↑ Stop is clicked: POST /projects/5dec474b/interrupt → {\"interrupted\": true}")}`,
    `data: {"type": ${F(TT.accent, '"complete"')}, "status": ${F(TT.red, '"interrupted"')}, "duration_ms": ${F(TT.blue, "14004")}, …}`,
    ``,
    `${F(TT.faint, "# the stream is over, and call_E7wW… never got an item_done: abandoned mid-lifecycle.")}`,
    `${F(TT.faint, "# the workspace, read after the loop's own arithmetic ran out:")}`,
    `${F(TT.green, "$")} grep -c '&lt;h2&gt;Section' projects/5dec474b/site/index.html`,
    `${F(TT.amber, "10")}   ${F(TT.faint, "# all ten. The agent stopped listening at section 6; the shell kept writing.")}`,
  ]);

const termSteerRace = () =>
  term("stdio &#183; the steer that lost the race (raw probe, id 5)", [
    `${F(TT.faint, "# 93 seconds into a build, we send turn/steer while turn 019f390a-d23b… is (was) live:")}`,
    `${F(TT.faint, "→")} {"id": ${F(TT.accent, "5")}, "method": ${F(TT.accent, '"turn/steer"')}, "params": {"threadId": "019f390a-d1e1…",`,
    `      "expectedTurnId": ${F(TT.amber, '"019f390a-d23b…"')}, "input": [{"type": "text", "text": "…"}]}}`,
    ``,
    `${F(TT.faint, "# the same logged instant, t=93.33s, in this order:")}`,
    `${F(TT.faint, "←")} {"method": ${F(TT.accent, '"turn/completed"')}, "params": {"turn": {"id": ${F(TT.amber, '"019f390a-d23b…"')},`,
    `      "status": ${F(TT.green, '"completed"')}, "durationMs": 93157, …}}}`,
    `${F(TT.faint, "←")} {"error": {"code": ${F(TT.red, "-32600")}, "message": ${F(TT.red, '"no active turn to steer"')}}, "id": ${F(TT.accent, "5")}}`,
    ``,
    `${F(TT.faint, "# the turn finished under our steer, in flight. The precondition failed LOUDLY:")}`,
    `${F(TT.faint, "# no silent absorption, no eaten message. Catch the CodexError, clear the stale")}`,
    `${F(TT.faint, "# ledger line, fall back to a plain turn/start. The user never sees -32600.")}`,
  ]);

/* ============================================================
   write everything
   ============================================================ */
for (const theme of ["light", "dark"]) {
  writeFileSync(`${OUT}/cover-${theme}.svg`, cover(theme));
  writeFileSync(`${OUT}/fig-steer-router-${theme}.svg`, figSteerRouter(theme));
  writeFileSync(`${OUT}/fig-meter-${theme}.svg`, figMeter(theme));
  writeFileSync(`${OUT}/browser-stop-${theme}.svg`, browserStop(theme));
  writeFileSync(`${OUT}/browser-steer-${theme}.svg`, browserSteer(theme));
  writeFileSync(`${OUT}/browser-gauge-${theme}.svg`, browserGauge(theme));
}
writeFileSync(`${OUT}/term-interrupt.svg`, termInterrupt());
writeFileSync(`${OUT}/term-steer-race.svg`, termSteerRace());
console.log("part-8 SVGs written to", OUT);

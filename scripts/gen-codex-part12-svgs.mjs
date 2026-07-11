/**
 * Part 12 SVG assets for "Codex App Server in Production".
 * Everything mirrors REAL runs (2026-07-09, codex-cli 0.142.4 /
 * gpt-5.4-mini behind the part-12 backend, clean CODEX_HOME):
 * - the canonical rented-tools turn (p12-sse-mcp.txt, project 5b577826):
 *   brand kit on -> one elicitation covers both search_images calls
 *   (acceptForSession -> _meta persist "session") -> the curl download
 *   raises a Part 7 COMMAND approval in the same turn -> the CC0
 *   latte-art JPEG lands in assets/ and ships on the page with alt
 *   text -> receipt "brand kit . 512,195 tokens this turn . 136s".
 * - the bug artifact (p12-sse-mcp-unhandled.txt): the pre-fix stream
 *   where every mcpToolCall failed in 0s ("user rejected MCP tool
 *   call") and the agent quietly fell back to curling the Openverse
 *   REST API; turn completed 630,655 tokens / 532s.
 * - the probes (p12-mcp-approval/elicit/serverlevel-probe.txt): the
 *   elicitation fires under approvalPolicy "never"; answer shapes;
 *   the persist ladder (2 asks -> 1 ask -> 0 asks after "always"
 *   writes config.toml); server-level approval_mode ignored.
 * - the break-it (p12-mcp-broken.txt): lazy launch; the failure exists
 *   only in mcpServer/startupStatus/updated, never in the list.
 * - the e2e screenshots (p12-e2e-mcp.png, p12-e2e-status.png,
 *   p12-e2e-status-healthy.png).
 * Hosts shown reader-world (localhost:3000). Same deliberate
 * substitution as Parts 7-11: the running app letters some seams with
 * an em-dash ("Approval needed — rented tool"); house rule bans that
 * glyph in drawn SVG text, so these captures letter a middot / colon
 * instead.
 *
 * Usage: node scripts/gen-codex-part12-svgs.mjs
 */
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";

const BASE = "/Users/yadneshsalvi/code/yadnesh-personal-blog/public/images/series/codex";
const P1 = `${BASE}/part-1`;
const OUT = `${BASE}/part-12`;
mkdirSync(OUT, { recursive: true });

const MONO = `font-family="'SF Mono', Menlo, Consolas, monospace"`;
const SANS = `font-family="-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"`;
const SERIF = `font-family="Georgia, 'Times New Roman', serif"`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---- shared palettes (ink & paper tokens, same as Parts 1-11) ----
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

// App-window chrome + UI palettes (stone tokens, same as Parts 3-11)
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
    greenLine: "#86efac", greenBg: "#f0fdf4", greenDot: "#22c55e",
    emerald: "#059669",
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
    greenLine: "#166534", greenBg: "#0a1f10", greenDot: "#22c55e",
    emerald: "#34d399",
  },
};

/* ============================================================
   1. COVER: templated from the Part 1 cover.
   ============================================================ */
function cover(theme) {
  const accent = theme === "light" ? "#b3441a" : "#e5825a";
  let svg = readFileSync(`${P1}/cover-${theme}.svg`, "utf8");
  svg = svg
    .replace(">01</text>", ">12</text>")
    .replace("PART 1 OF 13", "PART 12 OF 13")
    .replace(
      `font-size="92" fill="${theme === "light" ? "#1f1c19" : "#ebe7df"}" letter-spacing="-1">Your first <tspan font-style="italic" fill="${accent}">thread</tspan>`,
      `font-size="84" fill="${theme === "light" ? "#1f1c19" : "#ebe7df"}" letter-spacing="-1">The wider <tspan font-style="italic" fill="${accent}">workshop</tspan>`
    )
    .replace(
      "Speak raw JSON-RPC to the engine inside Codex. Get a website back.",
      "Standing rules, a pattern book, and rented tools that ask first."
    );
  return svg;
}

/* ============================================================
   2. Shared app-window pieces (Parts 3-11 conventions), plus the
   Part 12 newcomers: the tools pill, the MCP panel, the Brand kit
   pill, the rented-tool approval card, and the mcp badge.
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

// Part 12 header: the tools pill sits between the wordmark and the
// gauge. state "green" | "red"; red carries the "1 down" tail.
function appHeader(theme, { activeMode, blurb, gauge = null, tools = "green" }) {
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
  // the tools pill (Part 12): dot + "tools", red when a server is down
  const toolsLabel = tools === "red" ? "tools &#183; 1 down" : "tools";
  const toolsLen = tools === "red" ? 14 : 5;
  const tw = toolsLen * 6.6 + 30;
  const tx = 258;
  const toolsPill = `<rect x="${tx}" y="${y + 9}" width="${tw}" height="26" rx="13" fill="none" stroke="${tools === "red" ? t.red : t.line}" stroke-width="1.2"/>
  <circle cx="${tx + 15}" cy="${y + 22}" r="3" fill="${tools === "red" ? "#ef4444" : t.greenDot}"/>
  <text x="${tx + 25}" y="${y + 26}" ${MONO} font-size="11" fill="${tools === "red" ? t.red : t.muted}">${toolsLabel}</text>`;
  return `<line x1="0" y1="${y + HEADER_H}" x2="${W}" y2="${y + HEADER_H}" stroke="${t.line}" stroke-width="1"/>
  <circle cx="24" cy="${y + HEADER_H / 2}" r="5" fill="${t.accent}"/>
  <text x="38" y="${y + HEADER_H / 2 + 5}" ${SANS} font-size="15" font-weight="700" fill="${t.ink}">Pagewright</text>
  <text x="150" y="${y + HEADER_H / 2 + 5}" ${MONO} font-size="11" fill="${t.faint}">the site builder</text>
  ${toolsPill}
  <text x="${blurbAnchor}" y="${y + HEADER_H / 2 + 4}" ${SANS} font-size="11" fill="${t.faint}" text-anchor="end">${esc(blurb)}</text>
  ${gaugeSvg}
  ${picker}`;
}

// The MCP panel, dropped from the tools pill (mirrors the real
// popover in p12-e2e-status*.png). rows: [{name, state, tail, error}]
function mcpPanel(theme, rows) {
  const t = U[theme];
  const x = 300, y = CHROME_H + HEADER_H - 4, w = 330;
  const dot = { ready: t.greenDot, starting: t.amberDot, failed: "#ef4444" };
  let s = "", yy = y + 40;
  for (const r of rows) {
    const rh = r.error ? 76 : 48;
    s += `<rect x="${x + 12}" y="${yy}" width="${w - 24}" height="${rh}" rx="8" fill="none" stroke="${t.line}"/>
  <circle cx="${x + 28}" cy="${yy + 18}" r="4" fill="${dot[r.state]}"/>
  <text x="${x + 40}" y="${yy + 22}" ${SANS} font-size="12.5" font-weight="600" fill="${t.ink}">${esc(r.name)}</text>
  <text x="${x + w - 24}" y="${yy + 22}" ${MONO} font-size="10.5" fill="${t.faint}" text-anchor="end">${esc(r.tail)}</text>`;
    if (r.error) {
      r.error.forEach((l, i) => {
        s += `<text x="${x + 28}" y="${yy + 42 + i * 15}" ${MONO} font-size="10" fill="${t.red}">${esc(l)}</text>`;
      });
    } else if (r.tools) {
      s += `<text x="${x + 28}" y="${yy + 40}" ${MONO} font-size="10" fill="${t.faint}">${esc(r.tools)}</text>`;
    }
    yy += rh + 8;
  }
  const h = yy - y + 6;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${t.badgeBg}" stroke="${t.line}" filter="drop-shadow(0 6px 14px rgba(0,0,0,0.12))"/>
  <text x="${x + 14}" y="${y + 24}" ${MONO} font-size="10" letter-spacing="1.5" fill="${t.faint}">MCP SERVERS</text>
  ${s}`;
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

function sidebar(theme, h, rows, { picker = "beanline brief" } = {}) {
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
  <text x="22" y="${by + 27}" ${SANS} font-size="11" fill="${t.muted}">${esc(picker)}</text>
  <path d="M ${SB_W - 30} ${by + 21} l 4.5 5 l 4.5 -5" fill="none" stroke="${t.faint}" stroke-width="1.4"/>
  <rect x="12" y="${by + 44}" width="${SB_W - 24}" height="28" rx="7" fill="${t.accent}"/>
  <text x="${SB_W / 2}" y="${by + 62}" ${SANS} font-size="11.5" font-weight="600" fill="#ffffff" text-anchor="middle">New project</text>`;
  return s;
}

// ---- chat-column content pieces ----
const CC_X = CHAT_X + 16, CC_W = CHAT_W - 32;

function userBubble(theme, y, lines, { chip = null } = {}) {
  const t = U[theme];
  const lh = 18;
  const bh = lines.length * lh + 20 + (chip ? 22 : 0);
  const bw = CC_W - 30;
  let s = `<rect x="${CC_X + 30}" y="${y}" width="${bw}" height="${bh}" rx="12" fill="${t.userBubble}"/>`;
  lines.forEach((l, i) => {
    s += `\n  <text x="${CC_X + 44}" y="${y + 24 + i * lh}" ${SANS} font-size="12" fill="${t.userText}">${esc(l)}</text>`;
  });
  if (chip) {
    const cw = chip.length * 6 + 16;
    s += `\n  <rect x="${CC_X + 44}" y="${y + bh - 28}" width="${cw}" height="17" rx="8.5" fill="none" stroke="${t.userText}" stroke-opacity="0.4"/>
  <text x="${CC_X + 44 + cw / 2}" y="${y + bh - 16}" ${MONO} font-size="9.5" fill="${t.userText}" text-anchor="middle" opacity="0.85">${esc(chip)}</text>`;
  }
  return { svg: s, h: bh };
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

function commandBadge(theme, y, label, { state = "done", kind = "COMMAND" } = {}) {
  const t = U[theme];
  const bh = 34;
  let mark;
  if (state === "spin") {
    mark = `<circle cx="${CC_X + 19}" cy="${y + 17}" r="6" fill="none" stroke="${t.faint}" stroke-width="2" stroke-dasharray="7 5"/>`;
  } else if (state === "fail") {
    mark = `<text x="${CC_X + 14}" y="${y + 21.5}" ${SANS} font-size="12.5" fill="${t.red}">&#x2715;</text>`;
  } else {
    mark = `<text x="${CC_X + 14}" y="${y + 21.5}" ${SANS} font-size="12.5" fill="${t.green}">&#x2713;</text>`;
  }
  return {
    svg: `<rect x="${CC_X}" y="${y}" width="${CC_W - 20}" height="${bh}" rx="8" fill="${t.badgeBg}" stroke="${t.line}"/>
  ${mark}
  <text x="${CC_X + 30}" y="${y + 21.5}" ${MONO} font-size="12" fill="${t.ink}">${esc(label)}</text>
  <text x="${CC_X + CC_W - 66}" y="${y + 21}" ${SANS} font-size="9.5" letter-spacing="1" fill="${t.faint}">${kind}</text>`,
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

// The Part 7 approval card, Part 12 flavor. kind: "rented" | "command".
// Mirrors ApprovalCard.tsx: amber border while open, engine's own
// question as the body for the rented kind.
function approvalCard(theme, y, opts) {
  const t = U[theme];
  const x = CC_X, w = CC_W - 10;
  const open = !opts.resolved;
  let yy = y;
  let s = "";
  const border = open ? (theme === "light" ? "#fbbf24" : "#a16207") : t.line;
  // header strip
  s += `<rect x="${x}" y="${yy}" width="${w}" height="28" fill="${open ? t.amberBg : t.panel}"/>`;
  if (open) s += `<circle cx="${x + 16}" cy="${yy + 14}" r="4" fill="${t.amberDot}"/>`;
  s += `<text x="${x + (open ? 28 : 14)}" y="${yy + 18}" ${MONO} font-size="9.5" letter-spacing="1.2" fill="${t.faint}">APPROVAL NEEDED &#183; ${opts.kind === "rented" ? "RENTED TOOL" : "COMMAND"}</text>`;
  if (open && opts.countdown) {
    s += `<text x="${x + w - 12}" y="${yy + 18}" ${MONO} font-size="9.5" fill="${t.amberText}" text-anchor="end">${opts.countdown}</text>`;
  }
  yy += 28;
  if (opts.reason) {
    const rl = opts.reason;
    rl.forEach((l, i) => {
      s += `<text x="${x + 14}" y="${yy + 18 + i * 16}" ${SANS} font-size="11.5" fill="${t.muted}">${esc(l)}</text>`;
    });
    yy += rl.length * 16 + 8;
  }
  if (opts.kind === "rented") {
    opts.message.forEach((l, i) => {
      s += `<text x="${x + 14}" y="${yy + 18 + i * 17}" ${SANS} font-size="12.5" fill="${t.ink}">${esc(l)}</text>`;
    });
    yy += opts.message.length * 17 + 6;
    s += `<text x="${x + 14}" y="${yy + 12}" ${MONO} font-size="10" fill="${t.faint}">MCP server: openverse &#183; approvalPolicy does not cover</text>
  <text x="${x + 14}" y="${yy + 27}" ${MONO} font-size="10" fill="${t.faint}">rented tools: this card is the only gate</text>`;
    yy += 36;
  } else {
    // dark command pre block
    const lines = opts.command;
    const ph = lines.length * 17 + 18;
    s += `<rect x="${x + 12}" y="${yy + 2}" width="${w - 24}" height="${ph}" rx="8" fill="${t.preBg}"/>`;
    lines.forEach((l, i) => {
      s += `<text x="${x + 24}" y="${yy + 20 + i * 17}" ${MONO} font-size="10.5" fill="${t.preText}">${esc(l)}</text>`;
    });
    yy += ph + 10;
  }
  // footer: buttons or outcome
  s += `<line x1="${x}" y1="${yy}" x2="${x + w}" y2="${yy}" stroke="${t.line}"/>`;
  yy += 8;
  if (open) {
    const btn = (bx, bw2, label, solid) =>
      `<rect x="${bx}" y="${yy}" width="${bw2}" height="24" rx="7" fill="${solid ? t.segActive : "none"}" stroke="${solid ? t.segActive : t.line}"/>
  <text x="${bx + bw2 / 2}" y="${yy + 16}" ${SANS} font-size="10.5" font-weight="600" fill="${solid ? t.segActiveText : t.muted}" text-anchor="middle">${label}</text>`;
    s += btn(x + 12, 66, "Approve", true);
    s += btn(x + 84, 128, "Approve for session", false);
    s += btn(x + 218, 50, "Deny", false);
    yy += 32;
  } else {
    s += `<text x="${x + 14}" y="${yy + 14}" ${SANS} font-size="11.5" fill="${opts.denied ? t.red : t.green}">${esc(opts.resolved)}</text>`;
    yy += 26;
  }
  const h = yy - y;
  return {
    svg: `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${t.badgeBg}"/>
  <clipPath id="ac-${theme}-${y}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10"/></clipPath>
  <g clip-path="url(#ac-${theme}-${y})">${s}</g>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="none" stroke="${border}" stroke-width="1.6"/>`,
    h,
  };
}

// The builder's plan panel (Part 10), 4/4 from the canonical run.
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

// The publish bar (Part 11), resting state.
function publishBar(theme, y) {
  const t = U[theme];
  const x = CHAT_X, w = CHAT_W;
  const BH = 42;
  const pubX = x + w - 16 - 58;
  const inX = pubX - 8 - 82;
  return {
    svg: `<rect x="${x + 1}" y="${y}" width="${w - 1}" height="${BH}" fill="${t.panel}" opacity="0.6"/>
  <line x1="${x}" y1="${y}" x2="${x + w}" y2="${y}" stroke="${t.line}"/>
  <text x="${x + 18}" y="${y + 26}" ${SANS} font-size="11" fill="${t.muted}">Publishing starts with an inspection.</text>
  <rect x="${inX}" y="${y + 8}" width="82" height="26" rx="8" fill="none" stroke="${t.line}"/>
  <text x="${inX + 41}" y="${y + 25}" ${SANS} font-size="11" font-weight="500" fill="${t.muted}" text-anchor="middle">Inspect site</text>
  <rect x="${pubX}" y="${y + 8}" width="58" height="26" rx="8" fill="${t.accent}" opacity="0.4"/>
  <text x="${pubX + 29}" y="${y + 25}" ${SANS} font-size="11" font-weight="600" fill="#ffffff" text-anchor="middle">Publish</text>`,
    h: BH,
  };
}

// Footer: Plan-first + Brand kit pills + care picker + composer.
function chatFooter(theme, h, { brandKit = false } = {}) {
  const t = U[theme];
  const y = h - 62 - 34;
  let s = `<line x1="${CHAT_X}" y1="${y}" x2="${PV_X}" y2="${y}" stroke="${t.line}" stroke-width="1"/>`;
  const yy = y + 10;
  const pillW = 78;
  s += `<rect x="${CC_X}" y="${yy}" width="${pillW}" height="22" rx="11" fill="none" stroke="${t.line}"/>
  <circle cx="${CC_X + 13}" cy="${yy + 11}" r="2.5" fill="${t.tickPendingRing}"/>
  <text x="${CC_X + 22}" y="${yy + 15}" ${SANS} font-size="11" font-weight="500" fill="${t.muted}">Plan first</text>`;
  // Brand kit pill (Part 12): emerald dot when armed and on
  const bkW = 82;
  const bkX = CC_X + pillW + 8;
  s += `<rect x="${bkX}" y="${yy}" width="${bkW}" height="22" rx="11" fill="none" stroke="${brandKit ? t.emerald : t.line}" stroke-width="${brandKit ? 1.4 : 1}"/>
  <circle cx="${bkX + 13}" cy="${yy + 11}" r="2.5" fill="${brandKit ? "#10b981" : t.tickPendingRing}"/>
  <text x="${bkX + 22}" y="${yy + 15}" ${SANS} font-size="11" font-weight="500" fill="${brandKit ? t.emerald : t.muted}">Brand kit</text>`;
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

// The Beanline preview pane with the rented photograph: paper, rust
// brand, the latte-art hero figure (drawn), and the files pane whose
// star row is assets/latte-art-hero.jpg at 2878.1 kB.
function beanlinePreview(theme, h, { projectId, files, photo = true }) {
  const t = U[theme];
  const top = CHROME_H + HEADER_H;
  const urlH = 34;
  const filesH = 60 + files.list.length * 20;
  const siteY = top + urlH, siteH = h - siteY - filesH;
  let filesRows = "";
  files.list.forEach((f, i) => {
    const yy = h - filesH + 46 + i * 20;
    filesRows += `<text x="${PV_X + 16 + (f.indent || 0) * 14}" y="${yy}" ${MONO} font-size="11" fill="${f.hot ? t.green : t.muted}">${esc(f.name)}</text>`;
    filesRows += `<text x="${W - 16}" y="${yy}" ${MONO} font-size="10" fill="${t.faint}" text-anchor="end">${esc(f.size)}</text>`;
  });
  const sx = PV_X + 14, sw = PV_W - 28;
  const paper = "#FAF6F0", brand = "#B3441A", inkc = "#2B2B2B";
  const lx = sx + 24, ly = siteY + 32;
  // the coffee-bean logo mark + wordmark, then the hero, then the photo
  const bean = `<g transform="translate(${lx},${ly})">
    <ellipse cx="12" cy="14" rx="10" ry="13" fill="none" stroke="${brand}" stroke-width="2.2"/>
    <path d="M 12 2 C 8 8, 16 20, 12 27" fill="none" stroke="${brand}" stroke-width="2"/>
  </g>
  <text x="${lx + 32}" y="${ly + 22}" ${SERIF} font-size="19" fill="${inkc}">Beanline</text>`;
  let photoSvg = "";
  if (photo) {
    const py = siteY + 236, pw = sw - 48, ph2 = siteH - 258;
    const cx2 = sx + 24 + pw / 2, cy2 = py + ph2 * 0.56;
    const cr = Math.min(pw, ph2) * 0.33;
    photoSvg = `<clipPath id="photo-${theme}"><rect x="${sx + 24}" y="${py}" width="${pw}" height="${ph2}" rx="4"/></clipPath>
    <g clip-path="url(#photo-${theme})">
      <rect x="${sx + 24}" y="${py}" width="${pw}" height="${ph2}" fill="url(#wood-${theme})"/>
      <ellipse cx="${cx2}" cy="${cy2 + cr * 0.55}" rx="${cr * 1.45}" ry="${cr * 0.55}" fill="#e8dcc6"/>
      <circle cx="${cx2}" cy="${cy2}" r="${cr}" fill="#f3ead9"/>
      <circle cx="${cx2}" cy="${cy2}" r="${cr * 0.82}" fill="#b97a4b"/>
      <path d="M ${cx2} ${cy2 - cr * 0.15} C ${cx2 - cr * 0.5} ${cy2 - cr * 0.75}, ${cx2 - cr * 0.9} ${cy2 - cr * 0.1}, ${cx2} ${cy2 + cr * 0.55} C ${cx2 + cr * 0.9} ${cy2 - cr * 0.1}, ${cx2 + cr * 0.5} ${cy2 - cr * 0.75}, ${cx2} ${cy2 - cr * 0.15} Z" fill="#f3ead9"/>
    </g>
    <rect x="${sx + 24}" y="${py}" width="${pw}" height="${ph2}" rx="4" fill="none" stroke="${brand}" stroke-opacity="0.7"/>`;
  }
  const siteSvg = `<rect x="${sx}" y="${siteY + 12}" width="${sw}" height="${siteH - 24}" rx="10" fill="${paper}" stroke="${t.line}"/>
  <defs><linearGradient id="wood-${theme}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#a06a42"/><stop offset="1" stop-color="#6f4426"/>
  </linearGradient></defs>
  ${bean}
  <text x="${sx + 26}" y="${siteY + 96}" ${SERIF} font-size="10.5" letter-spacing="2.2" fill="${brand}">SPECIALTY COFFEE, SIX STORES, ONE STEADY PACE</text>
  <text x="${sx + 24}" y="${siteY + 146}" ${SERIF} font-size="44" font-weight="700" fill="${inkc}">Beanline</text>
  <text x="${sx + 26}" y="${siteY + 174}" ${SANS} font-size="13" fill="${inkc}">Slow coffee for fast mornings</text>
  <rect x="${sx + 26}" y="${siteY + 190}" width="126" height="34" fill="${brand}"/>
  <text x="${sx + 89}" y="${siteY + 212}" ${SANS} font-size="12.5" font-weight="600" fill="#ffffff" text-anchor="middle">Find your store</text>
  ${photoSvg}`;
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

function emptyPreview(theme, h, { projectId }) {
  const t = U[theme];
  const top = CHROME_H + HEADER_H;
  const filesH = 60 + 20;
  return `<line x1="${PV_X}" y1="${top}" x2="${PV_X}" y2="${h}" stroke="${t.line}" stroke-width="1"/>
  <text x="${PV_X + 16}" y="${top + 22}" ${MONO} font-size="11.5" fill="${t.faint}">/preview/${projectId}/</text>
  <rect x="${W - 118}" y="${top + 6}" width="56" height="22" rx="6" fill="none" stroke="${t.line}"/>
  <text x="${W - 90}" y="${top + 21}" ${SANS} font-size="10.5" fill="${t.muted}" text-anchor="middle">Reload</text>
  <line x1="${PV_X}" y1="${top + 34}" x2="${W}" y2="${top + 34}" stroke="${t.line}" stroke-width="1"/>
  <circle cx="${PV_X + PV_W / 2}" cy="${(h + top) / 2 - 40}" r="5" fill="${t.tickPendingRing}"/>
  <text x="${PV_X + PV_W / 2}" y="${(h + top) / 2 - 8}" ${SANS} font-size="14" font-weight="600" fill="${t.muted}" text-anchor="middle">Nothing to preview yet</text>
  <text x="${PV_X + PV_W / 2}" y="${(h + top) / 2 + 14}" ${SANS} font-size="11.5" fill="${t.faint}" text-anchor="middle">Ask for a site and watch it appear here.</text>
  <line x1="${PV_X}" y1="${h - filesH}" x2="${W}" y2="${h - filesH}" stroke="${t.line}" stroke-width="1"/>
  <text x="${PV_X + 16}" y="${h - filesH + 24}" ${MONO} font-size="10.5" letter-spacing="1.5" fill="${t.faint}">FILES</text>
  <text x="${W - 16}" y="${h - filesH + 24}" ${MONO} font-size="10.5" fill="${t.faint}" text-anchor="end">1</text>
  <text x="${PV_X + 16}" y="${h - filesH + 46}" ${MONO} font-size="11" fill="${t.muted}">AGENTS.md</text>
  <text x="${W - 16}" y="${h - filesH + 46}" ${MONO} font-size="10" fill="${t.faint}" text-anchor="end">644 B</text>`;
}

const BEANLINE_FILES = {
  count: 7,
  list: [
    { name: "AGENTS.md", size: "644 B" },
    { name: "assets/", size: "" },
    { name: "latte-art-hero.jpg", size: "2878.1 kB", indent: 1, hot: true },
    { name: "logo.svg", size: "417 B", indent: 1 },
    { name: "brief/", size: "" },
    { name: "brief.md", size: "1.0 kB", indent: 1 },
    { name: "index.html", size: "13.9 kB" },
  ],
};

const SIDEBAR_ROWS = (active) => [
  { name: "skill-with", sub: "Read brief/brief.md and build the site…", time: "4h ago", active: active === "skill-with" },
  { name: "Beanline (MCP imagery)", sub: "Read brief/brief.md and build the one…", time: "19m ago", active: active === "imagery" },
  { name: "Beanline (rented tools)", sub: "Read brief/brief.md and build the one…", time: "3m ago", active: active === "rented" },
];

/* ============================================================
   3. browser-mcp: the dessert. The finished rented-tools build,
   receipt with the brand-kit chip, the photo in the preview
   (mirrors p12-e2e-mcp.png).
   ============================================================ */
function browserMcp(theme) {
  const t = U[theme];
  const h = 900;
  let y = CHROME_H + HEADER_H + 34 + 14;
  const parts = [];
  const add = (p, gap = 12) => { parts.push(p.svg); y += p.h + gap; };

  add(approvalCard(theme, y, {
    kind: "rented",
    message: ['Allow the openverse MCP server to run tool', '"search_images"?'],
    resolved: "Approved for this session by you, just now",
  }), 8);
  add(commandBadge(theme, y, "openverse:search_images", { kind: "MCP" }), 8);
  add(commandBadge(theme, y, "openverse:search_images", { kind: "MCP" }), 12);
  add(proseRich(theme, y, [
    ["Also:"],
    [{ code: "assets/logo.svg" }, " copied; the CC0 latte-art hero"],
    ["photo downloaded into ", { code: "assets/latte-art-hero.jpg" }, "."],
    ["What's in the page: one semantic header, main,"],
    ["sections, and footer; exactly one h1; the hero with"],
    ["the logo, tagline, CTA, and the downloaded latte-art"],
    ["image; menu and stores from the brief copy."],
  ]), 6);
  add(receiptRow(theme, y, ["brand kit", "512,195 tokens this turn", "136s"], { first: t.emerald }), 14);
  add(planPanel(theme, y, [
    { step: "Read brief and inventory shipped assets", status: "completed" },
    { step: "Find and download a CC-licensed latte-art hero", status: "completed" },
    { step: "Build the one-page Beanline site in index.html", status: "completed" },
    { step: "Verify structure, copy fidelity, brief compliance", status: "completed" },
  ], { progress: "4/4", explanation: "Build completed after brief review, asset download, authoring, and checks." }), 0);

  const footer = chatFooter(theme, h, { brandKit: true });
  const bar = publishBar(theme, footer.top - 42);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">
  <rect width="${W}" height="${h}" fill="${t.pageBg}"/>
  ${chrome(theme)}
  ${appHeader(theme, { activeMode: "standard", blurb: "Write inside this workspace; the network stays off.", gauge: { turn: "512.2k", thread: "512.2k" }, tools: "green" })}
  ${sidebar(theme, h, SIDEBAR_ROWS("rented"))}
  ${chatBar(theme, { name: "Beanline (rented tools)", mode: "standard" })}
  ${parts.join("\n  ")}
  ${bar.svg}
  ${footer.svg}
  ${beanlinePreview(theme, h, { projectId: "5b577826", files: BEANLINE_FILES })}
</svg>`;
}

/* ============================================================
   4. browser-cards: both approval kinds in ONE turn, mid-build.
   The rented-tool elicitation card (resolved, for session) and
   the curl command card (open) from p12-sse-mcp.txt.
   ============================================================ */
function browserCards(theme) {
  const t = U[theme];
  const h = 900;
  let y = CHROME_H + HEADER_H + 34 + 14;
  const parts = [];
  const add = (p, gap = 12) => { parts.push(p.svg); y += p.h + gap; };

  add(userBubble(theme, y, [
    "Read brief/brief.md and build the one-page site it",
    "describes. For the hero, use the openverse MCP",
    "image-search tools to find ONE CC-licensed photo",
    "of latte art, then download that actual image file",
    "into assets/ using curl.",
  ], { chip: "brand kit" }), 14);
  add(approvalCard(theme, y, {
    kind: "rented",
    message: ['Allow the openverse MCP server to run tool', '"search_images"?'],
    resolved: "Approved for this session by you, just now",
  }), 10);
  add(commandBadge(theme, y, "openverse:search_images", { kind: "MCP" }), 8);
  add(commandBadge(theme, y, "openverse:search_images", { kind: "MCP" }), 14);
  add(approvalCard(theme, y, {
    kind: "command",
    countdown: "expires in 108s",
    reason: [
      "Do you want to allow downloading the requested CC-licensed",
      "latte-art photo with curl so I can place the actual image",
      "file in assets/?",
    ],
    command: [
      "/bin/zsh -lc 'mkdir -p assets && cp brief/assets/logo.svg",
      "  assets/logo.svg && curl -L \"https://upload.wikimedia.org/",
      "  wikipedia/commons/3/35/Latte_art_heart….jpg\"",
      "  -o assets/latte-art-hero.jpg'",
    ],
  }), 0);

  const footer = chatFooter(theme, h, { brandKit: true });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">
  <rect width="${W}" height="${h}" fill="${t.pageBg}"/>
  ${chrome(theme)}
  ${appHeader(theme, { activeMode: "standard", blurb: "Write inside this workspace; the network stays off.", gauge: { turn: "94.3k", thread: "94.3k" }, tools: "green" })}
  ${sidebar(theme, h, SIDEBAR_ROWS("rented"))}
  ${chatBar(theme, { name: "Beanline (rented tools)", mode: "standard" })}
  ${parts.join("\n  ")}
  ${footer.svg}
  ${emptyPreview(theme, h, { projectId: "5b577826" })}
</svg>`;
}

/* ============================================================
   5. browser-status-healthy: the tools panel open over the
   finished build (mirrors p12-e2e-status-healthy.png).
   ============================================================ */
function browserStatusHealthy(theme) {
  const t = U[theme];
  const h = 720;
  let y = CHROME_H + HEADER_H + 34 + 14;
  const parts = [];
  const add = (p, gap = 12) => { parts.push(p.svg); y += p.h + gap; };
  add(proseRich(theme, y, [
    ["The hero uses the downloaded latte-art photo with"],
    ["meaningful alt text; the CSS stays within the brand"],
    ["palette variables and uses no external resources."],
  ]), 6);
  add(receiptRow(theme, y, ["brand kit", "512,195 tokens this turn", "136s"], { first: t.emerald }), 0);
  const footer = chatFooter(theme, h, { brandKit: true });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">
  <rect width="${W}" height="${h}" fill="${t.pageBg}"/>
  ${chrome(theme)}
  ${appHeader(theme, { activeMode: "standard", blurb: "Write inside this workspace; the network stays off.", gauge: { turn: "512.2k", thread: "512.2k" }, tools: "green" })}
  ${sidebar(theme, h, SIDEBAR_ROWS("rented"))}
  ${chatBar(theme, { name: "Beanline (rented tools)", mode: "standard" })}
  ${parts.join("\n  ")}
  ${footer.svg}
  ${beanlinePreview(theme, h, { projectId: "5b577826", files: { count: 7, list: [
    { name: "AGENTS.md", size: "644 B" },
    { name: "assets/", size: "" },
    { name: "latte-art-hero.jpg", size: "2878.1 kB", indent: 1, hot: true },
  ] } })}
  ${mcpPanel(theme, [
    { name: "openverse", state: "ready", tail: "ready · v0.1.0",
      tools: "5 tools: get_image_details, get_image_s…" },
  ])}
</svg>`;
}

/* ============================================================
   6. browser-status-broken: the break-it. Red pill, red row, the
   engine's error verbatim (mirrors p12-e2e-status.png).
   ============================================================ */
function browserStatusBroken(theme) {
  const t = U[theme];
  const h = 720;
  let y = CHROME_H + HEADER_H + 34 + 14;
  const parts = [];
  const add = (p, gap = 12) => { parts.push(p.svg); y += p.h + gap; };
  add(userBubble(theme, y, ["Reply with exactly the word OK and nothing else."]), 14);
  add(proseRich(theme, y, [["OK"]]), 6);
  add(receiptRow(theme, y, ["15,804 tokens this turn", "3s"]), 0);
  const footer = chatFooter(theme, h);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">
  <rect width="${W}" height="${h}" fill="${t.pageBg}"/>
  ${chrome(theme)}
  ${appHeader(theme, { activeMode: "standard", blurb: "Write inside this workspace; the network stays off.", gauge: { turn: "15.8k", thread: "15.8k" }, tools: "red" })}
  ${sidebar(theme, h, [
    { name: "Beanline (rented tools)", sub: "Read brief/brief.md and build the one…", time: "5m ago", active: false },
    { name: "broken-mcp-probe", sub: "Reply with exactly the word OK and n…", time: "1m ago", active: true },
  ], { picker: "blank workspace" })}
  ${chatBar(theme, { name: "broken-mcp-probe", mode: "standard" })}
  ${parts.join("\n  ")}
  ${footer.svg}
  ${emptyPreview(theme, h, { projectId: "54c8a85c" })}
  ${mcpPanel(theme, [
    { name: "openverse", state: "failed", tail: "failed",
      error: ["MCP client for `openverse` failed to", "start: MCP startup failed: No such", "file or directory (os error 2)"] },
  ])}
</svg>`;
}

/* ============================================================
   7. fig-three-surfaces: the three extension surfaces, ascending
   cost, where each lives, how each is invoked.
   ============================================================ */
function figThreeSurfaces(theme) {
  const t = D[theme];
  const w = 1240, h = 880;
  const label = (x, y, txt, size = 13, fill = t.ink, anchor = "middle", font = MONO) =>
    `<text x="${x}" y="${y}" ${font} font-size="${size}" fill="${fill}" text-anchor="${anchor}">${txt}</text>`;
  const box = (x, y, bw, bh, fill, stroke, sw = 1.5) =>
    `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;

  const CW = 368, GAP = 20, X0 = 48, Y0 = 130, CH2 = 560;
  const cols = [
    {
      title: "AGENTS.MD", sub: "the site-rules poster", tint: t.greenTint, line: t.line, accent: t.green,
      rows: [
        ["LIVES IN", ["the workspace itself:", "site/AGENTS.md, written by", "the project scaffold"]],
        ["LOADED", ["by the engine, on its own,", "from the thread's cwd:", "every turn, zero client code"]],
        ["THE PROOF", ["thread/start returns", 'instructionSources:', '[".../AGENTS.md"]', "([] without the file)"]],
        ["COSTS", ["nothing per turn from you;", "always on for this workspace"]],
      ],
    },
    {
      title: "SKILLS", sub: "the pattern book", tint: t.skyTint, line: t.line, accent: t.sky,
      rows: [
        ["LIVES IN", ["CODEX_HOME/skills/&lt;name&gt;/", "SKILL.md + support files", "(engine-side, not workspace)"]],
        ["LOADED", ["on demand, per turn: a", '{type: "skill", name, path}', "input item ahead of the text"]],
        ["THE PROOF", ["skills/list names it and", "hands back the exact path", "the invocation wants"]],
        ["COSTS", ["the playbook's tokens, only", "on turns that attach it"]],
      ],
    },
    {
      title: "MCP SERVERS", sub: "the rented power tools", tint: t.accentTint, line: t.accentLine, accent: t.accent,
      rows: [
        ["LIVES IN", ["config.toml in CODEX_HOME:", "[mcp_servers.openverse]", 'command = "npx" + args']],
        ["LOADED", ["launched by the engine as", "its own child process;", "the agent calls tools mid-turn", "(mcpToolCall items)"]],
        ["THE PROOF", ["mcpServerStatus/list has the", "inventory; every call is", "gated by an elicitation"]],
        ["COSTS", ["a process, a per-call", "approval, and real trust:", "it runs OUTSIDE the sandbox"]],
      ],
    },
  ];

  let colsSvg = "";
  cols.forEach((c, i) => {
    const x = X0 + i * (CW + GAP);
    colsSvg += box(x, Y0, CW, CH2, c.tint, c.line, 1.4);
    colsSvg += label(x + 20, Y0 + 34, c.title, 13, c.accent, "start");
    colsSvg += label(x + 20, Y0 + 56, c.sub, 11.5, t.muted, "start", SANS);
    colsSvg += `<line x1="${x + 20}" y1="${Y0 + 70}" x2="${x + CW - 20}" y2="${Y0 + 70}" stroke="${t.line}"/>`;
    let yy = Y0 + 96;
    for (const [k, lines] of c.rows) {
      colsSvg += label(x + 20, yy, k, 9.5, t.faint, "start");
      yy += 20;
      for (const l of lines) {
        colsSvg += label(x + 20, yy, l, 11.5, l.includes("{") || l.includes("[") || l.includes("_") || l.includes("/") ? t.ink : t.muted, "start", l.includes("{") || l.includes("[") || l.includes("_") || l.includes("/") ? MONO : SANS);
        yy += 19;
      }
      yy += 12;
    }
  });

  // ascending-cost arrow under the header
  const ax1 = X0 + CW / 2, ax2 = X0 + 2 * (CW + GAP) + CW / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
  <rect width="${w}" height="${h}" fill="${t.paper}"/>
  <text x="48" y="52" ${MONO} font-size="12" letter-spacing="2.5" fill="${t.faint}">THREE WAYS TO EXTEND THE WORKSHOP &#183; NO PROMPT CHANGES</text>
  <line x1="48" y1="66" x2="${w - 48}" y2="66" stroke="${t.line}" stroke-width="1.5"/>
  <line x1="${ax1}" y1="100" x2="${ax2}" y2="100" stroke="${t.faint}" stroke-width="1.5"/>
  <path d="M ${ax2} 100 l -9 -5 l 0 10 z" fill="${t.faint}"/>
  ${label(w / 2, 92, "ASCENDING COST AND TRUST", 10.5, t.faint)}
  ${colsSvg}
  <rect x="48" y="${Y0 + CH2 + 24}" width="${w - 96}" height="120" rx="10" fill="${t.surface}" stroke="${t.line}"/>
  ${label(68, Y0 + CH2 + 52, "THE LAYERS COMPOSE (all three live in the canonical run)", 10.5, t.faint, "start")}
  ${label(68, Y0 + CH2 + 78, "The poster keeps every build self-contained &#183; the pattern book reads the client's assets before styling &#183;", 11.5, t.muted, "start")}
  ${label(68, Y0 + CH2 + 100, "the rented tool finds the photograph. Different layers, one turn: none of them edits a prompt.", 11.5, t.muted, "start")}
</svg>`;
}

/* ============================================================
   8. fig-elicitation-gate: THE truth. The per-call gate that
   approvalPolicy cannot see, the silent-off failure, the answer
   shape, and the persist ladder.
   ============================================================ */
function figElicitationGate(theme) {
  const t = D[theme];
  const w = 1240, h = 1100;
  const label = (x, y, txt, size = 13, fill = t.ink, anchor = "middle", font = MONO) =>
    `<text x="${x}" y="${y}" ${font} font-size="${size}" fill="${fill}" text-anchor="${anchor}">${txt}</text>`;
  const box = (x, y, bw, bh, fill, stroke, sw = 1.5) =>
    `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const arrow = (x1, y1, x2, y2, color = t.faint) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5"/>
     <path d="M ${x2} ${y2} l -5 -8 l 10 0 z" fill="${color}" transform="rotate(${(Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI - 90} ${x2} ${y2})"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
  <rect width="${w}" height="${h}" fill="${t.paper}"/>
  <text x="48" y="52" ${MONO} font-size="12" letter-spacing="2.5" fill="${t.faint}">THE ELICITATION GATE &#183; EVERY MCP TOOL CALL, REGARDLESS OF APPROVALPOLICY</text>
  <line x1="48" y1="66" x2="${w - 48}" y2="66" stroke="${t.line}" stroke-width="1.5"/>

  ${box(48, 90, 640, 90, t.chip, t.line)}
  ${label(70, 118, "the agent decides to call openverse:search_images", 13, t.ink, "start")}
  ${label(70, 142, "mid-turn, like any tool use. Then, before the server is contacted&#8230;", 11.5, t.muted, "start", SANS)}
  ${label(70, 164, "item/started &#183; mcpToolCall {server, tool, status: inProgress}", 11.5, t.muted, "start")}

  ${box(712, 90, 480, 90, "none", t.amberLine, 1.4)}
  ${label(734, 118, "APPROVALPOLICY HAS NO SAY (verified)", 10.5, t.amber, "start")}
  ${label(734, 142, 'the gate fired under untrusted, on-request AND "never"', 11.5, t.muted, "start", SANS)}
  ${label(734, 164, "(probe cases A and B: same request every time)", 11, t.faint, "start", SANS)}

  ${arrow(368, 180, 368, 214)}

  ${box(48, 214, 1144, 118, t.skyTint, t.skyLine, 2)}
  ${label(70, 242, "SERVER REQUEST &#183; mcpServer/elicitation/request   (has an id: the turn WAITS for your answer)", 12.5, t.sky, "start")}
  ${label(70, 268, `{"threadId", "turnId", "serverName": "openverse", "mode": "form",`, 11.5, t.muted, "start")}
  ${label(70, 290, `"_meta": {"codex_approval_kind": "mcp_tool_call", "persist": ["session", "always"], "tool_description", &#8230;},`, 11.5, t.muted, "start")}
  ${label(70, 312, `"message": "Allow the openverse MCP server to run tool \\"search_images\\"?", "requestedSchema": {&#8230;}}`, 11.5, t.muted, "start")}

  ${arrow(240, 332, 160, 396, t.red)}
  ${arrow(620, 332, 700, 396, t.green)}

  <!-- left: the silent OFF -->
  ${box(48, 396, 500, 240, t.redTint, t.redLine, 1.6)}
  ${label(70, 424, "NO HANDLER (the default)", 10.5, t.red, "start")}
  ${label(70, 450, "the client auto-answers the polite empty {}", 12, t.ink, "start")}
  ${label(70, 476, "&#8594; the engine scores it as a refusal:", 11.5, t.muted, "start", SANS)}
  ${label(70, 502, `mcpToolCall {status: "failed", error:`, 12, t.red, "start")}
  ${label(70, 524, `{"message": "user rejected MCP tool call"}}`, 12, t.red, "start")}
  ${label(70, 552, "item fails in 0s &#183; the server is NEVER contacted", 11.5, t.muted, "start", SANS)}
  ${label(70, 578, "no error surfaces anywhere else: the turn continues,", 11.5, t.muted, "start", SANS)}
  ${label(70, 598, "the agent works around it, the demo still &#8220;works&#8221;.", 11.5, t.muted, "start", SANS)}
  ${label(70, 622, "MCP IS SILENTLY OFF. This bit our own build (Part 12).", 11, t.red, "start")}

  <!-- right: the answer -->
  ${box(596, 396, 596, 240, t.greenTint, t.line, 1.6)}
  ${label(618, 424, "A REAL ANSWER (the fix)", 10.5, t.green, "start")}
  ${label(618, 452, `{"action": "accept", "content": {}}`, 13, t.ink, "start")}
  ${label(618, 478, `or "decline" / "cancel" &#183; the shape is the elicitation's,`, 11.5, t.muted, "start", SANS)}
  ${label(618, 498, `NOT the command-approval's: answering {"decision":`, 11.5, t.muted, "start", SANS)}
  ${label(618, 518, `"accept"} counts as no answer and still rejects the call`, 11.5, t.muted, "start", SANS)}
  ${label(618, 544, "(probe case A: the wrong dialect, refused)", 11, t.amber, "start")}
  ${label(618, 572, "Pagewright routes it through the Part 7 inbox as the", 11.5, t.muted, "start", SANS)}
  ${label(618, 592, 'card kind "mcp_tool_call": approve / for session / deny,', 11.5, t.muted, "start", SANS)}
  ${label(618, 612, "with a client-side timeout that declines honestly.", 11.5, t.muted, "start", SANS)}

  ${arrow(894, 636, 894, 678)}

  <!-- the persist ladder -->
  ${box(48, 678, 1144, 240, t.chip, t.line)}
  ${label(70, 706, "THE PERSIST LADDER (probe cases C / D / E, live counts)", 10.5, t.faint, "start")}
  ${label(70, 736, `plain {"action": "accept"}`, 12.5, t.ink, "start")}
  ${label(430, 736, "per CALL: the very next call asks again (2 calls = 2 asks)", 11.5, t.muted, "start", SANS)}
  ${label(70, 768, `+ "_meta": {"persist": "session"}`, 12.5, t.ink, "start")}
  ${label(430, 768, "quiets THIS tool for the engine process (2 calls = 1 ask; our canonical run)", 11.5, t.muted, "start", SANS)}
  ${label(70, 800, `+ "_meta": {"persist": "always"}`, 12.5, t.ink, "start")}
  ${label(430, 800, "the engine WRITES config.toml (2 calls = 1 ask now, 0 forever after):", 11.5, t.muted, "start", SANS)}
  ${label(430, 826, `[mcp_servers.openverse.tools.search_images]  approval_mode = "approve"`, 12, t.green, "start")}
  ${label(70, 858, "an operator can declare that per-tool table up front &#183; it is PER-TOOL ONLY:", 11.5, t.muted, "start", SANS)}
  ${label(70, 882, `a server-level approval_mode = "approve" is silently ignored (probe F: 7 elicitations anyway)`, 11.5, t.amber, "start")}

  <rect x="48" y="${h - 140}" width="${w - 96}" height="96" rx="10" fill="${t.surface}" stroke="${t.line}"/>
  ${label(68, h - 112, "Why a second gate? approvalPolicy governs the agent's HANDS (commands, patches): the sandbox can contain those.", 11.5, t.muted, "start")}
  ${label(68, h - 90, "A rented tool runs outside the walls (next figure), so consent is collected per call, at the airlock,", 11.5, t.muted, "start")}
  ${label(68, h - 68, "no matter how much you trust the agent itself.", 11.5, t.muted, "start")}
</svg>`;
}

/* ============================================================
   9. fig-two-networks: MCP servers outside the turn sandbox vs
   the agent's own curl inside it. Both card kinds, one turn.
   ============================================================ */
function figTwoNetworks(theme) {
  const t = D[theme];
  const w = 1240, h = 960;
  const label = (x, y, txt, size = 13, fill = t.ink, anchor = "middle", font = MONO) =>
    `<text x="${x}" y="${y}" ${font} font-size="${size}" fill="${fill}" text-anchor="${anchor}">${txt}</text>`;
  const box = (x, y, bw, bh, fill, stroke, sw = 1.5, dash = "") =>
    `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
  const arrow = (x1, y1, x2, y2, color = t.faint) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5"/>
     <path d="M ${x2} ${y2} l -5 -8 l 10 0 z" fill="${color}" transform="rotate(${(Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI - 90} ${x2} ${y2})"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
  <rect width="${w}" height="${h}" fill="${t.paper}"/>
  <text x="48" y="52" ${MONO} font-size="12" letter-spacing="2.5" fill="${t.faint}">TWO NETWORKS, ONE TURN &#183; WHY THE RENTED TOOL REACHES THE INTERNET AND CURL ASKS</text>
  <line x1="48" y1="66" x2="${w - 48}" y2="66" stroke="${t.line}" stroke-width="1.5"/>

  <!-- the operator's machine -->
  ${box(48, 96, 1144, 620, "none", t.line, 1.5)}
  ${label(70, 124, "YOUR MACHINE &#183; the operator's side", 10.5, t.faint, "start")}

  <!-- codex app-server -->
  ${box(80, 148, 520, 180, t.chip, t.line)}
  ${label(102, 176, "codex app-server (the engine)", 13, t.ink, "start")}
  ${label(102, 202, "reads config.toml &#183; launches each [mcp_servers.*]", 11.5, t.muted, "start", SANS)}
  ${label(102, 222, "entry as ITS OWN CHILD PROCESS", 11.5, t.muted, "start", SANS)}
  ${box(102, 244, 340, 60, t.accentTint, t.accentLine, 1.4)}
  ${label(120, 270, "openverse (npx mcp-openverse@0.1.1)", 12, t.accent, "start")}
  ${label(120, 292, "an ordinary process: NO sandbox around it", 11, t.muted, "start", SANS)}

  <!-- the internet -->
  ${box(920, 168, 240, 120, t.skyTint, t.skyLine, 1.6)}
  ${label(940, 196, "THE INTERNET", 10.5, t.sky, "start")}
  ${label(940, 222, "api.openverse.org", 12, t.ink, "start")}
  ${label(940, 246, "upload.wikimedia.org", 12, t.ink, "start")}
  ${label(940, 270, "fonts, CDNs, everything", 11, t.faint, "start", SANS)}

  ${arrow(442, 274, 920, 228, t.accent)}
  ${label(660, 240, "allowed search_images: straight out,", 11, t.accent, "start", SANS)}
  ${label(660, 258, "even with networkAccess: false", 11, t.accent, "start")}

  <!-- the turn sandbox -->
  ${box(80, 372, 720, 310, t.surface, t.accent, 2, "8 6")}
  ${label(102, 400, "THE TURN SANDBOX &#183; workspaceWrite + networkAccess: false", 10.5, t.accent, "start")}
  ${label(102, 426, "wraps the COMMANDS the agent runs, and only those", 11.5, t.muted, "start", SANS)}
  ${box(102, 448, 560, 90, t.chip, t.line)}
  ${label(122, 476, `curl -L "https://upload.wikimedia.org/&#8230;/Latte_art&#8230;.jpg"`, 11.5, t.ink, "start")}
  ${label(122, 500, "-o assets/latte-art-hero.jpg", 11.5, t.ink, "start")}
  ${label(122, 524, "the agent's own hands, downloading INTO the workspace", 11, t.muted, "start", SANS)}
  ${arrow(662, 494, 920, 300, t.amber)}
  ${label(676, 526, "blocked wall (Part 6): escalation =", 11, t.amber, "start", SANS)}
  ${label(676, 544, "a Part 7 command approval card", 11, t.amber, "start", SANS)}
  ${label(102, 570, "the workspace: brief/ &#183; AGENTS.md &#183; assets/ &#183; index.html", 11.5, t.muted, "start")}
  ${label(102, 596, "writes land here and only here (writableRoots)", 11, t.faint, "start", SANS)}
  ${label(102, 646, "The sandbox contains what the agent DOES. It cannot contain what a rented tool", 11.5, t.ink, "start", SANS)}
  ${label(102, 666, "sees or fetches: that trust decision happens at the elicitation gate instead.", 11.5, t.ink, "start", SANS)}

  <!-- the strip: both cards, one turn -->
  ${box(48, 748, 1144, 150, t.chip, t.line)}
  ${label(70, 776, "BOTH CARD KINDS IN ONE TURN (p12-sse-mcp.txt, the canonical run)", 10.5, t.faint, "start")}
  ${box(70, 794, 540, 84, t.amberTint, t.amberLine, 1.3)}
  ${label(88, 820, "APPROVAL NEEDED &#183; RENTED TOOL", 9.5, t.amber, "start")}
  ${label(88, 844, 'Allow the openverse MCP server to run tool', 11.5, t.ink, "start", SANS)}
  ${label(88, 862, '"search_images"? &#8594; approve for session (1 ask, 2 calls)', 11.5, t.ink, "start", SANS)}
  ${box(630, 794, 540, 84, t.amberTint, t.amberLine, 1.3)}
  ${label(648, 820, "APPROVAL NEEDED &#183; COMMAND", 9.5, t.amber, "start")}
  ${label(648, 844, "curl -L &#8230;Latte_art&#8230;.jpg -o assets/latte-art-hero.jpg", 11.5, t.ink, "start")}
  ${label(648, 862, "the download is the agent's hands: the Part 6/7 grid governs it", 11.5, t.muted, "start", SANS)}

  <rect x="48" y="${h - 40}" width="${w - 96}" height="1" fill="none"/>
  ${label(w / 2, h - 26, "Rented tools widen what the agent can SEE. The walls still decide what it can DO.", 11.5, t.accent)}
</svg>`;
}

/* ============================================================
   10. term captures (dark only).
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

// The elicitation request, verbatim from the approvalPolicy probe
// (case B: policy "never", the request fires anyway; the unanswered
// {} becomes a rejection).
const termElicitation = () =>
  term('mcpServer/elicitation/request &#183; fired under approvalPolicy "never"', [
    `${F(TT.faint, '# thread/start ... "approvalPolicy": "never" ... turn asks for one MCP call')}`,
    `${F(TT.blue, "SERVER REQUEST")} method: mcpServer/elicitation/request`,
    `  params: {"threadId": "019f46b7-730b-&#8230;", "turnId": "019f46b7-7340-&#8230;",`,
    `    "serverName": ${F(TT.green, '"openverse"')}, "mode": "form",`,
    `    "_meta": {"codex_approval_kind": ${F(TT.accent, '"mcp_tool_call"')},`,
    `             "persist": ["session", "always"], "tool_description": "Get`,
    `             statistics about image providers and counts", &#8230;},`,
    `    "message": ${F(TT.amber, '"Allow the openverse MCP server to run tool')}`,
    `             ${F(TT.amber, '\\"get_image_stats\\"?"')}, "requestedSchema": {&#8230;}}`,
    ``,
    `  ${F(TT.faint, "-> responded {} (the unhandled-request default)")}`,
    ``,
    `mcpToolCall completed: {"server": "openverse", "tool": "get_image_stats",`,
    `  "status": ${F(TT.red, '"failed"')}, "error": {"message": ${F(TT.red, '"user rejected MCP tool call"')}}}`,
    ``,
    `${F(TT.faint, '# same request under "untrusted" and "on-request": approvalPolicy has no say.')}`,
    `${F(TT.faint, "# duration 0s. The openverse server was never contacted.")}`,
  ]);

// The bug artifact: the pre-fix product stream, quietly rejecting
// every call while the turn "works" (p12-sse-mcp-unhandled.txt).
const termRejected = () =>
  term("the bug artifact &#183; Pagewright's stream BEFORE the elicitation handler", [
    `${F(TT.faint, "# ask: find a latte-art photo with the openverse MCP tools, then curl it in")}`,
    `data: {"type": "item_start", "kind": ${F(TT.accent, '"mcpToolCall"')}, "detail": {"server":`,
    `  "openverse", "tool": "search_images", "status": "inProgress"}}`,
    `data: {"type": "item_done",  "kind": "mcpToolCall", "detail": {&#8230; "status": ${F(TT.red, '"failed"')}}}`,
    `data: {"type": "item_done",  "kind": "mcpToolCall", "detail": {&#8230; "status": ${F(TT.red, '"failed"')}}}`,
    `data: {"type": "item_done",  "kind": "mcpToolCall", "detail": {"tool":`,
    `  "search_images_for_essay", "status": ${F(TT.red, '"failed"')}}}`,
    `data: {"type": "item_done",  "kind": "mcpToolCall", "detail": {"tool":`,
    `  "get_image_stats", "status": ${F(TT.red, '"failed"')}}}`,
    ``,
    `${F(TT.faint, "# zero rented-tool cards on screen. Then the agent routes around its own tools:")}`,
    `data: {"type": "approval_request", "kind": ${F(TT.amber, '"command"')}, "command": "/bin/zsh -lc`,
    `  \\"curl -L 'https://${F(TT.blue, "api.openverse.engineering")}/v1/images/?q=latte%20art&#8230;'\\"",`,
    `  "reason": "Do you want to allow network access so I can query Openverse&#8230;"}`,
    ``,
    `data: {"type": "complete", "status": ${F(TT.green, '"completed"')}, "duration_ms": 532584,`,
    `  "usage": {"totalTokens": ${F(TT.amber, "630655")}, &#8230;}}`,
    ``,
    `${F(TT.faint, "# the turn succeeded, the page got its photo, the demo looked fine.")}`,
    `${F(TT.faint, "# MCP was OFF the whole time, and nothing on screen said so.")}`,
  ]);

/* ============================================================
   write everything
   ============================================================ */
for (const theme of ["light", "dark"]) {
  writeFileSync(`${OUT}/cover-${theme}.svg`, cover(theme));
  writeFileSync(`${OUT}/fig-three-surfaces-${theme}.svg`, figThreeSurfaces(theme));
  writeFileSync(`${OUT}/fig-elicitation-gate-${theme}.svg`, figElicitationGate(theme));
  writeFileSync(`${OUT}/fig-two-networks-${theme}.svg`, figTwoNetworks(theme));
  writeFileSync(`${OUT}/browser-mcp-${theme}.svg`, browserMcp(theme));
  writeFileSync(`${OUT}/browser-cards-${theme}.svg`, browserCards(theme));
  writeFileSync(`${OUT}/browser-status-healthy-${theme}.svg`, browserStatusHealthy(theme));
  writeFileSync(`${OUT}/browser-status-broken-${theme}.svg`, browserStatusBroken(theme));
}
writeFileSync(`${OUT}/term-elicitation.svg`, termElicitation());
writeFileSync(`${OUT}/term-rejected.svg`, termRejected());
console.log("part-12 SVGs written to", OUT);

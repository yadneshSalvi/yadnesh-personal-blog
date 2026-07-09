/**
 * Part 9 SVG assets for "Codex App Server in Production".
 * Everything mirrors REAL runs (2026-07-09, codex-cli 0.142.4 /
 * gpt-5.4-mini behind the part-09 backend, clean CODEX_HOME):
 * - the replay captures (p9-sse-replay.txt): a fresh `curl -N` replays the
 *   Sunny Sips project's log as ids 1..689 then an id-less caught_up;
 *   `Last-Event-ID: 685` yields exactly 686-689; a viewer that died at
 *   730 mid-turn reconnects and gets 731 first, then follows live to the
 *   footer turn's receipt (75,861 tokens, id 925).
 * - the two-tab e2e (p9-e2e-twotabs.png / p9-e2e-tab1/2.png, 10/10 PASS):
 *   Stop clicked in tab 2 lands "stopped by you · 6s" in both tabs; the
 *   curl approval card renders in both and "Approve" clicked in tab 2
 *   resolves it in tab 1; receipt 31,149 tokens · 7s.
 * - the kill -9 e2e (p9-sse-restart.txt / p9-e2e-restart.png, 5/5 PASS):
 *   backend killed 10s into a turn, tail seq 1372 (a reasoning_delta),
 *   restart sweeps the turn to 'orphaned' and appends backend_restarted
 *   as seq 1373; workspace md5 identical before/after; the reconnecting
 *   tab gets the tombstone with zero user action; the next chat resumes
 *   the SAME thread. The restart screenshot also carries the bonus beat:
 *   given an empty workspace the agent FOUND another project's
 *   index.html via an out-of-workspace read (reads are open, Part 6) and
 *   offered to patch it: 134,810 tokens · 41s.
 * Hosts shown reader-world (localhost:3000). Same deliberate
 * substitution as Parts 7-8: the running app letters some labels with an
 * em-dash ("The files and the conversation survived — send the next
 * message...", the boom-loop prompt); house rule bans that glyph in
 * drawn SVG text, so these captures letter a colon / middot instead.
 *
 * Usage: node scripts/gen-codex-part9-svgs.mjs
 */
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";

const BASE = "/Users/yadneshsalvi/code/yadnesh-personal-blog/public/images/series/codex";
const P1 = `${BASE}/part-1`;
const OUT = `${BASE}/part-9`;
mkdirSync(OUT, { recursive: true });

const MONO = `font-family="'SF Mono', Menlo, Consolas, monospace"`;
const SANS = `font-family="-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---- shared palettes (ink & paper tokens, same as Parts 1-8) ----
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

// App-window chrome + UI palettes (stone tokens, same as Parts 3-8 captures)
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
  },
};

/* ============================================================
   1. COVER: templated from the Part 1 cover.
   ============================================================ */
function cover(theme) {
  const accent = theme === "light" ? "#b3441a" : "#e5825a";
  let svg = readFileSync(`${P1}/cover-${theme}.svg`, "utf8");
  svg = svg
    .replace(">01</text>", ">09</text>")
    .replace("PART 1 OF 13", "PART 9 OF 13")
    .replace(
      `font-size="92" fill="${theme === "light" ? "#1f1c19" : "#ebe7df"}" letter-spacing="-1">Your first <tspan font-style="italic" fill="${accent}">thread</tspan>`,
      `font-size="80" fill="${theme === "light" ? "#1f1c19" : "#ebe7df"}" letter-spacing="-1">Survive the <tspan font-style="italic" fill="${accent}">refresh</tspan>`
    )
    .replace(
      "Speak raw JSON-RPC to the engine inside Codex. Get a website back.",
      "Every event in a log, every tab a viewer. Refresh mid-build, lose nothing."
    );
  return svg;
}

/* ============================================================
   2. Shared app-window pieces (Parts 3-8 conventions), plus the
   Part 9 newcomers: the reconnecting chip and the notice pill.
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

// The Part 9 header: optional reconnecting chip between the wordmark and
// the gauge. gauge: {turn, thread} or null.
function appHeader(theme, { activeMode, blurb, gauge = null, reconnecting = false }) {
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
  let chip = "";
  if (reconnecting) {
    const label = "reconnecting&#8230;";
    const cw = 118;
    const cx0 = blurbAnchor - cw - 8;
    chip = `<circle cx="${cx0}" cy="${y + HEADER_H / 2}" r="3" fill="${t.amberDot}"/>
  <text x="${cx0 + 10}" y="${y + HEADER_H / 2 + 4}" ${MONO} font-size="11" fill="${t.amberText}">${label}</text>`;
    blurbAnchor = cx0 - 16;
  }
  return `<line x1="0" y1="${y + HEADER_H}" x2="${W}" y2="${y + HEADER_H}" stroke="${t.line}" stroke-width="1"/>
  <circle cx="24" cy="${y + HEADER_H / 2}" r="5" fill="${t.accent}"/>
  <text x="38" y="${y + HEADER_H / 2 + 5}" ${SANS} font-size="15" font-weight="700" fill="${t.ink}">Pagewright</text>
  <text x="150" y="${y + HEADER_H / 2 + 5}" ${MONO} font-size="11" fill="${t.faint}">the site builder</text>
  <text x="${blurbAnchor}" y="${y + HEADER_H / 2 + 4}" ${SANS} font-size="11" fill="${t.faint}" text-anchor="end">${esc(blurb)}</text>
  ${chip}
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
      } else if (seg.link) {
        s += `\n  <text x="${x}" y="${yy}" ${SANS} font-size="13" fill="${t.accent}" text-decoration="underline">${esc(seg.link)}</text>`;
        x += Math.ceil(seg.link.length * 6.35);
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

// The receipt line: first part tinted (red for stopped, faint otherwise).
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

// The Part 9 notice pill: the amber tombstone the replay delivers.
function noticePill(theme, y, lines) {
  const t = U[theme];
  const bh = 14 + lines.length * 17;
  const widest = Math.max(...lines.map((l) => l.length));
  const bw = Math.min(Math.ceil(widest * 5.9) + 32, CC_W);
  const x = CC_X + (CC_W - bw) / 2;
  let body = "";
  lines.forEach((l, i) => {
    body += `\n  <text x="${x + bw / 2}" y="${y + 20 + i * 17}" ${SANS} font-size="11" fill="${t.amberText}" text-anchor="middle">${esc(l)}</text>`;
  });
  return {
    svg: `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="${bh / 2}" fill="${t.amberBg}" stroke="${t.amberLine}" stroke-opacity="0.7"/>${body}`,
    h: bh,
  };
}

function chatFooter(theme, h, { running = false } = {}) {
  const t = U[theme];
  const y = h - 62;
  const sendW = 62, stopW = 58;
  const sendX = PV_X - 16 - sendW;
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

function previewShell(theme, h, { projectId, files }) {
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
      filesRows += `<text x="${PV_X + 16}" y="${yy}" ${MONO} font-size="11" fill="${t.muted}">${esc(f.name)}</text>
  <text x="${W - 16}" y="${yy}" ${MONO} font-size="10" fill="${t.faint}" text-anchor="end">${esc(f.size)}</text>`;
    });
  }
  return `<line x1="${PV_X}" y1="${top}" x2="${PV_X}" y2="${h}" stroke="${t.line}" stroke-width="1"/>
  <text x="${PV_X + 16}" y="${top + 22}" ${MONO} font-size="11.5" fill="${t.faint}">/preview/${projectId}/</text>
  <rect x="${W - 118}" y="${top + 6}" width="56" height="22" rx="6" fill="none" stroke="${t.line}"/>
  <text x="${W - 90}" y="${top + 21}" ${SANS} font-size="10.5" fill="${t.muted}" text-anchor="middle">Reload</text>
  <rect x="${W - 56}" y="${top + 6}" width="40" height="22" rx="6" fill="none" stroke="${t.line}" opacity="0.55"/>
  <text x="${W - 36}" y="${top + 21}" ${SANS} font-size="10.5" fill="${t.faint}" text-anchor="middle" opacity="0.8">Diff</text>
  <line x1="${PV_X}" y1="${siteY}" x2="${W}" y2="${siteY}" stroke="${t.line}" stroke-width="1"/>
  <circle cx="${PV_X + PV_W / 2}" cy="${siteY + siteH / 2 - 34}" r="4" fill="${t.faint}" opacity="0.7"/>
  <text x="${PV_X + PV_W / 2}" y="${siteY + siteH / 2}" ${SANS} font-size="14" font-weight="600" fill="${t.muted}" text-anchor="middle">Nothing to preview yet</text>
  <text x="${PV_X + PV_W / 2}" y="${siteY + siteH / 2 + 22}" ${SANS} font-size="11.5" fill="${t.faint}" text-anchor="middle">Ask for a site and watch it appear here.</text>
  <line x1="${PV_X}" y1="${h - filesH}" x2="${W}" y2="${h - filesH}" stroke="${t.line}" stroke-width="1"/>
  <rect x="${PV_X + 1}" y="${h - filesH + 1}" width="${PV_W - 1}" height="${filesH - 1}" fill="${t.panel}" opacity="0.35"/>
  <text x="${PV_X + 16}" y="${h - filesH + 24}" ${MONO} font-size="10.5" letter-spacing="1.5" fill="${t.faint}">FILES</text>
  <text x="${W - 16}" y="${h - filesH + 24}" ${MONO} font-size="10.5" fill="${t.faint}" text-anchor="end">${files.list.length}</text>
  ${filesRows}`;
}

/* ============================================================
   3. browser-restart: the tombstone + the reconnecting chip
   (mirrors p9-e2e-restart.png; two beats of the same minute in
   one frame, and the annotation says which is which).
   ============================================================ */
function browserRestart(theme) {
  const t = U[theme];
  const h = 900;
  let y = CHROME_H + HEADER_H + 34 + 16;
  const parts = [];
  const add = (p, gap = 13) => { parts.push(p.svg); y += p.h + gap; };

  // The bonus beat: the tail of the previous turn, in which the agent,
  // handed an empty workspace, FOUND another project's site by reading
  // outside the bench (reads are open; writes are not).
  add(proseRich(theme, y, [
    ["This workspace has no site file. Searching more broadly,"],
    ["the only index.html on this machine's readable disk is at"],
    [{ link: "…/backend/projects/aa1b16f7/site/index.html" }, " ,"],
    ["another project's workspace. If you want, I can patch"],
    ["that file instead."],
  ]), 8);
  add(receiptRow(theme, y, ["134,810 tokens this turn", "41s"]), 16);
  add(userBubble(theme, y, [
    "Run exactly this command and narrate: for i in",
    "1 2 3 4 5 6 7 8 9 10 11 12; do echo boom $i;",
    "sleep 2; done : then add a press section.",
  ]));
  add(thinkingRow(theme, y), 8);
  add(proseRich(theme, y, [
    ["I'm running the exact ", { code: "boom" }, " loop first, then I'll"],
    ["locate the site file and add a press section if the"],
    ["workspace contains one."],
  ]), 10);
  add(commandBadge(theme, y, "Running: for i in 1 2 3 4 5 6 7 8 9 10 11 12; do…", { state: "spin" }), 6);
  add(receiptRow(theme, y, ["backend restarted mid-build"]), 14);
  add(noticePill(theme, y, [
    "The backend restarted mid-build. The files and the",
    "conversation survived: send the next message to continue.",
  ]), 0);

  const t9 = U[theme];
  const annot = `<text x="${W - 26}" y="${CHROME_H + HEADER_H + 92}" ${SANS} font-size="10.5" fill="${t9.faint}" text-anchor="end">&#8598; the chip, while the backend was down (EventSource retrying);</text>
  <text x="${W - 26}" y="${CHROME_H + HEADER_H + 108}" ${SANS} font-size="10.5" fill="${t9.faint}" text-anchor="end">in the chat: the tombstone its reconnect delivered, seq 1373</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">
  <rect width="${W}" height="${h}" fill="${t.pageBg}"/>
  ${chrome(theme)}
  ${appHeader(theme, { activeMode: "standard", blurb: "", gauge: { turn: "134.8k", thread: "166.0k" }, reconnecting: true })}
  ${sidebar(theme, h, [
    { name: "replay-test", sub: "Build a tiny one-page site for a lemon…", time: "41m ago" },
    { name: "twotabs", sub: "Run exactly this command and narrat…", time: "38m ago", active: true },
  ])}
  ${chatBar(theme, { name: "twotabs", mode: "standard" })}
  ${parts.join("\n  ")}
  ${annot}
  ${chatFooter(theme, h)}
  ${previewShell(theme, h, { projectId: "5867099e", files: { list: [] } })}
</svg>`;
}

/* ============================================================
   4. browser-twotabs: two windows, one log (mirrors
   p9-e2e-twotabs.png / tab1 / tab2, 10/10 PASS run).
   ============================================================ */
function browserTwoTabs(theme) {
  const t = U[theme];
  const WW = 1250, TW = 610, GAP = WW - TW * 2; // two windows, thin gutter
  const TH = 640, TOP = 34;
  const H = TOP + TH + 16;

  // One mini window at x0. Everything inside uses local coordinates.
  function miniWindow(x0, { annotate }) {
    const c = CH[theme];
    const chromeH = 40, headH = 36;
    const chatW = 396, pvX = chatW;
    const CX = 14, CW = chatW - 28;
    let s = `<g transform="translate(${x0},${TOP})">
    <rect x="0" y="0" width="${TW}" height="${TH}" rx="10" fill="${t.pageBg}" stroke="${D[theme].line}" stroke-width="1.5"/>
    <path d="M 0 10 a 10 10 0 0 1 10 -10 h ${TW - 20} a 10 10 0 0 1 10 10 v ${chromeH - 10} h -${TW} z" fill="${c.chromeBg}"/>
    <line x1="0" y1="${chromeH}" x2="${TW}" y2="${chromeH}" stroke="${c.chromeLine}" stroke-width="1.2"/>
    <circle cx="20" cy="20" r="5" fill="${c.dots}"/><circle cx="38" cy="20" r="5" fill="${c.dots}"/><circle cx="56" cy="20" r="5" fill="${c.dots}"/>
    <rect x="${TW / 2 - 110}" y="9" width="220" height="22" rx="11" fill="${c.urlFill}" stroke="${c.urlStroke}"/>
    <text x="${TW / 2}" y="24" ${MONO} font-size="11" fill="${c.urlText}" text-anchor="middle">localhost:3000</text>`;
    // header
    s += `
    <line x1="0" y1="${chromeH + headH}" x2="${TW}" y2="${chromeH + headH}" stroke="${t.line}"/>
    <circle cx="18" cy="${chromeH + headH / 2}" r="4" fill="${t.accent}"/>
    <text x="30" y="${chromeH + headH / 2 + 4}" ${SANS} font-size="12.5" font-weight="700" fill="${t.ink}">Pagewright</text>
    <rect x="${TW - 148}" y="${chromeH + 7}" width="134" height="22" rx="6" fill="none" stroke="${t.line}" stroke-width="1.1"/>
    <text x="${TW - 138}" y="${chromeH + 22}" ${MONO} font-size="9.5" fill="${t.muted}">31.1k</text>
    <text x="${TW - 100}" y="${chromeH + 22}" ${MONO} font-size="9.5" fill="${t.faint}">&#183; 31.1k thread</text>`;
    // chat/preview split
    const top = chromeH + headH;
    s += `
    <line x1="${pvX}" y1="${top}" x2="${pvX}" y2="${TH}" stroke="${t.line}"/>
    <text x="${pvX + 14}" y="${top + 20}" ${MONO} font-size="10" fill="${t.faint}">/preview/5867099e/</text>
    <line x1="${pvX}" y1="${top + 30}" x2="${TW}" y2="${top + 30}" stroke="${t.line}"/>
    <text x="${(pvX + TW) / 2}" y="${top + 180}" ${SANS} font-size="11.5" font-weight="600" fill="${t.muted}" text-anchor="middle">Nothing to preview yet</text>
    <line x1="${pvX}" y1="${TH - 74}" x2="${TW}" y2="${TH - 74}" stroke="${t.line}"/>
    <text x="${pvX + 14}" y="${TH - 52}" ${MONO} font-size="9.5" letter-spacing="1.5" fill="${t.faint}">FILES</text>
    <text x="${pvX + 14}" y="${TH - 32}" ${SANS} font-size="10" fill="${t.faint}">The workspace is empty.</text>`;
    // chat content, local helpers at mini scale
    let y = top + 14;
    const bubble = (lines) => {
      const widest = Math.max(...lines.map((l) => l.length));
      const bw = Math.min(Math.ceil(widest * 5.7) + 24, CW * 0.95);
      const bh = 12 + lines.length * 16;
      const bx = CX + CW - bw;
      let b = `<rect x="${bx}" y="${y}" width="${bw}" height="${bh}" rx="11" fill="${t.userBubble}"/>`;
      lines.forEach((l, i) => {
        b += `<text x="${bx + 12}" y="${y + 19 + i * 16}" ${SANS} font-size="10.8" fill="${t.userText}">${esc(l)}</text>`;
      });
      y += bh + 10;
      return b;
    };
    const receipt = (parts, stopped = false) => {
      let b = "", x = CX;
      parts.forEach((p, i) => {
        const fill = i === 0 && stopped ? t.red : t.faint;
        b += `<text x="${x}" y="${y + 10}" ${MONO} font-size="9.8" fill="${fill}">${esc(p)}</text>`;
        x += (p.length + 1) * 5.9;
        if (i < parts.length - 1) {
          b += `<text x="${x}" y="${y + 10}" ${MONO} font-size="9.8" fill="${t.faint}">&#183;</text>`;
          x += 11;
        }
      });
      y += 22;
      return b;
    };
    const prose = (lines) => {
      let b = "";
      lines.forEach((l, i) => {
        b += `<text x="${CX}" y="${y + 12 + i * 17}" ${SANS} font-size="11" fill="${t.ink}">${esc(l)}</text>`;
      });
      y += lines.length * 17 + 8;
      return b;
    };
    const badge = (label) => {
      const b = `<rect x="${CX}" y="${y}" width="${CW - 10}" height="28" rx="7" fill="${t.badgeBg}" stroke="${t.line}"/>
      <text x="${CX + 10}" y="${y + 18.5}" ${SANS} font-size="10.5" fill="${t.green}">&#x2713;</text>
      <text x="${CX + 24}" y="${y + 18.5}" ${SANS} font-size="10.8" fill="${t.ink}">${esc(label)}</text>
      <text x="${CX + CW - 24}" y="${y + 18}" ${SANS} font-size="8.5" letter-spacing="1" fill="${t.faint}">COMMAND</text>`;
      y += 38;
      return b;
    };
    const approvalCard = (highlight) => {
      const ah = 118;
      const stroke = highlight ? t.accent : t.line;
      const b = `<rect x="${CX}" y="${y}" width="${CW - 10}" height="${ah}" rx="9" fill="${t.badgeBg}" stroke="${stroke}" stroke-width="${highlight ? 1.8 : 1.2}"/>
      <text x="${CX + 12}" y="${y + 20}" ${MONO} font-size="9" letter-spacing="1.2" fill="${t.amberText}">APPROVAL NEEDED &#183; COMMAND</text>
      <text x="${CX + 12}" y="${y + 40}" ${SANS} font-size="10.3" fill="${t.ink}">Allow this networked curl command to run outside</text>
      <text x="${CX + 12}" y="${y + 56}" ${SANS} font-size="10.3" fill="${t.ink}">the sandbox to return the requested header lines?</text>
      <rect x="${CX + 12}" y="${y + 64}" width="${CW - 34}" height="24" rx="5" fill="${t.preBg}"/>
      <text x="${CX + 20}" y="${y + 80}" ${MONO} font-size="9.5" fill="${t.preText}">/bin/zsh -lc 'curl -sI https://example.com | head -3'</text>
      <line x1="${CX + 12}" y1="${y + 96}" x2="${CX + CW - 22}" y2="${y + 96}" stroke="${t.line}"/>
      <text x="${CX + 12}" y="${y + 112}" ${SANS} font-size="10" fill="${t.green}">Approved by you &#183; 10:41:22</text>`;
      y += ah + 10;
      return b;
    };

    s += bubble(["Run exactly this command and narrate: for i in", "1 2 3 4 5 6 7 8 9 10 11 12; do echo tick $i; sleep 2;", "done : then add a contact section to index.html."]);
    s += receipt(["stopped by you", "6s"], true);
    s += bubble(["Run exactly this command: curl -sI", "https://example.com | head -3 . The sandbox blocks", "network access, so request escalated permissions."]);
    s += prose(["I'll run the exact curl command you specified and", "return the first three header lines. Network access is", "blocked in the sandbox, so I'm requesting escalated", "permissions for this one command."]);
    s += badge("Running: curl -sI https://example.com | head -3");
    s += approvalCard(annotate);
    s += prose(["HTTP/2 200 date: Thu, 09 Jul 2026 05:11:22 GMT"]);
    s += receipt(["31,149 tokens this turn", "7s"]);
    s += `</g>`;
    return s;
  }

  const dd = D[theme];
  const kicker = (x, txt, accent = false) =>
    `<text x="${x}" y="20" ${MONO} font-size="11" letter-spacing="2" fill="${accent ? dd.accent : dd.faint}">${txt}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WW}" height="${H}" viewBox="0 0 ${WW} ${H}">
  <rect width="${WW}" height="${H}" fill="${dd.paper}"/>
  ${kicker(0, "TAB 1 &#183; SENT EVERY MESSAGE")}
  ${kicker(TW + GAP, "TAB 2 &#183; NEVER TYPED &#183; CLICKED STOP, THEN APPROVE", true)}
  ${miniWindow(0, { annotate: false })}
  ${miniWindow(TW + GAP, { annotate: true })}
</svg>`;
}

/* ============================================================
   5. fig-worker-viewer: the architecture change, drawn.
   ============================================================ */
function figWorkerViewer(theme) {
  const t = D[theme];
  const w = 1240, h = 960;
  const label = (x, y, txt, size = 13, fill = t.ink, anchor = "middle", font = MONO) =>
    `<text x="${x}" y="${y}" ${font} font-size="${size}" fill="${fill}" text-anchor="${anchor}">${txt}</text>`;
  const box = (x, y, bw, bh, fill, stroke, sw = 1.5) =>
    `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const arrow = (x1, y1, x2, y2, color = t.faint, dash = "") =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" ${dash ? `stroke-dasharray="${dash}"` : ""}/>
     <path d="M ${x2} ${y2} l -5 -8 l 10 0 z" fill="${color}" transform="rotate(${(Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI - 90} ${x2} ${y2})"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
  <rect width="${w}" height="${h}" fill="${t.paper}"/>
  <text x="48" y="52" ${MONO} font-size="12" letter-spacing="2.5" fill="${t.faint}">RUNNING AND WATCHING STOP SHARING A LIFETIME</text>
  <line x1="48" y1="66" x2="${w - 48}" y2="66" stroke="${t.line}" stroke-width="1.5"/>

  <!-- the before strip -->
  ${box(48, 88, w - 96, 92, "none", t.redLine, 1.2).replace('stroke-width="1.2"', 'stroke-width="1.2" stroke-dasharray="7 5"')}
  ${label(70, 116, "PARTS 2-8", 10.5, t.red, "start")}
  ${label(70, 140, "POST /chat held the only pipe: the consumer loop lived inside the response, so whoever typed WAS the audience.", 12, t.muted, "start", SANS)}
  ${label(70, 160, `A refresh cut it, events drained into a queue nobody would read again, and on a one-way wire "silence and thinking are indistinguishable" (Part 2's confession).`, 12, t.muted, "start", SANS)}

  <!-- the run lane -->
  ${box(48, 220, 300, 96, t.chip, t.line)}
  ${label(198, 252, "POST /projects/{id}/chat", 13.5, t.ink)}
  ${label(198, 276, "answers in milliseconds with a", 11, t.muted, "middle", SANS)}
  ${label(198, 294, `claim ticket: {turn_id, stream_url}`, 11.5, t.accent)}

  ${arrow(198, 316, 198, 352)}
  ${label(210, 340, "turn/start &#183; spawns the consumer", 10.5, t.faint, "start")}

  ${box(48, 352, 300, 128, t.accentTint, t.accentLine, 2)}
  ${label(198, 382, "the consumer task", 14.5, t.accent)}
  ${label(198, 406, "drain the queue &#8594; translate() &#8594;", 11.5, t.ink)}
  ${label(198, 426, "append to the log &#183; one per turn", 11.5, t.ink)}
  ${label(198, 452, "held in CONSUMERS (asyncio keeps", 10.5, t.muted, "middle", SANS)}
  ${label(198, 468, "only weak refs to tasks)", 10.5, t.muted, "middle", SANS)}

  ${arrow(348, 416, 452, 416, t.accent)}
  ${label(400, 402, "append", 10.5, t.accent)}

  <!-- the log -->
  ${box(452, 336, 340, 190, t.surface, t.line, 2)}
  ${label(622, 366, "events.db &#183; SQLite, WAL mode", 13.5, t.ink)}
  ${label(622, 390, "events: PK (project_id, seq)", 12, t.muted)}
  ${label(622, 410, "seq = COALESCE(MAX(seq),0)+1 in the INSERT", 10.5, t.faint)}
  ${label(622, 430, "turns: running &#8594; completed | orphaned", 12, t.muted)}
  <line x1="472" y1="446" x2="772" y2="446" stroke="${t.line}"/>
  ${label(622, 468, "the log is the source of truth;", 11, t.accent, "middle", SANS)}
  ${label(622, 486, "the wakeup (asyncio.Condition per project)", 10.5, t.muted, "middle", SANS)}
  ${label(622, 502, "is a courtesy knock on the door", 10.5, t.muted, "middle", SANS)}

  <!-- the watch lane -->
  ${arrow(792, 416, 896, 416, t.faint)}
  ${label(844, 402, "SELECT &#183; knock", 10.5, t.faint)}

  ${box(896, 336, 296, 190, t.chip, t.line)}
  ${label(1044, 366, "GET /projects/{id}/stream", 13, t.ink)}
  ${label(1044, 392, "the dumb pipe: replay rows past the", 11, t.muted, "middle", SANS)}
  ${label(1044, 410, "Last-Event-ID bookmark, mark the seam", 11, t.muted, "middle", SANS)}
  ${label(1044, 428, "(caught_up), then follow the doorbell", 11, t.muted, "middle", SANS)}
  <line x1="916" y1="446" x2="1172" y2="446" stroke="${t.line}"/>
  ${label(1044, 470, "knows nothing about turns or agents:", 10.5, t.faint, "middle", SANS)}
  ${label(1044, 488, "it reads a table and waits by a bell.", 10.5, t.faint, "middle", SANS)}
  ${label(1044, 508, "id: {seq} on every logged frame", 10.5, t.accent)}

  <!-- the audience row -->
  ${(() => {
    const names = [
      ["the tab that typed", "a viewer like any other"],
      ["the refreshed tab", "replays 1..N, then follows"],
      ["a second tab", "same log, same pixels"],
      ["curl -N", "the wire, unimpressed"],
    ];
    let s = "";
    const bw = 262, gap = 24, y0 = 596;
    const x0 = (w - (bw * 4 + gap * 3)) / 2;
    names.forEach((n, i) => {
      const x = x0 + i * (bw + gap);
      s += box(x, y0, bw, 74, t.chip, t.line, 1.2);
      s += label(x + bw / 2, y0 + 30, n[0], 12.5, t.ink);
      s += label(x + bw / 2, y0 + 54, n[1], 10.5, t.faint, "middle", SANS);
      s += arrow(x + bw / 2, y0 - 4, x + bw / 2, y0 - 38, t.faint, "5 4");
    });
    return s;
  })()}
  ${label(w / 2, 546, "every viewer, identical: replay, then follow", 11, t.muted)}

  <!-- the control lane -->
  ${box(48, 710, w - 96, 100, t.greenTint, t.line, 1.2)}
  ${label(70, 740, "CONTROL WAS ALREADY PROJECT-SCOPED", 10.5, t.green, "start")}
  ${label(70, 764, "POST /interrupt and POST /approvals/{id}/decision never belonged to a stream: they name the project, the ledger and the Futures live server-side,", 11.5, t.muted, "start", SANS)}
  ${label(70, 784, "and the outcome lands in the log, where every tab reads it. Part 7 and Part 8 built cross-tab control without knowing it; Part 9 just opens the second tab.", 11.5, t.muted, "start", SANS)}

  <rect x="48" y="${h - 116}" width="${w - 96}" height="68" rx="10" fill="${t.surface}" stroke="${t.line}"/>
  ${label(68, h - 88, "The debt from Part 2, formally repaid: the wire is still one-way and silence still looks like thinking on a socket,", 11.5, t.muted, "start")}
  ${label(68, h - 66, "but the socket is now disposable. The log has a bookmark; any viewer can die, come back, and ask what it missed.", 11.5, t.accent, "start")}
</svg>`;
}

/* ============================================================
   6. fig-replay: replay-then-follow with the real numbers.
   ============================================================ */
function figReplay(theme) {
  const t = D[theme];
  const w = 1240, h = 880;
  const label = (x, y, txt, size = 13, fill = t.ink, anchor = "middle", font = MONO) =>
    `<text x="${x}" y="${y}" ${font} font-size="${size}" fill="${fill}" text-anchor="${anchor}">${txt}</text>`;
  const box = (x, y, bw, bh, fill, stroke, sw = 1.5) =>
    `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="12" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const arrow = (x1, y1, x2, y2, color = t.faint, dash = "") =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" ${dash ? `stroke-dasharray="${dash}"` : ""}/>
     <path d="M ${x2} ${y2} l -5 -8 l 10 0 z" fill="${color}" transform="rotate(${(Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI - 90} ${x2} ${y2})"/>`;

  const LX = 300, RX = 940;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
  <rect width="${w}" height="${h}" fill="${t.paper}"/>
  <text x="48" y="52" ${MONO} font-size="12" letter-spacing="2.5" fill="${t.faint}">REPLAY, THEN FOLLOW &#183; ONE RECONNECT, VERBATIM</text>
  <line x1="48" y1="66" x2="${w - 48}" y2="66" stroke="${t.line}" stroke-width="1.5"/>

  <!-- browser side -->
  ${box(48, 100, 504, 108, t.chip, t.line)}
  ${label(70, 130, "THE BROWSER, AFTER A DROP", 10.5, t.faint, "start")}
  ${label(70, 158, "EventSource reconnects by itself and sends the", 12, t.muted, "start", SANS)}
  ${label(70, 178, "last id: it saw, as a header:", 12, t.muted, "start", SANS)}
  ${label(300, 200, "Last-Event-ID: 685", 14, t.accent, "start")}

  ${arrow(552, 154, 688, 154)}
  ${label(620, 140, "GET /stream", 10.5, t.faint)}

  <!-- server side -->
  ${box(688, 100, 504, 108, t.surface, t.line)}
  ${label(710, 130, "THE DUMB PIPE", 10.5, t.faint, "start")}
  ${label(710, 160, "SELECT seq, payload FROM events", 12.5, t.ink, "start")}
  ${label(710, 182, "WHERE project_id = ? AND seq &gt; 685", 12.5, t.accent, "start")}
  ${label(710, 200, "ORDER BY seq", 12.5, t.ink, "start")}

  <!-- the frames, verbatim from p9-sse-replay.txt T1b -->
  ${(() => {
    let s = "";
    const rows = [
      { id: "id: 686", body: `data: {"type": "text_delta", &#8230;}`, tint: false },
      { id: "id: 687", body: `data: {"type": "text_delta", &#8230;}`, tint: false },
      { id: "id: 688", body: `data: {"type": "item_done", "kind": "fileChange", &#8230;}`, tint: false },
      { id: "id: 689", body: `data: {"type": "complete", "status": "completed", "usage": &#8230;}`, tint: false },
      { id: "(no id)", body: `data: {"type": "caught_up", "last_seq": 689}`, tint: true },
    ];
    const y0 = 268, rh = 44;
    rows.forEach((r, i) => {
      const y = y0 + i * (rh + 10);
      s += box(220, y, 800, rh, r.tint ? t.accentTint : t.chip, r.tint ? t.accentLine : t.line, r.tint ? 2 : 1.2);
      s += label(244, y + 27, r.id, 12.5, r.tint ? t.accent : t.green, "start");
      s += label(340, y + 27, r.body, 12, r.tint ? t.accent : t.muted, "start");
    });
    s += label(1040, y0 + 27, "&#8592; exactly the four", 11, t.faint, "start", SANS);
    s += label(1040, y0 + 45, "rows past the", 11, t.faint, "start", SANS);
    s += label(1040, y0 + 63, "bookmark. Not 689,", 11, t.faint, "start", SANS);
    s += label(1040, y0 + 81, "not zero: four.", 11, t.faint, "start", SANS);
    return s;
  })()}

  <!-- the caught_up lesson -->
  ${box(220, 560, 800, 106, "none", t.accentLine, 1.4)}
  ${label(244, 590, "WHY caught_up CARRIES NO id", 10.5, t.accent, "start")}
  ${label(244, 614, "The browser bookmarks the LAST id it saw, whatever frame carried it. caught_up is", 11.5, t.muted, "start", SANS)}
  ${label(244, 634, "ephemeral (never logged): give it an id and the bookmark can point past rows that exist,", 11.5, t.muted, "start", SANS)}
  ${label(244, 652, "at frames that were never written down. Only logged rows may move the bookmark.", 11.5, t.muted, "start", SANS)}

  <!-- follow phase -->
  ${arrow(620, 672, 620, 700, t.faint)}
  ${box(220, 700, 800, 88, t.chip, t.line)}
  ${label(244, 730, "THE FOLLOW PHASE", 10.5, t.faint, "start")}
  ${label(244, 754, "wait by the project's asyncio.Condition &#8594; re-read the log past the cursor &#8594; repeat;", 11.5, t.muted, "start", SANS)}
  ${label(244, 774, "15 quiet seconds become a keepalive comment. Mid-turn reconnect, live: died at 730, resumed at id: 731.", 11.5, t.muted, "start", SANS)}

  <rect x="48" y="${h - 66}" width="${w - 96}" height="1" fill="${t.line}"/>
  ${label(48, h - 38, "The whole contract is one header and one WHERE clause; the browser already speaks its half.", 12, t.accent, "start", SANS)}
</svg>`;
}

/* ============================================================
   7. term-replay (dark only, real captures from p9-sse-replay.txt)
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

const termReplay = () =>
  term("curl -N &#183; the log, replayed on demand (project aa1b16f7)", [
    `${F(TT.green, "$")} curl -sN localhost:8000/projects/aa1b16f7/stream ${F(TT.faint, "# a fresh viewer: no bookmark")}`,
    `id: ${F(TT.accent, "1")}`,
    `data: {"type": ${F(TT.accent, '"session_start"')}, "message": "Build a tiny one-page site for a`,
    `       lemonade stand called Sunny Sips&#8230;", "turn_id": "019f4543-e61d&#8230;", &#8230;}`,
    `${F(TT.faint, "&#8942; 687 more frames, every one wearing its seq as the SSE id: &#8230;")}`,
    `id: ${F(TT.accent, "689")}`,
    `data: {"type": ${F(TT.accent, '"complete"')}, "status": "completed", "usage": {"totalTokens": ${F(TT.amber, "83034")}, &#8230;}}`,
    `data: {"type": ${F(TT.blue, '"caught_up"')}, "last_seq": 689}   ${F(TT.faint, "# the seam. Note: NO id line")}`,
    ``,
    `${F(TT.faint, "# a tab that died at 685 asks for what it missed: the browser sends this header itself")}`,
    `${F(TT.green, "$")} curl -sN -H ${F(TT.amber, '"Last-Event-ID: 685"')} localhost:8000/projects/aa1b16f7/stream`,
    `id: ${F(TT.accent, "686")}   ${F(TT.faint, "&#8230;")}   id: ${F(TT.accent, "687")}   ${F(TT.faint, "&#8230;")}   id: ${F(TT.accent, "688")}   ${F(TT.faint, "&#8230;")}   id: ${F(TT.accent, "689")}   ${F(TT.faint, "# exactly four rows, then:")}`,
    `data: {"type": ${F(TT.blue, '"caught_up"')}, "last_seq": 689}`,
    ``,
    `${F(TT.faint, "# and mid-turn it is the same sentence: a viewer that died at 730 reconnected and got")}`,
    `id: ${F(TT.accent, "731")}  ${F(TT.faint, "first, then followed the live doorbell all the way to the receipt at id: 925.")}`,
  ]);

/* ============================================================
   write everything
   ============================================================ */
for (const theme of ["light", "dark"]) {
  writeFileSync(`${OUT}/cover-${theme}.svg`, cover(theme));
  writeFileSync(`${OUT}/fig-worker-viewer-${theme}.svg`, figWorkerViewer(theme));
  writeFileSync(`${OUT}/fig-replay-${theme}.svg`, figReplay(theme));
  writeFileSync(`${OUT}/browser-twotabs-${theme}.svg`, browserTwoTabs(theme));
  writeFileSync(`${OUT}/browser-restart-${theme}.svg`, browserRestart(theme));
}
writeFileSync(`${OUT}/term-replay.svg`, termReplay());
console.log("part-9 SVGs written to", OUT);

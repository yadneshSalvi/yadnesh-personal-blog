/**
 * Part 7 SVG assets for "Codex App Server in Production".
 * Everything mirrors REAL runs (2026-07-07, codex-cli 0.142.4 /
 * gpt-5.4-mini behind the part-07 backend, clean CODEX_HOME): the raw
 * item/commandExecution/requestApproval params (reason strings, the
 * narrow wire availableDecisions listing only accept /
 * acceptWithExecpolicyAmendment / cancel), the naked
 * item/fileChange/requestApproval params ({threadId, turnId, itemId,
 * startedAtMs, reason: null, grantRoot: null}, no diff, no file list),
 * the item/started patch that precedes it by the same millisecond, the
 * card texts, timestamps ("Denied by you · 1:15:56 AM"), and the
 * receipts (30,928 tokens · 19s approve run; 47,987 tokens · 13s deny
 * run) are measured values from the capture traces (p7-sse-*.txt,
 * probes/*.jsonl, p7-e2e-*.png). Hosts shown reader-world
 * (localhost:3000). One deliberate substitution: the running app draws
 * an em-dash in two labels ("Approval needed — command", "… approval —
 * answer the card …"); house rule bans that glyph in drawn SVG text, so
 * these captures letter a middot / colon instead.
 *
 * Usage: node scripts/gen-codex-part7-svgs.mjs
 */
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";

const BASE = "/Users/yadneshsalvi/code/yadnesh-personal-blog/public/images/series/codex";
const P1 = `${BASE}/part-1`;
const OUT = `${BASE}/part-7`;
mkdirSync(OUT, { recursive: true });

const MONO = `font-family="'SF Mono', Menlo, Consolas, monospace"`;
const SANS = `font-family="-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---- shared palettes (ink & paper tokens, same as Parts 1-6) ----
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
  blue: "#6fa8dc", red: "#d97676", amber: "#dcae62",
};

// App-window chrome + UI palettes (stone tokens, same as Parts 3-6 captures)
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
    diffHead: "#57534e", diffHunkBg: "#f0f9ff", diffHunk: "#0369a1",
    diffAddBg: "#f0fdf4", diffAdd: "#15803d",
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
    diffHead: "#d6d3d1", diffHunkBg: "#0c2536", diffHunk: "#7dd3fc",
    diffAddBg: "#0e2416", diffAdd: "#4ade80",
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
    .replace(">01</text>", ">07</text>")
    .replace("PART 1 OF 13", "PART 7 OF 13")
    .replace(
      `Your first <tspan font-style="italic" fill="${accent}">thread</tspan>`,
      `The foreman's <tspan font-style="italic" fill="${accent}">stamp</tspan>`
    )
    .replace(
      "Speak raw JSON-RPC to the engine inside Codex. Get a website back.",
      "The engine asks permission and waits. Approve, deny, or let the clock."
    );
  return svg;
}

/* ============================================================
   2. Shared app-window pieces (Parts 3-6 conventions: chrome,
   header with the Part 6 mode picker, sidebar, chat bar)
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

function chatBar(theme, { name, mode }) {
  const t = U[theme];
  const y = CHROME_H + HEADER_H;
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

function commandBadge(theme, y, label, { spinner = false, kind = "COMMAND" } = {}) {
  const t = U[theme];
  const bh = 34;
  const mark = spinner
    ? `<circle cx="${CC_X + 19}" cy="${y + 17}" r="6" fill="none" stroke="${t.faint}" stroke-width="2" stroke-dasharray="7 5"/>`
    : `<text x="${CC_X + 14}" y="${y + 21.5}" ${SANS} font-size="12.5" fill="${t.green}">&#x2713;</text>`;
  return {
    svg: `<rect x="${CC_X}" y="${y}" width="${CC_W - 20}" height="${bh}" rx="8" fill="${t.badgeBg}" stroke="${t.line}"/>
  ${mark}
  <text x="${CC_X + 30}" y="${y + 21.5}" ${SANS} font-size="12.5" fill="${t.ink}">${esc(label)}</text>
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

/* The Part 7 star: the approval card, mirrored from ApprovalCard.tsx and
   the real e2e captures. state: "pending" | {verdict, denied} */
function approvalCard(theme, y, opts) {
  const t = U[theme];
  const {
    kind, reason = null, command = null, cwd = null,
    diffLines = null, filesLine = null, state = "pending",
  } = opts;
  const x = CC_X, w = CC_W - 20;
  const pending = state === "pending";
  const headH = 26;
  let body = "";
  let bodyH = 0;

  // header strip (the app letters this with an em-dash; the house rule
  // for drawn SVG text swaps it for a middot)
  const label = kind === "command" ? "APPROVAL NEEDED &#183; COMMAND" : "APPROVAL NEEDED &#183; FILE CHANGE";

  if (reason) {
    const rl = reason;
    rl.forEach((line, i) => {
      body += `\n  <text x="${x + 14}" y="${y + headH + 18 + i * 18}" ${SANS} font-size="12" fill="${t.muted}">${esc(line)}</text>`;
    });
    bodyH += 10 + rl.length * 18;
  }
  if (command) {
    const py = y + headH + bodyH + 10;
    body += `\n  <rect x="${x + 14}" y="${py}" width="${w - 28}" height="30" rx="7" fill="${t.preBg}"/>
  <text x="${x + 26}" y="${py + 19.5}" ${MONO} font-size="11" fill="${t.preText}">${esc(command)}</text>`;
    bodyH += 40;
    if (cwd) {
      body += `\n  <text x="${x + 14}" y="${py + 46}" ${MONO} font-size="10" fill="${t.faint}">in ${esc(cwd)}</text>`;
      bodyH += 20;
    }
  }
  if (diffLines) {
    let dy = y + headH + bodyH + 8;
    for (const dl of diffLines) {
      const [cls, txt] = dl;
      const fills = {
        head: [null, t.diffHead, 700],
        hunk: [t.diffHunkBg, t.diffHunk, 400],
        add: [t.diffAddBg, t.diffAdd, 400],
      }[cls];
      if (fills[0]) body += `\n  <rect x="${x + 1}" y="${dy}" width="${w - 2}" height="20" fill="${fills[0]}"/>`;
      body += `\n  <text x="${x + 14}" y="${dy + 14.5}" ${MONO} font-size="11" font-weight="${fills[2]}" fill="${fills[1]}">${esc(txt)}</text>`;
      dy += 20;
    }
    bodyH += 8 + diffLines.length * 20;
  }
  if (filesLine) {
    body += `\n  <text x="${x + 14}" y="${y + headH + bodyH + 22}" ${MONO} font-size="10" fill="${t.faint}">${esc(filesLine)}</text>`;
    bodyH += 28;
  }
  bodyH += 10;

  // footer: buttons or outcome
  const footH = 40;
  const footY = y + headH + bodyH;
  let foot = `<line x1="${x}" y1="${footY}" x2="${x + w}" y2="${footY}" stroke="${t.line}"/>`;
  if (pending) {
    const btn = (bx, bw2, lbl, style) => {
      const solid = style === "solid";
      return `<rect x="${bx}" y="${footY + 8}" width="${bw2}" height="24" rx="7" fill="${solid ? t.segActive : "none"}" ${solid ? "" : `stroke="${t.line}"`}/>
  <text x="${bx + bw2 / 2}" y="${footY + 24}" ${SANS} font-size="11" font-weight="500" fill="${solid ? t.segActiveText : t.muted}" text-anchor="middle">${lbl}</text>`;
    };
    foot += btn(x + 14, 66, "Approve", "solid");
    foot += btn(x + 88, 130, "Approve for session", "line");
    foot += btn(x + 226, 46, "Deny", "line");
  } else {
    const color = state.denied ? t.red : t.green;
    foot += `<text x="${x + 14}" y="${footY + 25}" ${SANS} font-size="12" fill="${color}">${esc(state.verdict)}</text>`;
  }

  const ch = headH + bodyH + footH;
  const border = pending ? t.amberLine : t.line;
  const headBg = pending ? t.amberBg : t.panel;
  const dot = pending ? `<circle cx="${x + 16}" cy="${y + 13}" r="3.5" fill="${t.amberDot}"/>` : "";
  return {
    svg: `<rect x="${x}" y="${y}" width="${w}" height="${ch}" rx="10" fill="${t.badgeBg}" stroke="${border}" stroke-width="1.5"/>
  <path d="M ${x} ${y + headH} h ${w}" stroke="${t.line}" stroke-width="0"/>
  <rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${headH - 1}" rx="9" fill="${headBg}"/>
  <rect x="${x + 1}" y="${y + headH / 2}" width="${w - 2}" height="${headH / 2}" fill="${headBg}"/>
  ${dot}
  <text x="${x + (pending ? 27 : 14)}" y="${y + 17.5}" ${MONO} font-size="10" letter-spacing="1.2" fill="${pending ? t.amberText : t.faint}">${label}</text>
  ${body}
  ${foot}`,
    h: ch,
  };
}

function chatFooter(theme, h, { waiting = false, stop = false } = {}) {
  const t = U[theme];
  const y = h - 62;
  const btnW = 62, btnX = PV_X - 16 - btnW;
  // The app letters the chip with an em-dash; drawn SVG text uses a colon.
  const chip = waiting
    ? `<circle cx="${CC_X + 4}" cy="${y - 12}" r="3" fill="${t.amberDot}"/>
  <text x="${CC_X + 13}" y="${y - 8}" ${SANS} font-size="10.5" fill="${t.amberText}">The build is waiting for your approval: answer the card above to continue.</text>`
    : "";
  const btn = stop
    ? `<rect x="${btnX}" y="${y + 12}" width="${btnW}" height="36" rx="10" fill="none" stroke="${t.line}" stroke-width="1.5"/>
  <text x="${btnX + btnW / 2}" y="${y + 35}" ${SANS} font-size="12.5" font-weight="600" fill="#dc2626" text-anchor="middle">Stop</text>`
    : `<rect x="${btnX}" y="${y + 12}" width="${btnW}" height="36" rx="10" fill="${t.accent}" opacity="0.45"/>
  <text x="${btnX + btnW / 2}" y="${y + 35}" ${SANS} font-size="12.5" font-weight="600" fill="${t.btnText}" text-anchor="middle">Send</text>`;
  return `${chip}
  <line x1="${CHAT_X}" y1="${y}" x2="${PV_X}" y2="${y}" stroke="${t.line}" stroke-width="1"/>
  <rect x="${CC_X}" y="${y + 12}" width="${CC_W - btnW - 10}" height="36" rx="10" fill="${t.inputBg}" stroke="${t.line}" stroke-width="1.5"/>
  <text x="${CC_X + 13}" y="${y + 35}" ${SANS} font-size="12.5" fill="${t.placeholder}">Describe the site you want&#8230;</text>
  ${btn}`;
}

// The empty-workspace preview pane (the approval test projects start blank,
// like the real e2e captures).
function previewPaneEmpty(theme, h, { projectId }) {
  const t = U[theme];
  const top = CHROME_H + HEADER_H;
  const urlH = 34;
  const filesH = 96;
  const siteY = top + urlH, siteH = h - siteY - filesH;
  const mid = PV_X + PV_W / 2;
  return `<line x1="${PV_X}" y1="${top}" x2="${PV_X}" y2="${h}" stroke="${t.line}" stroke-width="1"/>
  <text x="${PV_X + 16}" y="${top + 22}" ${MONO} font-size="11.5" fill="${t.faint}">/preview/${projectId}/</text>
  <rect x="${W - 118}" y="${top + 6}" width="56" height="22" rx="6" fill="none" stroke="${t.line}"/>
  <text x="${W - 90}" y="${top + 21}" ${SANS} font-size="10.5" fill="${t.muted}" text-anchor="middle">Reload</text>
  <rect x="${W - 56}" y="${top + 6}" width="40" height="22" rx="6" fill="none" stroke="${t.line}" opacity="0.55"/>
  <text x="${W - 36}" y="${top + 21}" ${SANS} font-size="10.5" fill="${t.faint}" text-anchor="middle" opacity="0.8">Diff</text>
  <line x1="${PV_X}" y1="${siteY}" x2="${W}" y2="${siteY}" stroke="${t.line}" stroke-width="1"/>
  <circle cx="${mid}" cy="${siteY + siteH / 2 - 34}" r="4" fill="${t.faint}" opacity="0.7"/>
  <text x="${mid}" y="${siteY + siteH / 2}" ${SANS} font-size="14" font-weight="600" fill="${t.muted}" text-anchor="middle">Nothing to preview yet</text>
  <text x="${mid}" y="${siteY + siteH / 2 + 22}" ${SANS} font-size="11.5" fill="${t.faint}" text-anchor="middle">Ask for a site and watch it appear here.</text>
  <line x1="${PV_X}" y1="${h - filesH}" x2="${W}" y2="${h - filesH}" stroke="${t.line}" stroke-width="1"/>
  <rect x="${PV_X + 1}" y="${h - filesH + 1}" width="${PV_W - 1}" height="${filesH - 1}" fill="${t.panel}" opacity="0.35"/>
  <text x="${PV_X + 16}" y="${h - filesH + 24}" ${MONO} font-size="10.5" letter-spacing="1.5" fill="${t.faint}">FILES</text>
  <text x="${W - 16}" y="${h - filesH + 24}" ${MONO} font-size="10.5" fill="${t.faint}" text-anchor="end">0</text>
  <text x="${PV_X + 16}" y="${h - filesH + 46}" ${SANS} font-size="11" fill="${t.faint}">The workspace is empty.</text>`;
}

const SIDEBAR_ROWS = (active) => [
  { name: "approval accept test", sub: "Run exactly this command: curl -sI…", time: "13m ago", active: active === 0 },
  { name: "approval decline test", sub: "Save a copy of your working notes to…", time: "13m ago", active: active === 1 },
  { name: "acceptForSession test", sub: "Run exactly this command, character…", time: "12m ago", active: active === 2 },
  { name: "filechange approval test", sub: "Create a file at…", time: "8m ago", active: active === 3 },
  { name: "timeout test", sub: "Run exactly this command: curl -sI…", time: "8m ago", active: active === 4 },
  { name: "Untitled site", sub: "no conversation yet", time: "just now", active: active === 5 },
];

/* ============================================================
   3. browser-command: the dessert. A Standard-mode turn frozen on a
   command approval card (mirrors p7-e2e-command.png; the reason and
   command are from the real request).
   ============================================================ */
function browserCommand(theme) {
  const t = U[theme];
  const h = 780;
  let y = CHROME_H + HEADER_H + CHATBAR_H + 18;
  const parts = [];
  const add = (p, gap = 13) => { parts.push(p.svg); y += p.h + gap; };

  add(userBubble(theme, y, [
    "Run exactly this command: curl -sI",
    "https://example.com | head -3 . The sandbox",
    "blocks network access, so request escalated",
    "permissions to run it. Then report the",
    "HTTP status line.",
  ]));
  add(proseRich(theme, y, [
    ["Running the exact ", { code: "curl" }, " command now with"],
    ["escalated permissions so the network request"],
    ["can go through, then I'll report the HTTP"],
    ["status line from the output."],
  ]), 10);
  add(commandBadge(theme, y, "Running: curl -sI https://example.com | he…", { spinner: true }), 10);
  add(approvalCard(theme, y, {
    kind: "command",
    reason: [
      "Do you want to allow a networked curl request to",
      "https://example.com so I can return the HTTP",
      "status line?",
    ],
    command: "/bin/zsh -lc 'curl -sI https://example.com | head -3'",
    cwd: "…/backend/projects/ce59a45d/site",
  }), 12);
  add(workingRow(theme, y, "Building… 4s"), 0);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">
  <rect width="${W}" height="${h}" fill="${t.pageBg}"/>
  ${chrome(theme)}
  ${appHeader(theme, { activeMode: "standard", blurb: "Write inside this workspace; the network stays off." })}
  ${sidebar(theme, h, SIDEBAR_ROWS(0).slice(0, 4).concat([{ name: "Untitled site", sub: "no conversation yet", time: "just now" }]))}
  ${chatBar(theme, { name: "approval accept test", mode: "standard" })}
  ${parts.join("\n  ")}
  ${chatFooter(theme, h, { waiting: true, stop: true })}
  ${previewPaneEmpty(theme, h, { projectId: "ce59a45d" })}
</svg>`;
}

/* ============================================================
   4. browser-patch: the file-change card with the patch inline
   (mirrors p7-e2e-patch.png / the p7-sse-filechange run: the join
   table enriched the card with the diff the request never carried).
   ============================================================ */
function browserPatch(theme) {
  const t = U[theme];
  const h = 780;
  let y = CHROME_H + HEADER_H + CHATBAR_H + 18;
  const parts = [];
  const add = (p, gap = 13) => { parts.push(p.svg); y += p.h + gap; };

  add(userBubble(theme, y, [
    "Create a file OUTSIDE your workspace at",
    "~/pagewright-fc-test.txt with two lines:",
    "'approved by the foreman' and 'stamped'.",
    "Use a file patch (apply_patch), not a shell",
    "command. Request approval if needed.",
  ]));
  add(proseRich(theme, y, [
    ["I'm creating the requested file exactly at the"],
    ["target path with ", { code: "apply_patch" }, " and no shell"],
    ["commands, and requesting approval since it is"],
    ["outside the workspace."],
  ]), 10);
  add(commandBadge(theme, y, "Creating pagewright-fc-test.txt", { spinner: true, kind: "FILES" }), 10);
  add(approvalCard(theme, y, {
    kind: "file_change",
    diffLines: [
      ["head", "diff --git a/…/pagewright-fc-test.txt b/…/pagewright-…"],
      ["hunk", "@@ -0,0 +1,2 @@"],
      ["add", "+approved by the foreman"],
      ["add", "+stamped"],
    ],
    filesLine: "add: /Users/yadneshsalvi/pagewright-fc-test.txt",
  }), 12);
  add(workingRow(theme, y, "Building… 5s"), 0);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">
  <rect width="${W}" height="${h}" fill="${t.pageBg}"/>
  ${chrome(theme)}
  ${appHeader(theme, { activeMode: "standard", blurb: "Write inside this workspace; the network stays off." })}
  ${sidebar(theme, h, SIDEBAR_ROWS(3))}
  ${chatBar(theme, { name: "filechange approval test", mode: "standard" })}
  ${parts.join("\n  ")}
  ${chatFooter(theme, h, { waiting: true, stop: true })}
  ${previewPaneEmpty(theme, h, { projectId: "2fbbdd32" })}
</svg>`;
}

/* ============================================================
   5. browser-denied: the resolved card + the badge that lies
   (mirrors p7-e2e-resolved.png: item/completed fired for the denied
   patch, so the generic badge settled with a checkmark; the card's
   red line is the truth-teller).
   ============================================================ */
function browserDenied(theme) {
  const t = U[theme];
  const h = 700;
  let y = CHROME_H + HEADER_H + CHATBAR_H + 18;
  const parts = [];
  const add = (p, gap = 13) => { parts.push(p.svg); y += p.h + gap; };

  add(userBubble(theme, y, [
    "Create a file OUTSIDE your workspace at",
    "~/pagewright-fc-test.txt … using a file patch",
    "(apply_patch). Request approval if needed.",
  ]));
  add(commandBadge(theme, y, "Creating pagewright-fc-test.txt", { kind: "FILES" }), 18);
  parts.push(`<text x="${CC_X + CC_W - 20}" y="${y - 10}" ${SANS} font-size="9.5" fill="${t.faint}" text-anchor="end">&#8593; the badge settled with a &#x2713;</text>`);
  y += 6;
  add(approvalCard(theme, y, {
    kind: "file_change",
    diffLines: [
      ["head", "diff --git a/…/pagewright-fc-test.txt b/…/pagewright-…"],
      ["hunk", "@@ -0,0 +1,2 @@"],
      ["add", "+approved by the foreman"],
      ["add", "+stamped"],
    ],
    filesLine: "add: /Users/yadneshsalvi/pagewright-fc-test.txt",
    state: { verdict: "Denied by you · 1:15:56 AM", denied: true },
  }), 12);
  add(proseRich(theme, y, [
    ["The write was denied, so nothing landed at that"],
    ["path. I can save the same two lines inside the"],
    ["workspace instead if you want them kept."],
  ]), 8);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}">
  <rect width="${W}" height="${h}" fill="${t.pageBg}"/>
  ${chrome(theme)}
  ${appHeader(theme, { activeMode: "standard", blurb: "Write inside this workspace; the network stays off." })}
  ${sidebar(theme, h, SIDEBAR_ROWS(3))}
  ${chatBar(theme, { name: "filechange approval test", mode: "standard" })}
  ${parts.join("\n  ")}
  ${chatFooter(theme, h)}
  ${previewPaneEmpty(theme, h, { projectId: "2fbbdd32" })}
</svg>`;
}

/* ============================================================
   6. fig-reversed-request: Part 1's grammar grows its fourth shape.
   ============================================================ */
function figReversed(theme) {
  const t = D[theme];
  const w = 1240, h = 880;
  const label = (x, y, txt, size = 13, fill = t.ink, anchor = "middle", font = MONO) =>
    `<text x="${x}" y="${y}" ${font} font-size="${size}" fill="${fill}" text-anchor="${anchor}">${txt}</text>`;

  // the three known shapes, compressed to ghost cards
  const ghost = (x, title, badge, dir) => `
  <rect x="${x}" y="106" width="352" height="86" rx="12" fill="${t.surface}" stroke="${t.line}" stroke-width="1.5"/>
  ${label(x + 22, 138, title, 14.5, t.muted, "start")}
  ${label(x + 22, 162, dir, 11, t.faint, "start")}
  ${label(x + 330, 138, badge, 10.5, t.faint, "end")}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
  <rect width="${w}" height="${h}" fill="${t.paper}"/>
  <text x="48" y="52" ${MONO} font-size="12" letter-spacing="2.5" fill="${t.faint}">THE FOURTH SHAPE &#183; THE DIRECTION OF AUTHORITY REVERSES</text>
  <line x1="48" y1="66" x2="${w - 48}" y2="66" stroke="${t.line}" stroke-width="1.5"/>

  ${label(60, 94, "The grammar Part 1 taught (and Part 2's reader already routes):", 12, t.muted, "start", SANS)}
  ${ghost(60, "request", "ID &#183; YOU NUMBER IT", "you &#8594; engine &#183; one reply will quote your id")}
  ${ghost(444, "response", "SAME ID", "engine &#8594; you &#183; the reply that quotes it")}
  ${ghost(828, "notification", "NO ID", "engine &#8594; you &#183; narration, no reply owed")}

  <!-- the fourth shape, hero card: a REAL captured request -->
  ${label(60, 246, "And the shape approvals add: the engine numbers ITS note, slides it under the door, and stops:", 12, t.accent, "start", SANS)}
  <rect x="60" y="264" width="760" height="238" rx="14" fill="${t.chip}" stroke="${t.accentLine}" stroke-width="2"/>
  ${label(86, 298, "engine &#8594; you", 18, t.ink, "start")}
  ${label(794, 298, "SERVER REQUEST &#183; HAS AN ID &#183; BLOCKS", 12, t.accent, "end")}
  <line x1="60" y1="312" x2="820" y2="312" stroke="${t.line}"/>
  ${label(86, 342, `{"id": 0, "method": "item/commandExecution/requestApproval",`, 14, t.accent, "start")}
  ${label(86, 368, ` "params": {"threadId": "019f38df-&#8230;", "itemId": "call_iZyre5&#8230;",`, 14, t.ink, "start")}
  ${label(86, 394, `   "command": "/bin/zsh -lc 'curl -sI https://example.com | head -3'",`, 14, t.ink, "start")}
  ${label(86, 420, `   "cwd": "&#8230;/probes/ws-a",`, 14, t.ink, "start")}
  ${label(86, 446, `   "reason": "Do you want to allow this network command to run`, 14, t.muted, "start")}
  ${label(86, 472, `              outside the sandbox so I can execute it exactly &#8230;?", &#8230;}}`, 14, t.muted, "start")}

  <!-- the wait -->
  <rect x="60" y="524" width="760" height="64" rx="12" fill="${t.amberTint}" stroke="${t.amberLine}" stroke-width="1.5"/>
  ${label(86, 550, "&#8230; and nothing moves. The item is frozen; the turn holds its breath.", 13, t.amber, "start")}
  ${label(86, 572, "No retry, no timeout of its own: the engine will wait as long as we let it.", 12, t.amber, "start")}

  <!-- our reply -->
  <rect x="60" y="610" width="760" height="118" rx="14" fill="${t.chip}" stroke="${t.line}" stroke-width="1.5"/>
  ${label(86, 644, "you &#8594; engine", 18, t.ink, "start")}
  ${label(794, 644, "RESPONSE &#183; QUOTES ID 0", 12, t.faint, "end")}
  <line x1="60" y1="658" x2="820" y2="658" stroke="${t.line}"/>
  ${label(86, 688, `{"jsonrpc": "2.0", "id": 0, "result": {"decision": "accept"}}`, 14, t.green, "start")}
  ${label(86, 712, `&#8594; serverRequest/resolved arrives; the frozen item runs`, 12.5, t.faint, "start")}

  <!-- side notes -->
  <line x1="838" y1="290" x2="862" y2="290" stroke="${t.accent}" stroke-width="1.5"/>
  ${label(872, 296, "The roles swap.", 15, t.accent, "start", SANS + ' font-weight="700"')}
  ${label(872, 322, "Every id so far was ours. This one is", 14, t.muted, "start", SANS)}
  ${label(872, 344, "the engine's, and now WE owe the reply.", 14, t.muted, "start", SANS)}
  ${label(872, 366, "Part 2's reader already routes id+method", 14, t.muted, "start", SANS)}
  ${label(872, 388, "to _server_handlers; the desk was built", 14, t.muted, "start", SANS)}
  ${label(872, 410, "four parts ago. Today it gets staffed.", 14, t.muted, "start", SANS)}

  <line x1="838" y1="640" x2="862" y2="640" stroke="${t.green}" stroke-width="1.5"/>
  ${label(872, 646, "Returning = answering.", 15, t.green, "start", SANS + ' font-weight="700"')}
  ${label(872, 672, "The handler's return value IS the", 14, t.muted, "start", SANS)}
  ${label(872, 694, "JSON-RPC response. Between request", 14, t.muted, "start", SANS)}
  ${label(872, 716, "and return, an asyncio.Future waits", 14, t.muted, "start", SANS)}
  ${label(872, 738, "for a click that may never come.", 14, t.muted, "start", SANS)}

  ${label(w / 2, 800, "One wrinkle the next figure resolves: fileChange requests carry NO patch and NO file list,", 12.5, t.muted)}
  ${label(w / 2, 824, "only an itemId. The patch arrived moments earlier, on the item's own item/started. Join them.", 12.5, t.muted)}
</svg>`;
}

/* ============================================================
   7. fig-decision-flow: the bridge end to end, with the timeout lane.
   ============================================================ */
function figDecision(theme) {
  const t = D[theme];
  const w = 1240, h = 900;
  const label = (x, y, txt, size = 13, fill = t.ink, anchor = "middle", font = MONO) =>
    `<text x="${x}" y="${y}" ${font} font-size="${size}" fill="${fill}" text-anchor="${anchor}">${txt}</text>`;
  const box = (x, y, bw, bh, fill, stroke, sw = 1.5) =>
    `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="10" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
  const arrow = (x1, y1, x2, y2, color = t.faint, dash = "") =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.5" ${dash ? `stroke-dasharray="${dash}"` : ""}/>
     <path d="M ${x2} ${y2} l -5 -8 l 10 0 z" fill="${color}" transform="rotate(${(Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI - 90} ${x2} ${y2})"/>`;

  // three lanes
  const L1 = 210, L2 = 620, L3 = 1040; // engine, backend, browser
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
  <rect width="${w}" height="${h}" fill="${t.paper}"/>
  <text x="48" y="52" ${MONO} font-size="12" letter-spacing="2.5" fill="${t.faint}">THE BRIDGE &#183; ONE QUESTION'S LIFE, BOTH ENDINGS</text>
  <line x1="48" y1="66" x2="${w - 48}" y2="66" stroke="${t.line}" stroke-width="1.5"/>

  <!-- lane headers -->
  ${label(L1, 104, "codex app-server", 14, t.ink)}
  ${label(L1, 124, "stdio &#183; JSON-RPC", 10.5, t.faint)}
  ${label(L2, 104, "FastAPI backend", 14, t.ink)}
  ${label(L2, 124, "app/approvals.py &#183; the registry", 10.5, t.faint)}
  ${label(L3, 104, "the browser", 14, t.ink)}
  ${label(L3, 124, "SSE down &#183; POST back", 10.5, t.faint)}
  <line x1="${L1}" y1="136" x2="${L1}" y2="${h - 160}" stroke="${t.line}" stroke-width="1" stroke-dasharray="3 5"/>
  <line x1="${L2}" y1="136" x2="${L2}" y2="${h - 160}" stroke="${t.line}" stroke-width="1" stroke-dasharray="3 5"/>
  <line x1="${L3}" y1="136" x2="${L3}" y2="${h - 160}" stroke="${t.line}" stroke-width="1" stroke-dasharray="3 5"/>

  <!-- 1. request arrives -->
  ${arrow(L1, 170, L2 - 130, 170, t.accent)}
  ${label((L1 + L2) / 2 - 60, 158, `requestApproval &#183; id 0 &#183; then silence`, 11.5, t.accent)}
  ${box(L2 - 130, 148, 260, 68, t.accentTint, t.accentLine)}
  ${label(L2, 174, "handler fires:", 12, t.ink)}
  ${label(L2, 196, "a Future parks in the registry", 12, t.accent)}

  <!-- 2. SSE event -->
  ${arrow(L2 + 130, 182, L3 - 110, 182, t.faint)}
  ${label((L2 + L3) / 2 + 10, 170, `approval_request &#183; SSE`, 11.5, t.muted)}
  ${box(L3 - 110, 160, 220, 46, t.chip, t.line)}
  ${label(L3, 189, "the card renders, amber", 12, t.muted)}

  <!-- the pause band -->
  <rect x="120" y="240" width="${w - 240}" height="54" rx="10" fill="${t.amberTint}" stroke="${t.amberLine}" stroke-width="1"/>
  ${label(w / 2, 262, "the turn is frozen &#183; the Future is empty &#183; zero events, zero model calls, zero tokens", 12, t.amber)}
  ${label(w / 2, 282, "the engine awaits our response; asyncio.wait_for counts toward PAGEWRIGHT_APPROVAL_TIMEOUT", 11, t.amber)}

  <!-- ENDING A: the human answers -->
  ${label(90, 340, "ENDING A &#183; SOMEBODY CLICKS", 12, t.green, "start")}
  ${box(L3 - 110, 360, 220, 46, t.greenTint, t.line)}
  ${label(L3, 389, "Approve clicked", 12.5, t.green)}
  ${arrow(L3 - 110, 383, L2 + 130, 383, t.green)}
  ${label(L2 + 138, 352, "POST /approvals/72121c85/decision", 10.5, t.muted, "start")}
  ${box(L2 - 130, 360, 260, 46, t.chip, t.line)}
  ${label(L2, 389, `resolve() fills the Future`, 12.5, t.ink)}
  ${arrow(L2 - 130, 383, L1, 383, t.green)}
  ${label((L1 + L2) / 2 - 60, 371, `{"id": 0, "result": {"decision": "accept"}}`, 11, t.green)}
  ${box(L1 - 150, 420, 300, 46, t.chip, t.line)}
  ${label(L1, 449, "serverRequest/resolved &#183; item runs", 11.5, t.muted)}
  ${arrow(L2 + 130, 440, L3 - 110, 440, t.faint)}
  ${label((L2 + L3) / 2 - 25, 428, "approval_resolved &#183; reason: user", 10.5, t.muted)}
  ${box(L3 - 110, 418, 220, 46, t.chip, t.line)}
  ${label(L3, 447, `"Approved by you &#183; &#8230;"`, 12, t.green)}

  <!-- ENDING B: nobody answers -->
  ${label(90, 540, "ENDING B &#183; NOBODY ANSWERS", 12, t.red, "start")}
  ${box(L2 - 130, 560, 260, 68, t.redTint, t.line)}
  ${label(L2, 586, "asyncio.wait_for expires:", 12, t.ink)}
  ${label(L2, 608, `decision = "decline", reason = "timeout"`, 11.5, t.red)}
  ${arrow(L2 - 130, 594, L1, 594, t.red)}
  ${label((L1 + L2) / 2 - 60, 582, `{"id": 0, "result": {"decision": "decline"}}`, 11, t.red)}
  ${arrow(L2 + 130, 594, L3 - 110, 594, t.faint)}
  ${label(L2 + 138, 548, "approval_resolved &#183; reason: timeout", 10.5, t.muted, "start")}
  ${box(L3 - 110, 572, 220, 46, t.chip, t.line)}
  ${label(L3, 596, `"Denied automatically`, 11.5, t.red)}
  ${label(L3, 612, `(nobody answered in time)"`, 11.5, t.red)}
  ${box(L1 - 150, 646, 300, 64, t.chip, t.line)}
  ${label(L1, 672, "the turn CONTINUES: the agent", 11.5, t.muted)}
  ${label(L1, 692, "adapts and finishes honestly", 11.5, t.muted)}

  <!-- footer facts -->
  <rect x="48" y="${h - 140}" width="${w - 96}" height="92" rx="10" fill="${t.surface}" stroke="${t.line}"/>
  ${label(68, h - 112, "MEASURED (PAGEWRIGHT_APPROVAL_TIMEOUT=20, real turn): the request arrived, the card sat unanswered,", 11.5, t.muted, "start")}
  ${label(68, h - 90, `the clock declined it at +20s, and turn/completed still arrived: 25.8s total, status "completed".`, 11.5, t.muted, "start")}
  ${label(68, h - 66, "A declined approval ends a QUESTION, not the turn. Only Stop (turn/interrupt) ends the turn.", 11.5, t.accent, "start")}
</svg>`;
}

/* ============================================================
   8. fig-grid-complete: the Part 6 grid, second dial wired.
   ============================================================ */
function figGridComplete(theme) {
  const t = D[theme];
  const w = 1240, h = 760;
  const label = (x, y, txt, size = 13, fill = t.ink, anchor = "middle", font = MONO) =>
    `<text x="${x}" y="${y}" ${font} font-size="${size}" fill="${fill}" text-anchor="${anchor}">${txt}</text>`;

  const cols = ["untrusted", "on-failure", "on-request", "never"];
  const rows = [
    ["readOnly", "look and plan"],
    ["workspaceWrite", "network off"],
    ["workspaceWrite", "network on"],
    ["dangerFullAccess", "no walls"],
  ];
  const gx = 330, gy = 150, cw = 200, rh = 100;

  let grid = "";
  grid += label(gx + (cols.length * cw) / 2, gy - 56, "CONSENT &#183; approvalPolicy &#183; when does a human get asked?", 11.5, t.faint);
  cols.forEach((c, i) => {
    grid += label(gx + i * cw + cw / 2, gy - 22, c, 13, i === 2 ? t.accent : t.muted);
  });
  grid += `<text x="64" y="${gy + (rows.length * rh) / 2}" ${MONO} font-size="11.5" fill="${t.faint}" text-anchor="middle" transform="rotate(-90 64 ${gy + (rows.length * rh) / 2})">CONTAINMENT &#183; sandboxPolicy &#183; what may commands touch?</text>`;
  rows.forEach((r, i) => {
    const yy = gy + i * rh + rh / 2;
    grid += label(gx - 26, yy - 4, r[0], 13, i === 3 ? t.red : t.muted, "end");
    grid += label(gx - 26, yy + 16, r[1], 11, t.faint, "end");
  });
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < cols.length; c++) {
      const x = gx + c * cw, y = gy + r * rh;
      const danger = r === 3;
      grid += `<rect x="${x}" y="${y}" width="${cw}" height="${rh}" fill="${danger ? t.redTint : "none"}" fill-opacity="${danger ? 0.45 : 0}" stroke="${t.line}" stroke-width="1"/>`;
    }
  }
  const chip = (col, row, name, fg, bg, line) => {
    const x = gx + col * cw + cw / 2, y = gy + row * rh + rh / 2;
    return `<rect x="${x - 74}" y="${y - 22}" width="148" height="44" rx="10" fill="${bg}" stroke="${line}" stroke-width="1.5"/>
    ${label(x, y - 1, name, 13.5, fg, "middle", SANS + ' font-weight="700"')}
    ${label(x, y + 15, "in Pagewright", 9.5, t.faint)}`;
  };
  grid += chip(3, 0, "Read-only", t.sky, t.skyTint, t.skyLine);
  grid += chip(2, 1, "Standard", t.accent, t.accentTint, t.accentLine);
  grid += chip(3, 2, "Trusted", t.amber, t.amberTint, t.amberLine);
  // the ghost of where Standard used to sit
  const ghostX = gx + 3 * cw + cw / 2, ghostY = gy + 1 * rh + rh / 2;
  grid += `<rect x="${ghostX - 74}" y="${ghostY - 22}" width="148" height="44" rx="10" fill="none" stroke="${t.faint}" stroke-width="1.2" stroke-dasharray="5 4" opacity="0.6"/>
  ${label(ghostX, ghostY + 3, "Acts I&#8211;II so far", 10.5, t.faint)}
  <path d="M ${ghostX - 78} ${ghostY} C ${ghostX - 110} ${ghostY}, ${gx + 2 * cw + cw / 2 + 110} ${ghostY}, ${gx + 2 * cw + cw / 2 + 80} ${ghostY}" fill="none" stroke="${t.accent}" stroke-width="1.5"/>
  <path d="M ${gx + 2 * cw + cw / 2 + 80} ${ghostY} l 10 -5 l 0 10 z" fill="${t.accent}"/>`;
  grid += label(gx + (cols.length * cw) / 2, gy + 3 * rh + rh / 2 + 2, "still not offered: no cell in this row exists in the product", 11.5, t.red);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img">
  <rect width="${w}" height="${h}" fill="${t.paper}"/>
  <text x="48" y="52" ${MONO} font-size="12" letter-spacing="2.5" fill="${t.faint}">THE GRID COMPLETES &#183; BOTH DIALS WIRED</text>
  <line x1="48" y1="66" x2="${w - 48}" y2="66" stroke="${t.line}" stroke-width="1.5"/>
  ${grid}
  ${label(w / 2, h - 118, "Read-only never asks because it never acts. Trusted never asks because the sandbox contains.", 12, t.muted)}
  ${label(w / 2, h - 94, "Standard asks: on-request lets the agent propose stepping past the bench, and freezes the item on your answer.", 12, t.muted)}
  ${label(w / 2, h - 62, "Approval is escalation: an accepted command or patch acts OUTSIDE the walls the sandbox drew.", 12.5, t.accent)}
</svg>`;
}

/* ============================================================
   9. TERMINALS (dark only, real captures)
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

const termRequestApproval = () =>
  term("stdio &#183; a real command approval, request and response", [
    `${F(TT.faint, "# the engine numbers ITS note this time (id 0) and stops until we answer:")}`,
    `${F(TT.faint, "←")} {"id": ${F(TT.accent, "0")}, "method": ${F(TT.accent, '"item/commandExecution/requestApproval"')}, "params": {`,
    `      "threadId": "019f38df-…", "itemId": "call_iZyre5…",`,
    `      "command": ${F(TT.blue, `"/bin/zsh -lc 'curl -sI https://example.com | head -3'"`)},`,
    `      "cwd": "…/probes/ws-a",`,
    `      "reason": ${F(TT.green, '"Do you want to allow this network command to run outside')}`,
    `                 ${F(TT.green, 'the sandbox so I can execute it exactly as requested?"')},`,
    `      "proposedExecpolicyAmendment": ["curl", "-sI", "https://example.com"],`,
    `      "availableDecisions": [${F(TT.amber, '"accept", {"acceptWithExecpolicyAmendment": …}, "cancel"')}]}}`,
    `${F(TT.faint, '# note what that list does NOT offer: no "decline", no "acceptForSession".')}`,
    `${F(TT.faint, "# yet the schema declares both, and the server honors both (verified live).")}`,
    ``,
    `${F(TT.faint, "→")} {"jsonrpc": "2.0", "id": ${F(TT.accent, "0")}, "result": {"decision": ${F(TT.green, '"accept"')}}}`,
    `${F(TT.faint, "←")} {"method": ${F(TT.accent, '"serverRequest/resolved"')}, "params": {"threadId": "019f38df-…", "requestId": 0}}`,
    `${F(TT.faint, "# the frozen item runs; item/completed lands with exitCode 0")}`,
  ]);

const termJoinTable = () =>
  term("stdio &#183; the fileChange request arrives naked; the patch came first", [
    `${F(TT.faint, "# same millisecond, two notes. First, the item opens, CARRYING the patch:")}`,
    `${F(TT.faint, "←")} {"method": ${F(TT.accent, '"item/started"')}, "params": {"item": {`,
    `      "type": ${F(TT.blue, '"fileChange"')}, "id": ${F(TT.amber, '"call_U2FCrAls…"')},`,
    `      "changes": [{"path": "…/outside/note-from-h.txt",`,
    `                   "kind": {"type": "add"}, "diff": ${F(TT.green, '"hello from h\\n"')}}],`,
    `      "status": "inProgress"}, …}}`,
    ``,
    `${F(TT.faint, "# then the question, which names the item and nothing else:")}`,
    `${F(TT.faint, "←")} {"id": ${F(TT.accent, "0")}, "method": ${F(TT.accent, '"item/fileChange/requestApproval"')}, "params": {`,
    `      "threadId": "019f38e1-…", "turnId": "019f38e1-…",`,
    `      "itemId": ${F(TT.amber, '"call_U2FCrAls…"')}, "startedAtMs": 1783365744977,`,
    `      "reason": ${F(TT.red, "null")}, "grantRoot": ${F(TT.red, "null")}}}`,
    `${F(TT.faint, "# no diff. no file list. no availableDecisions. the itemId is the join key:")}`,
    `${F(TT.faint, "# the card's diff is item/started's payload, matched by call_U2FCrAls…")}`,
  ]);

/* ============================================================
   write everything
   ============================================================ */
for (const theme of ["light", "dark"]) {
  writeFileSync(`${OUT}/cover-${theme}.svg`, cover(theme));
  writeFileSync(`${OUT}/fig-reversed-request-${theme}.svg`, figReversed(theme));
  writeFileSync(`${OUT}/fig-decision-flow-${theme}.svg`, figDecision(theme));
  writeFileSync(`${OUT}/fig-grid-complete-${theme}.svg`, figGridComplete(theme));
  writeFileSync(`${OUT}/browser-command-${theme}.svg`, browserCommand(theme));
  writeFileSync(`${OUT}/browser-patch-${theme}.svg`, browserPatch(theme));
  writeFileSync(`${OUT}/browser-denied-${theme}.svg`, browserDenied(theme));
}
writeFileSync(`${OUT}/term-request-approval.svg`, termRequestApproval());
writeFileSync(`${OUT}/term-join-table.svg`, termJoinTable());
console.log("part-7 SVGs written to", OUT);

/**
 * Part 1 SVG assets for "Claude Agent SDK in Production".
 * All terminal content mirrors real runs recorded 2026-07-03 against
 * claude-agent-sdk 0.2.110 (costs, session ids, turn counts, answers are
 * the measured values; user paths shortened to the reader's world).
 *
 * Usage: node scripts/gen-agent-sdk-part1-svgs.mjs
 */
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";

const BASE = "/Users/yadneshsalvi/code/yadnesh-personal-blog/public/images/series/agent-sdk";
const OUT = `${BASE}/part-1`;
mkdirSync(OUT, { recursive: true });

const MONO = `font-family="'SF Mono', Menlo, Consolas, monospace"`;
const SANS = `font-family="-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"`;
const SERIF = `font-family="Georgia, 'Times New Roman', serif"`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// ---- shared palettes ----
const D = {
  light: {
    paper: "#faf9f6", line: "#e7e3d9", ink: "#1f1c19", muted: "#5b554c",
    faint: "#8f887a", accent: "#b3441a", surface: "#f1efe9",
    chip: "#ffffff", accentTint: "#f6e7df", accentLine: "#dcb09a",
    green: "#3f6212", greenTint: "#f2f7e8", numeral: "#e9e5d9",
  },
  dark: {
    paper: "#151311", line: "#2b2723", ink: "#ebe7df", muted: "#a49c90",
    faint: "#756d62", accent: "#e5825a", surface: "#1d1a17",
    chip: "#211e1a", accentTint: "#2a201a", accentLine: "#5e463a",
    green: "#a3c57d", greenTint: "#1d2314", numeral: "#241f1b",
  },
};
const TT = {
  bg: "#1a1816", chrome: "#211e1a", dot: "#3a3530", label: "#756d62",
  text: "#d8d2c6", faint: "#756d62", accent: "#e5825a", green: "#8fb573",
  blue: "#6fa8dc", red: "#d97676",
};

// ---- icon paths ----
const iconPath = (file) => {
  const svg = readFileSync(`${BASE.replace("/images/series/agent-sdk", "")}/icons/${file}`, "utf8");
  return svg.match(/<path[^>]*\sd="([^"]+)"/)[1];
};
const ANTHROPIC = iconPath("anthropic.svg");
const FASTAPI = iconPath("FastAPI.svg");
const NEXTJS = iconPath("icons8-nextjs.svg");

function iconRow(t, x, y, size = 56) {
  const gap = 36;
  const k = size / 24, kf = size / 128, kn = size / 48;
  let cx = x;
  const parts = [];
  parts.push(`<g transform="translate(${cx},${y}) scale(${k})"><path d="${ANTHROPIC}" fill="${t.ink}" fill-rule="evenodd" opacity="0.85"/></g>`);
  cx += size + gap;
  parts.push(`<circle cx="${cx}" cy="${y + size / 2}" r="3.5" fill="${t.faint}"/>`);
  cx += gap;
  parts.push(`<g transform="translate(${cx},${y}) scale(${kf})"><path d="${FASTAPI}" fill="${t.ink}" fill-rule="evenodd" opacity="0.85"/></g>`);
  cx += size + gap;
  parts.push(`<circle cx="${cx}" cy="${y + size / 2}" r="3.5" fill="${t.faint}"/>`);
  cx += gap;
  parts.push(`<g transform="translate(${cx},${y}) scale(${kn})"><path d="${NEXTJS}" fill="${t.ink}" fill-rule="evenodd" opacity="0.85"/></g>`);
  return parts.join("\n  ");
}

/* ============================================================
   1. PART COVER — series shelf template, numeral 01.
   ============================================================ */
function cover(theme) {
  const t = D[theme];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <rect width="1280" height="720" fill="${t.paper}"/>
  <text x="1216" y="600" ${MONO} font-size="400" fill="${t.numeral}" text-anchor="end" letter-spacing="-8">01</text>
  <line x1="64" y1="72" x2="1216" y2="72" stroke="${t.line}" stroke-width="1.5"/>
  <line x1="64" y1="648" x2="1216" y2="648" stroke="${t.line}" stroke-width="1.5"/>
  <text x="64" y="118" ${MONO} font-size="19" letter-spacing="3.5" fill="${t.faint}">SERIES &#183; CLAUDE AGENT SDK IN PRODUCTION</text>
  <text x="1216" y="118" ${MONO} font-size="19" letter-spacing="3.5" fill="${t.faint}" text-anchor="end">PART 1 OF 14</text>
  <text x="62" y="342" ${SERIF} font-size="92" fill="${t.ink}" letter-spacing="-1">Your <tspan font-style="italic" fill="${t.accent}">first agent</tspan></text>
  <text x="64" y="412" ${SERIF} font-size="36" font-style="italic" fill="${t.muted}">From uv init to an agent that reads your data and answers for a cent.</text>
  ${iconRow(t, 64, 512)}
</svg>`;
}

/* ============================================================
   2. fig-agent-loop — MUST BE BEAUTIFUL.
   Your code makes one call; the SDK owns think/act/observe.
   ============================================================ */
function figAgentLoop(theme) {
  const t = D[theme];
  const w = 1240, h = 660;
  // your-code box left, loop region right
  const yc = { x: 60, y: 210, w: 250, h: 190 };
  const lp = { x: 400, y: 90, w: 780, h: 440 };
  // three stations inside the loop
  const sW = 200, sH = 108;
  const think = { x: lp.x + 60, y: lp.y + 70 };
  const act = { x: lp.x + lp.w - 60 - sW, y: lp.y + 70 };
  const obs = { x: lp.x + (lp.w - sW) / 2, y: lp.y + 260 };
  const station = (s, kicker, title, sub, hero) => `
  <rect x="${s.x}" y="${s.y}" width="${sW}" height="${sH}" rx="14" fill="${hero ? t.accentTint : t.surface}" stroke="${hero ? t.accentLine : t.line}" stroke-width="1.5"/>
  <text x="${s.x + sW / 2}" y="${s.y + 30}" ${MONO} font-size="13.5" letter-spacing="2.5" fill="${hero ? t.accent : t.faint}" text-anchor="middle">${kicker}</text>
  <text x="${s.x + sW / 2}" y="${s.y + 58}" ${SANS} font-size="19" font-weight="700" fill="${t.ink}" text-anchor="middle">${title}</text>
  <text x="${s.x + sW / 2}" y="${s.y + 84}" ${SANS} font-size="14.5" fill="${t.muted}" text-anchor="middle">${sub}</text>`;
  const arrow = (x1, y1, x2, y2, color, wd = 2.5) => {
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const ax = x2 - 12 * Math.cos(ang), ay = y2 - 12 * Math.sin(ang);
    const p1x = ax + 7 * Math.sin(ang), p1y = ay - 7 * Math.cos(ang);
    const p2x = ax - 7 * Math.sin(ang), p2y = ay + 7 * Math.cos(ang);
    return `<line x1="${x1}" y1="${y1}" x2="${ax}" y2="${ay}" stroke="${color}" stroke-width="${wd}"/>
  <path d="M ${p1x} ${p1y} L ${p2x} ${p2y} L ${x2} ${y2} Z" fill="${color}"/>`;
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${t.paper}"/>

  <!-- your code -->
  <rect x="${yc.x}" y="${yc.y}" width="${yc.w}" height="${yc.h}" rx="14" fill="${t.chip}" stroke="${t.line}" stroke-width="1.5"/>
  <text x="${yc.x + 24}" y="${yc.y + 36}" ${MONO} font-size="12" letter-spacing="2.5" fill="${t.faint}">YOUR CODE</text>
  <text x="${yc.x + 24}" y="${yc.y + 76}" ${MONO} font-size="17" font-weight="700" fill="${t.ink}">query(</text>
  <text x="${yc.x + 44}" y="${yc.y + 102}" ${MONO} font-size="15" fill="${t.muted}">prompt,</text>
  <text x="${yc.x + 44}" y="${yc.y + 126}" ${MONO} font-size="15" fill="${t.muted}">options,</text>
  <text x="${yc.x + 24}" y="${yc.y + 152}" ${MONO} font-size="17" font-weight="700" fill="${t.ink}">)</text>

  <!-- one call in -->
  ${arrow(yc.x + yc.w, yc.y + 60, lp.x, yc.y + 60, t.accent, 3)}
  <text x="${(yc.x + yc.w + lp.x) / 2}" y="${yc.y + 44}" ${MONO} font-size="14.5" fill="${t.accent}" text-anchor="middle">one call</text>

  <!-- message stream out -->
  <line x1="${lp.x}" y1="${yc.y + 150}" x2="${yc.x + yc.w}" y2="${yc.y + 150}" stroke="${t.muted}" stroke-width="2.5" stroke-dasharray="7 5"/>
  <path d="M ${yc.x + yc.w + 12} ${yc.y + 143} L ${yc.x + yc.w + 12} ${yc.y + 157} L ${yc.x + yc.w} ${yc.y + 150} Z" fill="${t.muted}"/>
  <text x="${(yc.x + yc.w + lp.x) / 2}" y="${yc.y + 176}" ${MONO} font-size="14.5" fill="${t.muted}" text-anchor="middle">async for message</text>
  <text x="${(yc.x + yc.w + lp.x) / 2}" y="${yc.y + 196}" ${SANS} font-size="14" fill="${t.faint}" text-anchor="middle">a running narration</text>

  <!-- the loop region -->
  <rect x="${lp.x}" y="${lp.y}" width="${lp.w}" height="${lp.h}" rx="20" fill="none" stroke="${t.line}" stroke-width="1.5" stroke-dasharray="8 6"/>
  <rect x="${lp.x + 24}" y="${lp.y - 14}" width="270" height="28" rx="14" fill="${t.paper}"/>
  <text x="${lp.x + 40}" y="${lp.y + 5}" ${MONO} font-size="13" letter-spacing="2.5" fill="${t.faint}">INSIDE THE SDK &#183; THE LOOP</text>

  ${station(think, "THINK", "The model reads", "everything so far", true)}
  ${station(act, "ACT", "A tool runs, for real", "Read &#183; Bash &#183; Glob &#183; Write", false)}
  ${station(obs, "OBSERVE", "Result joins the", "conversation", false)}

  <!-- think -> act -->
  ${arrow(think.x + sW, think.y + sH / 2, act.x, act.y + sH / 2, t.accent)}
  <text x="${(think.x + sW + act.x) / 2}" y="${think.y + sH / 2 - 14}" ${MONO} font-size="14" fill="${t.accent}" text-anchor="middle">"I need to see sales.csv"</text>

  <!-- act -> observe -->
  ${arrow(act.x + sW / 2, act.y + sH, obs.x + sW - 20, obs.y + 8, t.muted)}
  <!-- observe -> think -->
  ${arrow(obs.x + 20, obs.y + 8, think.x + sW / 2 + 10, think.y + sH + 4, t.muted)}
  <text x="${lp.x + lp.w / 2}" y="${obs.y - 34}" ${SANS} font-size="15" fill="${t.muted}" text-anchor="middle">repeat until the job is done</text>

  <!-- exit -->
  ${arrow(obs.x + sW / 2, obs.y + sH, obs.x + sW / 2, lp.y + lp.h + 50, t.green, 3)}
  <rect x="${obs.x + sW / 2 - 190}" y="${lp.y + lp.h + 50}" width="380" height="56" rx="12" fill="${t.greenTint}" stroke="${t.green}" stroke-width="1.5"/>
  <text x="${obs.x + sW / 2}" y="${lp.y + lp.h + 84}" ${SANS} font-size="16" font-weight="700" fill="${t.green}" text-anchor="middle">Answer + the bill: ResultMessage</text>

  <!-- caption strip -->
  <text x="60" y="${h - 34}" ${SERIF} font-size="23" fill="${t.ink}">You wrote none of this loop. That's the entire pitch.</text>
</svg>`;
}

/* ============================================================
   3. fig-message-anatomy — the Rosetta stone.
   Four message cards, annotated, with real payloads.
   ============================================================ */
function figAnatomy(theme) {
  const t = D[theme];
  const w = 1240, h = 980;
  const cardX = 60, cardW = 760;
  const noteX = cardX + cardW + 40;
  let y = 60;
  const parts = [];
  const card = (title, badge, rows, hero) => {
    const rowH = 30, padTop = 62, padBot = 20;
    const ch = padTop + rows.length * rowH + padBot;
    let s = `<rect x="${cardX}" y="${y}" width="${cardW}" height="${ch}" rx="14" fill="${t.chip}" stroke="${hero ? t.accentLine : t.line}" stroke-width="1.5"/>
  <text x="${cardX + 26}" y="${y + 38}" ${MONO} font-size="19" font-weight="700" fill="${t.ink}">${title}</text>
  <text x="${cardX + cardW - 26}" y="${y + 38}" ${MONO} font-size="12" letter-spacing="2" fill="${hero ? t.accent : t.faint}" text-anchor="end">${badge}</text>
  <line x1="${cardX}" y1="${y + 52}" x2="${cardX + cardW}" y2="${y + 52}" stroke="${t.line}" stroke-width="1"/>`;
    rows.forEach((r, i) => {
      s += `\n  <text x="${cardX + 26 + (r.indent || 0)}" y="${y + padTop + 20 + i * rowH - 14}" ${MONO} font-size="16" fill="${r.color === "accent" ? t.accent : r.color === "muted" ? t.muted : r.color === "green" ? t.green : t.ink}" xml:space="preserve">${r.text}</text>`;
    });
    const out = { top: y, h: ch };
    parts.push(s);
    y += ch;
    return out;
  };
  const note = (cy, lines) => {
    let s = "";
    lines.forEach((l, i) => {
      s += `<text x="${noteX}" y="${cy + i * 26}" ${SANS} font-size="16" ${l.strong ? `font-weight="700" fill="${t.accent}"` : `fill="${t.muted}"`}>${l.text}</text>`;
    });
    parts.push(`<line x1="${cardX + cardW + 8}" y1="${cy - 5}" x2="${noteX - 10}" y2="${cy - 5}" stroke="${t.accent}" stroke-width="1.5"/>` + s);
  };
  const gap = (label) => {
    parts.push(`<line x1="${cardX + 60}" y1="${y + 8}" x2="${cardX + 60}" y2="${y + 44}" stroke="${t.faint}" stroke-width="2"/>
  <path d="M ${cardX + 53} ${y + 42} L ${cardX + 67} ${y + 42} L ${cardX + 60} ${y + 54} Z" fill="${t.faint}"/>
  ${label ? `<text x="${cardX + 84}" y="${y + 36}" ${MONO} font-size="12.5" fill="${t.faint}">${label}</text>` : ""}`);
    y += 62;
  };

  const c1 = card("SystemMessage", "SUBTYPE &#183; INIT", [
    { text: `data = {`, color: "muted" },
    { text: `  'session_id': 'd22f446b-ea4d-4b32-…',`, color: "accent" },
    { text: `  'model': 'claude-haiku-4-5',`, color: "ink" },
    { text: `  'tools': ['Bash','Glob','Grep','Read','Write'],`, color: "ink" },
    { text: `  'cwd': '…/backend/workspace', … }`, color: "muted" },
  ], true);
  note(c1.top + 40, [
    { text: "The handshake.", strong: true },
    { text: "Arrives first, once. That" },
    { text: "session_id is the key to" },
    { text: "everything in Part 5:" },
    { text: "write it down." },
  ]);
  gap();

  const c2 = card("AssistantMessage", "THE AGENT SPEAKS AND ACTS", [
    { text: `content = [`, color: "muted" },
    { text: `  TextBlock(text="I'll help you find…"),`, color: "ink" },
    { text: `  ToolUseBlock(id='toolu_01Qfr…',`, color: "accent" },
    { text: `    name='Bash',`, color: "accent" },
    { text: `    input={'command': "awk -F',' …"}) ]`, color: "accent" },
  ], false);
  note(c2.top + 40, [
    { text: "A list of blocks, not a", strong: true },
    { text: "string.", strong: true },
    { text: "Prose and tool calls ride" },
    { text: "in one message. This block" },
    { text: "model IS Part 3's UI model." },
  ]);
  gap();

  const c3 = card("UserMessage", "THE WORLD ANSWERS", [
    { text: `content = [`, color: "muted" },
    { text: `  ToolResultBlock(`, color: "ink" },
    { text: `    tool_use_id='toolu_01Qfr…',`, color: "accent" },
    { text: `    content='Downtown 51319.60\\nAirport…',`, color: "ink" },
    { text: `    is_error=None) ]`, color: "green" },
  ], false);
  note(c3.top + 40, [
    { text: "Tool results wear a user", strong: true },
    { text: "badge.", strong: true },
    { text: "To the model, the world's" },
    { text: "reply is input like yours." },
    { text: "Match it by tool_use_id." },
  ]);
  gap("&#215; 9 rounds in our March run");

  const c4 = card("ResultMessage", "THE RECEIPT", [
    { text: `num_turns=9,  duration_ms=21748,`, color: "ink" },
    { text: `total_cost_usd=0.0240,`, color: "accent" },
    { text: `usage={'input_tokens': …, 'output_tokens': …},`, color: "muted" },
    { text: `result='Downtown had the highest…'`, color: "ink" },
  ], true);
  note(c4.top + 40, [
    { text: "Arrives last, once.", strong: true },
    { text: "The whole turn's bill," },
    { text: "the final text, and the" },
    { text: "session_id again. Print" },
    { text: "the cost. Every time." },
  ]);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${t.paper}"/>
  <text x="${cardX}" y="40" ${MONO} font-size="13" letter-spacing="2.5" fill="${t.faint}">WHAT query() YIELDS &#183; ONE REAL RUN, FOUR KINDS OF MESSAGE</text>
  ${parts.join("\n  ")}
</svg>`;
}

/* ============================================================
   4. TERMINALS (dark only, real runs)
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

const termHello = () =>
  term("terminal &#183; backend", [
    `${F(TT.faint, "$")} uv run python hello.py`,
    ``,
    `SystemMessage(subtype=${F(TT.green, "'init'")}, data={'session_id': ${F(TT.accent, "'8d7bc838-8dd1-45d2-…'")},`,
    `  'model': 'claude-fable-5', 'tools': [...], 'cwd': '…/backend', …})`,
    ``,
    `AssistantMessage(content=[TextBlock(text=${F(TT.green, "'12,816'")})],`,
    `  model='claude-fable-5', …)`,
    ``,
    `ResultMessage(subtype='success', duration_ms=3843, num_turns=1,`,
    `  ${F(TT.accent, "total_cost_usd=0.34184")}, result=${F(TT.green, "'12,816'")}, …)`,
    ``,
    `${F(TT.faint, "# it answered. and that bare default billed 34 cents for one")}`,
    `${F(TT.faint, "# multiplication. hold that thought: we fix it in two sections.")}`,
  ]);

const termFirstQuestion = () =>
  term("terminal &#183; backend", [
    `${F(TT.faint, "$")} uv run python agent.py`,
    `[session ${F(TT.accent, "d22f446b-ea4d-4b32-8e95-fe3e5910876b")}]`,
    ``,
    `I'll help you find which store had the highest total revenue in`,
    `March. Let me first explore the available files.`,
    `  ${F(TT.blue, "-> Bash")}  find . -type f \\( -name "*.csv" -o -name "*.xlsx" … \\)`,
    `  ${F(TT.blue, "-> Read")}  /sales.csv`,
    `  ${F(TT.red, "!! File does not exist. Note: your current working directory is")}`,
    `  ${F(TT.red, "   …/backend/workspace")}`,
    `${F(TT.faint, "# it guessed a path, got corrected, and moved on. watch:")}`,
    `  ${F(TT.blue, "-> Bash")}  pwd &amp;&amp; ls -la *.csv`,
    `  ${F(TT.blue, "-> Read")}  …/workspace/sales.csv`,
    `  ${F(TT.blue, "-> Read")}  …/workspace/stores.csv`,
    `  ${F(TT.blue, "-> Read")}  …/workspace/products.csv`,
    `Now let me filter the data and calculate total revenue per store`,
    `for March 2026.`,
    `  ${F(TT.blue, "-> Bash")}  cat …/sales.csv | awk -F',' '$1 ~ /2026-03/ { s[$2]+=$5 } …'`,
    `  ${F(TT.blue, "-> Bash")}  cat …/stores.csv`,
    ``,
    `${F(TT.green, "**Downtown** had the highest total revenue in March with")}`,
    `${F(TT.green, "**$51,319.60**. It beat the runner-up (Airport store) by")}`,
    `${F(TT.green, "**$7,893.70** (which had $43,425.90 in revenue).")}`,
    ``,
    `[9 turns &#183; ${F(TT.accent, "$0.0240")}]`,
  ]);

const termWall = () =>
  term("terminal &#183; backend", [
    `${F(TT.faint, "$")} uv run python agent.py   ${F(TT.faint, "# permission_mode line deleted")}`,
    `[session aa806ca0-2e3e-44ad-affb-5ab1f8f15699]`,
    ``,
    `  ${F(TT.blue, "-> Glob")}  **/*.{csv,json,xlsx,xls}      ${F(TT.faint, "# reading is fine")}`,
    `  ${F(TT.blue, "-> Read")}  /root/sales.csv`,
    `  ${F(TT.red, "!! Claude requested permissions to read from /root/sales.csv,")}`,
    `  ${F(TT.red, "   but you haven't granted it yet.")}`,
    `  ${F(TT.blue, "-> Write")}  /root/analyze_march_revenue.py`,
    `  ${F(TT.red, "!! Claude requested permissions to write to /root/analyze_…")}`,
    `  ${F(TT.blue, "-> Bash")}  python3 -c "import csv; …"`,
    `  ${F(TT.red, "!! This command requires approval")}`,
    `  ${F(TT.blue, "-> Bash")}  perl -ne 'if (/2026-03/) { … }'`,
    `  ${F(TT.red, "!! This command requires approval")}`,
    ``,
    `${F(TT.faint, "        … 50 more turns of increasingly creative attempts,")}`,
    `${F(TT.faint, "          every compute path denied …")}`,
    ``,
    `Based on the comprehensive data I've already seen, let me manually`,
    `calculate the totals. ${F(TT.red, "**Downtown** … with **$59,278.80** …")}`,
    `${F(TT.red, "**Downtown beat Airport by $2,430.90**")}   ${F(TT.faint, "# both numbers: wrong")}`,
    ``,
    `[${F(TT.red, "62 turns")} &#183; ${F(TT.accent, "$0.3668")}]`,
  ]);

const termDiary = () =>
  term("terminal", [
    `${F(TT.faint, "$")} ls ~/.claude/projects/`,
    `-Users-you-beanline-analyst-backend-workspace`,
    `${F(TT.faint, "…one folder per working directory the SDK has run in…")}`,
    ``,
    `${F(TT.faint, "$")} ls ~/.claude/projects/-Users-you-beanline-analyst-backend-workspace/`,
    `${F(TT.accent, "d22f446b-ea4d-4b32-8e95-fe3e5910876b")}.jsonl`,
    ``,
    `${F(TT.faint, "$")} head -c 220 ~/.claude/projects/…/d22f446b-….jsonl`,
    `{"type":"queue-operation","operation":"enqueue","timestamp":"2026-`,
    `07-03T…","sessionId":"d22f446b-…","content":"Which store had the`,
    `highest total revenue in March? …"}`,
    ``,
    `${F(TT.faint, "# every turn you've ever run is in here. Part 5 cashes this in.")}`,
  ]);

/* ============================================================
   5. fig-finished-app — dessert: where the series ends up.
   Reuses the series-cover composition as a browser capture.
   ============================================================ */
function figFinishedApp(theme) {
  const src = readFileSync(`${BASE}/cover-${theme}.svg`, "utf8");
  // crop the cover to just the app window band: shift up, tighten canvas
  return src
    .replace(`width="1280" height="720" viewBox="0 0 1280 720"`, `width="1280" height="520" viewBox="0 90 1280 520"`)
    .replace(/<line x1="64" y1="72".*?\/>/, "")
    .replace(/<line x1="64" y1="648".*?\/>/, "")
    .replace(/<text x="64" y="52".*?<\/text>/, "")
    .replace(/<text x="1216" y="52".*?<\/text>/, "")
    .replace(/<text x="1216" y="697".*?<\/text>/, "")
    .replace(/(<g transform="translate\(64,670\)[\s\S]*?<\/g>)/g, "")
    .replace(/<circle cx="\d+" cy="690" r="3" fill="[^"]+"\/>/g, "")
    .replace(/<g transform="translate\((\d+),670\) scale\([\d.]+\)"><path[^]*?<\/g>/g, "");
}

/* ============================================================
   write everything
   ============================================================ */
for (const theme of ["light", "dark"]) {
  writeFileSync(`${OUT}/cover-${theme}.svg`, cover(theme));
  writeFileSync(`${OUT}/fig-agent-loop-${theme}.svg`, figAgentLoop(theme));
  writeFileSync(`${OUT}/fig-message-anatomy-${theme}.svg`, figAnatomy(theme));
  writeFileSync(`${OUT}/fig-finished-app-${theme}.svg`, figFinishedApp(theme));
}
writeFileSync(`${OUT}/term-hello.svg`, termHello());
writeFileSync(`${OUT}/term-first-question.svg`, termFirstQuestion());
writeFileSync(`${OUT}/term-wall.svg`, termWall());
writeFileSync(`${OUT}/term-diary.svg`, termDiary());
console.log("part-1 svgs written");

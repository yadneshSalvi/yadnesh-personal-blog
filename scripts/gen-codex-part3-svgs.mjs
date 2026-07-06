/**
 * Part 3 SVG assets for "Codex App Server in Production".
 * Browser captures mirror REAL runs (2026-07-06, codex-cli 0.142.4 /
 * gpt-5.4-mini behind the part-03 FastAPI bridge + Next.js UI, clean
 * CODEX_HOME): every label, reasoning line, exit code, output line,
 * token count, and duration is a measured value from the capture runs
 * (bakery build: 118,240 tokens / 39s; pulse loop: 60,233 tokens / 13s;
 * scrambled break run: 45,705 tokens / 12s). Hosts shown reader-world
 * (localhost:3000 / :8000).
 *
 * Usage: node scripts/gen-codex-part3-svgs.mjs
 */
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";

const BASE = "/Users/yadneshsalvi/code/yadnesh-personal-blog/public/images/series/codex";
const P1 = `${BASE}/part-1`;
const OUT = `${BASE}/part-3`;
mkdirSync(OUT, { recursive: true });

const MONO = `font-family="'SF Mono', Menlo, Consolas, monospace"`;
const SANS = `font-family="-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ============================================================
   1. COVER: templated from the Part 1 cover.
   ============================================================ */
function cover(theme) {
  const accent = theme === "light" ? "#b3441a" : "#e5825a";
  let svg = readFileSync(`${P1}/cover-${theme}.svg`, "utf8");
  svg = svg
    .replace(">01</text>", ">03</text>")
    .replace("PART 1 OF 13", "PART 3 OF 13")
    .replace(
      `Your first <tspan font-style="italic" fill="${accent}">thread</tspan>`,
      `The builder <tspan font-style="italic" fill="${accent}">UI</tspan>`
    )
    .replace(
      "Speak raw JSON-RPC to the engine inside Codex. Get a website back.",
      "Command badges with live output, a reasoning drawer, a typing answer."
    );
  return svg;
}

/* ============================================================
   2. Shared app-window renderer (the Part 3 Pagewright UI, drawn)
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
    chipBg: "#ffffff", stopLine: "#d6d3d1", stopText: "#57534e",
    drawerLine: "#e7e5e4", drawerText: "#a8a29e",
  },
  dark: {
    pageBg: "#0c0a09", ink: "#e7e5e4", muted: "#d6d3d1", faint: "#78716c",
    line: "#292524", badgeBg: "#1c1917", preBg: "#292524", preText: "#d6d3d1",
    userBubble: "#f5f5f4", userText: "#1c1917",
    green: "#4ade80", red: "#f87171", redLine: "#7f1d1d", accent: "#4fb8b3",
    inputBg: "#1c1917", placeholder: "#78716c", btnText: "#ffffff",
    chipBg: "#1c1917", stopLine: "#44403c", stopText: "#d6d3d1",
    drawerLine: "#44403c", drawerText: "#78716c",
  },
};

const W = 1120, CHROME_H = 56, HEADER_H = 46, FOOTER_H = 76;
const COL_X = 200, COL_W = 720; // the max-w-3xl column

function chrome(theme) {
  const c = CH[theme];
  return `<rect x="0" y="0" width="${W}" height="${CHROME_H}" fill="${c.chromeBg}"/>
  <line x1="0" y1="${CHROME_H}" x2="${W}" y2="${CHROME_H}" stroke="${c.chromeLine}" stroke-width="1.5"/>
  <circle cx="30" cy="28" r="7" fill="${c.dots}"/><circle cx="56" cy="28" r="7" fill="${c.dots}"/><circle cx="82" cy="28" r="7" fill="${c.dots}"/>
  <rect x="320" y="13" width="480" height="30" rx="15" fill="${c.urlFill}" stroke="${c.urlStroke}"/>
  <text x="560" y="33" ${MONO} font-size="14" fill="${c.urlText}" text-anchor="middle">localhost:3000</text>`;
}

function appHeader(theme) {
  const t = T[theme];
  const y = CHROME_H;
  return `<line x1="0" y1="${y + HEADER_H}" x2="${W}" y2="${y + HEADER_H}" stroke="${t.line}" stroke-width="1"/>
  <circle cx="28" cy="${y + HEADER_H / 2}" r="5" fill="${t.accent}"/>
  <text x="42" y="${y + HEADER_H / 2 + 5}" ${SANS} font-size="15" font-weight="700" fill="${t.ink}">Pagewright</text>
  <text x="${W - 24}" y="${y + HEADER_H / 2 + 5}" ${MONO} font-size="12" fill="${t.faint}" text-anchor="end">the site builder</text>`;
}

function footer(theme, { stop = false } = {}, h) {
  const t = T[theme];
  const y = h - FOOTER_H;
  const btnW = 74, btnX = COL_X + COL_W - btnW;
  const btn = stop
    ? `<rect x="${btnX}" y="${y + 18}" width="${btnW}" height="42" rx="12" fill="none" stroke="${t.stopLine}" stroke-width="1.5"/>
  <text x="${btnX + btnW / 2}" y="${y + 44}" ${SANS} font-size="14" font-weight="600" fill="${t.stopText}" text-anchor="middle">Stop</text>`
    : `<rect x="${btnX}" y="${y + 18}" width="${btnW}" height="42" rx="12" fill="${t.accent}" opacity="0.45"/>
  <text x="${btnX + btnW / 2}" y="${y + 44}" ${SANS} font-size="14" font-weight="600" fill="${t.btnText}" text-anchor="middle">Send</text>`;
  return `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${t.line}" stroke-width="1"/>
  <rect x="${COL_X}" y="${y + 18}" width="${COL_W - btnW - 10}" height="42" rx="12" fill="${t.inputBg}" stroke="${t.line}" stroke-width="1.5"/>
  <text x="${COL_X + 16}" y="${y + 44}" ${SANS} font-size="14.5" fill="${t.placeholder}">Describe the site you want&#8230;</text>
  ${btn}`;
}

// --- content pieces; each returns {svg, h} and takes the top y ---
function userBubble(theme, y, lines) {
  const t = T[theme];
  const list = Array.isArray(lines) ? lines : [lines];
  const widest = Math.max(...list.map((l) => l.length));
  const bw = Math.min(Math.ceil(widest * 7.6) + 34, COL_W * 0.85);
  const bh = 18 + list.length * 22;
  const x = COL_X + COL_W - bw;
  let body = "";
  list.forEach((l, i) => {
    body += `\n  <text x="${x + 17}" y="${y + 26 + i * 22}" ${SANS} font-size="14.5" fill="${t.userText}">${esc(l)}</text>`;
  });
  return {
    svg: `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="18" fill="${t.userBubble}"/>${body}`,
    h: bh,
  };
}

function prose(theme, y, lines) {
  const t = T[theme];
  const lh = 24;
  let s = "";
  lines.forEach((l, i) => {
    s += `\n  <text x="${COL_X}" y="${y + 17 + i * lh}" ${SANS} font-size="15" fill="${t.ink}">${esc(l)}</text>`;
  });
  return { svg: s, h: lines.length * lh };
}

function bullets(theme, y, items) {
  const t = T[theme];
  const lh = 26;
  let s = "";
  items.forEach((it, i) => {
    s += `\n  <circle cx="${COL_X + 8}" cy="${y + 12 + i * lh}" r="2.5" fill="${t.ink}"/>
  <text x="${COL_X + 22}" y="${y + 17 + i * lh}" ${SANS} font-size="15" fill="${t.ink}">${esc(it)}</text>`;
  });
  return { svg: s, h: items.length * lh };
}

// The reasoning drawer: collapsed = one muted THINKING row; open = the row
// plus the intern's scratchpad (italic mono behind a hairline).
function thinking(theme, y, { open = false, active = false, drawer = [] } = {}) {
  const t = T[theme];
  const dot = active ? t.faint : t.line;
  let s = `<circle cx="${COL_X + 4}" cy="${y + 10}" r="3" fill="${dot}"/>
  <text x="${COL_X + 16}" y="${y + 14}" ${SANS} font-size="11.5" font-weight="600" letter-spacing="1.5" fill="${t.faint}">THINKING</text>
  <path d="M ${COL_X + 96} ${y + (open ? 12 : 7)} l 4.5 ${open ? -5 : 5} l 4.5 ${open ? 5 : -5}" fill="none" stroke="${t.faint}" stroke-width="1.6"/>`;
  let h = 20;
  if (open && drawer.length) {
    const lh = 19;
    s += `\n  <line x1="${COL_X + 4}" y1="${y + 26}" x2="${COL_X + 4}" y2="${y + 26 + drawer.length * lh + 6}" stroke="${t.drawerLine}" stroke-width="2"/>`;
    drawer.forEach((l, i) => {
      s += `\n  <text x="${COL_X + 18}" y="${y + 40 + i * lh}" ${MONO} font-size="11.5" font-style="italic" fill="${t.drawerText}" xml:space="preserve">${esc(l)}</text>`;
    });
    h = 26 + drawer.length * lh + 12;
  }
  return { svg: s, h };
}

function spinner(theme, x, cy) {
  const t = T[theme];
  return `<circle cx="${x}" cy="${cy}" r="6.5" fill="none" stroke="${t.line}" stroke-width="2.5"/>
  <path d="M ${x} ${cy - 6.5} A 6.5 6.5 0 0 1 ${x + 6.5} ${cy}" fill="none" stroke="${t.accent}" stroke-width="2.5" stroke-linecap="round"/>`;
}

// A command/files badge. state: ok | err | spin. Optional exit chip and a
// live OUTPUT pane (the terminal-in-a-badge).
function badge(theme, y, { label, tag = "COMMAND", state, exit = null, output = null, outKicker = "OUTPUT" }) {
  const t = T[theme];
  const bw = 576, headH = 38;
  const isErr = state === "err";
  let icon;
  if (state === "spin") icon = spinner(theme, COL_X + 20, y + headH / 2);
  else icon = `<text x="${COL_X + 15}" y="${y + headH / 2 + 5}" ${SANS} font-size="14" fill="${isErr ? t.red : t.green}">${isErr ? "&#x2715;" : "&#x2713;"}</text>`;
  const exitChip = exit !== null
    ? `<text x="${COL_X + bw - 108}" y="${y + 23}" ${MONO} font-size="10.5" fill="${t.red}" text-anchor="end">exit ${exit}</text>`
    : "";
  let body = "";
  let bh = headH;
  if (output) {
    const lh = 19;
    const paneH = output.length * lh + 20;
    body = `<line x1="${COL_X}" y1="${y + headH}" x2="${COL_X + bw}" y2="${y + headH}" stroke="${t.line}" stroke-width="1"/>
  <text x="${COL_X + 14}" y="${y + headH + 22}" ${MONO} font-size="10.5" letter-spacing="1.5" fill="${t.faint}">${outKicker}</text>
  <rect x="${COL_X + 12}" y="${y + headH + 30}" width="${bw - 24}" height="${paneH}" rx="8" fill="${t.preBg}"/>`;
    output.forEach((l, i) => {
      body += `\n  <text x="${COL_X + 26}" y="${y + headH + 50 + i * lh}" ${MONO} font-size="12" fill="${t.preText}" xml:space="preserve">${esc(l)}</text>`;
    });
    bh = headH + 30 + paneH + 12;
  }
  return {
    svg: `<rect x="${COL_X}" y="${y}" width="${bw}" height="${bh}" rx="10" fill="${t.badgeBg}" stroke="${isErr ? t.redLine : t.line}" stroke-width="1.5"/>
  ${icon}
  <text x="${COL_X + 36}" y="${y + 24}" ${SANS} font-size="13" fill="${t.muted}">${esc(label)}</text>
  ${exitChip}
  <text x="${COL_X + bw - 38}" y="${y + 23}" ${MONO} font-size="10.5" letter-spacing="1" fill="${t.faint}" text-anchor="end">${tag}</text>
  <path d="M ${COL_X + bw - 26} ${y + 16} l 5 6 l 5 -6" fill="none" stroke="${t.faint}" stroke-width="1.8"/>
  ${body}`,
    h: bh,
  };
}

function workingRow(theme, y, secs) {
  const t = T[theme];
  return {
    svg: `<circle cx="${COL_X + 5}" cy="${y + 10}" r="4.5" fill="${t.accent}"/>
  <text x="${COL_X + 18}" y="${y + 15}" ${SANS} font-size="13" fill="${t.faint}">Building&#8230; ${secs}s</text>`,
    h: 20,
  };
}

function receipt(theme, y, text) {
  const t = T[theme];
  return {
    svg: `<text x="${COL_X}" y="${y + 12}" ${MONO} font-size="12" fill="${t.faint}">${esc(text)}</text>`,
    h: 16,
  };
}

// assemble: pieces is [(fnName, args, gapBefore), ...] with a moving cursor
function appWindow(theme, { stop, pieces, minBodyH = 0 }) {
  const t = T[theme];
  let cursor = CHROME_H + HEADER_H + 28;
  let body = "";
  for (const p of pieces) {
    const [kind, args, gapBefore = 14] = p;
    if (body) cursor += gapBefore;
    const fn = { userBubble, prose, bullets, thinking, badge, workingRow, receipt }[kind];
    const r = fn(theme, cursor, args);
    body += "\n  " + r.svg;
    cursor += r.h;
  }
  const bodyH = Math.max(cursor - (CHROME_H + HEADER_H), minBodyH);
  const h = CHROME_H + HEADER_H + bodyH + 24 + FOOTER_H;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" ${SANS}>
  <rect width="${W}" height="${h}" fill="${t.pageBg}"/>
  ${chrome(theme)}
  ${appHeader(theme)}
  ${body}
  ${footer(theme, { stop }, h)}
</svg>`;
}

/* ============================================================
   3. browser-empty: the empty desk (from the real app; the app's
   subtitle sentence is drawn with a period, not a dash)
   ============================================================ */
function browserEmpty(theme) {
  const t = T[theme];
  const h = 620;
  const cx = W / 2;
  const chips = [
    "Create hello.html with a big heading that says Pagewright lives",
    "Build a one-page site for a small bakery: hero, menu, contact",
    "List the files in your workspace",
  ];
  let chipSvg = "";
  chips.forEach((c, i) => {
    const cw = Math.ceil(c.length * 7.2) + 36;
    const y = CHROME_H + 292 + i * 50;
    chipSvg += `\n  <rect x="${cx - cw / 2}" y="${y}" width="${cw}" height="38" rx="10" fill="${t.chipBg}" stroke="${t.line}" stroke-width="1.5"/>
  <text x="${cx}" y="${y + 24}" ${SANS} font-size="14" fill="${t.muted}" text-anchor="middle">${esc(c)}</text>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" ${SANS}>
  <rect width="${W}" height="${h}" fill="${t.pageBg}"/>
  ${chrome(theme)}
  ${appHeader(theme)}
  <circle cx="${cx}" cy="${CHROME_H + 152}" r="6" fill="${t.accent}"/>
  <text x="${cx}" y="${CHROME_H + 194}" ${SANS} font-size="19" font-weight="700" fill="${t.ink}" text-anchor="middle">Describe a website</text>
  <text x="${cx}" y="${CHROME_H + 224}" ${SANS} font-size="14" fill="${t.faint}" text-anchor="middle">Pagewright plans it, runs the commands, and writes the files.</text>
  <text x="${cx}" y="${CHROME_H + 244}" ${SANS} font-size="14" fill="${t.faint}" text-anchor="middle">You watch every step happen.</text>
  ${chipSvg}
  ${footer(theme, {}, h)}
</svg>`;
}

/* ============================================================
   4. browser-midrun: 5 seconds into the real bakery build, two
   probes already refused (exit 1, exit 2)
   ============================================================ */
const midrun = (theme) =>
  appWindow(theme, {
    stop: true,
    minBodyH: 430,
    pieces: [
      ["userBubble", "Build a one-page site for a small bakery called Flour & Stone: hero, menu, contact"],
      ["thinking", { active: true }, 18],
      ["prose", ["I'm going to inspect the existing app structure first, then I'll wire in a one-page", "bakery landing page with hero, menu, and contact sections that fit the current stack."], 10],
      ["badge", { label: "Checking the working directory", state: "err", exit: 1 }, 16],
      ["badge", { label: 'Running: "rg -n \\"(React|Next|Vite|Svelte|Astro|Vue|tailwind…', state: "err", exit: 2 }, 8],
      ["workingRow", 5, 16],
    ],
  });

/* ============================================================
   5. browser-thinking: the drawer open mid-run, real reasoning
   summary streaming into it (summary: "detailed")
   ============================================================ */
const thinkingOpen = (theme) =>
  appWindow(theme, {
    stop: true,
    minBodyH: 430,
    pieces: [
      ["userBubble", "Build a one-page site for a small bakery called Flour & Stone: hero, menu, contact"],
      ["thinking", {
        active: true, open: true, drawer: [
          "**Modifying code and checking files**",
          "",
          "I need to modify some code and inspect the repository. Since the web isn't",
          "required for this task, it looks like it will be a frontend-related task. I",
          "should definitely update the user before I dive deeper into the exploration.",
          "It's a good idea to check the files first to get a clear understanding of",
          "what changes need to be made. Let's make sure everything is lined up!",
        ],
      }, 18],
      ["prose", ["I'm going to inspect the existing app structure first, then I'll wire in a one-page", "bakery landing page with hero, menu, and contact sections that fit the current stack."], 12],
      ["workingRow", 4, 16],
    ],
  });

/* ============================================================
   6. browser-live-output: the terminal-in-a-badge, mid-stream.
   Real pulse run: tick lines arriving one per second.
   ============================================================ */
const liveOutput = (theme) =>
  appWindow(theme, {
    stop: true,
    minBodyH: 430,
    pieces: [
      ["userBubble", ["Run a shell loop that prints a line per second for 5 seconds, then create", "pulse.html with a heading that says The stream is alive"]],
      ["thinking", {}, 18],
      ["prose", ["I'll run the 5-second shell loop first so you can see the live output, then I'll add", "pulse.html with the requested heading."], 10],
      ["badge", {
        label: `Running: /bin/zsh -c 'for i in 1 2 3 4 5; do echo "tick $i"; sleep 1;…`,
        state: "spin",
        output: ["tick 2", "tick 3", "tick 4"],
      }, 16],
      ["prose", ["The loop is running; I'm waiting for the remaining ticks to finish before writing the file."], 16],
      ["workingRow", 9, 14],
    ],
  });

/* ============================================================
   7. browser-answer: the dessert. End of the real bakery build,
   compressed (the full turn ran seven commands).
   ============================================================ */
const answer = (theme) =>
  appWindow(theme, {
    stop: false,
    pieces: [
      ["userBubble", "Build a one-page site for a small bakery called Flour & Stone: hero, menu, contact"],
      ["thinking", {}, 18],
      ["badge", { label: "Checking the working directory", state: "err", exit: 1 }, 12],
      ["badge", { label: "Listing files", state: "ok" }, 8],
      ["prose", ["I confirmed there isn't an existing app scaffold in this directory, so I'm creating a", "self-contained static site: one index.html plus one stylesheet, with responsive", "sections and no framework assumptions."], 16],
      ["badge", { label: "Creating index.html, Creating styles.css", tag: "FILES", state: "ok" }, 14],
      ["thinking", {}, 14],
      ["badge", { label: `Running: "sed -n '1,220p' index.html"`, state: "ok" }, 12],
      ["prose", ["Built a self-contained one-page bakery site with:"], 18],
      ["bullets", ["a hero section", "a menu section", "a contact/visit section", "responsive styling and a warm editorial visual style"], 10],
      ["prose", ["Files: index.html and styles.css. If you want, I can next add product photos,", "a mobile menu, or a more luxe, brand-specific art direction."], 12],
      ["receipt", "118,240 tokens · 39s", 14],
    ],
  });

/* ============================================================
   8. browser-scrambled: the break. item_id keying dropped, two
   parallel commands, every delta lands in the last badge, and
   both spinners outlive the receipt.
   ============================================================ */
const scrambled = (theme) =>
  appWindow(theme, {
    stop: false,
    minBodyH: 430,
    pieces: [
      ["userBubble", ["At the same time, in two separate parallel tool calls, run one command that", "prints tick N once per second for 5 seconds and another that prints tock N", "once per second for 5 seconds. Then reply with one sentence."]],
      ["thinking", {}, 18],
      ["prose", ["I'm running the two one-second loops concurrently now so the outputs overlap in", "time, then I'll return a single-sentence confirmation."], 10],
      ["badge", { label: `Running: /bin/zsh -c 'for i in 1 2 3 4 5; do echo "tick $i"; sleep 1;…`, state: "spin" }, 16],
      ["badge", {
        label: `Running: /bin/zsh -c 'for i in 1 2 3 4 5; do echo "tock $i"; sleep 1;…`,
        state: "spin",
        output: ["tick 2", "tock 2"],
      }, 8],
      ["prose", ["The tick and tock loops both ran in parallel for 5 seconds and completed successfully."], 16],
      ["receipt", "45,705 tokens · 12s", 12],
    ],
  });

/* ============================================================
   9. fig-block-model: wire events, block array, rendered turn.
   Real shapes and ids from the 2026-07-06 runs.
   ============================================================ */
function figBlockModel(theme) {
  const light = theme === "light";
  const D = light
    ? { paper: "#faf9f6", line: "#e7e3d9", ink: "#1f1c19", muted: "#5b554c", faint: "#8f887a", accent: "#b3441a", chip: "#ffffff", surface: "#f1efe9", green: "#3f6212", accentTint: "#f6e7df", accentLine: "#dcb09a" }
    : { paper: "#151311", line: "#2b2723", ink: "#ebe7df", muted: "#a49c90", faint: "#756d62", accent: "#e5825a", chip: "#211e1a", surface: "#1d1a17", green: "#a3c57d", accentTint: "#2a201a", accentLine: "#5e463a" };
  const w = 1240, h = 700;
  const colW = 356, gap = 40;
  const c1 = 60, c2 = c1 + colW + gap, c3 = c2 + colW + gap;
  const topY = 96, colH = 476;

  const colHead = (x, kicker, title) => `
  <text x="${x + 4}" y="${topY - 26}" ${MONO} font-size="11.5" letter-spacing="2" fill="${D.faint}">${kicker}</text>
  <text x="${x + 4}" y="${topY - 6}" ${SANS} font-size="16" font-weight="700" fill="${D.ink}">${title}</text>`;

  // left column: wire events, in real arrival order
  const wire = [
    { t: `{"type":"item_start",`, c: D.ink },
    { t: `  "item_id":"rs_0e4a34b3…",`, c: D.accent },
    { t: `  "kind":"reasoning"}`, c: D.ink },
    { t: `{"type":"reasoning_delta",`, c: D.ink },
    { t: `  "item_id":"rs_0e4a34b3…",`, c: D.accent },
    { t: `  "text":"**Planning…"}`, c: D.muted },
    { t: `{"type":"text_delta",`, c: D.ink },
    { t: `  "text":"I'll run the"}`, c: D.muted },
    { t: `{"type":"item_start",`, c: D.ink },
    { t: `  "item_id":"call_oR9buR…",`, c: D.accent },
    { t: `  "kind":"commandExecution"}`, c: D.ink },
    { t: `{"type":"command_output_delta",`, c: D.ink },
    { t: `  "item_id":"call_oR9buR…",`, c: D.accent },
    { t: `  "chunk":"tick 2\\n"}`, c: D.green },
    { t: `{"type":"item_done",`, c: D.ink },
    { t: `  "item_id":"call_oR9buR…",`, c: D.accent },
    { t: `  "detail":{"exit_code":0}}`, c: D.green },
  ];
  let wireSvg = `<rect x="${c1}" y="${topY}" width="${colW}" height="${colH}" rx="14" fill="${D.chip}" stroke="${D.line}" stroke-width="1.5"/>`;
  wire.forEach((r, i) => {
    wireSvg += `\n  <text x="${c1 + 20}" y="${topY + 34 + i * 26}" ${MONO} font-size="12.5" fill="${r.c}" xml:space="preserve">${esc(r.t)}</text>`;
  });

  // middle column: the block array
  const blockCard = (y, bh, title, rows, hero) => {
    let s = `<rect x="${c2 + 16}" y="${y}" width="${colW - 32}" height="${bh}" rx="10" fill="${D.surface}" stroke="${hero ? D.accentLine : D.line}" stroke-width="1.5"/>
  <text x="${c2 + 32}" y="${y + 24}" ${MONO} font-size="12" font-weight="700" fill="${hero ? D.accent : D.ink}">${title}</text>`;
    rows.forEach((r, i) => {
      s += `\n  <text x="${c2 + 32}" y="${y + 46 + i * 21}" ${MONO} font-size="11.5" fill="${D.muted}" xml:space="preserve">${esc(r)}</text>`;
    });
    return s;
  };
  let mid = `<rect x="${c2}" y="${topY}" width="${colW}" height="${colH}" rx="14" fill="none" stroke="${D.line}" stroke-width="1.5" stroke-dasharray="6 5"/>
  <text x="${c2 + 20}" y="${topY + 28}" ${MONO} font-size="12" fill="${D.faint}">blocks: [</text>`;
  mid += blockCard(topY + 44, 96, `{type:"item", kind:"reasoning"`, [`id: "rs_0e4a34b3…"`, `reasoning: "**Planning…"`, `done: true}`], true);
  mid += blockCard(topY + 154, 74, `{type:"text"`, [`text: "I'll run the 5-second`, `shell loop first…"}`], false);
  mid += blockCard(topY + 242, 118, `{type:"item", kind:"commandExecution"`, [`id: "call_oR9buR…"`, `output: "tick 2\\ntick 3\\n…"`, `detail: {exit_code: 0},`, `done: true}`], true);
  mid += `\n  <text x="${c2 + 20}" y="${topY + 390}" ${MONO} font-size="12" fill="${D.faint}">]</text>
  <text x="${c2 + 20}" y="${topY + 428}" ${SANS} font-size="13" fill="${D.muted}">Deltas find their block by id,</text>
  <text x="${c2 + 20}" y="${topY + 448}" ${SANS} font-size="13" fill="${D.muted}">never by position: two items</text>
  <text x="${c2 + 20}" y="${topY + 468}" ${SANS} font-size="13" fill="${D.muted}">can be live at once.</text>`;

  // right column: the rendered turn
  const bx = c3 + 20, bw = colW - 40;
  let right = `<rect x="${c3}" y="${topY}" width="${colW}" height="${colH}" rx="14" fill="${D.chip}" stroke="${D.line}" stroke-width="1.5"/>
  <circle cx="${bx + 4}" cy="${topY + 34}" r="3" fill="${D.line}"/>
  <text x="${bx + 16}" y="${topY + 38}" ${SANS} font-size="10.5" font-weight="600" letter-spacing="1.5" fill="${D.faint}">THINKING</text>
  <path d="M ${bx + 92} ${topY + 31} l 4 5 l 4 -5" fill="none" stroke="${D.faint}" stroke-width="1.5"/>
  <text x="${bx}" y="${topY + 72}" ${SANS} font-size="13.5" fill="${D.ink}">I'll run the 5-second shell loop first</text>
  <text x="${bx}" y="${topY + 93}" ${SANS} font-size="13.5" fill="${D.ink}">so you can see the live output…</text>
  <rect x="${bx}" y="${topY + 112}" width="${bw}" height="118" rx="10" fill="${D.surface}" stroke="${D.line}" stroke-width="1.5"/>
  <text x="${bx + 12}" y="${topY + 136}" ${SANS} font-size="13" fill="${D.green}">&#x2713;</text>
  <text x="${bx + 30}" y="${topY + 136}" ${SANS} font-size="12" fill="${D.muted}">Running: for i in 1 2 3 4 5; do…</text>
  <text x="${bx + bw - 12}" y="${topY + 135}" ${MONO} font-size="9.5" letter-spacing="1" fill="${D.faint}" text-anchor="end">COMMAND</text>
  <line x1="${bx}" y1="${topY + 148}" x2="${bx + bw}" y2="${topY + 148}" stroke="${D.line}"/>
  <rect x="${bx + 10}" y="${topY + 158}" width="${bw - 20}" height="60" rx="6" fill="${light ? "#f5f5f4" : "#292524"}"/>
  <text x="${bx + 22}" y="${topY + 176}" ${MONO} font-size="11" fill="${D.muted}">tick 2</text>
  <text x="${bx + 22}" y="${topY + 194}" ${MONO} font-size="11" fill="${D.muted}">tick 3</text>
  <text x="${bx + 22}" y="${topY + 212}" ${MONO} font-size="11" fill="${D.muted}">tick 4</text>
  <text x="${bx}" y="${topY + 262}" ${SANS} font-size="13.5" fill="${D.ink}">The loop completed. I'm creating</text>
  <text x="${bx}" y="${topY + 283}" ${SANS} font-size="13.5" fill="${D.ink}">pulse.html now…</text>
  <text x="${bx}" y="${topY + 330}" ${MONO} font-size="11" fill="${D.faint}">60,233 tokens · 13s</text>
  <text x="${bx}" y="${topY + 404}" ${SANS} font-size="13" fill="${D.muted}">One component per block kind:</text>
  <text x="${bx}" y="${topY + 424}" ${SANS} font-size="13" fill="${D.muted}">text, reasoning drawer, command</text>
  <text x="${bx}" y="${topY + 444}" ${SANS} font-size="13" fill="${D.muted}">badge, files badge.</text>`;

  const arrow = (x) => `<path d="M ${x + 6} ${topY + colH / 2} h 22 m -7 -7 l 7 7 l -7 7" fill="none" stroke="${D.accent}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${D.paper}"/>
  <text x="${c1}" y="40" ${MONO} font-size="13" letter-spacing="2.5" fill="${D.faint}">ONE TURN, THREE FORMS &#183; REAL EVENTS FROM THE PULSE RUN, 2026-07-06</text>
  ${colHead(c1, "ON THE WIRE", "Envelope events, in arrival order")}
  ${colHead(c2, "IN STATE", "The block array")}
  ${colHead(c3, "ON SCREEN", "The rendered turn")}
  ${wireSvg}
  ${mid}
  ${right}
  ${arrow(c1 + colW + 4)}
  ${arrow(c2 + colW + 4)}
  <rect x="${c1}" y="${h - 84}" width="${w - 120}" height="48" rx="10" fill="${D.accentTint}" stroke="${D.accentLine}"/>
  <text x="${c1 + 20}" y="${h - 54}" ${SANS} font-size="14" fill="${D.ink}">The middle column mirrors the protocol's own noun: an assistant turn is a sequence of <tspan font-weight="700">items</tspan>. The from-zero derivation of this model lives in Agent SDK Part 3.</text>
</svg>`;
}

/* ============================================================
   write everything
   ============================================================ */
for (const theme of ["light", "dark"]) {
  writeFileSync(`${OUT}/cover-${theme}.svg`, cover(theme));
  writeFileSync(`${OUT}/fig-block-model-${theme}.svg`, figBlockModel(theme));
  writeFileSync(`${OUT}/browser-empty-${theme}.svg`, browserEmpty(theme));
  writeFileSync(`${OUT}/browser-midrun-${theme}.svg`, midrun(theme));
  writeFileSync(`${OUT}/browser-thinking-${theme}.svg`, thinkingOpen(theme));
  writeFileSync(`${OUT}/browser-live-output-${theme}.svg`, liveOutput(theme));
  writeFileSync(`${OUT}/browser-answer-${theme}.svg`, answer(theme));
  writeFileSync(`${OUT}/browser-scrambled-${theme}.svg`, scrambled(theme));
}
console.log("codex part-3 svgs written to", OUT);

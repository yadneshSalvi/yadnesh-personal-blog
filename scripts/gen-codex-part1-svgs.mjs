/**
 * Part 1 SVG assets for "Codex App Server in Production".
 * All terminal content mirrors real runs recorded 2026-07-06 against
 * codex-cli 0.142.4 / gpt-5.4-mini (thread ids, turn ids, token counts,
 * durations, and payloads are the measured values; user paths shortened
 * to the reader's world).
 *
 * Usage: node scripts/gen-codex-part1-svgs.mjs
 */
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";

const ROOT = "/Users/yadneshsalvi/code/yadnesh-personal-blog/public";
const OUT = `${ROOT}/images/series/codex/part-1`;
mkdirSync(OUT, { recursive: true });

const MONO = `font-family="'SF Mono', Menlo, Consolas, monospace"`;
const SANS = `font-family="-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"`;
const SERIF = `font-family="Georgia, 'Times New Roman', serif"`;

// ---- shared palettes (ink & paper tokens) ----
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
  const svg = readFileSync(`${ROOT}/icons/${file}`, "utf8");
  return svg.match(/<path[^>]*\sd="([^"]+)"/)[1];
};
const OPENAI = iconPath("openai.svg");   // viewBox 0 0 24
const FASTAPI = iconPath("FastAPI.svg"); // viewBox 0 0 128
const NEXTJS = iconPath("icons8-nextjs.svg"); // viewBox 0 0 48

function iconRow(t, x, y, size = 56) {
  const gap = 36;
  const ko = size / 24, kf = size / 128, kn = size / 48;
  let cx = x;
  const parts = [];
  parts.push(`<g transform="translate(${cx},${y}) scale(${ko})"><path d="${OPENAI}" fill="${t.ink}" fill-rule="evenodd" opacity="0.85"/></g>`);
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
  <text x="64" y="118" ${MONO} font-size="19" letter-spacing="3.5" fill="${t.faint}">SERIES &#183; CODEX APP SERVER IN PRODUCTION</text>
  <text x="1216" y="118" ${MONO} font-size="19" letter-spacing="3.5" fill="${t.faint}" text-anchor="end">PART 1 OF 13</text>
  <text x="62" y="342" ${SERIF} font-size="92" fill="${t.ink}" letter-spacing="-1">Your first <tspan font-style="italic" fill="${t.accent}">thread</tspan></text>
  <text x="64" y="412" ${SERIF} font-size="36" font-style="italic" fill="${t.muted}">Speak raw JSON-RPC to the engine inside Codex. Get a website back.</text>
  ${iconRow(t, 64, 512)}
</svg>`;
}

/* ============================================================
   2. fig-finished-app — the series dessert: Part 13 Pagewright.
   Browser window, chat + approval left, live preview right,
   diff drawer peeking in from the right edge.
   ============================================================ */
function figFinishedApp(theme) {
  const t = D[theme];
  const light = theme === "light";
  const w = 1280, h = 600;
  // window chrome tones
  const winBg = light ? "#f5f5f4" : "#1d1a17";
  const winLine = light ? "#e2ded4" : "#2b2723";
  const chromeBg = light ? "#f3f1ec" : "#211e1a";
  const dot = light ? "#d6d1c5" : "#3a3530";
  const panel = light ? "#ffffff" : "#211e1a";
  const panelLine = light ? "#e7e5e4" : "#2f2a25";
  // preview page tones (the generated Beanline site, own theme per side)
  const page = light ? "#f6efe7" : "#241b14";
  const pageInk = light ? "#2d1b12" : "#efe3d5";
  const pageMut = light ? "#6b5649" : "#b09a88";
  const pageAcc = light ? "#9a5b2e" : "#d99b62";
  const pageCard = light ? "#fffaf4" : "#2c221a";
  const pageLine = light ? "#eadfd2" : "#3b2f24";
  const drawerBg = "#1a1816";
  const chatX = 64, chatW = 442, colY = 104, colH = 452;
  const prevX = 526, prevW = 618;

  const menuItem = (mx, my, name, price) => `
  <rect x="${mx}" y="${my}" width="176" height="52" rx="8" fill="${pageCard}" stroke="${pageLine}"/>
  <text x="${mx + 14}" y="${my + 22}" ${SERIF} font-size="14" fill="${pageInk}">${name}</text>
  <text x="${mx + 14}" y="${my + 41}" ${MONO} font-size="11.5" fill="${pageAcc}">${price}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${t.paper}"/>

  <!-- browser window -->
  <rect x="40" y="20" width="1200" height="560" rx="12" fill="${winBg}" stroke="${winLine}" stroke-width="1.5"/>
  <path d="M 40 32 a12 12 0 0 1 12,-12 h 1176 a12 12 0 0 1 12,12 v 32 h -1200 z" fill="${chromeBg}"/>
  <line x1="40" y1="64" x2="1240" y2="64" stroke="${winLine}" stroke-width="1.5"/>
  <circle cx="66" cy="42" r="6" fill="${dot}"/><circle cx="88" cy="42" r="6" fill="${dot}"/><circle cx="110" cy="42" r="6" fill="${dot}"/>
  <rect x="450" y="28" width="380" height="28" rx="14" fill="${panel}" stroke="${winLine}"/>
  <text x="640" y="47" ${MONO} font-size="14" fill="${t.muted}" text-anchor="middle">localhost:3000</text>

  <!-- chat column -->
  <rect x="${chatX}" y="${colY}" width="${chatW}" height="${colH}" rx="12" fill="${panel}" stroke="${panelLine}" stroke-width="1.5"/>
  <text x="${chatX + 22}" y="${colY + 32}" ${SANS} font-size="15" font-weight="700" fill="${t.ink}">Pagewright</text>
  <text x="${chatX + chatW - 22}" y="${colY + 32}" ${MONO} font-size="11" fill="${t.faint}" text-anchor="end">BEANLINE &#183; BUILDING&#8230; 31s</text>
  <line x1="${chatX}" y1="${colY + 48}" x2="${chatX + chatW}" y2="${colY + 48}" stroke="${panelLine}" stroke-width="1.5"/>

  <!-- user bubble -->
  <rect x="${chatX + 96}" y="${colY + 64}" width="${chatW - 118}" height="56" rx="12" fill="${light ? "#1c1917" : "#3a332c"}"/>
  <text x="${chatX + 112}" y="${colY + 87}" ${SANS} font-size="13.5" fill="#fafaf9">A one-page site for Beanline: warm,</text>
  <text x="${chatX + 112}" y="${colY + 107}" ${SANS} font-size="13.5" fill="#fafaf9">editorial, a menu section.</text>

  <!-- command badge, done -->
  <rect x="${chatX + 22}" y="${colY + 136}" width="316" height="34" rx="9" fill="none" stroke="${panelLine}" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="${chatX + 36}" y="${colY + 158}" ${MONO} font-size="12.5" fill="${t.muted}"><tspan fill="${t.green}">&#10003;</tspan>  <tspan font-weight="700" fill="${t.ink}">zsh</tspan>  rg --files &#183; exit 0</text>

  <!-- file change badge, running -->
  <rect x="${chatX + 22}" y="${colY + 178}" width="316" height="34" rx="9" fill="none" stroke="${panelLine}" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="${chatX + 36}" y="${colY + 200}" ${MONO} font-size="12.5" fill="${t.muted}"><tspan fill="${t.accent}">&#9679;</tspan>  <tspan font-weight="700" fill="${t.ink}">edit</tspan>  index.html &#183; updating</text>

  <!-- approval card with patch preview -->
  <rect x="${chatX + 22}" y="${colY + 226}" width="${chatW - 44}" height="150" rx="12" fill="${t.accentTint}" stroke="${t.accentLine}" stroke-width="1.5"/>
  <text x="${chatX + 40}" y="${colY + 252}" ${SANS} font-size="13.5" font-weight="700" fill="${t.ink}">Approve this patch?</text>
  <text x="${chatX + chatW - 40}" y="${colY + 252}" ${MONO} font-size="11" fill="${t.accent}" text-anchor="end">+9 &#8722;2</text>
  <rect x="${chatX + 40}" y="${colY + 264}" width="${chatW - 80}" height="66" rx="8" fill="${drawerBg}"/>
  <text x="${chatX + 54}" y="${colY + 285}" ${MONO} font-size="11.5" fill="${TT.faint}">@@ index.html</text>
  <text x="${chatX + 54}" y="${colY + 303}" ${MONO} font-size="11.5" fill="${TT.green}">+ &lt;section id="menu"&gt;</text>
  <text x="${chatX + 54}" y="${colY + 321}" ${MONO} font-size="11.5" fill="${TT.red}">&#8722; &lt;p&gt;menu coming soon&lt;/p&gt;</text>
  <rect x="${chatX + 40}" y="${colY + 340}" width="92" height="26" rx="13" fill="${light ? "#1c1917" : "#ebe7df"}"/>
  <text x="${chatX + 86}" y="${colY + 357}" ${SANS} font-size="12.5" font-weight="700" fill="${light ? "#fafaf9" : "#1c1917"}" text-anchor="middle">Approve</text>
  <rect x="${chatX + 142}" y="${colY + 340}" width="72" height="26" rx="13" fill="none" stroke="${t.accentLine}" stroke-width="1.5"/>
  <text x="${chatX + 178}" y="${colY + 357}" ${SANS} font-size="12.5" fill="${t.ink}" text-anchor="middle">Deny</text>

  <!-- streaming line -->
  <text x="${chatX + 22}" y="${colY + 410}" ${SANS} font-size="13.5" fill="${t.muted}">Adding the menu section now, then the</text>
  <text x="${chatX + 22}" y="${colY + 430}" ${SANS} font-size="13.5" fill="${t.muted}">footer.<tspan fill="${t.accent}">&#9612;</tspan></text>

  <!-- preview pane -->
  <rect x="${prevX}" y="${colY}" width="${prevW}" height="${colH}" rx="12" fill="${panel}" stroke="${panelLine}" stroke-width="1.5"/>
  <text x="${prevX + 22}" y="${colY + 32}" ${MONO} font-size="11" letter-spacing="2" fill="${t.accent}">LIVE PREVIEW</text>
  <text x="${prevX + prevW - 78}" y="${colY + 32}" ${MONO} font-size="11" fill="${t.faint}" text-anchor="end">/p/beanline/</text>
  <line x1="${prevX}" y1="${colY + 48}" x2="${prevX + prevW}" y2="${colY + 48}" stroke="${panelLine}" stroke-width="1.5"/>

  <!-- the generated Beanline page -->
  <rect x="${prevX + 18}" y="${colY + 64}" width="${prevW - 92}" height="${colH - 82}" rx="8" fill="${page}" stroke="${pageLine}"/>
  <text x="${prevX + 52}" y="${colY + 132}" ${SERIF} font-size="42" fill="${pageInk}">Beanline</text>
  <text x="${prevX + 52}" y="${colY + 162}" ${SERIF} font-size="16" font-style="italic" fill="${pageMut}">Slow coffee, roasted loud.</text>
  <line x1="${prevX + 52}" y1="${colY + 184}" x2="${prevX + 130}" y2="${colY + 184}" stroke="${pageAcc}" stroke-width="2.5"/>
  <text x="${prevX + 52}" y="${colY + 222}" ${MONO} font-size="11" letter-spacing="2.5" fill="${pageAcc}">THE MENU</text>
  ${menuItem(prevX + 52, colY + 238, "Espresso", "3.20")}
  ${menuItem(prevX + 244, colY + 238, "Flat white", "4.10")}
  ${menuItem(prevX + 52, colY + 302, "Filter of the day", "3.60")}
  ${menuItem(prevX + 244, colY + 302, "Cardamom bun", "3.90")}
  <text x="${prevX + 52}" y="${colY + colH - 42}" ${SANS} font-size="11.5" fill="${pageMut}">Roastery &amp; cafe &#183; Marine Drive &#183; open 7 to 7</text>

  <!-- diff drawer peeking from the right -->
  <path d="M ${prevX + prevW - 58} ${colY + 14} h 46 a12 12 0 0 1 12 12 v ${colH - 52} a12 12 0 0 1 -12 12 h -46 z" fill="${drawerBg}"/>
  <text x="${prevX + prevW - 44}" y="${colY + 40}" ${MONO} font-size="10" letter-spacing="2" fill="${TT.accent}">DIFF</text>
  <text x="${prevX + prevW - 46}" y="${colY + 66}" ${MONO} font-size="10.5" fill="${TT.green}">+ &lt;se</text>
  <text x="${prevX + prevW - 46}" y="${colY + 84}" ${MONO} font-size="10.5" fill="${TT.green}">+ &lt;h2</text>
  <text x="${prevX + prevW - 46}" y="${colY + 102}" ${MONO} font-size="10.5" fill="${TT.red}">&#8722; &lt;p&gt;</text>
  <text x="${prevX + prevW - 46}" y="${colY + 120}" ${MONO} font-size="10.5" fill="${TT.green}">+ &lt;ul</text>
  <text x="${prevX + prevW - 46}" y="${colY + 138}" ${MONO} font-size="10.5" fill="${TT.faint}">&#8230;</text>
</svg>`;
}

/* ============================================================
   3. fig-engine-hatch — one engine, many clients.
   ============================================================ */
function figEngineHatch(theme) {
  const t = D[theme];
  const w = 1240, h = 660;
  const eng = { x: 60, y: 104, w: 420, h: 380 };
  const doorX = 566;
  const cliX = 660, cliW = 520, cliH = 58, cliGap = 14;
  const clients = [
    { name: "Codex CLI", sub: "the terminal app you ran during setup" },
    { name: "IDE extension", sub: "the Codex panel inside VS Code" },
    { name: "Codex web", sub: "chatgpt.com/codex, cloud tasks" },
    { name: "Codex desktop app", sub: "same engine, native window" },
    { name: "Your app: Pagewright", sub: "starting today, about 60 lines of Python", hero: true },
  ];
  const chip = (cx, cy, cw, label) => `
  <rect x="${cx}" y="${cy}" width="${cw}" height="34" rx="8" fill="${t.surface}" stroke="${t.line}"/>
  <text x="${cx + cw / 2}" y="${cy + 22}" ${MONO} font-size="12.5" fill="${t.muted}" text-anchor="middle">${label}</text>`;
  let clientRows = "", wires = "", slots = "";
  clients.forEach((c, i) => {
    const cy = eng.y + 18 + i * (cliH + cliGap);
    const mid = cy + cliH / 2;
    clientRows += `
  <rect x="${cliX}" y="${cy}" width="${cliW}" height="${cliH}" rx="12" fill="${c.hero ? t.accentTint : t.chip}" stroke="${c.hero ? t.accentLine : t.line}" stroke-width="1.5"/>
  <text x="${cliX + 20}" y="${cy + 25}" ${SANS} font-size="16" font-weight="700" fill="${c.hero ? t.accent : t.ink}">${c.name}</text>
  <text x="${cliX + 20}" y="${cy + 45}" ${SANS} font-size="13" fill="${t.muted}">${c.sub}</text>`;
    wires += `
  <line x1="${eng.x + eng.w}" y1="${mid}" x2="${cliX}" y2="${mid}" stroke="${c.hero ? t.accent : t.line}" stroke-width="${c.hero ? 2.5 : 1.5}"/>`;
    slots += `
  <rect x="${doorX - 3}" y="${mid - 9}" width="6" height="18" rx="3" fill="${t.paper}" stroke="${c.hero ? t.accent : t.faint}" stroke-width="1.5"/>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${t.paper}"/>
  <text x="60" y="52" ${MONO} font-size="13" letter-spacing="2.5" fill="${t.faint}">ONE ENGINE &#183; MANY CLIENTS &#183; SAME NOTES UNDER THE SAME DOOR</text>

  <!-- the engine -->
  <rect x="${eng.x}" y="${eng.y}" width="${eng.w}" height="${eng.h}" rx="16" fill="${t.chip}" stroke="${t.line}" stroke-width="1.5"/>
  <text x="${eng.x + 26}" y="${eng.y + 40}" ${MONO} font-size="12" letter-spacing="2.5" fill="${t.faint}">THE ENGINE</text>
  <text x="${eng.x + 26}" y="${eng.y + 82}" ${MONO} font-size="25" font-weight="700" fill="${t.ink}">codex app-server</text>
  <text x="${eng.x + 26}" y="${eng.y + 112}" ${SANS} font-size="14.5" fill="${t.muted}">one process, spoken to over stdin and stdout</text>
  ${chip(eng.x + 26, eng.y + 142, 175, "threads &amp; turns")}
  ${chip(eng.x + 219, eng.y + 142, 175, "the agent loop")}
  ${chip(eng.x + 26, eng.y + 188, 175, "OS sandbox")}
  ${chip(eng.x + 219, eng.y + 188, 175, "rollout archive")}
  ${chip(eng.x + 26, eng.y + 234, 175, "model access")}
  ${chip(eng.x + 219, eng.y + 234, 175, "approvals")}
  <text x="${eng.x + 26}" y="${eng.y + 316}" ${SANS} font-size="14" fill="${t.muted}">Everything a Codex surface can do</text>
  <text x="${eng.x + 26}" y="${eng.y + 338}" ${SANS} font-size="14" fill="${t.muted}">lives here, behind one JSON-RPC door.</text>

  <!-- the door -->
  <line x1="${doorX}" y1="${eng.y - 10}" x2="${doorX}" y2="${eng.y + eng.h + 10}" stroke="${t.faint}" stroke-width="2"/>
  ${slots}
  ${wires}
  ${clientRows}
  <text x="${doorX}" y="${eng.y + eng.h + 42}" ${MONO} font-size="12" letter-spacing="2" fill="${t.faint}" text-anchor="middle">STDIO &#183; JSON, ONE LINE PER NOTE</text>

  <!-- legend: the two kinds of note -->
  <rect x="60" y="${h - 96}" width="470" height="58" rx="10" fill="${t.surface}" stroke="${t.line}"/>
  <text x="80" y="${h - 72}" ${MONO} font-size="13" fill="${t.accent}">{"id": 3, "method": "turn/start", &#8230;}</text>
  <text x="80" y="${h - 50}" ${SANS} font-size="13" fill="${t.muted}">a request: numbered, gets exactly one reply</text>
  <rect x="556" y="${h - 96}" width="470" height="58" rx="10" fill="${t.surface}" stroke="${t.line}"/>
  <text x="576" y="${h - 72}" ${MONO} font-size="13" fill="${t.muted}">{"method": "item/started", &#8230;}</text>
  <text x="576" y="${h - 50}" ${SANS} font-size="13" fill="${t.muted}">a notification: no number, arrives unasked</text>
</svg>`;
}

/* ============================================================
   4. fig-stream-anatomy — the Rosetta stone. Real payloads from
   the 2026-07-06 Beanline run, trimmed.
   ============================================================ */
function figStreamAnatomy(theme) {
  const t = D[theme];
  const w = 1240;
  const cardX = 60, cardW = 764;
  const noteX = cardX + cardW + 40;
  let y = 64;
  const parts = [];
  const card = (title, badge, rows, hero) => {
    const rowH = 29, padTop = 60, padBot = 18;
    const ch = padTop + rows.length * rowH + padBot;
    let s = `<rect x="${cardX}" y="${y}" width="${cardW}" height="${ch}" rx="14" fill="${t.chip}" stroke="${hero ? t.accentLine : t.line}" stroke-width="1.5"/>
  <text x="${cardX + 26}" y="${y + 38}" ${MONO} font-size="18" font-weight="700" fill="${t.ink}">${title}</text>
  <text x="${cardX + cardW - 26}" y="${y + 38}" ${MONO} font-size="12" letter-spacing="2" fill="${hero ? t.accent : t.faint}" text-anchor="end">${badge}</text>
  <line x1="${cardX}" y1="${y + 50}" x2="${cardX + cardW}" y2="${y + 50}" stroke="${t.line}" stroke-width="1"/>`;
    rows.forEach((r, i) => {
      const color = r.c === "a" ? t.accent : r.c === "m" ? t.muted : r.c === "g" ? t.green : t.ink;
      s += `\n  <text x="${cardX + 26}" y="${y + padTop + 6 + i * rowH}" ${MONO} font-size="15" fill="${color}" xml:space="preserve">${r.t}</text>`;
    });
    const top = y;
    parts.push(s);
    y += ch;
    return top;
  };
  const note = (cy, lines) => {
    let s = "";
    lines.forEach((l, i) => {
      s += `<text x="${noteX}" y="${cy + i * 26}" ${SANS} font-size="16" ${l.strong ? `font-weight="700" fill="${t.accent}"` : `fill="${t.muted}"`}>${l.text}</text>`;
    });
    parts.push(`<line x1="${cardX + cardW + 8}" y1="${cy - 5}" x2="${noteX - 10}" y2="${cy - 5}" stroke="${t.accent}" stroke-width="1.5"/>` + s);
  };
  const gap = (label) => {
    parts.push(`<line x1="${cardX + 60}" y1="${y + 8}" x2="${cardX + 60}" y2="${y + 40}" stroke="${t.faint}" stroke-width="2"/>
  <path d="M ${cardX + 53} ${y + 38} L ${cardX + 67} ${y + 38} L ${cardX + 60} ${y + 50} Z" fill="${t.faint}"/>
  ${label ? `<text x="${cardX + 84}" y="${y + 34}" ${MONO} font-size="12.5" fill="${t.faint}">${label}</text>` : ""}`);
    y += 58;
  };

  let top;
  top = card("you &#8594; engine", "REQUEST &#183; HAS AN ID", [
    { t: `{"jsonrpc": "2.0", "id": 3, "method": "turn/start",`, c: "a" },
    { t: ` "params": {"threadId": "019f387d-a6b4-&#8230;",`, c: "i" },
    { t: `   "input": [{"type": "text",`, c: "i" },
    { t: `     "text": "Build a single-page site for Beanline&#8230;"}]}}`, c: "m" },
  ], true);
  note(top + 40, [
    { text: "A numbered note.", strong: true },
    { text: "Exactly one reply will" },
    { text: "quote id 3. Everything" },
    { text: "else you get back is" },
    { text: "narration." },
  ]);
  gap();

  top = card("engine &#8594; you", "RESPONSE &#183; SAME ID", [
    { t: `{"id": 3, "result": {"turn": {`, c: "a" },
    { t: `   "id": "019f387d-a71a-7641-&#8230;",`, c: "i" },
    { t: `   "status": "inProgress", &#8230;}}}`, c: "i" },
  ], true);
  note(top + 40, [
    { text: "The receipt, not the result.", strong: true },
    { text: "The turn is accepted and" },
    { text: "running. The actual work" },
    { text: "arrives below, unnumbered." },
  ]);
  gap("the narration begins &#183; nothing below carries an id");

  top = card("item/started", "NOTIFICATION", [
    { t: `{"method": "item/started", "params": {"item": {`, c: "i" },
    { t: `   "type": "commandExecution", "id": "call_TQqOM&#8230;",`, c: "a" },
    { t: `   "command": "/bin/zsh -lc 'rg --files'",`, c: "i" },
    { t: `   "status": "inProgress", &#8230;}, "turnId": &#8230;}}`, c: "m" },
  ], false);
  note(top + 40, [
    { text: "An item opens.", strong: true },
    { text: "One unit of agent work:" },
    { text: "a command, a file edit," },
    { text: "reasoning, or prose. Each" },
    { text: "gets started/completed." },
  ]);
  gap();

  top = card("item/agentMessage/delta", "NOTIFICATION &#183; &#215; 248", [
    { t: `{"method": "item/agentMessage/delta", "params": {`, c: "i" },
    { t: `   "itemId": "msg_0925e1fe48f0&#8230;", "delta": "I"}}`, c: "a" },
  ], false);
  note(top + 40, [
    { text: "The typing effect.", strong: true },
    { text: "Hundreds of these, a few" },
    { text: "characters each, keyed to" },
    { text: "their item by itemId." },
  ]);
  gap();

  top = card("item/completed", "NOTIFICATION", [
    { t: `{"method": "item/completed", "params": {"item": {`, c: "i" },
    { t: `   "type": "fileChange", "changes": [{`, c: "a" },
    { t: `     "path": "&#8230;/site/index.html",`, c: "i" },
    { t: `     "kind": {"type": "add"}, "diff": "&#8230;"}], &#8230;}}}`, c: "g" },
  ], false);
  note(top + 40, [
    { text: "The item settles,", strong: true },
    { text: "results attached. Here:" },
    { text: "the file the agent added," },
    { text: "with its diff." },
  ]);
  gap();

  top = card("thread/tokenUsage/updated", "NOTIFICATION &#183; THE METER", [
    { t: `{"method": "thread/tokenUsage/updated", "params": {`, c: "i" },
    { t: `   "tokenUsage": {"total": {"totalTokens": 125052,`, c: "a" },
    { t: `     "inputTokens": 117968, "cachedInputTokens": 96640,`, c: "a" },
    { t: `     "outputTokens": 7084, &#8230;}, &#8230;},`, c: "a" },
    { t: `   "modelContextWindow": 258400}}`, c: "m" },
  ], true);
  note(top + 40, [
    { text: "The only place usage", strong: true },
    { text: "lives.", strong: true },
    { text: "Fires several times per" },
    { text: "turn; the last one is" },
    { text: "your bill." },
  ]);
  gap();

  top = card("turn/diff/updated", "NOTIFICATION", [
    { t: `{"method": "turn/diff/updated", "params": {`, c: "i" },
    { t: `   "diff": "diff --git a/index.html b/index.html\\n`, c: "g" },
    { t: `     new file mode 100644\\n&#8230;+&lt;!doctype html&gt;&#8230;"}}`, c: "g" },
  ], false);
  note(top + 40, [
    { text: "The whole turn's diff,", strong: true },
    { text: "re-sent as it grows." },
    { text: "Part 4 turns this into" },
    { text: "the diff drawer." },
  ]);
  gap();

  top = card("turn/completed", "NOTIFICATION &#183; CLOSING BELL", [
    { t: `{"method": "turn/completed", "params": {"turn": {`, c: "i" },
    { t: `   "id": "019f387d-a71a-7641-&#8230;",`, c: "i" },
    { t: `   "status": "completed",`, c: "g" },
    { t: `   "durationMs": &#8230;, "error": null}}}`, c: "m" },
  ], true);
  note(top + 40, [
    { text: "Status and timing only.", strong: true },
    { text: "No usage field here; the" },
    { text: "meter already told you." },
    { text: "Our run: completed, 45.0s." },
  ]);

  const h = y + 56;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${t.paper}"/>
  <text x="${cardX}" y="42" ${MONO} font-size="13" letter-spacing="2.5" fill="${t.faint}">ONE REAL TURN ON THE WIRE &#183; BEANLINE BUILD, 2026-07-06, TRIMMED</text>
  ${parts.join("\n  ")}
</svg>`;
}

/* ============================================================
   5. TERMINALS (dark only, real runs)
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
    `${F(TT.faint, "$")} uv run python hello_appserver.py`,
    ``,
    `engine says: {`,
    `  "userAgent": "${F(TT.accent, "pagewright/0.142.4")} (Mac OS 26.3.0; arm64) vscode/3.5.33 (pagewright; 0.1)",`,
    `  "codexHome": "/Users/you/.codex",`,
    `  "platformFamily": "unix",`,
    `  "platformOs": "macos"`,
    `}`,
    ``,
    `${F(TT.faint, "# the engine took the name we sent (“pagewright”) and wove it into its")}`,
    `${F(TT.faint, "# own user agent. the handshake is real; you are officially a client.")}`,
  ]);

const termNotInitialized = () =>
  term("terminal &#183; backend", [
    `${F(TT.faint, "$")} uv run python skip_handshake.py   ${F(TT.faint, "# thread/start sent first, no initialize")}`,
    ``,
    `{"error":{"code":${F(TT.red, "-32600")},"message":${F(TT.red, '"Not initialized"')}},"id":${F(TT.accent, "1")}}`,
    ``,
    `${F(TT.faint, "# no crash, no silence: a proper JSON-RPC error, quoting our id.")}`,
    `${F(TT.faint, "# the engine refuses every method until the handshake is done.")}`,
  ]);

const termFirstThread = () =>
  term("terminal &#183; backend", [
    `${F(TT.faint, "$")} uv run python first_thread.py`,
    `[thread ${F(TT.accent, "019f387d-a6b4-75f1-ae60-1ae4baa9a087")}]`,
    ``,
    `  ${F(TT.faint, "...thinking")}`,
    `I’m going to inspect the site directory first, then I’ll replace or create`,
    `index.html with a self-contained single-page Beanline experience using`,
    `inline CSS only.`,
    `  ${F(TT.blue, "-> runs: /bin/zsh -lc 'rg --files'")}`,
    `  ${F(TT.blue, "-> runs: /bin/zsh -lc pwd")}`,
    `  ${F(TT.faint, "...thinking")}`,
    `The directory looks empty, so I’m checking for any existing scaffold`,
    `before I add the page.`,
    `  ${F(TT.blue, "-> runs: /bin/zsh -lc 'ls -la'")}`,
    `  ${F(TT.blue, "-> runs: /bin/zsh -lc 'find . -maxdepth 2 -type f | sort'")}`,
    `  ${F(TT.faint, "...thinking")}`,
    `I confirmed there’s no existing site content, so I’m adding a complete`,
    `editorial-style landing page with a warm palette, strong type hierarchy,`,
    `and a compact menu grid.`,
    `  ${F(TT.blue, "-> edits files")}`,
    `  ${F(TT.faint, "...thinking")}`,
    `The page is in place. I’m doing a quick readback on the generated HTML`,
    `to catch any structural issues before I hand it off.`,
    `  ${F(TT.blue, `-> runs: /bin/zsh -lc "sed -n '1,260p' index.html"`)}`,
    `${F(TT.faint, "# it wrote the file, then proofread its own work. then:")}`,
    ``,
    `${F(TT.green, "Built the Beanline single-page site in index.html.")}`,
    ``,
    `${F(TT.green, "What’s included:")}`,
    `${F(TT.green, "- Warm editorial hero with brand lockup, CTA buttons, and a custom")}`,
    `${F(TT.green, "  coffee illustration")}`,
    `${F(TT.green, "- Menu section with six items, prices, and tag chips")}`,
    `${F(TT.green, "- Fully inline CSS, no external resources, no JavaScript")}`,
    `${F(TT.green, "- Responsive layout for desktop and mobile")}`,
    ``,
    `[completed in ${F(TT.accent, "45.0s")} &#183; ${F(TT.accent, "117968 in / 7084 out")}]`,
  ]);

/* ============================================================
   write everything
   ============================================================ */
for (const theme of ["light", "dark"]) {
  writeFileSync(`${OUT}/cover-${theme}.svg`, cover(theme));
  writeFileSync(`${OUT}/fig-finished-app-${theme}.svg`, figFinishedApp(theme));
  writeFileSync(`${OUT}/fig-engine-hatch-${theme}.svg`, figEngineHatch(theme));
  writeFileSync(`${OUT}/fig-stream-anatomy-${theme}.svg`, figStreamAnatomy(theme));
}
writeFileSync(`${OUT}/term-hello.svg`, termHello());
writeFileSync(`${OUT}/term-first-thread.svg`, termFirstThread());
writeFileSync(`${OUT}/term-not-initialized.svg`, termNotInitialized());
console.log("codex part-1 svgs written to", OUT);

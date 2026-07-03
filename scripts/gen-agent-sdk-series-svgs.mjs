/**
 * Series-level SVG assets for "Claude Agent SDK in Production".
 * Generates the series landing cover (light + dark): a dessert-shot
 * composition of the finished analyst — chat with tool badges and a
 * resolved approval card on the left, artifacts panel (revenue chart +
 * report) on the right — framed by the ink & paper cover furniture and
 * the Anthropic / FastAPI / Next.js icon row.
 *
 * Usage: node scripts/gen-agent-sdk-series-svgs.mjs
 */
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";

const OUT = "/Users/yadneshsalvi/code/yadnesh-personal-blog/public/images/series/agent-sdk";
mkdirSync(OUT, { recursive: true });

const MONO = `font-family="'SF Mono', Menlo, Consolas, monospace"`;
const SANS = `font-family="-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif"`;

// ---- icon paths, extracted from public/icons/ ----
const iconPath = (file) => {
  const svg = readFileSync(`/Users/yadneshsalvi/code/yadnesh-personal-blog/public/icons/${file}`, "utf8");
  const m = svg.match(/<path[^>]*\sd="([^"]+)"/);
  if (!m) throw new Error(`no path in ${file}`);
  return m[1];
};
const ANTHROPIC = iconPath("anthropic.svg"); // viewBox 24
const FASTAPI = iconPath("FastAPI.svg"); // viewBox 128
const NEXTJS = iconPath("icons8-nextjs.svg"); // viewBox 48

// ---- palettes (ink & paper cover furniture + stone app chrome) ----
const P = {
  light: {
    paper: "#faf9f6", line: "#e7e3d9", ink: "#1f1c19", muted: "#5b554c",
    faint: "#8f887a", accent: "#b3441a", numeral: "#e9e5d9",
  },
  dark: {
    paper: "#151311", line: "#2b2723", ink: "#ebe7df", muted: "#a49c90",
    faint: "#756d62", accent: "#e5825a", numeral: "#241f1b",
  },
};
const APP = {
  light: {
    chromeBg: "#f3f1ec", chromeLine: "#e2ded4", dots: "#d6d1c5",
    urlFill: "#ffffff", urlStroke: "#e2ded4", urlText: "#5b554c",
    pageBg: "#f5f5f4", cardBg: "#ffffff", cardLine: "#e7e5e4",
    ink: "#1c1917", muted: "#78716c", faint: "#a8a29e",
    asstBubble: "#f5f5f4", userBubble: "#1c1917", userText: "#fafaf9",
    toolLine: "#d6d3d1", ok: "#3f6212", okBg: "#f2f7e8",
    panelBg: "#fafaf9", chipBg: "#ffffff",
  },
  dark: {
    chromeBg: "#211e1a", chromeLine: "#2b2723", dots: "#3a3530",
    urlFill: "#1a1816", urlStroke: "#3a3530", urlText: "#a49c90",
    pageBg: "#0c0a09", cardBg: "#1c1917", cardLine: "#292524",
    ink: "#fafaf9", muted: "#a8a29e", faint: "#78716c",
    asstBubble: "#292524", userBubble: "#fafaf9", userText: "#1c1917",
    toolLine: "#44403c", ok: "#a3c57d", okBg: "#1d2314",
    panelBg: "#171412", chipBg: "#211e1a",
  },
};

function iconRow(t, x, y) {
  // 40px-tall icons, vertically centered on y; middot separators
  const gap = 30;
  const s = [];
  let cx = x;
  s.push(`<g transform="translate(${cx},${y - 20}) scale(1.6667)"><path d="${ANTHROPIC}" fill="${t.ink}" fill-rule="evenodd" opacity="0.8"/></g>`);
  cx += 40 + gap;
  s.push(`<circle cx="${cx}" cy="${y}" r="3" fill="${t.faint}"/>`);
  cx += gap;
  s.push(`<g transform="translate(${cx},${y - 20}) scale(0.3125)"><path d="${FASTAPI}" fill="${t.ink}" fill-rule="evenodd" opacity="0.8"/></g>`);
  cx += 40 + gap;
  s.push(`<circle cx="${cx}" cy="${y}" r="3" fill="${t.faint}"/>`);
  cx += gap;
  s.push(`<g transform="translate(${cx},${y - 20}) scale(0.8333)"><path d="${NEXTJS}" fill="${t.ink}" fill-rule="evenodd" opacity="0.8"/></g>`);
  return s.join("\n  ");
}

function toolBadge(a, x, y, w, label, detail) {
  return `<rect x="${x}" y="${y}" width="${w}" height="34" rx="9" fill="none" stroke="${a.toolLine}" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="${x + 14}" y="${y + 22}" ${MONO} font-size="12.5" fill="${a.muted}"><tspan fill="${a.ok}">&#10003;</tspan>  <tspan font-weight="700" fill="${a.ink}">${label}</tspan>  ${detail}</text>`;
}

function cover(theme) {
  const t = P[theme], a = APP[theme];
  const W = 1280, H = 720;

  // window geometry
  const wx = 64, wy = 118, ww = 1152, wh = 470, chromeH = 44;
  const px = wx, py = wy + chromeH; // page area
  // chat column / artifacts column
  const chatX = px + 24, chatW = 610;
  const artX = chatX + chatW + 20, artW = wx + ww - 24 - (chatX + chatW + 20);
  const colY = py + 20, colH = wh - chromeH - 40;

  // mini bar chart from the real Beanline store totals (S01..S06)
  const totals = [302706, 245730, 172127, 155316, 193629, 164802];
  const maxV = Math.max(...totals);
  const chartX0 = artX + 30, chartY0 = colY + 118, chartW0 = artW - 60, chartH0 = 120;
  const bw = 42, gap = (chartW0 - 6 * bw) / 5;
  const bars = totals
    .map((v, i) => {
      const bh = Math.round((v / maxV) * chartH0);
      const x = chartX0 + i * (bw + gap);
      return `<rect x="${x}" y="${chartY0 + chartH0 - bh}" width="${bw}" height="${bh}" fill="${t.accent}" opacity="${i === 0 ? 1 : 0.55}"/>`;
    })
    .join("\n  ");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${t.paper}"/>

  <!-- cover furniture -->
  <line x1="64" y1="72" x2="1216" y2="72" stroke="${t.line}" stroke-width="1.5"/>
  <line x1="64" y1="648" x2="1216" y2="648" stroke="${t.line}" stroke-width="1.5"/>
  <text x="64" y="52" ${MONO} font-size="19" letter-spacing="3.5" fill="${t.faint}">SERIES &#183; CLAUDE AGENT SDK IN PRODUCTION</text>
  <text x="1216" y="52" ${MONO} font-size="19" letter-spacing="3.5" fill="${t.faint}" text-anchor="end">14 PARTS &#183; 3 ACTS</text>

  <!-- the app window -->
  <rect x="${wx}" y="${wy}" width="${ww}" height="${wh}" rx="12" fill="${a.pageBg}" stroke="${a.chromeLine}" stroke-width="1.5"/>
  <path d="M ${wx} ${wy + 12} a12 12 0 0 1 12,-12 h ${ww - 24} a12 12 0 0 1 12,12 v ${chromeH - 12} h -${ww} z" fill="${a.chromeBg}"/>
  <line x1="${wx}" y1="${wy + chromeH}" x2="${wx + ww}" y2="${wy + chromeH}" stroke="${a.chromeLine}" stroke-width="1.5"/>
  <circle cx="${wx + 26}" cy="${wy + 22}" r="6" fill="${a.dots}"/><circle cx="${wx + 48}" cy="${wy + 22}" r="6" fill="${a.dots}"/><circle cx="${wx + 70}" cy="${wy + 22}" r="6" fill="${a.dots}"/>
  <rect x="${wx + ww / 2 - 190}" y="${wy + 8}" width="380" height="28" rx="14" fill="${a.urlFill}" stroke="${a.urlStroke}"/>
  <text x="${wx + ww / 2}" y="${wy + 27}" ${MONO} font-size="14" fill="${a.urlText}" text-anchor="middle">localhost:3000</text>

  <!-- chat column -->
  <rect x="${chatX}" y="${colY}" width="${chatW}" height="${colH}" rx="12" fill="${a.cardBg}" stroke="${a.cardLine}" stroke-width="1.5"/>
  <text x="${chatX + 22}" y="${colY + 34}" ${SANS} font-size="15" font-weight="700" fill="${a.ink}">Beanline analyst</text>
  <text x="${chatX + chatW - 22}" y="${colY + 34}" ${MONO} font-size="11" fill="${a.faint}" text-anchor="end">WORKING&#8230; 14s</text>
  <line x1="${chatX}" y1="${colY + 50}" x2="${chatX + chatW}" y2="${colY + 50}" stroke="${a.cardLine}" stroke-width="1.5"/>

  <!-- user bubble -->
  <rect x="${chatX + chatW - 22 - 380}" y="${colY + 66}" width="380" height="36" rx="12" fill="${a.userBubble}"/>
  <text x="${chatX + chatW - 22 - 380 + 16}" y="${colY + 89}" ${SANS} font-size="14" fill="${a.userText}">Chart monthly revenue by store and write it up.</text>

  <!-- tool badges -->
  ${toolBadge(a, chatX + 22, colY + 116, 330, "Read", "sales.csv &#183; 11,081 rows")}
  ${toolBadge(a, chatX + 22, colY + 158, 330, "Bash", "python analyze.py")}

  <!-- approval card, resolved -->
  <rect x="${chatX + 22}" y="${colY + 202}" width="440" height="64" rx="10" fill="${a.okBg}" stroke="${a.ok}" stroke-width="1.5"/>
  <text x="${chatX + 40}" y="${colY + 228}" ${MONO} font-size="12" letter-spacing="1.5" fill="${a.ok}">APPROVED</text>
  <text x="${chatX + 40}" y="${colY + 251}" ${MONO} font-size="13" fill="${a.ink}">Write &#183; report.md</text>
  <text x="${chatX + 440 - 4}" y="${colY + 240}" ${SANS} font-size="20" fill="${a.ok}" text-anchor="end">&#10003;</text>

  <!-- assistant bubble -->
  <rect x="${chatX + 22}" y="${colY + 282}" width="470" height="58" rx="12" fill="${a.asstBubble}"/>
  <text x="${chatX + 38}" y="${colY + 306}" ${SANS} font-size="14" fill="${a.ink}">Downtown leads every month. Full write-up in</text>
  <text x="${chatX + 38}" y="${colY + 327}" ${SANS} font-size="14" fill="${a.ink}"><tspan ${MONO} font-size="13">report.md</tspan>, chart attached.<tspan fill="${t.accent}">&#9612;</tspan></text>

  <!-- artifacts panel -->
  <rect x="${artX}" y="${colY}" width="${artW}" height="${colH}" rx="12" fill="${a.panelBg}" stroke="${a.cardLine}" stroke-width="1.5"/>
  <text x="${artX + 22}" y="${colY + 32}" ${MONO} font-size="11" letter-spacing="2" fill="${a.faint}">ARTIFACTS</text>
  <rect x="${artX + 22}" y="${colY + 48}" width="130" height="28" rx="8" fill="${a.chipBg}" stroke="${t.accent}" stroke-width="1.5"/>
  <text x="${artX + 36}" y="${colY + 67}" ${MONO} font-size="12" fill="${t.accent}">revenue.png</text>
  <rect x="${artX + 162}" y="${colY + 48}" width="110" height="28" rx="8" fill="${a.chipBg}" stroke="${a.cardLine}" stroke-width="1.5"/>
  <text x="${artX + 176}" y="${colY + 67}" ${MONO} font-size="12" fill="${a.muted}">report.md</text>

  <!-- the chart artifact -->
  <rect x="${artX + 22}" y="${colY + 92}" width="${artW - 44}" height="164" rx="8" fill="${a.cardBg}" stroke="${a.cardLine}" stroke-width="1.5"/>
  <text x="${artX + 30}" y="${chartY0 - 8}" ${MONO} font-size="11" fill="${a.faint}">Revenue by store &#183; Jan-Jun 2026</text>
  ${bars}
  <line x1="${chartX0 - 6}" y1="${chartY0 + chartH0}" x2="${chartX0 + chartW0 + 6}" y2="${chartY0 + chartH0}" stroke="${a.toolLine}" stroke-width="1.5"/>

  <!-- the report artifact preview -->
  <rect x="${artX + 22}" y="${colY + 272}" width="${artW - 44}" height="86" rx="8" fill="${a.cardBg}" stroke="${a.cardLine}" stroke-width="1.5"/>
  <text x="${artX + 38}" y="${colY + 298}" ${SANS} font-size="13.5" font-weight="700" fill="${a.ink}">Beanline revenue, H1 2026</text>
  <rect x="${artX + 38}" y="${colY + 312}" width="${artW - 44 - 60}" height="7" rx="3.5" fill="${a.asstBubble}"/>
  <rect x="${artX + 38}" y="${colY + 328}" width="${artW - 44 - 110}" height="7" rx="3.5" fill="${a.asstBubble}"/>
  <rect x="${artX + 38}" y="${colY + 344}" width="${artW - 44 - 80}" height="7" rx="3.5" fill="${a.asstBubble}"/>

  <!-- bottom band: icon row + line -->
  ${iconRow(t, 64, 690)}
  <text x="1216" y="697" ${MONO} font-size="16" letter-spacing="3" fill="${t.faint}" text-anchor="end">AN AI DATA ANALYST, TAKEN TO PRODUCTION</text>
</svg>`;
}

function conceptsCover(theme) {
  const t = P[theme];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <rect width="1280" height="720" fill="${t.paper}"/>
  <text x="1216" y="600" ${MONO} font-size="400" fill="${t.numeral}" text-anchor="end">&#167;</text>
  <line x1="64" y1="72" x2="1216" y2="72" stroke="${t.line}" stroke-width="1.5"/>
  <line x1="64" y1="648" x2="1216" y2="648" stroke="${t.line}" stroke-width="1.5"/>
  <text x="64" y="118" ${MONO} font-size="19" letter-spacing="3.5" fill="${t.faint}">SERIES &#183; CLAUDE AGENT SDK IN PRODUCTION</text>
  <text x="1216" y="118" ${MONO} font-size="19" letter-spacing="3.5" fill="${t.faint}" text-anchor="end">REFERENCE</text>
  <text x="62" y="342" font-family="Georgia, 'Times New Roman', serif" font-size="92" fill="${t.ink}" letter-spacing="-1">Concepts, in <tspan font-style="italic" fill="${t.accent}">plain words</tspan></text>
  <text x="64" y="412" font-family="Georgia, 'Times New Roman', serif" font-size="36" font-style="italic" fill="${t.muted}">Every recurring idea in the series, defined once.</text>
  ${iconRow(t, 64, 540)}
</svg>`;
}

for (const theme of ["light", "dark"]) {
  writeFileSync(`${OUT}/cover-${theme}.svg`, cover(theme));
  writeFileSync(`${OUT}/concepts-cover-${theme}.svg`, conceptsCover(theme));
}
console.log("agent-sdk series covers written");

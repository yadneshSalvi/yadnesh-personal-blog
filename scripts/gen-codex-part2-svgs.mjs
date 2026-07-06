/**
 * Part 2 SVG assets for "Codex App Server in Production".
 * All terminal content mirrors real runs recorded 2026-07-06 against
 * codex-cli 0.142.4 / gpt-5.4-mini through the part-02 FastAPI bridge
 * (session ids, item ids, commands, token counts, and durations are the
 * measured values; ports and paths shortened to the reader's world).
 *
 * Usage: node scripts/gen-codex-part2-svgs.mjs
 */
import { writeFileSync, readFileSync, mkdirSync } from "node:fs";

const ROOT = "/Users/yadneshsalvi/code/yadnesh-personal-blog/public";
const OUT = `${ROOT}/images/series/codex/part-2`;
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
   1. PART COVER — series shelf template, numeral 02.
   ============================================================ */
function cover(theme) {
  const t = D[theme];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <rect width="1280" height="720" fill="${t.paper}"/>
  <text x="1216" y="600" ${MONO} font-size="400" fill="${t.numeral}" text-anchor="end" letter-spacing="-8">02</text>
  <line x1="64" y1="72" x2="1216" y2="72" stroke="${t.line}" stroke-width="1.5"/>
  <line x1="64" y1="648" x2="1216" y2="648" stroke="${t.line}" stroke-width="1.5"/>
  <text x="64" y="118" ${MONO} font-size="19" letter-spacing="3.5" fill="${t.faint}">SERIES &#183; CODEX APP SERVER IN PRODUCTION</text>
  <text x="1216" y="118" ${MONO} font-size="19" letter-spacing="3.5" fill="${t.faint}" text-anchor="end">PART 2 OF 13</text>
  <text x="62" y="296" ${SERIF} font-size="76" fill="${t.ink}" letter-spacing="-1">The FastAPI bridge and</text>
  <text x="62" y="384" ${SERIF} font-size="76" fill="${t.ink}" letter-spacing="-1">the <tspan font-style="italic" fill="${t.accent}">event</tspan> vocabulary</text>
  <text x="64" y="448" ${SERIF} font-size="32" font-style="italic" fill="${t.muted}">A real client, six labeled parcels, one belt the series never rebuilds.</text>
  ${iconRow(t, 64, 512)}
</svg>`;
}

/* ============================================================
   2. fig-pipeline — the must-be-beautiful one. Top half: the
   bidirectional JSON-RPC world (engine + CodexClient internals).
   Bottom half: the one-way SSE wire. All labels mirror the code.
   ============================================================ */
function figPipeline(theme) {
  const t = D[theme];
  const w = 1240, h = 900;
  const arrow = (x1, y1, x2, y2, color, width = 1.5, dash = "") => {
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const ax = x2 - 11 * Math.cos(ang), ay = y2 - 11 * Math.sin(ang);
    const left = ang + Math.PI * 0.82, right = ang - Math.PI * 0.82;
    return `<line x1="${x1}" y1="${y1}" x2="${ax}" y2="${ay}" stroke="${color}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>
  <path d="M ${x2} ${y2} L ${x2 - 12 * Math.cos(ang - 0.42)} ${y2 - 12 * Math.sin(ang - 0.42)} L ${x2 - 12 * Math.cos(ang + 0.42)} ${y2 - 12 * Math.sin(ang + 0.42)} Z" fill="${color}"/>`;
  };
  const elbow = (pts, color, width = 1.5, dash = "") => {
    let s = "";
    for (let i = 0; i < pts.length - 2; i++) {
      s += `<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${pts[i + 1][0]}" y2="${pts[i + 1][1]}" stroke="${color}" stroke-width="${width}"${dash ? ` stroke-dasharray="${dash}"` : ""}/>`;
    }
    const [px, py] = pts[pts.length - 2];
    const [qx, qy] = pts[pts.length - 1];
    return s + arrow(px, py, qx, qy, color, width, dash);
  };

  // engine
  const eng = { x: 48, y: 116, w: 230, h: 320 };
  const engChip = (cx, cy, label) => `
  <rect x="${cx}" y="${cy}" width="88" height="30" rx="7" fill="${t.surface}" stroke="${t.line}"/>
  <text x="${cx + 44}" y="${cy + 20}" ${MONO} font-size="11" fill="${t.muted}" text-anchor="middle">${label}</text>`;

  // the stdio door
  const doorX = 320;

  // CodexClient box
  const cc = { x: 362, y: 86, w: 830, h: 374 };
  const box = (b, title, sub, opts = {}) => `
  <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="12" fill="${opts.fill || t.chip}" stroke="${opts.stroke || t.line}" stroke-width="1.5"${opts.dash ? ` stroke-dasharray="5 4"` : ""}/>
  <text x="${b.x + 16}" y="${b.y + 26}" ${MONO} font-size="15" font-weight="700" fill="${opts.titleColor || t.ink}">${title}</text>
  ${sub ? `<text x="${b.x + 16}" y="${b.y + 46}" ${SANS} font-size="12.5" fill="${opts.subColor || t.muted}">${sub}</text>` : ""}`;
  const box3 = (b, title, line2, sub, opts = {}) => `
  <rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="12" fill="${opts.fill || t.chip}" stroke="${opts.stroke || t.line}" stroke-width="1.5"${opts.dash ? ` stroke-dasharray="5 4"` : ""}/>
  <text x="${b.x + 16}" y="${b.y + 26}" ${MONO} font-size="15" font-weight="700" fill="${opts.titleColor || t.ink}">${title}</text>
  <text x="${b.x + 16}" y="${b.y + 45}" ${MONO} font-size="12" fill="${t.muted}">${line2}</text>
  <text x="${b.x + 16}" y="${b.y + 64}" ${SANS} font-size="12" fill="${opts.subColor || t.muted}">${sub}</text>`;

  const send = { x: 390, y: 150, w: 212, h: 64 };
  const reader = { x: 390, y: 288, w: 212, h: 64 };
  const futures = { x: 700, y: 128, w: 216, h: 82 };
  const handlers = { x: 700, y: 236, w: 216, h: 82 };
  const queues = { x: 700, y: 344, w: 216, h: 82 };
  const ring = { x: 968, y: 344, w: 200, h: 82 };

  // bottom row
  const divY = 556;
  const runTurn = { x: 48, y: 640, w: 250, h: 104 };
  const translator = { x: 372, y: 640, w: 274, h: 104 };
  const streaming = { x: 720, y: 640, w: 262, h: 104 };
  const curlBox = { x: 1056, y: 640, w: 136, h: 104 };

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${t.paper}"/>
  <text x="48" y="46" ${MONO} font-size="13" letter-spacing="2.5" fill="${t.faint}">ONE MESSAGE, END TO END &#183; A TWO-WAY PROTOCOL MAPPED ONTO A ONE-WAY WIRE</text>

  <!-- ===== top half: the protocol world ===== -->
  <text x="48" y="74" ${MONO} font-size="11.5" letter-spacing="2" fill="${t.accent}">UPSTAIRS &#183; JSON-RPC OVER STDIO &#183; BOTH DIRECTIONS</text>

  <!-- the engine -->
  <rect x="${eng.x}" y="${eng.y}" width="${eng.w}" height="${eng.h}" rx="14" fill="${t.chip}" stroke="${t.line}" stroke-width="1.5"/>
  <text x="${eng.x + 20}" y="${eng.y + 34}" ${MONO} font-size="11" letter-spacing="2" fill="${t.faint}">THE ENGINE</text>
  <text x="${eng.x + 20}" y="${eng.y + 66}" ${MONO} font-size="19" font-weight="700" fill="${t.ink}">codex</text>
  <text x="${eng.x + 20}" y="${eng.y + 90}" ${MONO} font-size="19" font-weight="700" fill="${t.ink}">app-server</text>
  <text x="${eng.x + 20}" y="${eng.y + 116}" ${SANS} font-size="12.5" fill="${t.muted}">one subprocess, spawned</text>
  <text x="${eng.x + 20}" y="${eng.y + 134}" ${SANS} font-size="12.5" fill="${t.muted}">once, at startup</text>
  ${engChip(eng.x + 20, eng.y + 156, "agent loop")}
  ${engChip(eng.x + 120, eng.y + 156, "sandbox")}
  ${engChip(eng.x + 20, eng.y + 196, "threads")}
  ${engChip(eng.x + 120, eng.y + 196, "rollouts")}
  <text x="${eng.x + 20}" y="${eng.y + 268}" ${SANS} font-size="12.5" fill="${t.muted}">Part 1 drove it by hand.</text>
  <text x="${eng.x + 20}" y="${eng.y + 286}" ${SANS} font-size="12.5" fill="${t.muted}">Today it gets a landlord.</text>
  <text x="${eng.x + 20}" y="${eng.y + eng.h - 14}" ${MONO} font-size="11" fill="${t.faint}">stderr &#8595; (kept too)</text>

  <!-- the door -->
  <line x1="${doorX}" y1="${eng.y - 6}" x2="${doorX}" y2="${eng.y + eng.h + 6}" stroke="${t.faint}" stroke-width="2"/>
  <rect x="${doorX - 3}" y="${send.y + 23}" width="6" height="18" rx="3" fill="${t.paper}" stroke="${t.accent}" stroke-width="1.5"/>
  <rect x="${doorX - 3}" y="${reader.y + 23}" width="6" height="18" rx="3" fill="${t.paper}" stroke="${t.faint}" stroke-width="1.5"/>
  <text x="${doorX}" y="${eng.y + eng.h + 32}" ${MONO} font-size="11" letter-spacing="2" fill="${t.faint}" text-anchor="middle">STDIO</text>

  <!-- CodexClient -->
  <rect x="${cc.x}" y="${cc.y}" width="${cc.w}" height="${cc.h}" rx="16" fill="none" stroke="${t.line}" stroke-width="1.5"/>
  <text x="${cc.x + 24}" y="${cc.y + 32}" ${MONO} font-size="16" font-weight="700" fill="${t.ink}">CodexClient <tspan font-weight="400" fill="${t.faint}">&#183; app/codex_client.py &#183; one instance, lives as long as the server</tspan></text>

  ${box(send, "_send()", "one writer, one lock", {})}
  ${box(reader, "_read_stdout()", "the only reader", {})}
  ${box3(futures, "_pending", "{id &#8594; Future}", "each reply wakes its request()", {})}
  ${box3(handlers, "_server_handlers", "{}", "", { dash: true, stroke: t.accentLine, titleColor: t.accent })}
  <text x="${handlers.x + 16}" y="${handlers.y + 64}" ${MONO} font-size="11" letter-spacing="1.5" fill="${t.accent}">EMPTY UNTIL PART 7</text>
  ${box3(queues, "_queues", "{threadId &#8594; Queue}", "notifications, one mailbox per thread", {})}
  ${box3(ring, "_stderr_tail", "deque(maxlen=40)", "the engine's last words", {})}

  <!-- wires: send -> door, door -> reader -->
  ${arrow(send.x, send.y + 32, doorX + 4, send.y + 32, t.accent, 2)}
  <text x="${(send.x + doorX) / 2}" y="${send.y + 20}" ${MONO} font-size="10.5" fill="${t.accent}" text-anchor="middle">requests</text>
  ${arrow(doorX + 4, reader.y + 32, reader.x, reader.y + 32, t.faint, 2)}
  <text x="${(send.x + doorX) / 2}" y="${reader.y + 20}" ${MONO} font-size="10.5" fill="${t.faint}" text-anchor="middle">every line back</text>

  <!-- reader fan-out -->
  ${elbow([[reader.x + reader.w, reader.y + 18], [660, reader.y + 18], [660, futures.y + 41], [futures.x, futures.y + 41]], t.line, 1.5)}
  <text x="${futures.x - 12}" y="${futures.y + 30}" ${MONO} font-size="10.5" fill="${t.muted}" text-anchor="end">"id" + "result"</text>
  ${elbow([[reader.x + reader.w, reader.y + 32], [672, reader.y + 32], [672, handlers.y + 41], [handlers.x, handlers.y + 41]], t.accentLine, 1.5, "5 4")}
  <text x="${handlers.x - 12}" y="${handlers.y + 30}" ${MONO} font-size="10.5" fill="${t.accent}" text-anchor="end">"id" + "method"</text>
  ${elbow([[reader.x + reader.w, reader.y + 46], [684, reader.y + 46], [684, queues.y + 41], [queues.x, queues.y + 41]], t.line, 1.5)}
  <text x="${queues.x - 12}" y="${queues.y + 30}" ${MONO} font-size="10.5" fill="${t.muted}" text-anchor="end">"method", no "id"</text>

  <!-- stderr wire -->
  ${elbow([[eng.x + 115, eng.y + eng.h], [eng.x + 115, 520], [ring.x + 100, 520], [ring.x + 100, ring.y + ring.h]], t.faint, 1.2, "3 4")}
  <text x="620" y="512" ${MONO} font-size="10.5" fill="${t.faint}">stderr, line by line, into the ring buffer</text>

  <!-- ===== the divider ===== -->
  <line x1="48" y1="${divY}" x2="${w - 48}" y2="${divY}" stroke="${t.line}" stroke-width="1.5" stroke-dasharray="2 6"/>
  <text x="48" y="${divY + 28}" ${MONO} font-size="11.5" letter-spacing="2" fill="${t.accent}">DOWNSTAIRS &#183; SSE OVER HTTP &#183; ONE DIRECTION, OUTWARD</text>

  <!-- queue exit into the bottom half -->
  ${elbow([[queues.x + 60, queues.y + queues.h], [queues.x + 60, 608], [173, 608], [173, runTurn.y]], t.accent, 2)}
  <text x="340" y="628" ${MONO} font-size="10.5" fill="${t.accent}">run_turn() drains one thread's mailbox, note by note</text>

  <!-- bottom row -->
  ${box3(runTurn, "run_turn()", "app/main.py", "await queue.get(), forever", {})}
  <rect x="${translator.x}" y="${translator.y}" width="${translator.w}" height="${translator.h}" rx="12" fill="${t.accentTint}" stroke="${t.accentLine}" stroke-width="1.5"/>
  <text x="${translator.x + 16}" y="${translator.y + 26}" ${MONO} font-size="11" letter-spacing="2" fill="${t.accent}">THE TRANSLATOR</text>
  <text x="${translator.x + 16}" y="${translator.y + 52}" ${MONO} font-size="15" font-weight="700" fill="${t.ink}">translate(note)</text>
  <text x="${translator.x + 16}" y="${translator.y + 74}" ${SANS} font-size="12" fill="${t.muted}">app/events.py &#183; notification in,</text>
  <text x="${translator.x + 16}" y="${translator.y + 91}" ${SANS} font-size="12" fill="${t.muted}">envelope out (or None: dropped)</text>
  ${box3(streaming, "StreamingResponse", "text/event-stream", "each parcel pushed the moment it exists", {})}
  <rect x="${curlBox.x}" y="${curlBox.y}" width="${curlBox.w}" height="${curlBox.h}" rx="12" fill="${t.chip}" stroke="${t.line}" stroke-width="1.5"/>
  <text x="${curlBox.x + 16}" y="${curlBox.y + 30}" ${MONO} font-size="15" font-weight="700" fill="${t.ink}">curl -N</text>
  <text x="${curlBox.x + 16}" y="${curlBox.y + 52}" ${SANS} font-size="12" fill="${t.muted}">today; the</text>
  <text x="${curlBox.x + 16}" y="${curlBox.y + 69}" ${SANS} font-size="12" fill="${t.muted}">browser in</text>
  <text x="${curlBox.x + 16}" y="${curlBox.y + 86}" ${SANS} font-size="12" fill="${t.muted}">Part 3</text>

  ${arrow(runTurn.x + runTurn.w, runTurn.y + 52, translator.x, translator.y + 52, t.ink, 2)}
  <text x="${(runTurn.x + runTurn.w + translator.x) / 2}" y="${runTurn.y + 40}" ${MONO} font-size="10.5" fill="${t.muted}" text-anchor="middle">notification</text>
  ${arrow(translator.x + translator.w, translator.y + 52, streaming.x, streaming.y + 52, t.ink, 2)}
  <text x="${(translator.x + translator.w + streaming.x) / 2}" y="${translator.y + 40}" ${MONO} font-size="10.5" fill="${t.muted}" text-anchor="middle">envelope</text>
  ${arrow(streaming.x + streaming.w, streaming.y + 52, curlBox.x, curlBox.y + 52, t.ink, 2)}

  <!-- shipment record from the real run -->
  <rect x="48" y="788" width="${w - 96}" height="58" rx="10" fill="${t.surface}" stroke="${t.line}"/>
  <text x="68" y="812" ${MONO} font-size="12" letter-spacing="1.5" fill="${t.faint}">THIS RUN, ON THIS EXACT PIPELINE &#183; 2026-07-06</text>
  <text x="68" y="834" ${MONO} font-size="13" fill="${t.muted}">1 session_start &#183; <tspan fill="${t.accent}">379 text_delta</tspan> &#183; 19 item_start + 19 item_done &#183; 1 complete &#183; <tspan fill="${t.accent}">54.9s</tspan>, 159,680 tokens</text>
</svg>`;
}

/* ============================================================
   3. fig-envelope — six labeled parcels on one conveyor, plus
   the greyed parcels later parts will stand on the same belt.
   Real payloads from the 2026-07-06 Beanline run.
   ============================================================ */
function figEnvelope(theme) {
  const t = D[theme];
  const w = 1240, h = 680;
  const beltY = 260;
  const parcelW = 118, parcelH = 128, gap = 10, startX = 48;

  const parcel = (i, name, sub, tag, ghost) => {
    const x = startX + i * (parcelW + gap);
    const y = beltY - parcelH;
    const stroke = ghost ? t.line : t.accentLine;
    const nameFill = ghost ? t.faint : t.ink;
    const fontSize = name.length > 13 ? 10.5 : 12;
    return `
  <rect x="${x}" y="${y}" width="${parcelW}" height="${parcelH}" rx="9" fill="${ghost ? "none" : t.chip}" stroke="${stroke}" stroke-width="1.5"${ghost ? ` stroke-dasharray="5 4"` : ""}/>
  <rect x="${x + parcelW / 2 - 13}" y="${y - 1}" width="26" height="10" rx="2" fill="${ghost ? t.line : t.accentTint}" stroke="${stroke}" stroke-width="1"/>
  <text x="${x + parcelW / 2}" y="${y + 44}" ${MONO} font-size="${fontSize}" font-weight="700" fill="${nameFill}" text-anchor="middle">${name}</text>
  ${sub.map((s, j) => `<text x="${x + parcelW / 2}" y="${y + 64 + j * 15}" ${MONO} font-size="9.5" fill="${t.faint}" text-anchor="middle">${s}</text>`).join("\n  ")}
  <text x="${x + parcelW / 2}" y="${y + parcelH - 12}" ${MONO} font-size="9.5" letter-spacing="1.5" fill="${ghost ? t.accent : t.faint}" text-anchor="middle">${tag}</text>`;
  };

  const rollers = [];
  for (let rx = startX + 30; rx <= 900; rx += 88) {
    rollers.push(`<circle cx="${rx}" cy="${beltY + 21}" r="6" fill="none" stroke="${t.line}" stroke-width="1.5"/>`);
  }

  const rows = [
    ["session_start", `the turn began; here's the thread id`, `{"session_id": "019f389a-9927-&#8230;"}`],
    ["text_delta", "a piece of the prose, in order", `{"text": " checking"} &#183; 379 of these in one turn`],
    ["item_start", "a unit of agent work opened", `{"item_id": "call_onv9&#8230;", "kind": "commandExecution", "detail": {&#8230;}}`],
    ["item_done", "that unit settled, detail attached", `kind "fileChange" &#183; {"path": "&#8230;/site/index.html", "kind": "add"}`],
    ["complete", "the receipt; the turn is over", `{"status": "completed", "duration_ms": 54875, "usage": {&#8230;}}`],
    ["error", "something broke, said as data", `{"message": "&#8230;"} &#183; because a 200 stream can't change its status`],
  ];
  const manifest = rows.map(([name, meaning, example], i) => {
    const y = 380 + i * 38;
    return `
  <text x="70" y="${y}" ${MONO} font-size="13.5" font-weight="700" fill="${t.accent}">${name}</text>
  <text x="230" y="${y}" ${SANS} font-size="13.5" fill="${t.ink}">${meaning}</text>
  <text x="560" y="${y}" ${MONO} font-size="11.5" fill="${t.muted}">${example}</text>`;
  }).join("\n");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${t.paper}"/>
  <text x="48" y="46" ${MONO} font-size="13" letter-spacing="2.5" fill="${t.faint}">ONE BELT &#183; LATER PARTS ADD PARCELS &#183; NOBODY EVER REBUILDS THE BELT</text>

  ${parcel(0, "session_start", ["session_id"], "PART 2", false)}
  ${parcel(1, "text_delta", ["text"], "PART 2", false)}
  ${parcel(2, "item_start", ["item_id &#183; kind", "detail"], "PART 2", false)}
  ${parcel(3, "item_done", ["item_id &#183; kind", "detail"], "PART 2", false)}
  ${parcel(4, "complete", ["status &#183; usage", "duration_ms"], "PART 2", false)}
  ${parcel(5, "error", ["message"], "PART 2", false)}
  ${parcel(6, "file_change", ["files &#183; status"], "PART 4", true)}
  ${parcel(7, "approval_request", ["command / diff"], "PART 7", true)}
  ${parcel(8, "plan_update", ["steps"], "PART 10", true)}

  <!-- the belt -->
  <rect x="${startX - 14}" y="${beltY}" width="${w - 68}" height="14" rx="7" fill="${t.surface}" stroke="${t.line}" stroke-width="1.5"/>
  ${rollers.join("\n  ")}
  <text x="${w - 48}" y="${beltY + 42}" ${MONO} font-size="11" letter-spacing="2" fill="${t.faint}" text-anchor="end">&#8594; TO WHOEVER IS LISTENING</text>

  <!-- the manifest -->
  <text x="48" y="346" ${MONO} font-size="11.5" letter-spacing="2" fill="${t.faint}">THE SIX LABELS OF PART 2, WITH REAL CARGO FROM THE BEANLINE RUN</text>
  <line x1="48" y1="358" x2="${w - 48}" y2="358" stroke="${t.line}" stroke-width="1"/>
  ${manifest}

  <!-- the contract -->
  <rect x="48" y="610" width="${w - 96}" height="40" rx="10" fill="${t.greenTint}" stroke="${t.line}"/>
  <text x="${w / 2}" y="636" ${MONO} font-size="13" fill="${t.green}" text-anchor="middle">THE PARSER CONTRACT &#183; switch on "type" &#183; ignore labels you don't know yet</text>
</svg>`;
}

/* ============================================================
   4. TERMINALS (dark only, real runs through the part-02 bridge)
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
const Q = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const termDessert = () =>
  term("terminal &#183; the end of this page, compressed", [
    `${F(TT.faint, "$")} curl -N localhost:8000/chat -d '{"message": "Build a single-page site for Beanline, &#8230;"}'`,
    ``,
    `data: {"type": ${F(TT.accent, '"session_start"')}, "session_id": "019f389a-9927-7922-&#8230;"}`,
    `data: {"type": ${F(TT.accent, '"item_start"')}, "item_id": "rs_0388c9de&#8230;", "kind": ${F(TT.blue, '"reasoning"')}, "detail": {}}`,
    `data: {"type": ${F(TT.accent, '"text_delta"')}, "text": " checking"}`,
    `${F(TT.faint, "# &#8230; the agent thinks, types, runs commands, and edits files, one labeled parcel at a time &#8230;")}`,
    `data: {"type": ${F(TT.accent, '"item_start"')}, "item_id": "call_YTYZ1F&#8230;", "kind": ${F(TT.blue, '"fileChange"')},`,
    `       "detail": {"files": [{"path": "&#8230;/site/index.html", "kind": ${F(TT.green, '"add"')}}]}}`,
    `${F(TT.faint, "# 419 parcels and 54.9 seconds later:")}`,
    `data: {"type": ${F(TT.green, '"complete"')}, "status": ${F(TT.green, '"completed"')}, "usage": {"totalTokens": ${F(TT.accent, "159680")}, &#8230;}}`,
  ]);

const termCurlStream = () =>
  term("terminal &#183; watching the belt", [
    `${F(TT.faint, "$")} curl -N localhost:8000/chat -H 'content-type: application/json' \\`,
    `    -d '{"message": "Build a single-page site for Beanline, a specialty coffee`,
    `         chain: warm, editorial, a hero and a menu section. &#8230;"}'`,
    ``,
    `data: {"type": ${F(TT.accent, '"session_start"')}, "session_id": "019f389a-9927-7922-9f4c-6f0599e4ac40"}`,
    ``,
    `${F(TT.faint, "# the first parcels: the agent thinks before it types")}`,
    `data: {"type": ${F(TT.accent, '"item_start"')}, "item_id": "rs_0388c9de&#8230;", "kind": ${F(TT.blue, '"reasoning"')}, "detail": {}}`,
    `data: {"type": ${F(TT.accent, '"item_done"')},  "item_id": "rs_0388c9de&#8230;", "kind": ${F(TT.blue, '"reasoning"')}, "detail": {}}`,
    ``,
    `${F(TT.faint, "# prose arrives as a run of text_delta parcels, a word or two each")}`,
    `data: {"type": ${F(TT.accent, '"item_start"')}, "item_id": "msg_0388c9de&#8230;", "kind": ${F(TT.blue, '"agentMessage"')}, "detail": {}}`,
    `data: {"type": ${F(TT.accent, '"text_delta"')}, "text": "I"}`,
    `data: {"type": ${F(TT.accent, '"text_delta"')}, "text": "\\u2019m"}`,
    `data: {"type": ${F(TT.accent, '"text_delta"')}, "text": " checking"}`,
    `data: {"type": ${F(TT.accent, '"text_delta"')}, "text": " the"}`,
    `data: {"type": ${F(TT.accent, '"text_delta"')}, "text": " existing"}`,
    `${F(TT.faint, "# &#8230; 379 text_delta parcels in this turn &#8230;")}`,
    ``,
    `${F(TT.faint, "# commands and file edits ride the same belt, labeled by kind")}`,
    `data: {"type": ${F(TT.accent, '"item_start"')}, "item_id": "call_onv9Cb&#8230;", "kind": ${F(TT.blue, '"commandExecution"')},`,
    `       "detail": {"command": "/bin/zsh -lc 'rg --files'"}}`,
    `data: {"type": ${F(TT.accent, '"item_start"')}, "item_id": "call_YTYZ1F&#8230;", "kind": ${F(TT.blue, '"fileChange"')},`,
    `       "detail": {"files": [{"path": "&#8230;/site/index.html", "kind": ${F(TT.green, '"add"')}}]}}`,
    ``,
    `${F(TT.faint, "# 19 items and 54.9 seconds later, the receipt:")}`,
    `data: {"type": ${F(TT.green, '"complete"')}, "status": ${F(TT.green, '"completed"')}, "duration_ms": ${F(TT.accent, "54875")},`,
    `       "usage": {"totalTokens": ${F(TT.accent, "159680")}, "inputTokens": ${F(TT.accent, "151319")},`,
    `                 "cachedInputTokens": ${F(TT.accent, "129280")}, "outputTokens": ${F(TT.accent, "8361")}, &#8230;}}`,
  ]);

const termEngineDied = () =>
  term("terminal &#183; the engine dies mid-turn", [
    `${F(TT.faint, "$")} curl -N localhost:8000/chat -H 'content-type: application/json' \\`,
    `    -d '{"message": "Add a contact section with opening hours to the Beanline site."}'`,
    ``,
    `data: {"type": ${F(TT.accent, '"session_start"')}, "session_id": "019f389f-71a0-73b1-bdd2-82790d5c8d42"}`,
    `data: {"type": ${F(TT.accent, '"item_start"')}, "item_id": "call_ZDdECt&#8230;", "kind": ${F(TT.blue, '"commandExecution"')},`,
    `       "detail": {"command": "/bin/zsh -lc 'pwd &amp;&amp; rg --files .'"}}`,
    `${F(TT.faint, "# &#8230; ten healthy seconds of parcels &#8230;")}`,
    `data: {"type": ${F(TT.accent, '"item_done"')},  "item_id": "call_GEfLwC&#8230;", "kind": ${F(TT.blue, '"commandExecution"')},`,
    `       "detail": {"command": "/bin/zsh -lc \\"sed -n '521,820p' index.html\\""}}`,
    `data: {"type": ${F(TT.accent, '"item_start"')}, "item_id": "rs_003266&#8230;", "kind": ${F(TT.blue, '"reasoning"')}, "detail": {}}`,
    ``,
    `${F(TT.faint, "# (second terminal)")}`,
    `${F(TT.faint, "$")} pkill -f ${F(TT.red, '"codex app-server"')}`,
    ``,
    `${F(TT.faint, "# &#8230;and nothing. no error parcel, no complete, no closed connection.")}`,
    `${F(TT.faint, "# the last parcel is an opened reasoning item: the engine died thinking,")}`,
    `${F(TT.faint, "# and from this side of the wire that looks exactly like the engine")}`,
    `${F(TT.faint, "# thinking. sit with that. Part 9 earns its keep right here.")}`,
  ]);

/* ============================================================
   write everything
   ============================================================ */
for (const theme of ["light", "dark"]) {
  writeFileSync(`${OUT}/cover-${theme}.svg`, cover(theme));
  writeFileSync(`${OUT}/fig-pipeline-${theme}.svg`, figPipeline(theme));
  writeFileSync(`${OUT}/fig-envelope-${theme}.svg`, figEnvelope(theme));
}
writeFileSync(`${OUT}/term-dessert.svg`, termDessert());
writeFileSync(`${OUT}/term-curl-stream.svg`, termCurlStream());
writeFileSync(`${OUT}/term-engine-died.svg`, termEngineDied());
console.log("codex part-2 svgs written to", OUT);

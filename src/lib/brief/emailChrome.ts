// src/lib/brief/emailChrome.ts
//
// The shell every brief email is poured into: wordmark on top, footer with the
// archive, preferences, unsubscribe, and the postal address underneath. Phase 3
// reuses it for the issues themselves, which is why the body is passed in as
// finished HTML and the chrome knows nothing about what it wraps.
//
// Rules that shaped the markup: one <style> block instead of per-element inline
// styles (inline styles multiply by item count and the whole issue has to stay
// under 80KB), off-white and off-black rather than #fff and #000 (Gmail's
// forced dark mode is most aggressive on pure values), an explicit
// background-color on every text container, links underlined, body text 16px,
// and no layout tables.

export type BriefEmailFooter = {
  archiveUrl: string;
  preferencesUrl?: string;
  unsubscribeUrl?: string;
  /** "View in browser" for issues; omitted on transactional mail. */
  webUrl?: string;
  howItWorksUrl?: string;
};

const PAPER = "#faf8f3";
const SURFACE = "#f1efe9";
const INK = "#1f1c19";
const MUTED = "#5b554c";
const FAINT = "#8f887a";
const LINE = "#e7e3d9";
const ACCENT = "#b3441a";

const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const MONO_STACK = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

export function escapeHtml(input: string): string {
  return String(input)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/** A link that survives dark-mode inversion and reads as a link without color. */
export function emailLink(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="color:${ACCENT};text-decoration:underline;">${escapeHtml(label)}</a>`;
}

/**
 * The single call to action. Bordered rather than filled, because a filled
 * button is the first thing an inversion algorithm ruins, and every button is
 * followed by the same URL as plain text for clients that strip it.
 */
export function emailButton(href: string, label: string): string {
  return [
    `<p class="cta">`,
    `<a href="${escapeHtml(href)}" class="btn">${escapeHtml(label)}</a>`,
    `</p>`,
  ].join("");
}

function footerHtml(footer: BriefEmailFooter): string {
  const links: string[] = [];
  if (footer.webUrl) links.push(emailLink(footer.webUrl, "View in browser"));
  links.push(emailLink(footer.archiveUrl, "Archive"));
  if (footer.howItWorksUrl) links.push(emailLink(footer.howItWorksUrl, "How this is made"));
  if (footer.preferencesUrl) links.push(emailLink(footer.preferencesUrl, "Change cadence"));
  if (footer.unsubscribeUrl) links.push(emailLink(footer.unsubscribeUrl, "Unsubscribe"));

  const postal = process.env.BRIEF_POSTAL_ADDRESS;

  return [
    `<div class="footer">`,
    `<p class="footer-links">${links.join(" &nbsp;·&nbsp; ")}</p>`,
    `<p>You're getting this because you subscribed at yadneshsalvi.com.</p>`,
    postal ? `<p>${escapeHtml(postal)}</p>` : "",
    `</div>`,
  ].join("");
}

export function renderBriefEmailHtml(input: {
  /** The line that shows next to the subject in the inbox list. */
  preheader: string;
  bodyHtml: string;
  footer: BriefEmailFooter;
}): string {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<style>
  body { margin:0; padding:0; background-color:${SURFACE}; color:${INK}; font-family:${FONT_STACK}; font-size:16px; line-height:1.6; }
  .wrap { background-color:${SURFACE}; padding:24px 12px; }
  .sheet { background-color:${PAPER}; color:${INK}; max-width:560px; margin:0 auto; padding:28px 24px 24px; border:1px solid ${LINE}; }
  .wordmark { font-family:${MONO_STACK}; font-size:12px; letter-spacing:0.22em; text-transform:uppercase; color:${FAINT}; margin:0 0 20px; }
  h1 { font-size:22px; line-height:1.3; margin:0 0 16px; color:${INK}; font-weight:600; }
  h2 { font-size:17px; line-height:1.35; margin:24px 0 8px; color:${INK}; font-weight:600; }
  p { margin:0 0 14px; color:${INK}; }
  ul { margin:0 0 14px; padding-left:20px; color:${INK}; }
  li { margin:0 0 8px; }
  a { color:${ACCENT}; text-decoration:underline; }
  .lede { color:${MUTED}; }
  .cta { margin:22px 0; }
  .btn { display:inline-block; padding:11px 20px; border:1px solid ${ACCENT}; color:${ACCENT}; background-color:${PAPER}; text-decoration:none; font-size:15px; font-weight:600; }
  .fallback { font-size:13px; color:${MUTED}; word-break:break-all; margin:0 0 14px; }
  .footer { border-top:1px solid ${LINE}; margin-top:28px; padding-top:16px; font-size:13px; line-height:1.6; color:${FAINT}; background-color:${PAPER}; }
  .footer p { margin:0 0 6px; color:${FAINT}; font-size:13px; }
  .footer-links a { color:${MUTED}; }
  .preheader { display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; overflow:hidden; }
</style>
</head>
<body>
<div class="preheader">${escapeHtml(input.preheader)}</div>
<div class="wrap">
  <div class="sheet">
    <p class="wordmark">The Agentic Brief</p>
    ${input.bodyHtml}
    ${footerHtml(input.footer)}
  </div>
</div>
</body></html>`;
}

/**
 * The plain-text part, hand-shaped. An HTML-only email filters worse than light
 * HTML with a real text alternative, and an auto-stripped one reads like link
 * soup, so callers pass the lines they want rather than a converted body.
 */
export function renderBriefEmailText(input: {
  lines: string[];
  footer: BriefEmailFooter;
}): string {
  const footerLines: string[] = [];
  if (input.footer.webUrl) footerLines.push(`View in browser: ${input.footer.webUrl}`);
  footerLines.push(`Archive: ${input.footer.archiveUrl}`);
  if (input.footer.howItWorksUrl) {
    footerLines.push(`How this is made: ${input.footer.howItWorksUrl}`);
  }
  if (input.footer.preferencesUrl) {
    footerLines.push(`Change cadence: ${input.footer.preferencesUrl}`);
  }
  if (input.footer.unsubscribeUrl) {
    footerLines.push(`Unsubscribe: ${input.footer.unsubscribeUrl}`);
  }
  footerLines.push("You're getting this because you subscribed at yadneshsalvi.com.");
  const postal = process.env.BRIEF_POSTAL_ADDRESS;
  if (postal) footerLines.push(postal);

  return [
    "THE AGENTIC BRIEF",
    "",
    ...input.lines,
    "",
    "-- ",
    ...footerLines,
    "",
  ].join("\n");
}

// src/lib/brief/actionPage.ts
//
// The small standalone page a signed link lands on when it has already done its
// work: approve, hold, and anything else that is one click and then a sentence.
//
// It carries its own styles because it is served straight from a route handler
// with no React tree and no layout above it, and it is noindex because every
// URL that reaches it contains a token.

import { escapeHtml } from "./emailChrome";

export type ActionPageLink = { href: string; label: string };

export function renderActionPage(input: {
  title: string;
  body: string;
  links: ActionPageLink[];
  status?: number;
}): Response {
  const html = `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>${escapeHtml(input.title)} · The Agentic Brief</title>
<style>
  :root { color-scheme: light dark; }
  body { margin:0; background:#f1efe9; color:#1f1c19; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; line-height:1.6; }
  main { max-width:32rem; margin:0 auto; padding:4rem 1.5rem; }
  .kicker { font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; font-size:11px; letter-spacing:0.22em; text-transform:uppercase; color:#8f887a; margin:0 0 1rem; }
  h1 { font-size:1.6rem; line-height:1.25; margin:0 0 1rem; font-weight:600; }
  p { margin:0 0 1rem; color:#5b554c; }
  a { color:#b3441a; }
  @media (prefers-color-scheme: dark) {
    body { background:#1d1a17; color:#ebe7df; }
    p { color:#a49c90; }
    a { color:#e5825a; }
  }
</style>
</head><body><main>
<p class="kicker">The Agentic Brief</p>
<h1>${escapeHtml(input.title)}</h1>
<p>${escapeHtml(input.body)}</p>
${input.links
  .map((link) => `<p><a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a></p>`)
  .join("\n")}
</main></body></html>`;

  return new Response(html, {
    status: input.status ?? 200,
    headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex" },
  });
}

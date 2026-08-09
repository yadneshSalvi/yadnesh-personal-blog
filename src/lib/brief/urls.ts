// src/lib/brief/urls.ts
//
// Every link that goes into an email is absolute, and it has to point at the
// deployment that sent it: a link mailed from a preview build must come back to
// that preview, not to production. So the base URL is read off the request when
// there is one, and only falls back to the canonical site URL.

import { SITE_URL } from "@/lib/seo";

export function siteBaseUrl(request?: Request): string {
  if (request) {
    const headers = request.headers;
    const host = headers.get("x-forwarded-host") || headers.get("host");
    if (host) {
      const proto =
        headers.get("x-forwarded-proto") ||
        (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
      return `${proto}://${host}`;
    }
  }
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL || process.env.BRIEF_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/+$/, "");
  return SITE_URL;
}

const q = encodeURIComponent;

export function confirmUrl(base: string, token: string): string {
  return `${base}/api/brief/confirm?token=${q(token)}`;
}

export function preferencesUrl(base: string, token: string): string {
  return `${base}/brief/preferences?token=${q(token)}`;
}

/** The one-click unsubscribe endpoint. GET shows a page, POST just does it. */
export function unsubscribeUrl(base: string, token: string): string {
  return `${base}/api/brief/unsubscribe?token=${q(token)}`;
}

export function feedbackVoteUrl(
  base: string,
  input: { type: "daily" | "weekly"; id: string; vote: "up" | "down"; token: string },
): string {
  return (
    `${base}/api/brief/feedback?type=${q(input.type)}&issue=${q(input.id)}` +
    `&vote=${q(input.vote)}&token=${q(input.token)}`
  );
}

export function issueWebUrl(base: string, type: "daily" | "weekly", id: string): string {
  return `${base}/brief/${type}/${id}`;
}

export function archiveUrl(base: string): string {
  return `${base}/brief/archive`;
}

export function howItWorksUrl(base: string): string {
  return `${base}/brief/how-it-works`;
}

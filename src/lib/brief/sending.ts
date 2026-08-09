// src/lib/brief/sending.ts
//
// The pieces the three Phase 3 routes share: the shared-secret check, the
// timing constants the approval gate and the send loop both reason about, and
// the per-recipient link builders.
//
// Nothing here talks to Redis or to SMTP. It is the boring middle layer, which
// is exactly why the send route can stay readable.

import { timingSafeEqual } from "node:crypto";
import type { BriefIssue } from "./schema";
import { signBriefToken } from "./tokens";
import type { IssueEmailLinks, IssueEmailRecipientUrls } from "./issueEmail";
import {
  archiveUrl,
  feedbackVoteUrl,
  howItWorksUrl,
  issueWebUrl,
  preferencesUrl,
  unsubscribeUrl,
} from "./urls";

/* ── Timing ─────────────────────────────────────────────────────────────── */

/** Locked in 06 §Decisions: two hours for both cadences, then it sends itself. */
export const APPROVAL_WINDOW_MS = 2 * 60 * 60 * 1000;

/** A held issue becomes a web-only edition a day later. That is a fine outcome. */
export const HOLD_EXPIRY_MS = 24 * 60 * 60 * 1000;

/** Zoho SMTP is not a broadcast API. One send every 600ms is polite and safe. */
export const SEND_THROTTLE_MS = 600;

/**
 * A cron invocation stops well before the platform would stop it, marks itself
 * partial, and lets the next tick pick the cursor back up.
 */
export const SEND_WALL_CLOCK_MS = 50_000;

/** Long enough that a stalled run cannot be lapped, short enough to self-heal. */
export const SEND_LOCK_TTL_SECONDS = 120;

/**
 * How far back the cron looks for issues worth sending. An issue older than
 * this that never went out is not a backlog item, it is history.
 */
export const SEND_CANDIDATE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/* ── Shared-secret auth ─────────────────────────────────────────────────── */

function constantTimeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1] : null;
}

export type SecretName = "BRIEF_PIPELINE_SECRET" | "CRON_SECRET";

export type AuthOutcome =
  | { ok: true; via: SecretName }
  | { ok: false; reason: "unconfigured" | "unauthorized" };

/**
 * Accepts any of the named shared secrets. Vercel's cron invocations arrive
 * with CRON_SECRET; a manual "send it now" from a laptop uses the pipeline
 * secret. Both are compared in constant time, and a route whose secrets are
 * all unset refuses everything rather than opening itself up.
 */
export function authorizeSharedSecret(
  request: Request,
  accepted: SecretName[],
): AuthOutcome {
  const provided = bearerToken(request);
  const configured = accepted.filter((name) => (process.env[name] ?? "").length > 0);
  if (configured.length === 0) return { ok: false, reason: "unconfigured" };
  if (!provided) return { ok: false, reason: "unauthorized" };

  for (const name of configured) {
    if (constantTimeEquals(provided, process.env[name] as string)) {
      return { ok: true, via: name };
    }
  }
  return { ok: false, reason: "unauthorized" };
}

/* ── Links ──────────────────────────────────────────────────────────────── */

/** The links that are identical for every recipient of one issue. */
export function issueEmailLinks(base: string, issue: BriefIssue): IssueEmailLinks {
  return {
    webUrl: issueWebUrl(base, issue.type, issue.id),
    archiveUrl: archiveUrl(base),
    howItWorksUrl: howItWorksUrl(base),
  };
}

/**
 * One reader's four signed links.
 *
 * The unsubscribe and preferences tokens carry an empty scope on purpose: the
 * routes behind them read the address off the token and the cadence out of the
 * store, and looking a cadence up per recipient would cost a round trip per
 * send for a value nothing reads.
 */
export function recipientUrls(input: {
  base: string;
  email: string;
  type: "daily" | "weekly";
  id: string;
}): IssueEmailRecipientUrls {
  const { base, email, type, id } = input;
  const scope = `${type}/${id}`;
  const feedbackToken = signBriefToken({ purpose: "feedback", subject: email, scope });
  return {
    unsubscribeUrl: unsubscribeUrl(
      base,
      signBriefToken({ purpose: "unsub", subject: email }),
    ),
    preferencesUrl: preferencesUrl(
      base,
      signBriefToken({ purpose: "prefs", subject: email }),
    ),
    feedbackUpUrl: feedbackVoteUrl(base, { type, id, vote: "up", token: feedbackToken }),
    feedbackDownUrl: feedbackVoteUrl(base, {
      type,
      id,
      vote: "down",
      token: feedbackToken,
    }),
  };
}

/** The segment an issue's cadence maps onto. Dailies go to daily, weeklies to weekly. */
export function segmentForIssueType(type: "daily" | "weekly"): "daily" | "weekly" {
  return type;
}

// src/lib/brief/tokens.ts
//
// Every signed link in the brief (confirm, preferences, unsubscribe, feedback,
// approve/hold) is an HMAC-SHA256 over a flat string, so verifying one costs no
// database round trip. Rotating BRIEF_TOKEN_SECRET invalidates every link that
// is still in someone's inbox, which is the intended emergency lever.
//
// Wire format: base64url(payload) "." base64url(signature)
// Payload:     purpose ":" subject ":" scope ":" expiresAt
//
// `subject` is the email for subscriber links and the issue id for issue links.
// `scope` carries the cadence, the vote, or the issue reference depending on the
// purpose, and may be empty. Neither may contain ":".

import { createHmac, timingSafeEqual } from "node:crypto";

export const BRIEF_TOKEN_PURPOSES = [
  "confirm",
  "prefs",
  "unsub",
  "feedback",
  "send-action",
] as const;

export type BriefTokenPurpose = (typeof BRIEF_TOKEN_PURPOSES)[number];

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** How long a freshly minted token of each kind stays valid. */
export const BRIEF_TOKEN_TTL_MS: Record<BriefTokenPurpose, number> = {
  // Short on purpose: an unconfirmed signup is not a subscriber.
  confirm: 24 * HOUR,
  // Long, because these live in the footer of every issue ever sent.
  prefs: 90 * DAY,
  unsub: 90 * DAY,
  feedback: 30 * DAY,
  // Phase 3. The approval window is 2h; the link outliving it by a week lets a
  // late click still report what happened instead of showing a broken page.
  "send-action": 7 * DAY,
};

export type BriefTokenPayload = {
  purpose: BriefTokenPurpose;
  subject: string;
  scope: string;
  /** Epoch milliseconds. */
  expiresAt: number;
};

export type BriefTokenVerification =
  | { ok: true; payload: BriefTokenPayload }
  | {
      ok: false;
      reason: "missing_secret" | "malformed" | "bad_signature" | "expired" | "purpose_mismatch";
    };

function b64url(input: Buffer | string): string {
  return Buffer.from(input as never).toString("base64url");
}

function secret(): string | null {
  const value = process.env.BRIEF_TOKEN_SECRET;
  return value && value.length > 0 ? value : null;
}

export function isTokenSecretConfigured(): boolean {
  return secret() !== null;
}

function sign(payload: string, key: string): string {
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function expiryFor(purpose: BriefTokenPurpose, now = Date.now()): number {
  return now + BRIEF_TOKEN_TTL_MS[purpose];
}

/**
 * Mints a token. Throws when BRIEF_TOKEN_SECRET is unset so a misconfigured
 * deploy fails at the API boundary rather than mailing out dead links.
 */
export function signBriefToken(input: {
  purpose: BriefTokenPurpose;
  subject: string;
  scope?: string;
  expiresAt?: number;
  now?: number;
}): string {
  const key = secret();
  if (!key) throw new Error("Missing env: BRIEF_TOKEN_SECRET");

  const subject = input.subject.trim();
  const scope = (input.scope ?? "").trim();
  if (subject.includes(":") || scope.includes(":")) {
    throw new Error("Brief token fields must not contain ':'");
  }
  if (!subject) throw new Error("Brief token subject must not be empty");

  const expiresAt =
    input.expiresAt ?? expiryFor(input.purpose, input.now ?? Date.now());
  const payload = `${input.purpose}:${subject}:${scope}:${expiresAt}`;
  return `${b64url(payload)}.${sign(payload, key)}`;
}

/** Verifies signature, purpose, and expiry. Never throws. */
export function verifyBriefToken(
  token: string | null | undefined,
  options: { purpose: BriefTokenPurpose; now?: number },
): BriefTokenVerification {
  const key = secret();
  if (!key) return { ok: false, reason: "missing_secret" };
  if (!token || typeof token !== "string") return { ok: false, reason: "malformed" };

  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return { ok: false, reason: "malformed" };

  const encodedPayload = token.slice(0, dot);
  const providedSig = token.slice(dot + 1);

  let payload: string;
  try {
    payload = Buffer.from(encodedPayload, "base64url").toString("utf8");
  } catch {
    return { ok: false, reason: "malformed" };
  }

  const parts = payload.split(":");
  if (parts.length !== 4) return { ok: false, reason: "malformed" };

  const expected = sign(payload, key);
  const a = Buffer.from(expected);
  const b = Buffer.from(providedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "bad_signature" };
  }

  const [purpose, subject, scope, rawExpiry] = parts;
  if (!(BRIEF_TOKEN_PURPOSES as readonly string[]).includes(purpose)) {
    return { ok: false, reason: "malformed" };
  }
  if (purpose !== options.purpose) return { ok: false, reason: "purpose_mismatch" };

  const expiresAt = Number(rawExpiry);
  if (!Number.isFinite(expiresAt)) return { ok: false, reason: "malformed" };
  if ((options.now ?? Date.now()) > expiresAt) return { ok: false, reason: "expired" };

  return {
    ok: true,
    payload: { purpose: purpose as BriefTokenPurpose, subject, scope, expiresAt },
  };
}

// src/lib/brief/http.ts
//
// Small shared pieces for the /api/brief routes: caller identity, email
// validation, the Turnstile check, and the one response every route gives when
// the subscriber store has not been provisioned yet.

import { NextResponse } from "next/server";

/** Same permissive shape the contact route uses. Real validation is the opt-in. */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: unknown): email is string {
  return typeof email === "string" && email.length <= 254 && EMAIL_RE.test(email.trim());
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Subscriptions are closed until the Redis integration exists. Saying so is
 * better than pretending a signup worked and dropping it on the floor.
 */
export function storeUnavailableResponse() {
  return NextResponse.json(
    {
      ok: false,
      error: "Subscriptions aren't open yet. Try again shortly, or read the archive in the meantime.",
    },
    { status: 503 },
  );
}

export function tokenSecretMissingResponse() {
  return NextResponse.json(
    { ok: false, error: "Subscriptions aren't open yet." },
    { status: 503 },
  );
}

/**
 * Server-side Turnstile. When TURNSTILE_SECRET_KEY is unset the check passes,
 * which is what lets the whole flow work before the widget exists.
 */
export async function verifyTurnstile(
  token: unknown,
  remoteIp?: string,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true };
  if (typeof token !== "string" || token.length === 0) {
    return { ok: false, reason: "missing" };
  }

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp && remoteIp !== "unknown") body.set("remoteip", remoteIp);

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      },
    );
    const result = (await response.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };
    if (result.success) return { ok: true };
    return { ok: false, reason: (result["error-codes"] ?? ["failed"]).join(",") };
  } catch (error) {
    return { ok: false, reason: `unreachable: ${String(error)}` };
  }
}

/** Bots fill every input they find, including the one nobody can see. */
export function honeypotTripped(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/** A human needs longer than this to read the form and type an address. */
export const MIN_FORM_FILL_MS = 3000;

export function submittedTooFast(renderedAt: unknown, now = Date.now()): boolean {
  if (renderedAt === undefined || renderedAt === null) return false;
  const value = Number(renderedAt);
  if (!Number.isFinite(value) || value <= 0) return false;
  const elapsed = now - value;
  // A negative elapsed means a clock skew, not a bot; only the fast case counts.
  return elapsed >= 0 && elapsed < MIN_FORM_FILL_MS;
}

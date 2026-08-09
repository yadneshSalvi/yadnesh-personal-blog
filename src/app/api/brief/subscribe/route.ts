// POST /api/brief/subscribe
//
// Step one of double opt-in. Four filters stand between a bot and the list:
// a honeypot, a timing check, Turnstile, and rate limits. Nothing here creates
// a subscriber; it creates a pending row and mails a signed link.

import { NextResponse } from "next/server";
import { CONSENT_TEXT_VERSION } from "@/lib/brief/consent";
import { buildConfirmationEmail } from "@/lib/brief/emails";
import {
  clientIp,
  honeypotTripped,
  isValidEmail,
  storeUnavailableResponse,
  submittedTooFast,
  tokenSecretMissingResponse,
  verifyTurnstile,
} from "@/lib/brief/http";
import { sendBriefEmail } from "@/lib/brief/mailer";
import { getStore, getSubscribeLimiters, isCadence, normalizeEmail } from "@/lib/brief/store";
import { isTokenSecretConfigured, signBriefToken } from "@/lib/brief/tokens";
import { confirmUrl, siteBaseUrl } from "@/lib/brief/urls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  // A tripped honeypot gets the success response a bot expects, and nothing else.
  if (honeypotTripped(body.website)) {
    return NextResponse.json({ ok: true, next: "/brief/confirm-sent" });
  }

  if (submittedTooFast(body.t)) {
    return NextResponse.json(
      { ok: false, error: "That was quick. Give the form a moment and try again." },
      { status: 400 },
    );
  }

  if (!isValidEmail(body.email)) {
    return NextResponse.json(
      { ok: false, error: "That email address doesn't look right." },
      { status: 400 },
    );
  }
  const email = normalizeEmail(body.email);

  const cadence = body.cadence;
  if (!isCadence(cadence)) {
    return NextResponse.json(
      { ok: false, error: "Pick daily, weekly, or both." },
      { status: 400 },
    );
  }

  const store = getStore();
  if (!store) return storeUnavailableResponse();
  if (!isTokenSecretConfigured()) return tokenSecretMissingResponse();

  const ip = clientIp(request);

  const limiters = getSubscribeLimiters();
  if (limiters) {
    const [byIp, byEmail] = await Promise.all([
      limiters.perIp.limit(ip),
      limiters.perEmail.limit(email),
    ]);
    if (!byIp.success || !byEmail.success) {
      return NextResponse.json(
        { ok: false, error: "Too many signups from here. Try again later." },
        { status: 429 },
      );
    }
  }

  const turnstile = await verifyTurnstile(body.turnstileToken, ip);
  if (!turnstile.ok) {
    return NextResponse.json(
      { ok: false, error: "The bot check didn't pass. Reload the page and try again." },
      { status: 400 },
    );
  }

  try {
    await store.saveSignup({
      email,
      cadence,
      ip,
      consentTextVersion: CONSENT_TEXT_VERSION,
    });
    await store.logConsent({
      ts: new Date().toISOString(),
      email,
      action: "signup",
      cadence,
      ip,
      consent_text_version: CONSENT_TEXT_VERSION,
    });

    const base = siteBaseUrl(request);
    const token = signBriefToken({ purpose: "confirm", subject: email, scope: cadence });
    const message = buildConfirmationEmail({
      base,
      cadence,
      confirmUrl: confirmUrl(base, token),
    });

    await sendBriefEmail({
      to: email,
      subject: message.subject,
      html: message.html,
      text: message.text,
      kind: "transactional",
    });

    return NextResponse.json({ ok: true, next: "/brief/confirm-sent" });
  } catch (error) {
    console.error("[brief] subscribe failed", error);
    return NextResponse.json(
      { ok: false, error: "Something broke on my side. Try again in a minute." },
      { status: 500 },
    );
  }
}

// /api/brief/preferences
//
// GET  ?token=...  returns the current cadence for the preferences page.
// POST { token, action }  changes cadence or unsubscribes entirely.
//
// Both accept a prefs token or an unsub token, because the unsubscribe link in
// an email footer lands on the same page in unsubscribe mode and the page still
// needs to read state.

import { NextResponse } from "next/server";
import { CONSENT_TEXT_VERSION } from "@/lib/brief/consent";
import { buildConfirmationEmail } from "@/lib/brief/emails";
import { clientIp, storeUnavailableResponse } from "@/lib/brief/http";
import { sendBriefEmail } from "@/lib/brief/mailer";
import { getStore, getTokenActionLimiter, isCadence } from "@/lib/brief/store";
import { signBriefToken, verifyBriefToken, type BriefTokenVerification } from "@/lib/brief/tokens";
import { confirmUrl, siteBaseUrl } from "@/lib/brief/urls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A footer unsubscribe link and a preferences link both open this page. */
function verifyEitherToken(token: string | null): BriefTokenVerification {
  const asPrefs = verifyBriefToken(token, { purpose: "prefs" });
  if (asPrefs.ok) return asPrefs;
  const asUnsub = verifyBriefToken(token, { purpose: "unsub" });
  if (asUnsub.ok) return asUnsub;
  // Report the more informative failure: an expired link is worth explaining.
  return asPrefs.reason === "purpose_mismatch" ? asUnsub : asPrefs;
}

function badToken(verification: BriefTokenVerification) {
  const reason = verification.ok ? "" : verification.reason;
  if (reason === "missing_secret") {
    return NextResponse.json({ ok: false, error: "Subscriptions aren't open yet." }, { status: 503 });
  }
  return NextResponse.json(
    {
      ok: false,
      error:
        reason === "expired"
          ? "That link has expired. Use the link in a more recent issue, or subscribe again."
          : "That link isn't valid. Use the one in your latest issue.",
      expired: reason === "expired",
    },
    { status: 400 },
  );
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const verified = verifyEitherToken(token);
  if (!verified.ok) return badToken(verified);

  const store = getStore();
  if (!store) return storeUnavailableResponse();

  const email = verified.payload.subject;
  const subscriber = await store.getSubscriber(email);
  if (!subscriber) {
    return NextResponse.json(
      { ok: false, error: "There's no subscription for that address." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    ok: true,
    email: subscriber.email,
    cadence: subscriber.cadence,
    status: subscriber.status,
  });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const token =
    typeof body.token === "string" ? body.token : url.searchParams.get("token");

  const verified = verifyEitherToken(token);
  if (!verified.ok) return badToken(verified);

  const store = getStore();
  if (!store) return storeUnavailableResponse();

  const limiter = getTokenActionLimiter();
  if (limiter) {
    const result = await limiter.limit(clientIp(request));
    if (!result.success) {
      return NextResponse.json(
        { ok: false, error: "Too many changes at once. Try again shortly." },
        { status: 429 },
      );
    }
  }

  const email = verified.payload.subject;
  const ip = clientIp(request);
  const action = body.action;

  if (action === "unsubscribe") {
    const subscriber = await store.unsubscribe(email);
    await store.logConsent({
      ts: new Date().toISOString(),
      email,
      action: "unsubscribe",
      cadence: subscriber?.cadence,
      ip,
      consent_text_version: CONSENT_TEXT_VERSION,
    });
    return NextResponse.json({ ok: true, status: "unsubscribed", email });
  }

  if (action === "cadence") {
    const cadence = body.cadence;
    if (!isCadence(cadence)) {
      return NextResponse.json(
        { ok: false, error: "Pick daily, weekly, or both." },
        { status: 400 },
      );
    }
    const subscriber = await store.changeCadence(email, cadence);
    if (!subscriber) {
      return NextResponse.json(
        { ok: false, error: "There's no subscription for that address." },
        { status: 404 },
      );
    }
    await store.logConsent({
      ts: new Date().toISOString(),
      email,
      action: "change",
      cadence,
      ip,
      consent_text_version: CONSENT_TEXT_VERSION,
    });
    return NextResponse.json({ ok: true, status: subscriber.status, cadence, email });
  }

  // The goodbye page's downgrade offer. Someone who just unsubscribed is on the
  // suppression list, and the only route back off it is a fresh double opt-in,
  // so this mails a new confirmation link rather than quietly restarting sends.
  if (action === "resubscribe") {
    const cadence = body.cadence;
    if (!isCadence(cadence)) {
      return NextResponse.json(
        { ok: false, error: "Pick daily, weekly, or both." },
        { status: 400 },
      );
    }
    try {
      await store.saveSignup({ email, cadence, ip, consentTextVersion: CONSENT_TEXT_VERSION });
      await store.logConsent({
        ts: new Date().toISOString(),
        email,
        action: "signup",
        cadence,
        ip,
        consent_text_version: CONSENT_TEXT_VERSION,
      });

      const base = siteBaseUrl(request);
      const confirmToken = signBriefToken({
        purpose: "confirm",
        subject: email,
        scope: cadence,
      });
      const message = buildConfirmationEmail({
        base,
        cadence,
        confirmUrl: confirmUrl(base, confirmToken),
      });
      await sendBriefEmail({
        to: email,
        subject: message.subject,
        html: message.html,
        text: message.text,
        kind: "transactional",
      });
    } catch (error) {
      console.error("[brief] resubscribe failed", error);
      return NextResponse.json(
        { ok: false, error: "Couldn't send the confirmation email. Try again in a minute." },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true, status: "pending", cadence, email });
  }

  return NextResponse.json({ ok: false, error: "Unknown action." }, { status: 400 });
}

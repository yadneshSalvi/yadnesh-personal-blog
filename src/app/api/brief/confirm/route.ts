// GET /api/brief/confirm?token=...
//
// Step two of double opt-in, and the only place a pending row becomes a real
// subscriber. Every failure lands on /brief/confirm-sent?expired=1, which
// explains what happened and offers a fresh signup.

import { NextResponse } from "next/server";
import { CONSENT_TEXT_VERSION } from "@/lib/brief/consent";
import { buildWelcomeEmail } from "@/lib/brief/emails";
import { clientIp } from "@/lib/brief/http";
import { sendBriefEmail } from "@/lib/brief/mailer";
import { getStore, isCadence, type BriefCadence } from "@/lib/brief/store";
import { signBriefToken, verifyBriefToken } from "@/lib/brief/tokens";
import { preferencesUrl, siteBaseUrl, unsubscribeUrl } from "@/lib/brief/urls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const base = siteBaseUrl(request);
  const expired = () => NextResponse.redirect(`${base}/brief/confirm-sent?expired=1`, 302);

  const token = new URL(request.url).searchParams.get("token");
  const verified = verifyBriefToken(token, { purpose: "confirm" });
  if (!verified.ok) return expired();

  const store = getStore();
  if (!store) return expired();

  const email = verified.payload.subject;
  const cadence: BriefCadence = isCadence(verified.payload.scope)
    ? verified.payload.scope
    : "weekly";

  try {
    const subscriber = await store.confirmSubscriber(email, cadence);
    if (!subscriber) return expired();

    await store.logConsent({
      ts: new Date().toISOString(),
      email,
      action: "confirm",
      cadence,
      ip: clientIp(request),
      consent_text_version: CONSENT_TEXT_VERSION,
    });

    // W1 goes out immediately. A welcome that fails to send must not undo a
    // confirmation that already succeeded, so this leg is best effort.
    try {
      const prefsToken = signBriefToken({ purpose: "prefs", subject: email, scope: cadence });
      const unsubToken = signBriefToken({ purpose: "unsub", subject: email, scope: cadence });
      const message = buildWelcomeEmail({
        base,
        cadence,
        preferencesUrl: preferencesUrl(base, prefsToken),
        unsubscribeUrl: unsubscribeUrl(base, unsubToken),
      });
      await sendBriefEmail({
        to: email,
        subject: message.subject,
        html: message.html,
        text: message.text,
        kind: "transactional",
      });
    } catch (error) {
      console.error("[brief] welcome email failed", error);
    }

    return NextResponse.redirect(`${base}/brief/welcome?cadence=${cadence}`, 302);
  } catch (error) {
    console.error("[brief] confirm failed", error);
    return expired();
  }
}

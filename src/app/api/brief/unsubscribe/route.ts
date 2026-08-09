// /api/brief/unsubscribe?token=...
//
// GET  is the plain link in every footer. It unsubscribes nothing by itself; it
//      forwards to the preferences page in unsubscribe mode, one button away.
// POST is RFC 8058 one-click. Gmail and Outlook POST here from their own
//      unsubscribe button with no body worth reading, so the token in the query
//      string is the whole request and the answer has to be a plain 200.

import { NextResponse } from "next/server";
import { CONSENT_TEXT_VERSION } from "@/lib/brief/consent";
import { clientIp } from "@/lib/brief/http";
import { getStore } from "@/lib/brief/store";
import { verifyBriefToken } from "@/lib/brief/tokens";
import { siteBaseUrl } from "@/lib/brief/urls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifyEither(token: string | null) {
  const asUnsub = verifyBriefToken(token, { purpose: "unsub" });
  if (asUnsub.ok) return asUnsub;
  return verifyBriefToken(token, { purpose: "prefs" });
}

export async function GET(request: Request) {
  const base = siteBaseUrl(request);
  const token = new URL(request.url).searchParams.get("token");
  const verified = verifyEither(token);
  if (!verified.ok) {
    return NextResponse.redirect(`${base}/brief/preferences?error=token`, 302);
  }
  return NextResponse.redirect(
    `${base}/brief/preferences?token=${encodeURIComponent(token as string)}&mode=unsub`,
    302,
  );
}

export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  const verified = verifyEither(token);
  if (!verified.ok) {
    // A mail client's one-click button gives the reader no way to retry, so a
    // bad token is logged and answered plainly rather than argued with.
    return new NextResponse("Invalid or expired unsubscribe link.\n", {
      status: 400,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const store = getStore();
  if (!store) {
    return new NextResponse("Unsubscribe is unavailable right now.\n", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const email = verified.payload.subject;
  try {
    const subscriber = await store.unsubscribe(email);
    await store.logConsent({
      ts: new Date().toISOString(),
      email,
      action: "unsubscribe",
      cadence: subscriber?.cadence,
      ip: clientIp(request),
      consent_text_version: CONSENT_TEXT_VERSION,
    });
  } catch (error) {
    console.error("[brief] one-click unsubscribe failed", error);
    return new NextResponse("Unsubscribe failed. Reply to the email and I'll do it by hand.\n", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new NextResponse("Unsubscribed.\n", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

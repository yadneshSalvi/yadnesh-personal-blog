// POST /api/brief/notify
//
// The feed repo's pipeline calls this once an issue PR has merged and the
// deployment carrying it is live. It arms the approval gate and mails Yadnesh
// the one decision that matters: send it, hold it, or leave it alone and let
// the two-hour window send it for you.
//
// Body: { "type": "daily"|"weekly", "id": "2026-08-06", "approve_by"?: ISO }
// Auth: Authorization: Bearer $BRIEF_PIPELINE_SECRET
//
// Idempotent by design. Calling it twice re-sends the notification, which is
// what you want when the first one landed in spam, and never rewinds an issue
// that has already gone out.

import { NextResponse } from "next/server";
import { approvalSubject, buildApprovalEmail, issueSourceUrl } from "@/lib/brief/approvalEmail";
import { getIssue } from "@/lib/brief/issues";
import { renderIssueEmail } from "@/lib/brief/issueEmail";
import { isMailerConfigured, sendBriefEmail } from "@/lib/brief/mailer";
import { APPROVAL_WINDOW_MS, authorizeSharedSecret, issueEmailLinks } from "@/lib/brief/sending";
import { getStore, type SendState } from "@/lib/brief/store";
import { isTokenSecretConfigured, signBriefToken } from "@/lib/brief/tokens";
import { siteBaseUrl } from "@/lib/brief/urls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function actionUrl(base: string, action: "approve" | "hold", subject: string): string {
  const token = signBriefToken({ purpose: "send-action", subject, scope: action });
  return `${base}/api/brief/send-action?token=${encodeURIComponent(token)}&action=${action}`;
}

export async function POST(request: Request) {
  const auth = authorizeSharedSecret(request, ["BRIEF_PIPELINE_SECRET"]);
  if (!auth.ok) {
    return NextResponse.json(
      {
        ok: false,
        error:
          auth.reason === "unconfigured"
            ? "BRIEF_PIPELINE_SECRET is not set on this deployment."
            : "Unauthorized.",
      },
      { status: auth.reason === "unconfigured" ? 503 : 401 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const type = body.type === "daily" || body.type === "weekly" ? body.type : null;
  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!type || !id) {
    return NextResponse.json(
      { ok: false, error: 'Body needs {"type":"daily"|"weekly","id":"<issue id>"}.' },
      { status: 400 },
    );
  }

  const issue = getIssue(type, id);
  if (!issue || issue.status !== "published") {
    // The most likely cause is that the deployment carrying the merged PR has
    // not finished building yet, so say so rather than just refusing.
    return NextResponse.json(
      {
        ok: false,
        error: `No published issue at content/brief/${type}/${id}.json in this deployment. If the PR just merged, retry once the deploy is live.`,
      },
      { status: 404 },
    );
  }

  const store = getStore();
  if (!store) {
    return NextResponse.json(
      { ok: false, error: "The subscriber store is not provisioned yet." },
      { status: 503 },
    );
  }
  if (!isTokenSecretConfigured()) {
    return NextResponse.json({ ok: false, error: "BRIEF_TOKEN_SECRET is not set." }, { status: 503 });
  }
  if (!isMailerConfigured()) {
    return NextResponse.json({ ok: false, error: "No mail driver is configured." }, { status: 503 });
  }
  const approver = process.env.BRIEF_APPROVER_EMAIL;
  if (!approver) {
    return NextResponse.json(
      { ok: false, error: "BRIEF_APPROVER_EMAIL is not set, so there is nobody to ask." },
      { status: 503 },
    );
  }

  const requested = typeof body.approve_by === "string" ? Date.parse(body.approve_by) : NaN;
  const approveBy = new Date(
    Number.isFinite(requested) ? requested : Date.now() + APPROVAL_WINDOW_MS,
  ).toISOString();

  const existing = await store.getSendState(type, id);
  let state: SendState;
  if (!existing) {
    state = await store.setSendState(type, id, {
      state: "pending_approval",
      approve_by: approveBy,
      recipients_done: 0,
      failures: 0,
    });
  } else if (existing.state === "pending_approval") {
    // A repeat notification restarts the clock, because the window exists to
    // give a human a fair chance to look at it.
    state = await store.setSendState(type, id, { approve_by: approveBy });
  } else {
    // approved, held, sent, and skipped are all decisions. Leave them alone.
    state = existing;
  }

  const base = siteBaseUrl(request);
  const links = issueEmailLinks(base, issue);
  const preview = renderIssueEmail(issue, links);

  let recipients: number | null = null;
  try {
    recipients = await store.segmentSize(type);
  } catch (error) {
    console.error("[brief] notify could not read the segment size", error);
  }

  const subject = `${type}/${id}`;
  const message = buildApprovalEmail({
    base,
    issue,
    approveUrl: actionUrl(base, "approve", subject),
    holdUrl: actionUrl(base, "hold", subject),
    githubUrl: issueSourceUrl(type, id),
    webUrl: links.webUrl,
    approveBy: state.approve_by ?? approveBy,
    recipients,
    sizeBytes: preview.size.bytes,
    dropped: preview.dropped,
    alreadySentAt: state.state === "sent" ? state.sent_at : undefined,
  });

  try {
    await sendBriefEmail({
      to: approver,
      subject: message.subject,
      html: message.html,
      text: message.text,
      kind: "transactional",
    });
  } catch (error) {
    console.error("[brief] approval notification failed to send", error);
    // The state is armed either way: an issue whose notification bounced still
    // sends itself when the window expires, which is the safer failure.
    return NextResponse.json(
      {
        ok: false,
        error: "The approval notification could not be sent. The send window is armed anyway.",
        state: state.state,
        approve_by: state.approve_by,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    subject: approvalSubject(issue),
    state: state.state,
    approve_by: state.approve_by,
    recipients,
    email_bytes: preview.size.bytes,
    trimmed: preview.dropped,
  });
}

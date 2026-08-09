// GET /api/brief/send-action?token=…&action=approve|hold
//
// The two links in the approval email. A GET because it is a link in an inbox,
// and safe as a GET because the token is single-purpose, scoped to one issue,
// and the worst a prefetcher can do is bring a send forward by two hours or
// hold an issue Yadnesh can then approve from the same email.
//
// Nothing here sends anything. It flips a state; the cron does the work.

import { renderActionPage } from "@/lib/brief/actionPage";
import { getIssue } from "@/lib/brief/issues";
import { HOLD_EXPIRY_MS } from "@/lib/brief/sending";
import { getStore } from "@/lib/brief/store";
import { verifyBriefToken } from "@/lib/brief/tokens";
import { archiveUrl, issueWebUrl, siteBaseUrl } from "@/lib/brief/urls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** IST, because the person clicking this link lives there. */
function stamp(iso: string | undefined): string {
  if (!iso) return "an unrecorded time";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })} IST`;
}

export async function GET(request: Request) {
  const base = siteBaseUrl(request);
  const params = new URL(request.url).searchParams;
  const token = params.get("token");
  const action = params.get("action");

  const backToArchive = { href: archiveUrl(base), label: "Open the archive" };

  if (action !== "approve" && action !== "hold") {
    return renderActionPage({
      title: "That link is incomplete",
      body: "It needs to say whether you're approving or holding. Use the links in the approval email.",
      links: [backToArchive],
      status: 400,
    });
  }

  const verified = verifyBriefToken(token, { purpose: "send-action" });
  if (!verified.ok || verified.payload.scope !== action) {
    return renderActionPage({
      title: verified.ok === false && verified.reason === "expired" ? "That link has expired" : "That link isn't valid",
      body: "Nothing changed. The issue is where you left it, and the pipeline can send a fresh notification.",
      links: [backToArchive],
      status: 400,
    });
  }

  const [type, id] = verified.payload.subject.split("/");
  if ((type !== "daily" && type !== "weekly") || !id) {
    return renderActionPage({
      title: "That link points at nothing",
      body: "The token doesn't name an issue this site knows about.",
      links: [backToArchive],
      status: 400,
    });
  }

  const store = getStore();
  if (!store) {
    return renderActionPage({
      title: "The send state store isn't wired up",
      body: "Nothing was recorded. That's a configuration problem on my side, not a bad link.",
      links: [backToArchive],
      status: 503,
    });
  }

  const issue = getIssue(type, id);
  const issueLink = { href: issueWebUrl(base, type, id), label: "Read the issue on the web" };
  const label = issue ? issue.subject : `${type} ${id}`;

  const current = await store.getSendState(type, id);
  if (!current) {
    return renderActionPage({
      title: "There's no send waiting on this one",
      body: `Nothing is armed for ${label}. Either the notification never ran, or the state was cleared.`,
      links: [issueLink, backToArchive],
      status: 404,
    });
  }

  if (current.state === "sent") {
    return renderActionPage({
      title: "Already sent",
      body: `${label} went out at ${stamp(current.sent_at)}. Nothing to decide.`,
      links: [issueLink, backToArchive],
    });
  }

  if (action === "approve") {
    await store.setSendState(type, id, { state: "approved", decided_via: "approve" });
    const held = current.state === "held";
    return renderActionPage({
      title: held ? "Un-held and approved" : "Approved",
      body: held
        ? `${label} was on hold and is now queued. The next cron tick sends it, usually within fifteen minutes.`
        : `${label} is queued. The next cron tick sends it, usually within fifteen minutes, and you'll see it in your own inbox.`,
      links: [issueLink, backToArchive],
    });
  }

  await store.setSendState(type, id, { state: "held", decided_via: "hold" });
  const holdUntil = current.approve_by
    ? stamp(new Date(Date.parse(current.approve_by) + HOLD_EXPIRY_MS).toISOString())
    : "a day from now";
  return renderActionPage({
    title: "Held",
    body: `${label} stays on the web and goes to nobody's inbox. Approving it from the same email still works until ${holdUntil}, after which it's a web-only edition for good.`,
    links: [issueLink, backToArchive],
  });
}

// GET /api/brief/send
//
// The poller. Vercel's cron hits it every fifteen minutes inside the send
// window (see vercel.json) and once more each morning as a sweep. Everything it
// does is idempotent, resumable, and safe to run twice, because on a schedule
// like this "run twice" eventually happens.
//
// Per tick, in order:
//   1. take the send lock, or leave immediately;
//   2. send any issue that is approved, or whose approval window expired;
//   3. mark held issues skipped once a day has passed;
//   4. hourly, mail the one confirmation reminder and the day-3 / day-10
//      welcome-sequence emails.
//
// Two hard refusals worth knowing about. Without BRIEF_POSTAL_ADDRESS nothing
// marketing goes out at all, because CAN-SPAM prices that mistake per email.
// And without a send state an issue is never sent, so an issue that reaches the
// site without the pipeline announcing it stays a web-only edition.

import { NextResponse } from "next/server";
import { issueDate } from "@/lib/brief/dates";
import { getAllIssues } from "@/lib/brief/issues";
import {
  personalizeIssueEmail,
  renderIssueEmail,
  type RenderedIssueEmail,
} from "@/lib/brief/issueEmail";
import {
  isMailerConfigured,
  oneClickUnsubscribeHeaders,
  sendBriefEmail,
} from "@/lib/brief/mailer";
import { pickArchiveHighlights } from "@/lib/brief/archivePicks";
import {
  buildArchiveDigestEmail,
  buildCadenceCheckEmail,
  buildReminderEmail,
  SEQUENCE_DUE_DAYS,
  SEQUENCE_FLAGS,
  SEQUENCE_WINDOW_DAYS,
} from "@/lib/brief/sequenceEmails";
import {
  APPROVAL_WINDOW_MS,
  authorizeSharedSecret,
  HOLD_EXPIRY_MS,
  issueEmailLinks,
  recipientUrls,
  SEND_CANDIDATE_WINDOW_MS,
  SEND_LOCK_TTL_SECONDS,
  SEND_THROTTLE_MS,
  SEND_WALL_CLOCK_MS,
} from "@/lib/brief/sending";
import { getStore, type BriefStore, type SendState } from "@/lib/brief/store";
import { isTokenSecretConfigured, signBriefToken } from "@/lib/brief/tokens";
import { confirmUrl, preferencesUrl, siteBaseUrl, unsubscribeUrl } from "@/lib/brief/urls";
import type { BriefIssue } from "@/lib/brief/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Generous ceiling; the loop below stops itself long before this.
export const maxDuration = 300;

const DAY_MS = 24 * 60 * 60 * 1000;

/** How often the subscriber sweep runs, whatever the cron schedule says. */
const LIFECYCLE_INTERVAL_SECONDS = 60 * 60;

/** A ceiling on lifecycle mail per tick, so one sweep cannot eat the window. */
const LIFECYCLE_SEND_CAP = 25;

/** Nobody has this many subscribers yet, and the walk stays bounded anyway. */
const LIFECYCLE_SCAN_CAP = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type IssueOutcome = {
  issue: string;
  state: SendState["state"] | "refused";
  sent: number;
  total: number;
  failures: number;
  reason?: string;
  dropped?: string[];
};

/* ── Sending one issue ──────────────────────────────────────────────────── */

async function sendIssue(input: {
  store: BriefStore;
  base: string;
  issue: BriefIssue;
  state: SendState;
  suppressed: Set<string>;
  /** Wall-clock stop line for this whole invocation. */
  deadline: number;
  dueViaTimeout: boolean;
}): Promise<IssueOutcome> {
  const { store, base, issue, state, suppressed, deadline, dueViaTimeout } = input;
  const label = `${issue.type}/${issue.id}`;

  // CAN-SPAM's physical-address rule binds per email, and the penalty is per
  // email too. Refuse loudly and change nothing.
  const postal = process.env.BRIEF_POSTAL_ADDRESS;
  if (!postal) {
    console.error(
      `[brief] REFUSING to send ${label}: BRIEF_POSTAL_ADDRESS is unset. ` +
        "Every marketing email needs a physical mailing address. Set it and the next cron tick will send.",
    );
    return {
      issue: label,
      state: "refused",
      sent: 0,
      total: 0,
      failures: 0,
      reason: "BRIEF_POSTAL_ADDRESS is unset",
    };
  }

  // The recipient list is frozen on the first pass. The cursor in the send
  // state indexes into this exact list, so a resume cannot skip or repeat
  // anyone just because the segment changed underneath it.
  let recipients = await store.getSendRecipients(issue.type, issue.id);
  if (recipients.length === 0 && state.recipients_done === 0) {
    const segment = await store.segmentEmails(issue.type);
    recipients = segment.filter((email) => !suppressed.has(email)).sort();
    await store.saveSendRecipients(issue.type, issue.id, recipients);
  }

  const decidedVia = state.decided_via ?? (dueViaTimeout ? "timeout" : "approve");

  if (recipients.length === 0) {
    const done = await store.setSendState(issue.type, issue.id, {
      state: "sent",
      sent_at: new Date().toISOString(),
      decided_via: decidedVia,
      recipients_done: 0,
    });
    await store.appendSendLog({
      ts: done.sent_at ?? new Date().toISOString(),
      type: issue.type,
      id: issue.id,
      recipients: 0,
      failures: 0,
      decided_via: decidedVia,
      dropped: [],
      driver: "none",
    });
    console.warn(`[brief] ${label} had no confirmed recipients; marked sent.`);
    return { issue: label, state: "sent", sent: 0, total: 0, failures: 0 };
  }

  // Rendered once for the whole list. Per recipient, four string replaces.
  const rendered: RenderedIssueEmail = renderIssueEmail(issue, issueEmailLinks(base, issue));
  if (!rendered.size.ok) {
    console.warn(
      `[brief] ${label} is ${rendered.size.bytes} bytes after trimming, over the budget. Sending anyway.`,
    );
  }

  let cursor = state.recipients_done;
  let failures = state.failures;
  let sentThisRun = 0;
  let driver = "unknown";

  while (cursor < recipients.length) {
    if (Date.now() > deadline) {
      console.log(`[brief] ${label} partial: ${cursor}/${recipients.length} done, resuming next tick.`);
      return {
        issue: label,
        state: state.state,
        sent: sentThisRun,
        total: recipients.length,
        failures,
        reason: "partial, out of wall clock",
        dropped: rendered.dropped,
      };
    }

    const email = recipients[cursor];
    // Somebody who unsubscribed after the list was frozen must not get it.
    if (suppressed.has(email)) {
      cursor += 1;
      await store.setSendState(issue.type, issue.id, { recipients_done: cursor });
      continue;
    }

    const urls = recipientUrls({ base, email, type: issue.type, id: issue.id });
    const personalized = personalizeIssueEmail(rendered, urls);

    try {
      const result = await sendBriefEmail({
        to: email,
        subject: rendered.subject,
        html: personalized.html,
        text: personalized.text,
        headers: oneClickUnsubscribeHeaders(urls.unsubscribeUrl),
        kind: "issue",
      });
      driver = result.driver;
      sentThisRun += 1;
    } catch (error) {
      failures += 1;
      console.error(`[brief] ${label} failed for one recipient`, error);
    }

    // The cursor advances past a failure on purpose: retrying a hard bounce on
    // every tick would stall the whole send behind one bad address.
    cursor += 1;
    await store.setSendState(issue.type, issue.id, {
      recipients_done: cursor,
      failures,
    });
    await sleep(SEND_THROTTLE_MS);
  }

  const sentAt = new Date().toISOString();
  await store.setSendState(issue.type, issue.id, {
    state: "sent",
    sent_at: sentAt,
    decided_via: decidedVia,
    recipients_done: cursor,
    failures,
  });
  await store.appendSendLog({
    ts: sentAt,
    type: issue.type,
    id: issue.id,
    recipients: recipients.length,
    failures,
    decided_via: decidedVia,
    dropped: rendered.dropped,
    driver,
  });

  return {
    issue: label,
    state: "sent",
    sent: sentThisRun,
    total: recipients.length,
    failures,
    dropped: rendered.dropped,
  };
}

/* ── The issue sweep ────────────────────────────────────────────────────── */

async function processIssues(input: {
  store: BriefStore;
  base: string;
  now: number;
  deadline: number;
}): Promise<{ outcomes: IssueOutcome[]; holdsSkipped: string[] }> {
  const { store, base, now, deadline } = input;
  const outcomes: IssueOutcome[] = [];
  const holdsSkipped: string[] = [];

  const candidates = getAllIssues().filter(
    (issue) => now - issueDate(issue.type, issue.id).getTime() <= SEND_CANDIDATE_WINDOW_MS,
  );

  const suppressed = new Set(await store.suppressedEmails());

  for (const issue of candidates) {
    const state = await store.getSendState(issue.type, issue.id);
    // No state means the pipeline never announced it. Silence is the correct
    // answer: nothing reaches an inbox that a human was not asked about.
    if (!state) continue;
    if (state.state === "sent" || state.state === "skipped") continue;

    const approveBy = state.approve_by ? Date.parse(state.approve_by) : NaN;

    if (state.state === "held") {
      if (Number.isFinite(approveBy) && now > approveBy + HOLD_EXPIRY_MS) {
        await store.setSendState(issue.type, issue.id, { state: "skipped" });
        holdsSkipped.push(`${issue.type}/${issue.id}`);
      }
      continue;
    }

    const dueViaTimeout =
      state.state === "pending_approval" && Number.isFinite(approveBy) && now > approveBy;
    if (state.state !== "approved" && !dueViaTimeout) continue;

    if (Date.now() > deadline) break;
    outcomes.push(
      await sendIssue({ store, base, issue, state, suppressed, deadline, dueViaTimeout }),
    );
  }

  return { outcomes, holdsSkipped };
}

/* ── The subscriber sweep ───────────────────────────────────────────────── */

type LifecycleReport = { reminders: number; w2: number; w3: number; scanned: number };

async function processLifecycle(input: {
  store: BriefStore;
  base: string;
  now: number;
  deadline: number;
}): Promise<LifecycleReport> {
  const { store, base, now, deadline } = input;
  const report: LifecycleReport = { reminders: 0, w2: 0, w3: 0, scanned: 0 };
  let sends = 0;

  const emails = await store.listSubscriberEmails(LIFECYCLE_SCAN_CAP);
  // The archive picks are the same for everyone, so they are computed once.
  const picks = pickArchiveHighlights(getAllIssues());

  for (const address of emails) {
    if (sends >= LIFECYCLE_SEND_CAP || Date.now() > deadline) break;
    const subscriber = await store.getSubscriber(address);
    if (!subscriber) continue;
    report.scanned += 1;

    // One reminder to an unconfirmed signup, a day later, then silence.
    if (subscriber.status === "pending" && !subscriber.reminder_sent_at) {
      const age = now - Date.parse(subscriber.created_at);
      if (age >= DAY_MS && age < 3 * DAY_MS) {
        const claimed = await store.claimSubscriberFlag(
          subscriber.email,
          "reminder_sent_at",
          new Date().toISOString(),
        );
        if (claimed) {
          try {
            const message = buildReminderEmail({
              base,
              cadence: subscriber.cadence,
              confirmUrl: confirmUrl(
                base,
                signBriefToken({
                  purpose: "confirm",
                  subject: subscriber.email,
                  scope: subscriber.cadence,
                }),
              ),
            });
            await sendBriefEmail({
              to: subscriber.email,
              subject: message.subject,
              html: message.html,
              text: message.text,
              kind: "transactional",
            });
            report.reminders += 1;
            sends += 1;
          } catch (error) {
            // Give the claim back so the next sweep can try again.
            await store.clearSubscriberFlag(subscriber.email, "reminder_sent_at");
            console.error(`[brief] reminder failed for ${subscriber.email}`, error);
          }
          await sleep(SEND_THROTTLE_MS);
        }
      }
      continue;
    }

    if (subscriber.status !== "confirmed" || !subscriber.confirmed_at) continue;
    const age = now - Date.parse(subscriber.confirmed_at);
    if (!Number.isFinite(age)) continue;

    const links = {
      preferencesUrl: preferencesUrl(
        base,
        signBriefToken({ purpose: "prefs", subject: subscriber.email }),
      ),
      unsubscribeUrl: unsubscribeUrl(
        base,
        signBriefToken({ purpose: "unsub", subject: subscriber.email }),
      ),
    };

    const due = (which: "w2" | "w3") =>
      age >= SEQUENCE_DUE_DAYS[which] * DAY_MS &&
      age < SEQUENCE_WINDOW_DAYS[which] * DAY_MS;

    // W3 first: somebody who confirmed long enough ago for both is past the
    // point where the archive digest is still news.
    const which = due("w3") ? "w3" : due("w2") ? "w2" : null;
    if (!which) continue;
    if (which === "w2" && picks.length === 0) continue;
    // Both of these promote the product, which puts them under the same
    // physical-address rule as the issues themselves. The reminder above does
    // not: it finishes a signup the reader asked for.
    if (!process.env.BRIEF_POSTAL_ADDRESS) continue;

    const claimed = await store.claimSubscriberFlag(
      subscriber.email,
      SEQUENCE_FLAGS[which],
      new Date().toISOString(),
    );
    if (!claimed) continue;

    try {
      const message =
        which === "w2"
          ? buildArchiveDigestEmail({ base, picks, ...links })
          : buildCadenceCheckEmail({ base, cadence: subscriber.cadence, ...links });
      await sendBriefEmail({
        to: subscriber.email,
        subject: message.subject,
        html: message.html,
        text: message.text,
        headers: oneClickUnsubscribeHeaders(links.unsubscribeUrl),
        kind: "transactional",
      });
      report[which] += 1;
      sends += 1;
    } catch (error) {
      await store.clearSubscriberFlag(subscriber.email, SEQUENCE_FLAGS[which]);
      console.error(`[brief] ${which} failed for ${subscriber.email}`, error);
    }
    await sleep(SEND_THROTTLE_MS);
  }

  return report;
}

/* ── The route ──────────────────────────────────────────────────────────── */

export async function GET(request: Request) {
  const auth = authorizeSharedSecret(request, ["CRON_SECRET", "BRIEF_PIPELINE_SECRET"]);
  if (!auth.ok) {
    return NextResponse.json(
      {
        ok: false,
        error:
          auth.reason === "unconfigured"
            ? "Neither CRON_SECRET nor BRIEF_PIPELINE_SECRET is set on this deployment."
            : "Unauthorized.",
      },
      { status: auth.reason === "unconfigured" ? 503 : 401 },
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

  const locked = await store.acquireSendLock(SEND_LOCK_TTL_SECONDS);
  if (!locked) {
    // Not an error. Two ticks overlapping is exactly what the lock is for.
    return NextResponse.json({ ok: true, skipped: "another run holds the send lock" });
  }

  const started = Date.now();
  const deadline = started + SEND_WALL_CLOCK_MS;
  const base = siteBaseUrl(request);

  try {
    const { outcomes, holdsSkipped } = await processIssues({
      store,
      base,
      now: started,
      deadline,
    });

    let lifecycle: LifecycleReport | null = null;
    if (Date.now() < deadline && (await store.claimPeriodicTask("lifecycle", LIFECYCLE_INTERVAL_SECONDS))) {
      lifecycle = await processLifecycle({ store, base, now: Date.now(), deadline });
    }

    const refused = outcomes.filter((outcome) => outcome.state === "refused");
    const partial = outcomes.filter((outcome) => outcome.reason?.startsWith("partial"));

    return NextResponse.json({
      ok: refused.length === 0,
      ran_at: new Date(started).toISOString(),
      elapsed_ms: Date.now() - started,
      approval_window_hours: APPROVAL_WINDOW_MS / (60 * 60 * 1000),
      issues: outcomes,
      partial: partial.map((outcome) => outcome.issue),
      refused: refused.map((outcome) => ({ issue: outcome.issue, reason: outcome.reason })),
      holds_skipped: holdsSkipped,
      lifecycle,
    });
  } catch (error) {
    console.error("[brief] send run failed", error);
    return NextResponse.json(
      { ok: false, error: "The send run failed. The cursor is where it stopped; the next tick resumes." },
      { status: 500 },
    );
  } finally {
    await store.releaseSendLock();
  }
}

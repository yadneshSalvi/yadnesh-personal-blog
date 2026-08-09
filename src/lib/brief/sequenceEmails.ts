// src/lib/brief/sequenceEmails.ts
//
// The lifecycle mail the send cron handles: the one reminder an unconfirmed
// signup gets, and the two welcome-sequence emails after W1 (plan 04 §4).
//
// W1 lives in emails.ts with the confirmation, because a route sends it inline.
// These three are here because the cron sends them, and because Phase 2's file
// is finished; adding to it would mean editing code that already ships.

import type { BriefCadence } from "./cadence";
import {
  emailButton,
  emailLink,
  escapeHtml,
  renderBriefEmailHtml,
  renderBriefEmailText,
  type BriefEmailFooter,
} from "./emailChrome";
import { CADENCE_LABELS, scheduleSentence, type BuiltEmail } from "./emails";
import type { ArchivePick } from "./archivePicks";
import { archiveUrl, howItWorksUrl, issueWebUrl } from "./urls";

/** Days after confirmation each sequence email is due. */
export const SEQUENCE_DUE_DAYS = { w2: 3, w3: 10 } as const;

/**
 * How late a sequence email may still go out. Without this, wiring the cron up
 * for the first time would mail every subscriber who ever confirmed.
 */
export const SEQUENCE_WINDOW_DAYS = { w2: 7, w3: 14 } as const;

/** The subscriber-hash fields that make each sequence email send exactly once. */
export const SEQUENCE_FLAGS = { w2: "w2_sent_at", w3: "w3_sent_at" } as const;

/* ── The 24-hour reminder ───────────────────────────────────────────────── */

/**
 * One reminder, then silence. Somebody who signed up and did not click either
 * missed the email or changed their mind, and a second chase turns the first
 * into spam.
 */
export function buildReminderEmail(input: {
  base: string;
  cadence: BriefCadence;
  confirmUrl: string;
}): BuiltEmail {
  const footer: BriefEmailFooter = {
    archiveUrl: archiveUrl(input.base),
    howItWorksUrl: howItWorksUrl(input.base),
  };

  const bodyHtml = [
    `<h1>Still want the brief?</h1>`,
    `<p class="lede">You asked for it yesterday and the confirmation link is still sitting there unclicked. ${escapeHtml(scheduleSentence(input.cadence))}</p>`,
    emailButton(input.confirmUrl, "Confirm your subscription"),
    `<p class="fallback">Or paste this into your browser:<br>${escapeHtml(input.confirmUrl)}</p>`,
    `<p>This is the only reminder. Ignore it and the signup expires on its own, with nothing kept and nothing sent.</p>`,
    `<p>${emailLink(footer.archiveUrl, "The archive")} is the whole product either way, ungated.</p>`,
  ].join("\n");

  return {
    subject: "Your subscription to The Agentic Brief is one click away",
    html: renderBriefEmailHtml({
      preheader: "One click finishes it. This is the only reminder.",
      bodyHtml,
      footer,
    }),
    text: renderBriefEmailText({
      lines: [
        "Still want the brief?",
        "",
        `You asked for it yesterday and the confirmation link is still sitting there unclicked. ${scheduleSentence(input.cadence)}`,
        "",
        "Confirm your subscription:",
        input.confirmUrl,
        "",
        "This is the only reminder. Ignore it and the signup expires on its own, with nothing kept and nothing sent.",
      ],
      footer,
    }),
  };
}

/* ── W2, day 3: best of the archive ─────────────────────────────────────── */

function pickBlurb(pick: ArchivePick): string {
  return pick.editorNote ? `Y: ${pick.editorNote}` : pick.story.summary;
}

export function buildArchiveDigestEmail(input: {
  base: string;
  picks: ArchivePick[];
  preferencesUrl: string;
  unsubscribeUrl: string;
}): BuiltEmail {
  const footer: BriefEmailFooter = {
    archiveUrl: archiveUrl(input.base),
    howItWorksUrl: howItWorksUrl(input.base),
    preferencesUrl: input.preferencesUrl,
    unsubscribeUrl: input.unsubscribeUrl,
  };

  const items = input.picks.map((pick) => {
    const issueUrl = issueWebUrl(input.base, pick.type, pick.issueId);
    return {
      pick,
      issueUrl,
      html: [
        `<p>${emailLink(pick.story.url, `${pick.story.title} (${pick.story.source_name})`)}<br>`,
        `${escapeHtml(pickBlurb(pick))}<br>`,
        `<span class="lede">Picked because ${escapeHtml(pick.reason)}. ${emailLink(issueUrl, "The issue it ran in")}.</span></p>`,
      ].join(""),
    };
  });

  const bodyHtml = [
    `<h1>Three things from the archive</h1>`,
    `<p class="lede">You've had a few issues by now. These are the ones worth going back for, picked by what earned a note or kept coming back.</p>`,
    ...items.map((item) => item.html),
    `<p>${emailLink(footer.archiveUrl, "Everything else is in the archive")}, ungated and searchable.</p>`,
  ].join("\n");

  const text = renderBriefEmailText({
    lines: [
      "Three things from the archive.",
      "",
      "You've had a few issues by now. These are the ones worth going back for, picked by what earned a note or kept coming back.",
      "",
      ...items.flatMap((item) => [
        `* ${item.pick.story.title} (${item.pick.story.source_name})`,
        `  ${item.pick.story.url}`,
        `  ${pickBlurb(item.pick)}`,
        `  Picked because ${item.pick.reason}. The issue it ran in: ${item.issueUrl}`,
        "",
      ]),
      `Everything else is in the archive: ${footer.archiveUrl}`,
    ],
    footer,
  });

  return {
    subject: "Three from the archive worth going back for",
    html: renderBriefEmailHtml({
      preheader: "The items that earned a note or kept coming back.",
      bodyHtml,
      footer,
    }),
    text,
  };
}

/* ── W3, day 10: the cadence check ──────────────────────────────────────── */

/**
 * Framed as a feature rather than a survey. The three links all open the same
 * preferences screen, where the change is one click; the `suggest` parameter
 * rides along so the intent is visible in the URL the reader clicked.
 */
export function buildCadenceCheckEmail(input: {
  base: string;
  cadence: BriefCadence;
  preferencesUrl: string;
  unsubscribeUrl: string;
}): BuiltEmail {
  const footer: BriefEmailFooter = {
    archiveUrl: archiveUrl(input.base),
    howItWorksUrl: howItWorksUrl(input.base),
    preferencesUrl: input.preferencesUrl,
    unsubscribeUrl: input.unsubscribeUrl,
  };

  const suggest = (value: BriefCadence) =>
    `${input.preferencesUrl}${input.preferencesUrl.includes("?") ? "&" : "?"}suggest=${value}`;

  const options: Array<{ value: BriefCadence; label: string; line: string }> = [
    { value: "both", label: "More", line: "Daily plus the Sunday synthesis." },
    { value: "daily", label: "Weekdays only", line: "About four minutes each morning." },
    { value: "weekly", label: "Less", line: "Sundays only, one argued read." },
  ];

  const bodyHtml = [
    `<h1>Is this the right amount?</h1>`,
    `<p class="lede">You're on ${escapeHtml(CADENCE_LABELS[input.cadence].toLowerCase())}. ${escapeHtml(scheduleSentence(input.cadence))}</p>`,
    `<p>Ten days in is when you know whether the rhythm fits. Changing it is a feature, not a failure, and it takes one click on the screen these open.</p>`,
    `<ul>`,
    ...options.map(
      (option) =>
        `<li>${emailLink(suggest(option.value), option.label)}: ${escapeHtml(option.line)}</li>`,
    ),
    `</ul>`,
    `<p>If it's already right, do nothing. And if you have thirty seconds, reply and tell me what you'd cut. I read every reply.</p>`,
  ].join("\n");

  const text = renderBriefEmailText({
    lines: [
      "Is this the right amount?",
      "",
      `You're on ${CADENCE_LABELS[input.cadence].toLowerCase()}. ${scheduleSentence(input.cadence)}`,
      "",
      "Ten days in is when you know whether the rhythm fits. Changing it is a feature, not a failure, and it takes one click on the screen these open.",
      "",
      ...options.flatMap((option) => [
        `* ${option.label}: ${option.line}`,
        `  ${suggest(option.value)}`,
      ]),
      "",
      "If it's already right, do nothing. And if you have thirty seconds, reply and tell me what you'd cut. I read every reply.",
    ],
    footer,
  });

  return {
    subject: "Ten days in: too much, too little, or right?",
    html: renderBriefEmailHtml({
      preheader: "One click changes the cadence. Doing nothing keeps it.",
      bodyHtml,
      footer,
    }),
    text,
  };
}

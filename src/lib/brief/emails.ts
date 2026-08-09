// src/lib/brief/emails.ts
//
// The two transactional emails Phase 2 sends: the double opt-in confirmation
// and the W1 welcome. Both are built here rather than in the routes so the copy
// sits in one file and the routes stay about validation and state.

import type { BriefCadence } from "./cadence";
import {
  emailButton,
  emailLink,
  escapeHtml,
  renderBriefEmailHtml,
  renderBriefEmailText,
  type BriefEmailFooter,
} from "./emailChrome";
import { archiveUrl, howItWorksUrl } from "./urls";

export const CADENCE_LABELS: Record<BriefCadence, string> = {
  daily: "Daily only",
  weekly: "Weekly only",
  both: "Both",
};

/** What arrives and when, in one sentence, per cadence. */
export function scheduleSentence(cadence: BriefCadence): string {
  if (cadence === "daily") {
    return "Weekdays at 8:45am IST, one lead story and six to nine items, about four minutes.";
  }
  if (cadence === "weekly") {
    return "Sundays at 9am IST, one argued synthesis of the week, about six minutes.";
  }
  return "Weekdays at 8:45am IST, about four minutes, and Sundays at 9am IST, about six minutes.";
}

export const DISCLOSURE_LINE =
  "Curated and summarized by an agent pipeline I built, reviewed before send.";

const DAILY_PARAGRAPH =
  "The daily leads with the one story that changed something, writes it up with the caveat attached rather than buried, and lines six to nine items up behind it. Then it stops. A quiet day ships short and says so in the subject line.";

const WEEKLY_PARAGRAPH =
  "The Sunday edition does what a daily structurally can't: one argued observation connecting the week, the items whose significance only showed up in hindsight, and the good things nobody clicked.";

/** Only describe what this subscriber actually gets, then name the other one. */
function whatArrives(cadence: BriefCadence): string[] {
  if (cadence === "daily") {
    return [
      DAILY_PARAGRAPH,
      "There's a Sunday edition too, one argued synthesis of the week rather than a recap. It's a separate choice, and the link below adds it.",
    ];
  }
  if (cadence === "weekly") {
    return [
      WEEKLY_PARAGRAPH,
      "There's a weekday daily too, about four minutes at 8:45am IST. It's a separate choice, and the link below adds it.",
    ];
  }
  return [DAILY_PARAGRAPH, WEEKLY_PARAGRAPH];
}

export type BuiltEmail = {
  subject: string;
  html: string;
  text: string;
};

export function buildConfirmationEmail(input: {
  base: string;
  cadence: BriefCadence;
  confirmUrl: string;
}): BuiltEmail {
  const footer: BriefEmailFooter = {
    archiveUrl: archiveUrl(input.base),
    howItWorksUrl: howItWorksUrl(input.base),
  };

  const bodyHtml = [
    `<h1>One click and you're in</h1>`,
    `<p class="lede">You asked for The Agentic Brief. ${escapeHtml(scheduleSentence(input.cadence))}</p>`,
    emailButton(input.confirmUrl, "Confirm your subscription"),
    `<p class="fallback">Or paste this into your browser:<br>${escapeHtml(input.confirmUrl)}</p>`,
    `<p>Nothing gets sent until you click. If you didn't ask for this, ignore this email and you'll never hear from me again.</p>`,
    `<p>While you're deciding, ${emailLink(footer.archiveUrl, "the archive")} is the whole product, ungated.</p>`,
  ].join("\n");

  const text = renderBriefEmailText({
    lines: [
      "One click and you're in.",
      "",
      `You asked for The Agentic Brief. ${scheduleSentence(input.cadence)}`,
      "",
      "Confirm your subscription:",
      input.confirmUrl,
      "",
      "Nothing gets sent until you click. If you didn't ask for this, ignore this email and you'll never hear from me again.",
    ],
    footer,
  });

  return {
    subject: "Confirm your subscription to The Agentic Brief",
    html: renderBriefEmailHtml({
      preheader: "Click once to confirm. Nothing sends until you do.",
      bodyHtml,
      footer,
    }),
    text,
  };
}

export function buildWelcomeEmail(input: {
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

  const arriving = whatArrives(input.cadence);

  const bodyHtml = [
    `<h1>You're in</h1>`,
    `<p class="lede">${escapeHtml(scheduleSentence(input.cadence))}</p>`,
    `<h2>What arrives</h2>`,
    ...arriving.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`),
    `<h2>How it's made</h2>`,
    `<p>${escapeHtml(DISCLOSURE_LINE)} ${emailLink(footer.howItWorksUrl ?? input.base, "How this is made")} lists every source, which model does which job, and what I check before a send.</p>`,
    `<h2>If the cadence is wrong</h2>`,
    `<p>${emailLink(input.preferencesUrl, "Change it here")}, any time. Daily, weekly, or both. Leaving takes ${emailLink(input.unsubscribeUrl, "one click")} and no questions.</p>`,
    `<h2>One ask</h2>`,
    `<p>Reply to this email and tell me what you work on. I read every reply, and it's the fastest way to shape what gets picked.</p>`,
  ].join("\n");

  const text = renderBriefEmailText({
    lines: [
      "You're in.",
      "",
      scheduleSentence(input.cadence),
      "",
      "WHAT ARRIVES",
      ...arriving.flatMap((paragraph) => [paragraph, ""]),
      "HOW IT'S MADE",
      `${DISCLOSURE_LINE} ${howItWorksUrl(input.base)}`,
      "",
      "IF THE CADENCE IS WRONG",
      `Change it here, any time: ${input.preferencesUrl}`,
      "",
      "ONE ASK",
      "Reply to this email and tell me what you work on. I read every reply, and it's the fastest way to shape what gets picked.",
    ],
    footer,
  });

  return {
    subject: "You're in. Here's what arrives, and when.",
    html: renderBriefEmailHtml({
      preheader: "What arrives, exactly when, and how to change it.",
      bodyHtml,
      footer,
    }),
    text,
  };
}

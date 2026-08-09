// src/lib/brief/approvalEmail.ts
//
// The one email that goes to Yadnesh rather than to a reader: the approval
// notice the pipeline triggers after an issue PR merges.
//
// It is the editorial-responsibility step the EU AI Act Article 50 carve-out
// rests on (plan 01 §5), so it has to be readable on a phone in under a minute
// and answerable with one tap. Everything in it is either the decision, the
// deadline, or the evidence needed to make the decision.

import {
  emailLink,
  escapeHtml,
  renderBriefEmailHtml,
  renderBriefEmailText,
  type BriefEmailFooter,
} from "./emailChrome";
import type { BuiltEmail } from "./emails";
import { issueDateLabel } from "./dates";
import { sectionLabel, type BriefIssue } from "./schema";
import { archiveUrl } from "./urls";

/** Where the issue JSON lives, for the "edit on GitHub" link. */
export function issueSourceUrl(type: "daily" | "weekly", id: string): string {
  return `https://github.com/yadneshSalvi/yadnesh-personal-blog/blob/main/content/brief/${type}/${id}.json`;
}

export function approvalSubject(issue: BriefIssue): string {
  return `[brief] approve: ${issue.subject}`;
}

/** A deadline a human can act on, in the timezone the human lives in. */
function deadlineLabel(approveBy: string): string {
  const date = new Date(approveBy);
  if (Number.isNaN(date.getTime())) return approveBy;
  return `${date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    day: "numeric",
    month: "short",
  })} IST`;
}

/** The issue at a glance: what leads, what follows it, how long it runs. */
function contentsLines(issue: BriefIssue): string[] {
  const lines: string[] = [];
  if (issue.type === "daily") {
    if (issue.lead) {
      lines.push(`Lead: ${issue.lead.story.title} (${issue.lead.story.source_name})`);
      lines.push(`Yes, but: ${issue.lead.yes_but ?? issue.lead.yes_but_waived ?? "MISSING"}`);
    } else {
      lines.push(`Thin day, no lead. Subject says so: ${issue.subject}`);
    }
    for (const section of issue.sections) {
      lines.push(`${sectionLabel(section.key)}: ${section.items.length} items`);
    }
  } else {
    lines.push(`Through line: ${issue.weekly.through_line.title}`);
    lines.push(`What mattered: ${issue.weekly.what_mattered.length} picks`);
    lines.push(`Quietly important: ${issue.weekly.quietly_important.length}`);
    lines.push(`Thread to watch: ${issue.weekly.thread_to_watch.title}`);
    lines.push(`Deep cuts: ${issue.weekly.deep_cuts.length}`);
  }
  if (issue.from_x.length > 0) lines.push(`From X: ${issue.from_x.length}`);
  if (issue.quick_links.length > 0) lines.push(`Quick links: ${issue.quick_links.length}`);
  if (issue.editor_notes.length > 0) {
    lines.push(`Editor notes awaiting your approval: ${issue.editor_notes.length}`);
  }
  lines.push(
    issue.corrections.length > 0
      ? `Corrections: ${issue.corrections.length}`
      : "Corrections: none",
  );
  return lines;
}

export function buildApprovalEmail(input: {
  base: string;
  issue: BriefIssue;
  approveUrl: string;
  holdUrl: string;
  githubUrl: string;
  webUrl: string;
  /** ISO timestamp the issue sends itself at if nobody touches it. */
  approveBy: string;
  /** Null when the subscriber store could not be read. */
  recipients: number | null;
  sizeBytes: number;
  dropped: string[];
  /** Set when this is a repeat notification for an issue that already went out. */
  alreadySentAt?: string;
}): BuiltEmail {
  const { issue } = input;
  const footer: BriefEmailFooter = { archiveUrl: archiveUrl(input.base) };
  const deadline = deadlineLabel(input.approveBy);
  const audience =
    input.recipients === null
      ? "the matching segment"
      : `${input.recipients} confirmed ${input.recipients === 1 ? "subscriber" : "subscribers"}`;

  const status = input.alreadySentAt
    ? `This issue already went out at ${deadlineLabel(input.alreadySentAt)}. Nothing below will send it again.`
    : `Nobody has to do anything. Left alone, it sends itself to ${audience} at ${deadline}.`;

  const contents = contentsLines(issue);
  const notes = issue.editor_notes.map((note) => note.text);

  const bodyHtml = [
    `<h1>${escapeHtml(issue.subject)}</h1>`,
    `<p class="lede">${escapeHtml(`${issue.type === "daily" ? "Daily" : "Weekly"} ${issue.id} · ${issueDateLabel(issue.type, issue.id)} · ${issue.read_minutes} min read`)}</p>`,
    `<p>${escapeHtml(status)}</p>`,
    `<p><strong>Preheader:</strong> ${escapeHtml(issue.preheader)}</p>`,
    `<h2>What's in it</h2>`,
    `<ul>${contents.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`,
    notes.length > 0
      ? `<h2>The notes that only survive approval</h2>${notes
          .map(
            (note) =>
              `<blockquote style="margin:0 0 14px;padding:2px 0 2px 14px;border-left:2px solid #b3441a;"><p style="margin:0;color:#5b554c;font-style:italic;">Y: ${escapeHtml(note)}</p></blockquote>`,
          )
          .join("")}`
      : "",
    `<h2>Decide</h2>`,
    `<p>${emailLink(input.approveUrl, "Approve and send now")}<br>` +
      `${emailLink(input.holdUrl, "Hold it")} (web stays up, no email goes out)<br>` +
      `${emailLink(input.githubUrl, "Edit on GitHub")}<br>` +
      `${emailLink(input.webUrl, "Read it on the web first")}</p>`,
    `<p class="lede">Email size ${(input.sizeBytes / 1024).toFixed(1)}KB of the 80KB budget.${
      input.dropped.length > 0
        ? ` Trimmed to fit: ${escapeHtml(input.dropped.join(", "))}.`
        : ""
    }</p>`,
  ]
    .filter(Boolean)
    .join("\n");

  const text = renderBriefEmailText({
    lines: [
      issue.subject,
      `${issue.type === "daily" ? "Daily" : "Weekly"} ${issue.id} · ${issueDateLabel(issue.type, issue.id)} · ${issue.read_minutes} min read`,
      "",
      status,
      "",
      `Preheader: ${issue.preheader}`,
      "",
      "WHAT'S IN IT",
      ...contents.map((line) => `* ${line}`),
      "",
      ...(notes.length > 0
        ? ["THE NOTES THAT ONLY SURVIVE APPROVAL", ...notes.map((note) => `Y: ${note}`), ""]
        : []),
      "DECIDE",
      `Approve and send now: ${input.approveUrl}`,
      `Hold it: ${input.holdUrl}`,
      `Edit on GitHub: ${input.githubUrl}`,
      `Read it on the web first: ${input.webUrl}`,
      "",
      `Email size ${(input.sizeBytes / 1024).toFixed(1)}KB of the 80KB budget.${
        input.dropped.length > 0 ? ` Trimmed to fit: ${input.dropped.join(", ")}.` : ""
      }`,
    ],
    footer,
  });

  return {
    subject: approvalSubject(issue),
    html: renderBriefEmailHtml({
      preheader: input.alreadySentAt
        ? "Already sent. This is a repeat notification."
        : `Sends itself at ${deadline} unless you act.`,
      bodyHtml,
      footer,
    }),
    text,
  };
}

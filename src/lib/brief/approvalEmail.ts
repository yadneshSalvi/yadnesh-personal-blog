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

export function needsReviewSubject(type: "daily" | "weekly", id: string): string {
  return `[brief] NEEDS REVIEW: ${type} ${id}`;
}

/** How many held-for-review reasons reach the email, and how long each may be. */
export const MAX_REVIEW_REASONS = 25;
export const MAX_REVIEW_REASON_CHARS = 500;

/**
 * The PR link, or null.
 *
 * It arrives over the wire from the pipeline and goes into an email as an href, so
 * it is parsed rather than trusted: https only, and only on GitHub, which is the one
 * place a PR for this repo can be.
 */
export function reviewPrLink(value: unknown): string | null {
  if (typeof value !== "string" || value.trim() === "") return null;
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase();
    if (url.protocol !== "https:") return null;
    if (host !== "github.com" && !host.endsWith(".github.com")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

/** The pipeline's reasons, bounded. Anything that is not a non-empty string is not one. */
export function reviewReasons(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim().slice(0, MAX_REVIEW_REASON_CHARS))
    .filter((entry) => entry !== "")
    .slice(0, MAX_REVIEW_REASONS);
}

/**
 * The other end of the pipeline: an issue the fact-gate or the validator refused to
 * clear, sitting in an unmerged PR.
 *
 * It takes no BriefIssue, on purpose. A held issue's PR is not merged, so its JSON is
 * not in the deployment this route runs in and there is nothing to read. Everything
 * here comes off the wire from the pipeline.
 *
 * The 2026-W33 weekly is why it exists. It was held, the PR opened, and nobody was
 * told; the owner found out by asking why no mail had come. Silence is the one thing
 * a review gate cannot afford, because a gate nobody hears from is indistinguishable
 * from a pipeline that did not run.
 */
export function buildNeedsReviewEmail(input: {
  base: string;
  type: "daily" | "weekly";
  id: string;
  /** Raw from the pipeline. Sanitized here, so the route can pass the body through. */
  prUrl: unknown;
  reasons: unknown;
}): BuiltEmail {
  const footer: BriefEmailFooter = { archiveUrl: archiveUrl(input.base) };
  const label = `${input.type === "daily" ? "Daily" : "Weekly"} ${input.id}`;
  const standstill =
    "Nothing publishes and nothing sends until that PR is merged or closed. There is " +
    "no timer on this one: left alone it stays exactly where it is.";
  const prUrl = reviewPrLink(input.prUrl);
  const parsed = reviewReasons(input.reasons);
  const reasons = parsed.length > 0 ? parsed : ["No reason was recorded."];

  const bodyHtml = [
    `<h1>${escapeHtml(`${label} is held for review`)}</h1>`,
    `<p class="lede">${escapeHtml(
      `${issueDateLabel(input.type, input.id)} · the fact-gate or the validator did not clear it`,
    )}</p>`,
    `<p>${escapeHtml(standstill)}</p>`,
    `<h2>Why it was held</h2>`,
    `<ul>${reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}</ul>`,
    `<h2>Decide</h2>`,
    `<p>${
      prUrl
        ? `${emailLink(prUrl, "Open the PR")}<br>`
        : `The pipeline did not report a PR link. Look for the <code>needs-review</code> label.<br>`
    }${emailLink(prUrl ?? issueSourceUrl(input.type, input.id), "Read the issue JSON")}</p>`,
    `<p class="lede">${escapeHtml(
      "Fix it in the PR and merge to publish it, or close the PR to drop the issue. " +
        "The approval mail with the send decision only arrives once the PR has merged.",
    )}</p>`,
  ].join("\n");

  return {
    subject: needsReviewSubject(input.type, input.id),
    html: renderBriefEmailHtml({
      preheader: `Held for review. ${reasons[0]}`,
      bodyHtml,
      footer,
    }),
    text: renderBriefEmailText({
      lines: [
        `${label} is held for review`,
        `${issueDateLabel(input.type, input.id)} · the fact-gate or the validator did not clear it`,
        "",
        standstill,
        "",
        "WHY IT WAS HELD",
        ...reasons.map((reason) => `* ${reason}`),
        "",
        "DECIDE",
        prUrl
          ? `Open the PR: ${prUrl}`
          : "The pipeline did not report a PR link. Look for the needs-review label.",
        `Read the issue JSON: ${prUrl ?? issueSourceUrl(input.type, input.id)}`,
        "",
        "Fix it in the PR and merge to publish it, or close the PR to drop the issue. " +
          "The approval mail with the send decision only arrives once the PR has merged.",
      ],
      footer,
    }),
  };
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

/**
 * The jokes, shown rather than described.
 *
 * This is the only email that carries images, and deliberately so: it goes to
 * one person, it is the single human review point before an issue sends itself,
 * and a meme is the one part of an issue that cannot be reviewed as text. A
 * caption reading "the benchmark number, drawn at the size of its error bars"
 * tells you nothing about whether the drawing is funny, on-message, or has six
 * fingers. Reader-facing issue emails stay image-free, and a test enforces it.
 */
function humorHtml(issue: BriefIssue, base: string): string {
  const blocks: string[] = [];

  const drawn = (label: string, image: string, alt: string, caption: string, altJoke: string | null) =>
    [
      `<h2>${escapeHtml(label)}</h2>`,
      `<p><img src="${escapeHtml(`${base}${image}`)}" alt="${escapeHtml(alt)}" width="440" ` +
        `style="max-width:100%;height:auto;border:1px solid #e7e3d9;border-radius:2px;"></p>`,
      `<p><strong>Caption:</strong> ${escapeHtml(caption)}</p>`,
      `<p class="lede" style="font-size:13px;"><strong>Alt:</strong> ${escapeHtml(alt)}</p>`,
      altJoke
        ? `<p class="lede" style="font-size:13px;"><strong>Bonus line:</strong> ${escapeHtml(altJoke)}</p>`
        : "",
    ]
      .filter(Boolean)
      .join("");

  if (issue.type === "weekly" && issue.weekly.comic) {
    const comic = issue.weekly.comic;
    blocks.push(drawn("The comic", comic.image, comic.alt, comic.caption, comic.alt_joke));
  }

  if (issue.meme) {
    const meme = issue.meme;
    blocks.push(
      drawn(
        issue.type === "weekly" ? "Meme of the week" : "Meme of the day",
        meme.image,
        meme.alt,
        meme.caption,
        meme.alt_joke,
      ) + `<p class="lede" style="font-size:13px;"><strong>Premise:</strong> ${escapeHtml(meme.concept)}</p>`,
    );
  }

  if (issue.type === "daily" && issue.hedge) {
    const hedge = issue.hedge;
    blocks.push(
      [
        `<h2>Hedge of the day</h2>`,
        `<blockquote style="margin:0 0 12px;padding:2px 0 2px 14px;border-left:2px solid #e7e3d9;">` +
          `<p style="margin:0;font-style:italic;">${escapeHtml(`"${hedge.quote}"`)}</p></blockquote>`,
        `<p class="lede" style="font-size:13px;">${emailLink(hedge.story.url, `${hedge.story.title} (${hedge.story.source_name})`)}</p>`,
        `<p>${escapeHtml(hedge.note)}</p>`,
      ].join(""),
    );
  }

  return blocks.join("\n");
}

/** The same content for the text part, where an image can only be a link. */
function humorTextLines(issue: BriefIssue, base: string): string[] {
  const lines: string[] = [];

  const drawn = (label: string, image: string, alt: string, caption: string, altJoke: string | null) => {
    lines.push(label.toUpperCase(), "", `Image: ${base}${image}`, `Caption: ${caption}`, `Alt: ${alt}`);
    if (altJoke) lines.push(`Bonus line: ${altJoke}`);
    lines.push("");
  };

  if (issue.type === "weekly" && issue.weekly.comic) {
    const comic = issue.weekly.comic;
    drawn("The comic", comic.image, comic.alt, comic.caption, comic.alt_joke);
  }
  if (issue.meme) {
    const meme = issue.meme;
    drawn(
      issue.type === "weekly" ? "Meme of the week" : "Meme of the day",
      meme.image,
      meme.alt,
      meme.caption,
      meme.alt_joke,
    );
    lines.push(`Premise: ${meme.concept}`, "");
  }
  if (issue.type === "daily" && issue.hedge) {
    const hedge = issue.hedge;
    lines.push(
      "HEDGE OF THE DAY",
      "",
      `"${hedge.quote}"`,
      `${hedge.story.title} (${hedge.story.source_name})`,
      `  ${hedge.story.url}`,
      hedge.note,
      "",
    );
  }

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
    humorHtml(issue, input.base),
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
      ...humorTextLines(issue, input.base),
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

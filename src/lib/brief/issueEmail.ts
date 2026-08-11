// src/lib/brief/issueEmail.ts
//
// Issue JSON to a sendable email: subject, preheader, HTML, and a real
// plain-text part. Same content as the web issue page, different chrome.
//
// Two things shape the design.
//
// First, per-recipient links. The unsubscribe, preferences, and feedback URLs
// each carry a token signed for one reader, so they cannot be baked in at
// render time without re-rendering the whole issue for every subscriber. The
// renderer emits a TEMPLATE with four placeholders instead, and the send loop
// calls personalizeIssueEmail() per recipient, which is four string replaces
// over a string that is already built.
//
// Second, the byte budget. Gmail clips at 102KB of raw source and a clipped
// email loses its footer, its unsubscribe link, and the reader's trust. We ship
// under 80KB: one <style> block in the chrome instead of per-item inline
// styles, and a trim ladder that drops the least load-bearing content first
// until the whole thing fits. The lead, the corrections block, and the footer
// are never trimmed.
//
// Imports stay relative and free of the "@/" alias so node can load this file
// directly through its built-in type stripping, the way
// scripts/test-brief-email.mjs does.

import {
  emailLink,
  escapeHtml,
  renderBriefEmailHtml,
  renderBriefEmailText,
  type BriefEmailFooter,
} from "./emailChrome";
import { issueDateLabel } from "./dates";
import { COMIC_LABEL, HEDGE_LABEL, memeLabel } from "./humor";
import {
  BRIEF_SECTION_KEYS,
  sectionLabel,
  type BriefEditorNote,
  type BriefHedge,
  type BriefIssue,
  type BriefStory,
} from "./schema";

/* ── Per-recipient placeholders ─────────────────────────────────────────── */

/**
 * Deliberately ugly and unlikely to occur in prose. Each one appears exactly
 * once in the HTML part and exactly once in the text part; the CI test asserts
 * that, because a placeholder that survives into a real send is a dead link in
 * somebody's inbox.
 */
export const ISSUE_EMAIL_PLACEHOLDERS = {
  unsubscribe: "%%UNSUB_URL%%",
  preferences: "%%PREFS_URL%%",
  feedbackUp: "%%FEEDBACK_UP%%",
  feedbackDown: "%%FEEDBACK_DOWN%%",
} as const;

export type IssueEmailRecipientUrls = {
  unsubscribeUrl: string;
  preferencesUrl: string;
  feedbackUpUrl: string;
  feedbackDownUrl: string;
};

/** Links that are the same for every recipient, built by the caller from urls.ts. */
export type IssueEmailLinks = {
  /** "View in browser": the canonical web issue URL, never an ESP-hosted copy. */
  webUrl: string;
  archiveUrl: string;
  howItWorksUrl: string;
};

/* ── Byte budget ────────────────────────────────────────────────────────── */

export const EMAIL_BYTE_LIMIT = 80 * 1024;

/**
 * A placeholder is 14 bytes; the signed URL that replaces it is closer to 200,
 * and HTML-escaping its query string adds a few more. Measuring the template as
 * written would understate the shipped size, so the check swaps in a probe
 * string long enough to cover a signed token plus an ESP rewrap.
 */
const SIZE_PROBE = "u".repeat(320);

function expandPlaceholders(text: string, value: string): string {
  let out = text;
  for (const placeholder of Object.values(ISSUE_EMAIL_PLACEHOLDERS)) {
    out = out.split(placeholder).join(value);
  }
  return out;
}

export type EmailSizeCheck = { bytes: number; limit: number; ok: boolean };

/** Shipped size of a rendered template, with placeholders costed at full width. */
export function checkEmailSize(html: string, limit = EMAIL_BYTE_LIMIT): EmailSizeCheck {
  const bytes = Buffer.byteLength(expandPlaceholders(html, SIZE_PROBE), "utf8");
  return { bytes, limit, ok: bytes <= limit };
}

/* ── The trim ladder ────────────────────────────────────────────────────── */

/**
 * What survives a render. `null` means "everything"; a number caps a list from
 * the front, so the items an editor put first are the ones that stay.
 */
type TrimPlan = {
  quickLinks: boolean;
  fromX: boolean;
  sectionItems: number | null;
  deepCuts: number | null;
  quietlyImportant: number | null;
  whatMattered: number | null;
};

const FULL_PLAN: TrimPlan = {
  quickLinks: true,
  fromX: true,
  sectionItems: null,
  deepCuts: null,
  quietlyImportant: null,
  whatMattered: null,
};

function totalSectionItems(issue: BriefIssue): number {
  return issue.type === "daily"
    ? issue.sections.reduce((sum, section) => sum + section.items.length, 0)
    : 0;
}

/**
 * The order things go over the side, least load-bearing first: quick links,
 * then From X, then the tail of the long lists, then the tail of the analysed
 * picks. A weekly always keeps at least one "what mattered" pick, a daily
 * always keeps its lead, and neither ever loses corrections or the footer.
 */
function trimLadder(issue: BriefIssue): TrimPlan[] {
  const plans: TrimPlan[] = [{ ...FULL_PLAN }];
  const push = (patch: Partial<TrimPlan>) => {
    plans.push({ ...plans[plans.length - 1], ...patch });
  };

  if (issue.quick_links.length > 0) push({ quickLinks: false });
  if (issue.from_x.length > 0) push({ fromX: false });

  if (issue.type === "daily") {
    for (let keep = totalSectionItems(issue) - 1; keep >= 1; keep -= 1) {
      push({ sectionItems: keep });
    }
  } else {
    for (let keep = issue.weekly.deep_cuts.length - 1; keep >= 0; keep -= 1) {
      push({ deepCuts: keep });
    }
    for (let keep = issue.weekly.quietly_important.length - 1; keep >= 0; keep -= 1) {
      push({ quietlyImportant: keep });
    }
    for (let keep = issue.weekly.what_mattered.length - 1; keep >= 1; keep -= 1) {
      push({ whatMattered: keep });
    }
  }

  return plans;
}

/** Human-readable account of what a plan removed, for the send log. */
function describeTrim(issue: BriefIssue, plan: TrimPlan): string[] {
  const dropped: string[] = [];
  if (!plan.quickLinks && issue.quick_links.length > 0) {
    dropped.push(`${issue.quick_links.length} quick links`);
  }
  if (!plan.fromX && issue.from_x.length > 0) {
    dropped.push(`${issue.from_x.length} From X items`);
  }
  if (issue.type === "daily") {
    const total = totalSectionItems(issue);
    if (plan.sectionItems !== null && plan.sectionItems < total) {
      dropped.push(`${total - plan.sectionItems} section items`);
    }
  } else {
    const weekly = issue.weekly;
    if (plan.deepCuts !== null && plan.deepCuts < weekly.deep_cuts.length) {
      dropped.push(`${weekly.deep_cuts.length - plan.deepCuts} deep cuts`);
    }
    if (
      plan.quietlyImportant !== null &&
      plan.quietlyImportant < weekly.quietly_important.length
    ) {
      dropped.push(
        `${weekly.quietly_important.length - plan.quietlyImportant} quietly important items`,
      );
    }
    if (plan.whatMattered !== null && plan.whatMattered < weekly.what_mattered.length) {
      dropped.push(
        `${weekly.what_mattered.length - plan.whatMattered} what-mattered picks`,
      );
    }
  }
  return dropped;
}

function cap<T>(items: T[], limit: number | null): T[] {
  return limit === null ? items : items.slice(0, Math.max(0, limit));
}

/* ── Story fragments ────────────────────────────────────────────────────── */

const DISCLOSURE =
  "Curated and summarized by an agent pipeline built by Yadnesh; reviewed before send.";

/** The parenthetical after a headline: read annotation, paywall, credit, points. */
function annotationText(story: BriefStory): string {
  const bits: string[] = [];
  if (story.read_annotation) bits.push(story.read_annotation);
  if (story.paywalled) bits.push("paywalled");
  if (story.via) bits.push(`via ${story.via}`);
  if (story.hn_points !== null) bits.push(`${story.hn_points} points on HN`);
  return bits.join(", ");
}

/** The citation convention: `Exact Title (Organization)`, never "read more". */
function headlineLink(story: BriefStory): string {
  return emailLink(story.url, `${story.title} (${story.source_name})`);
}

function headlineText(story: BriefStory): string {
  return `${story.title} (${story.source_name})`;
}

function storyHtml(story: BriefStory): string {
  const annotation = annotationText(story);
  const suffix = annotation ? ` <em class="lede">(${escapeHtml(annotation)})</em>` : "";
  return `<p>${headlineLink(story)}${suffix}<br>${escapeHtml(story.summary)}</p>`;
}

function storyTextLines(story: BriefStory): string[] {
  const annotation = annotationText(story);
  return [
    `* ${headlineText(story)}${annotation ? ` (${annotation})` : ""}`,
    `  ${story.url}`,
    `  ${story.summary}`,
    "",
  ];
}

function oneLinerHtml(story: BriefStory): string {
  return `<li>${headlineLink(story)}</li>`;
}

function oneLinerTextLines(story: BriefStory): string[] {
  return [`* ${headlineText(story)}`, `  ${story.url}`];
}

/**
 * The `Y:` blocks: the only place opinion lives. Italic with a left rule, per
 * the editorial spec. The inline style is deliberate here; there are at most
 * two of these in an issue, so it costs nothing, and the chrome's style block
 * belongs to Phase 2.
 */
function editorNoteHtml(text: string): string {
  return (
    `<blockquote style="margin:0 0 14px;padding:2px 0 2px 14px;border-left:2px solid #b3441a;">` +
    `<p style="margin:0;color:#5b554c;font-style:italic;">Y: ${escapeHtml(text)}</p>` +
    `</blockquote>`
  );
}

/* ── The humor blocks ───────────────────────────────────────────────────── */

/**
 * A drawn thing gets a line, not a picture. Images in email are a fight with
 * every client's blocking rules, they cost the byte budget the trim ladder
 * exists to protect, and a meme that renders as a grey box with a red cross is
 * worse than a sentence saying where the joke is. So the email points at the
 * web edition's anchor and stays text, which is also what the plain-text part
 * has always been able to promise.
 */
function drawnPointerHtml(label: string, caption: string, href: string): string {
  return (
    `<p><strong>${escapeHtml(label)}:</strong> ${escapeHtml(caption)} ` +
    `${emailLink(href, "see it on the web edition")}</p>`
  );
}

function drawnPointerTextLines(label: string, caption: string, href: string): string[] {
  return [`${label}: ${caption}`, `See it on the web edition: ${href}`, ""];
}

/**
 * The hedge is text, so unlike the meme it ships whole: the quote as somebody
 * else said it, the citation, and the one dry line that is the actual joke.
 */
function hedgeParts(hedge: BriefHedge, parts: Parts): void {
  parts.html.push(`<h2>${escapeHtml(HEDGE_LABEL)}</h2>`);
  parts.html.push(
    `<blockquote style="margin:0 0 12px;padding:2px 0 2px 14px;border-left:2px solid #e7e3d9;">` +
      `<p style="margin:0;font-style:italic;">${escapeHtml(`"${hedge.quote}"`)}</p>` +
      `</blockquote>`,
  );
  parts.html.push(`<p class="lede" style="font-size:14px;">${headlineLink(hedge.story)}</p>`);
  parts.html.push(`<p>${escapeHtml(hedge.note)}</p>`);

  parts.text.push(
    HEDGE_LABEL.toUpperCase(),
    "",
    `"${hedge.quote}"`,
    "",
    `${headlineText(hedge.story)}`,
    `  ${hedge.story.url}`,
    "",
    hedge.note,
    "",
  );
}

function splitEditorNotes(notes: BriefEditorNote[]): {
  byStory: Map<string, string[]>;
  loose: string[];
} {
  const byStory = new Map<string, string[]>();
  const loose: string[] = [];
  for (const note of notes) {
    if (note.after_story) {
      const existing = byStory.get(note.after_story) ?? [];
      existing.push(note.text);
      byStory.set(note.after_story, existing);
    } else {
      loose.push(note.text);
    }
  }
  return { byStory, loose };
}

/* ── Body assembly ──────────────────────────────────────────────────────── */

type Parts = { html: string[]; text: string[] };

function metaLine(issue: BriefIssue): string {
  const bits = [issueDateLabel(issue.type, issue.id), `${issue.read_minutes} min read`];
  if (issue.type === "weekly" && issue.issue_number) {
    bits.unshift(`Weekly #${issue.issue_number}`);
  }
  return bits.join(" · ");
}

function header(issue: BriefIssue, links: IssueEmailLinks, parts: Parts): void {
  parts.html.push(
    `<p class="lede" style="font-size:13px;margin:0 0 6px;">${escapeHtml(DISCLOSURE)} ${emailLink(links.howItWorksUrl, "How this is made")}</p>`,
  );
  parts.html.push(
    `<p class="lede" style="font-size:13px;margin:0 0 18px;">${escapeHtml(metaLine(issue))}</p>`,
  );
  parts.text.push(DISCLOSURE, `How this is made: ${links.howItWorksUrl}`, metaLine(issue), "");
}

function dailyBody(
  issue: Extract<BriefIssue, { type: "daily" }>,
  plan: TrimPlan,
  parts: Parts,
): void {
  const { byStory } = splitEditorNotes(issue.editor_notes);
  const notesFor = (storyId: string) => byStory.get(storyId) ?? [];

  if (issue.lead) {
    const lead = issue.lead;
    const annotation = annotationText(lead.story);
    parts.html.push(`<h1>${headlineLink(lead.story)}</h1>`);
    if (annotation) {
      parts.html.push(`<p class="lede" style="margin:-8px 0 14px;">${escapeHtml(annotation)}</p>`);
    }
    parts.html.push(`<p><strong>What happened:</strong> ${escapeHtml(lead.what)}</p>`);
    parts.html.push(`<p><strong>The details:</strong> ${escapeHtml(lead.details)}</p>`);
    const caveat = lead.yes_but ?? lead.yes_but_waived;
    if (caveat) {
      parts.html.push(`<p><strong>Yes, but:</strong> ${escapeHtml(caveat)}</p>`);
    }
    parts.html.push(`<p><strong>Why it matters:</strong> ${escapeHtml(lead.why)}</p>`);
    for (const note of notesFor(lead.story.story_id)) parts.html.push(editorNoteHtml(note));

    parts.text.push(
      headlineText(lead.story),
      lead.story.url,
      "",
      `What happened: ${lead.what}`,
      `The details: ${lead.details}`,
      ...(caveat ? [`Yes, but: ${caveat}`] : []),
      `Why it matters: ${lead.why}`,
      ...notesFor(lead.story.story_id).map((note) => `Y: ${note}`),
      "",
    );
  } else {
    parts.html.push(`<h1>${escapeHtml(issue.title)}</h1>`);
    parts.text.push(issue.title.toUpperCase(), "");
  }

  // Section order is fixed by the schema, not by the order the pipeline wrote
  // them, and the item budget is spent across sections in that same order.
  let remaining = plan.sectionItems;
  for (const key of BRIEF_SECTION_KEYS) {
    const section = issue.sections.find((candidate) => candidate.key === key);
    if (!section) continue;
    const items = remaining === null ? section.items : section.items.slice(0, remaining);
    if (items.length === 0) continue;
    if (remaining !== null) remaining -= items.length;

    parts.html.push(`<h2>${escapeHtml(sectionLabel(key))}</h2>`);
    parts.text.push(sectionLabel(key).toUpperCase(), "");
    for (const story of items) {
      parts.html.push(storyHtml(story));
      for (const note of notesFor(story.story_id)) parts.html.push(editorNoteHtml(note));
      parts.text.push(...storyTextLines(story));
      for (const note of notesFor(story.story_id)) parts.text.push(`  Y: ${note}`, "");
    }
  }

  // Same seat as the web edition: after the last section, before the quick links.
  if (issue.hedge) hedgeParts(issue.hedge, parts);
}

function weeklyBody(
  issue: Extract<BriefIssue, { type: "weekly" }>,
  links: IssueEmailLinks,
  plan: TrimPlan,
  parts: Parts,
): void {
  const weekly = issue.weekly;
  const { byStory } = splitEditorNotes(issue.editor_notes);
  const notesFor = (storyId: string) => byStory.get(storyId) ?? [];

  parts.html.push(`<h1>${escapeHtml(issue.title)}</h1>`);
  parts.text.push(issue.title.toUpperCase(), "");

  parts.html.push(`<h2>The week in five lines</h2>`);
  parts.html.push(
    `<ul>${weekly.week_in_five.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`,
  );
  parts.text.push("THE WEEK IN FIVE LINES", "");
  for (const line of weekly.week_in_five) parts.text.push(`* ${line}`);
  parts.text.push("");

  parts.html.push(`<h2>${escapeHtml(weekly.through_line.title)}</h2>`);
  const paragraphs = weekly.through_line.body_md
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  for (const paragraph of paragraphs) parts.html.push(`<p>${escapeHtml(paragraph)}</p>`);
  parts.text.push(weekly.through_line.title.toUpperCase(), "");
  for (const paragraph of paragraphs) parts.text.push(paragraph, "");

  if (weekly.comic) {
    const href = `${links.webUrl}#comic`;
    parts.html.push(drawnPointerHtml(COMIC_LABEL, weekly.comic.caption, href));
    parts.text.push(...drawnPointerTextLines(COMIC_LABEL, weekly.comic.caption, href));
  }

  const picks = cap(weekly.what_mattered, plan.whatMattered);
  if (picks.length > 0) {
    parts.html.push(`<h2>What mattered</h2>`);
    parts.text.push("WHAT MATTERED", "");
    for (const pick of picks) {
      const annotation = annotationText(pick.story);
      const suffix = annotation ? ` <em class="lede">(${escapeHtml(annotation)})</em>` : "";
      parts.html.push(`<p>${headlineLink(pick.story)}${suffix}</p>`);
      parts.html.push(`<p>${escapeHtml(pick.what)}</p>`);
      parts.html.push(`<p><strong>Yes, but:</strong> ${escapeHtml(pick.yes_but)}</p>`);
      parts.html.push(`<p><strong>Why it matters:</strong> ${escapeHtml(pick.why)}</p>`);
      for (const note of notesFor(pick.story.story_id)) parts.html.push(editorNoteHtml(note));

      parts.text.push(
        `* ${headlineText(pick.story)}`,
        `  ${pick.story.url}`,
        `  ${pick.what}`,
        `  Yes, but: ${pick.yes_but}`,
        `  Why it matters: ${pick.why}`,
        ...notesFor(pick.story.story_id).map((note) => `  Y: ${note}`),
        "",
      );
    }
  }

  const quiet = cap(weekly.quietly_important, plan.quietlyImportant);
  if (quiet.length > 0) {
    parts.html.push(`<h2>Quietly important</h2>`);
    parts.text.push("QUIETLY IMPORTANT", "");
    for (const pick of quiet) {
      parts.html.push(`<p>${headlineLink(pick.story)}<br>${escapeHtml(pick.note)}</p>`);
      parts.text.push(
        `* ${headlineText(pick.story)}`,
        `  ${pick.story.url}`,
        `  ${pick.note}`,
        "",
      );
    }
  }

  parts.html.push(`<h2>${escapeHtml(weekly.thread_to_watch.title)}</h2>`);
  parts.html.push(`<p>${escapeHtml(weekly.thread_to_watch.body)}</p>`);
  if (weekly.thread_to_watch.story) {
    parts.html.push(`<p>${headlineLink(weekly.thread_to_watch.story)}</p>`);
  }
  parts.text.push(weekly.thread_to_watch.title.toUpperCase(), "", weekly.thread_to_watch.body, "");
  if (weekly.thread_to_watch.story) {
    parts.text.push(
      `* ${headlineText(weekly.thread_to_watch.story)}`,
      `  ${weekly.thread_to_watch.story.url}`,
      "",
    );
  }
  for (const thread of weekly.thread_to_watch.prior_threads_paid_off) {
    parts.html.push(
      `<p><strong>${escapeHtml(thread.title)}</strong> ${escapeHtml(thread.body)}</p>`,
    );
    parts.text.push(`${thread.title} ${thread.body}`, "");
  }

  const deepCuts = cap(weekly.deep_cuts, plan.deepCuts);
  if (deepCuts.length > 0) {
    parts.html.push(`<h2>Deep cuts</h2>`);
    parts.html.push(`<ul>${deepCuts.map(oneLinerHtml).join("")}</ul>`);
    parts.text.push("DEEP CUTS", "");
    for (const story of deepCuts) parts.text.push(...oneLinerTextLines(story));
    parts.text.push("");
  }
}

function tail(
  issue: BriefIssue,
  links: IssueEmailLinks,
  plan: TrimPlan,
  parts: Parts,
): void {
  const { loose } = splitEditorNotes(issue.editor_notes);

  if (plan.fromX && issue.from_x.length > 0) {
    parts.html.push(`<h2>From X</h2>`);
    parts.text.push("FROM X", "");
    for (const story of issue.from_x) {
      parts.html.push(storyHtml(story));
      parts.text.push(...storyTextLines(story));
    }
  }

  if (plan.quickLinks && issue.quick_links.length > 0) {
    parts.html.push(`<h2>Quick links</h2>`);
    parts.html.push(`<ul>${issue.quick_links.map(oneLinerHtml).join("")}</ul>`);
    parts.text.push("QUICK LINKS", "");
    for (const story of issue.quick_links) parts.text.push(...oneLinerTextLines(story));
    parts.text.push("");
  }

  for (const note of loose) {
    parts.html.push(editorNoteHtml(note));
    parts.text.push(`Y: ${note}`, "");
  }

  if (issue.meme) {
    const label = memeLabel(issue.type);
    const href = `${links.webUrl}#meme`;
    parts.html.push(drawnPointerHtml(label, issue.meme.caption, href));
    parts.text.push(...drawnPointerTextLines(label, issue.meme.caption, href));
  }

  // Standing section, fixed position. The usual single line is the point: it
  // tells a reader the archive is monitored.
  parts.html.push(`<h2>Corrections</h2>`);
  parts.text.push("CORRECTIONS", "");
  if (issue.corrections.length === 0) {
    parts.html.push(`<p>Nothing to correct.</p>`);
    parts.text.push("Nothing to correct.", "");
  } else {
    for (const correction of issue.corrections) {
      parts.html.push(
        `<p><strong>We said:</strong> ${escapeHtml(correction.we_said)}<br>` +
          `<strong>What's true:</strong> ${escapeHtml(correction.whats_true)}</p>`,
      );
      parts.text.push(
        `We said: ${correction.we_said}`,
        `What's true: ${correction.whats_true}`,
        "",
      );
    }
  }

  parts.html.push(
    `<p class="lede" style="border-top:1px solid #e7e3d9;margin-top:22px;padding-top:14px;font-size:14px;">` +
      `Was this one worth your time? ` +
      `${emailLink(ISSUE_EMAIL_PLACEHOLDERS.feedbackUp, "Yes")} &nbsp;·&nbsp; ` +
      `${emailLink(ISSUE_EMAIL_PLACEHOLDERS.feedbackDown, "No")}</p>`,
  );
  parts.text.push(
    "Was this one worth your time?",
    `Yes: ${ISSUE_EMAIL_PLACEHOLDERS.feedbackUp}`,
    `No: ${ISSUE_EMAIL_PLACEHOLDERS.feedbackDown}`,
  );
}

/* ── The renderer ───────────────────────────────────────────────────────── */

export type RenderedIssueEmail = {
  subject: string;
  preheader: string;
  /** HTML template. Run it through personalizeIssueEmail() before sending. */
  html: string;
  /** Plain-text template, hand-shaped rather than stripped from the HTML. */
  text: string;
  /** Shipped size with placeholders costed at full width. */
  size: EmailSizeCheck;
  /** What the trim ladder removed to make it fit. Empty on a normal issue. */
  dropped: string[];
};

function renderWithPlan(
  issue: BriefIssue,
  links: IssueEmailLinks,
  plan: TrimPlan,
): { html: string; text: string } {
  const footer: BriefEmailFooter = {
    webUrl: links.webUrl,
    archiveUrl: links.archiveUrl,
    howItWorksUrl: links.howItWorksUrl,
    preferencesUrl: ISSUE_EMAIL_PLACEHOLDERS.preferences,
    unsubscribeUrl: ISSUE_EMAIL_PLACEHOLDERS.unsubscribe,
  };

  const parts: Parts = { html: [], text: [] };
  header(issue, links, parts);
  if (issue.type === "daily") {
    dailyBody(issue, plan, parts);
  } else {
    weeklyBody(issue, links, plan, parts);
  }
  tail(issue, links, plan, parts);

  return {
    html: renderBriefEmailHtml({
      preheader: issue.preheader,
      bodyHtml: parts.html.join("\n"),
      footer,
    }),
    text: renderBriefEmailText({ lines: parts.text, footer }),
  };
}

/**
 * Renders an issue, trimming only as far down the ladder as the byte budget
 * demands. If even the most aggressive plan overflows, the last one still ships
 * (an oversized email beats no email) and `dropped` says what happened.
 */
export function renderIssueEmail(
  issue: BriefIssue,
  links: IssueEmailLinks,
  options: { limit?: number } = {},
): RenderedIssueEmail {
  const limit = options.limit ?? EMAIL_BYTE_LIMIT;
  const ladder = trimLadder(issue);

  let rendered = renderWithPlan(issue, links, ladder[0]);
  let size = checkEmailSize(rendered.html, limit);
  let plan = ladder[0];

  for (let step = 1; step < ladder.length && !size.ok; step += 1) {
    plan = ladder[step];
    rendered = renderWithPlan(issue, links, plan);
    size = checkEmailSize(rendered.html, limit);
  }

  return {
    subject: issue.subject,
    preheader: issue.preheader,
    html: rendered.html,
    text: rendered.text,
    size,
    dropped: describeTrim(issue, plan),
  };
}

/**
 * Stamps one reader's signed links into a rendered template. Four replaces over
 * an existing string, which is the whole reason the renderer emits placeholders
 * instead of finished URLs.
 */
export function personalizeIssueEmail(
  rendered: Pick<RenderedIssueEmail, "html" | "text">,
  urls: IssueEmailRecipientUrls,
): { html: string; text: string } {
  const pairs: Array<[string, string]> = [
    [ISSUE_EMAIL_PLACEHOLDERS.unsubscribe, urls.unsubscribeUrl],
    [ISSUE_EMAIL_PLACEHOLDERS.preferences, urls.preferencesUrl],
    [ISSUE_EMAIL_PLACEHOLDERS.feedbackUp, urls.feedbackUpUrl],
    [ISSUE_EMAIL_PLACEHOLDERS.feedbackDown, urls.feedbackDownUrl],
  ];

  let html = rendered.html;
  let text = rendered.text;
  for (const [placeholder, url] of pairs) {
    // The HTML part sits inside href="…", so the query string's ampersands have
    // to be escaped; the text part takes the URL exactly as it will be clicked.
    html = html.split(placeholder).join(escapeHtml(url));
    text = text.split(placeholder).join(url);
  }
  return { html, text };
}

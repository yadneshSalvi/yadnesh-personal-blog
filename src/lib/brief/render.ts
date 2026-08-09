// src/lib/brief/render.ts
//
// Full-content HTML for the RSS feeds. Deliberately plain: no classes, no
// inline styles, nothing a reader app has to fight.

import type { BriefIssue, BriefStory } from "./schema";
import { sectionLabel } from "./schema";
import { issueDateLabel } from "./dates";

function escapeHtml(text: string): string {
  return text.replace(
    /[<>&"]/g,
    (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]!,
  );
}

function storyAnnotation(story: BriefStory): string {
  const bits: string[] = [];
  if (story.read_annotation) bits.push(story.read_annotation);
  if (story.paywalled) bits.push("paywalled");
  if (story.via) bits.push(`via ${story.via}`);
  if (story.hn_points !== null) bits.push(`${story.hn_points} points on HN`);
  return bits.length ? ` <em>(${escapeHtml(bits.join(", "))})</em>` : "";
}

function storyHtml(story: BriefStory): string {
  const link = `<a href="${escapeHtml(story.url)}">${escapeHtml(story.title)} (${escapeHtml(story.source_name)})</a>`;
  return `<p>${link}${storyAnnotation(story)}<br />${escapeHtml(story.summary)}</p>`;
}

function quickLinkHtml(story: BriefStory): string {
  return `<li><a href="${escapeHtml(story.url)}">${escapeHtml(story.title)} (${escapeHtml(story.source_name)})</a></li>`;
}

/**
 * Full-content HTML for the RSS feeds. Deliberately plain: no classes, no
 * inline styles, nothing a reader app has to fight.
 */
export function issueToHtml(issue: BriefIssue, canonicalUrl: string): string {
  const out: string[] = [];
  out.push(
    `<p><em>${escapeHtml(issueDateLabel(issue.type, issue.id))} · ${issue.read_minutes} min read</em></p>`,
  );
  out.push(
    "<p><em>Curated and summarized by an agent pipeline built by Yadnesh; reviewed before send.</em></p>",
  );

  const notesAfter = new Map<string, string[]>();
  const looseNotes: string[] = [];
  for (const note of issue.editor_notes) {
    if (note.after_story) {
      const existing = notesAfter.get(note.after_story) ?? [];
      existing.push(note.text);
      notesAfter.set(note.after_story, existing);
    } else {
      looseNotes.push(note.text);
    }
  }
  const noteHtml = (storyId: string): string =>
    (notesAfter.get(storyId) ?? [])
      .map((text) => `<blockquote><p>Y: ${escapeHtml(text)}</p></blockquote>`)
      .join("");

  if (issue.type === "daily") {
    if (issue.lead) {
      const lead = issue.lead;
      out.push(
        `<h2><a href="${escapeHtml(lead.story.url)}">${escapeHtml(lead.story.title)} (${escapeHtml(lead.story.source_name)})</a></h2>`,
      );
      out.push(`<p><strong>What happened:</strong> ${escapeHtml(lead.what)}</p>`);
      out.push(`<p><strong>The details:</strong> ${escapeHtml(lead.details)}</p>`);
      if (lead.yes_but) {
        out.push(`<p><strong>Yes, but:</strong> ${escapeHtml(lead.yes_but)}</p>`);
      } else if (lead.yes_but_waived) {
        out.push(
          `<p><strong>Yes, but:</strong> ${escapeHtml(lead.yes_but_waived)}</p>`,
        );
      }
      out.push(`<p><strong>Why it matters:</strong> ${escapeHtml(lead.why)}</p>`);
      out.push(noteHtml(lead.story.story_id));
    }
    for (const section of issue.sections) {
      out.push(`<h3>${escapeHtml(sectionLabel(section.key))}</h3>`);
      for (const story of section.items) {
        out.push(storyHtml(story));
        out.push(noteHtml(story.story_id));
      }
    }
  } else {
    const weekly = issue.weekly;
    out.push("<h3>The week in five lines</h3>");
    out.push(
      `<ul>${weekly.week_in_five.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`,
    );
    out.push(`<h3>${escapeHtml(weekly.through_line.title)}</h3>`);
    for (const paragraph of weekly.through_line.body_md.split(/\n{2,}/)) {
      out.push(`<p>${escapeHtml(paragraph.trim())}</p>`);
    }
    out.push("<h3>What mattered</h3>");
    for (const pick of weekly.what_mattered) {
      out.push(
        `<p><a href="${escapeHtml(pick.story.url)}">${escapeHtml(pick.story.title)} (${escapeHtml(pick.story.source_name)})</a></p>`,
      );
      out.push(`<p>${escapeHtml(pick.what)}</p>`);
      out.push(`<p><strong>Yes, but:</strong> ${escapeHtml(pick.yes_but)}</p>`);
      out.push(`<p><strong>Why it matters:</strong> ${escapeHtml(pick.why)}</p>`);
      out.push(noteHtml(pick.story.story_id));
    }
    if (weekly.quietly_important.length > 0) {
      out.push("<h3>Quietly important</h3>");
      for (const pick of weekly.quietly_important) {
        out.push(
          `<p><a href="${escapeHtml(pick.story.url)}">${escapeHtml(pick.story.title)} (${escapeHtml(pick.story.source_name)})</a><br />${escapeHtml(pick.note)}</p>`,
        );
      }
    }
    out.push(`<h3>${escapeHtml(weekly.thread_to_watch.title)}</h3>`);
    out.push(`<p>${escapeHtml(weekly.thread_to_watch.body)}</p>`);
    for (const thread of weekly.thread_to_watch.prior_threads_paid_off) {
      out.push(
        `<p><strong>${escapeHtml(thread.title)}</strong> ${escapeHtml(thread.body)}</p>`,
      );
    }
    if (weekly.deep_cuts.length > 0) {
      out.push("<h3>Deep cuts</h3>");
      out.push(`<ul>${weekly.deep_cuts.map(quickLinkHtml).join("")}</ul>`);
    }
  }

  if (issue.from_x.length > 0) {
    out.push("<h3>From X</h3>");
    for (const story of issue.from_x) out.push(storyHtml(story));
  }

  if (issue.quick_links.length > 0) {
    out.push("<h3>Quick links</h3>");
    out.push(`<ul>${issue.quick_links.map(quickLinkHtml).join("")}</ul>`);
  }

  for (const text of looseNotes) {
    out.push(`<blockquote><p>Y: ${escapeHtml(text)}</p></blockquote>`);
  }

  out.push("<h3>Corrections</h3>");
  if (issue.corrections.length === 0) {
    out.push("<p>Nothing to correct.</p>");
  } else {
    for (const correction of issue.corrections) {
      out.push(
        `<p><strong>We said:</strong> ${escapeHtml(correction.we_said)}<br /><strong>What's true:</strong> ${escapeHtml(correction.whats_true)}</p>`,
      );
    }
  }

  out.push(`<p><a href="${escapeHtml(canonicalUrl)}">Read this issue on the web</a></p>`);
  return out.filter(Boolean).join("\n");
}

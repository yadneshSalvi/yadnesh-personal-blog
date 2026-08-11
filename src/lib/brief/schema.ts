// src/lib/brief/schema.ts
//
// The Agentic Brief issue schema, version 1.
//
// This file is imported two ways: by the Next app (through the "@/" alias) and
// by scripts/validate-brief.mjs, which node runs directly using its built-in
// type stripping. That second path is why every import here is relative or a
// bare package specifier, and why the file stays on erasable TypeScript (no
// enums, no namespaces, no parameter properties).

import { z } from "zod";

export const BRIEF_SCHEMA_VERSION = 1;

/** Section order is fixed. Empty sections are omitted from an issue, never reordered. */
export const BRIEF_SECTION_KEYS = [
  "research",
  "engineering",
  "product",
  "community",
] as const;
export type BriefSectionKey = (typeof BRIEF_SECTION_KEYS)[number];

export const BRIEF_SECTION_LABELS: Record<BriefSectionKey, string> = {
  research: "Research & Papers",
  engineering: "Engineering & Harnesses",
  product: "Product & Releases",
  community: "Community",
};

/**
 * Controlled topic vocabulary. Slugs are the URL segment at /newsletter/topics/<slug>;
 * the pipeline maps the feed's `category` field onto these.
 */
export const BRIEF_TOPICS = [
  "agent-research",
  "coding-agents",
  "evals-benchmarks",
  "frameworks",
  "harnesses-tools",
  "industry",
  "infra-sandboxes",
  "memory-context",
  "models",
  "papers",
  "security",
] as const;
export type BriefTopic = (typeof BRIEF_TOPICS)[number];

export const BRIEF_TOPIC_LABELS: Record<BriefTopic, string> = {
  "agent-research": "Agent research",
  "coding-agents": "Coding agents",
  "evals-benchmarks": "Evals & benchmarks",
  frameworks: "Frameworks",
  "harnesses-tools": "Harnesses & tools",
  industry: "Industry",
  "infra-sandboxes": "Infra & sandboxes",
  "memory-context": "Memory & context",
  models: "Models",
  papers: "Papers",
  security: "Security",
};

/** Source kinds carried over from the feed repo's sources_web.json, plus X posts. */
export const BRIEF_SOURCE_KINDS = [
  "company",
  "individual",
  "newsletter",
  "paper",
  "community",
  "x",
] as const;

export const DAILY_ID_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const WEEKLY_ID_PATTERN = /^\d{4}-W\d{2}$/;

/** Subject-line ceiling from the editorial spec. Load-bearing part should sit under 45. */
export const SUBJECT_MAX_LENGTH = 70;

const isoTimestamp = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "must be a parseable ISO-8601 timestamp",
  });

const httpsUrl = z.string().refine(
  (value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  },
  { message: "must be an absolute https:// URL" },
);

/**
 * A story as it appears inside an issue: fully denormalized, so the site builds
 * with zero access to the feed repo. `story_id` is the feed's item id (already
 * stable and deduped) and `cluster` is what powers threading across issues.
 */
export const BriefStorySchema = z.object({
  story_id: z.string().min(1),
  title: z.string().min(1),
  url: httpsUrl,
  source_name: z.string().min(1),
  kind: z.enum(BRIEF_SOURCE_KINDS),
  section: z.enum(BRIEF_SECTION_KEYS),
  topics: z.array(z.enum(BRIEF_TOPICS)).min(1),
  cluster: z.string().min(1).nullable().default(null),
  published_at: isoTimestamp.nullable().default(null),
  /** "6 min read", "arXiv, 22 pp", "X post". Free text, shown after the headline. */
  read_annotation: z.string().nullable().default(null),
  /** The newsletter's own 1-2 sentence text, not the feed's raw summary. */
  summary: z.string().min(1),
  /** Discovery credit when the primary source was found through someone else. */
  via: z.string().nullable().default(null),
  paywalled: z.boolean().default(false),
  hn_points: z.number().int().nonnegative().nullable().default(null),
});
export type BriefStory = z.infer<typeof BriefStorySchema>;

/**
 * The lead story's labeled skeleton. `yes_but` is structurally required: either
 * the caveat, or an explicit waiver saying why there isn't one. Summarizers
 * inflate hedged claims into certainties, and this slot forces the check.
 */
export const BriefLeadSchema = z.object({
  story: BriefStorySchema,
  what: z.string().min(1),
  details: z.string().min(1),
  yes_but: z.string().min(1).nullable().default(null),
  yes_but_waived: z.string().min(1).nullable().default(null),
  why: z.string().min(1),
});
export type BriefLead = z.infer<typeof BriefLeadSchema>;

export const BriefSectionSchema = z.object({
  key: z.enum(BRIEF_SECTION_KEYS),
  items: z.array(BriefStorySchema).min(1),
});
export type BriefSection = z.infer<typeof BriefSectionSchema>;

/** The `Y:` blocks: the only place opinion is allowed to live. */
export const BriefEditorNoteSchema = z.object({
  after_story: z.string().min(1).nullable().default(null),
  text: z.string().min(1),
});
export type BriefEditorNote = z.infer<typeof BriefEditorNoteSchema>;

export const BriefCorrectionSchema = z.object({
  we_said: z.string().min(1),
  whats_true: z.string().min(1),
  /** The issue being corrected, so the web page can link back to it. */
  issue_type: z.enum(["daily", "weekly"]).nullable().default(null),
  issue_id: z.string().min(1).nullable().default(null),
  corrected_at: isoTimestamp,
});
export type BriefCorrection = z.infer<typeof BriefCorrectionSchema>;

/**
 * Where meme and comic images live, both on disk (under public/) and on the
 * web. The pipeline commits the image in the same PR as the issue, so a path
 * that points nowhere is a CI failure rather than a broken image in an inbox.
 */
export const MEME_IMAGE_ROOT = "/images/brief/memes";

/**
 * `/images/brief/memes/<issue-id>/<file>.png|.webp`. The issue-id folder is
 * checked in CI, and the filename is free-form because a daily's candidates are
 * named after the edition they came from, not the issue they ran in.
 *
 * Both formats are allowed because the pipeline is moving from png to webp: a
 * real render is around 1.6MB as png, which is over 2GB of binary a year in a
 * blog repo. Nothing about delivery depends on this choice, since next/image
 * already serves resized webp whatever the source is.
 */
export const MEME_IMAGE_PATTERN =
  /^\/images\/brief\/memes\/[A-Za-z0-9][A-Za-z0-9._-]*\/[A-Za-z0-9][A-Za-z0-9._-]*\.(png|webp)$/;

/** A quote runs verbatim, so it is capped rather than rewritten. */
export const HEDGE_QUOTE_MAX_LENGTH = 300;

const memeImagePath = z
  .string()
  .regex(
    MEME_IMAGE_PATTERN,
    `must be a site-relative image under ${MEME_IMAGE_ROOT}/<issue-id>/`,
  );

/**
 * The weekly comic: one drawn panel set with an xkcd-style bonus line. `alt`
 * describes the image for a screen reader and retells the joke; `alt_joke` is
 * the extra gag, shown as the title attribute the way xkcd does it.
 */
export const BriefComicSchema = z.object({
  image: memeImagePath,
  alt: z.string().min(1),
  alt_joke: z.string().min(1).nullable().default(null),
  caption: z.string().min(1),
});
export type BriefComic = z.infer<typeof BriefComicSchema>;

/**
 * The meme. Same shape as the comic plus the two fields that keep it honest:
 * `concept` names the premise in one line (if you can't, the joke isn't about
 * anything), and `story_id` grounds it in a story the issue actually carried.
 */
export const BriefMemeSchema = BriefComicSchema.extend({
  concept: z.string().min(1),
  story_id: z.string().min(1).nullable().default(null),
});
export type BriefMeme = z.infer<typeof BriefMemeSchema>;

/**
 * Hedge of the day: a verbatim line of hedging from a source, the story it came
 * from, and one dry sentence about it. `quote` is source text, so the house
 * style scan skips it the way it skips story titles; `note` is ours and is
 * scanned.
 */
export const BriefHedgeSchema = z.object({
  quote: z.string().min(1).max(HEDGE_QUOTE_MAX_LENGTH),
  story: BriefStorySchema,
  note: z.string().min(1),
});
export type BriefHedge = z.infer<typeof BriefHedgeSchema>;

/* ── The meme hall of fame ──────────────────────────────────────────────── */

/**
 * One candidate from a day's batch. The winner ran in the issue; the rest are
 * kept because the runner-ups are half the fun of a hall of fame.
 */
export const BriefMemeCandidateSchema = z.object({
  id: z.string().min(1),
  image: memeImagePath,
  alt: z.string().min(1),
  alt_joke: z.string().min(1).nullable().default(null),
  caption: z.string().min(1),
  /** Required on a daily's memes, absent on a weekly's comics. See the set refine. */
  concept: z.string().min(1).nullable().default(null),
  winner: z.boolean(),
});
export type BriefMemeCandidate = z.infer<typeof BriefMemeCandidateSchema>;

/**
 * One file per issue day at content/brief/memes/<issue-id>.json.
 *
 * A daily's candidates are memes and must name their premise; a weekly's are
 * comics, which carry no `concept` field in the issue either, so the set's type
 * decides whether the field is required rather than the field itself.
 */
export const BriefMemeSetSchema = z
  .object({
    issue_id: z.string().min(1),
    type: z.enum(["daily", "weekly"]),
    candidates: z.array(BriefMemeCandidateSchema).min(1),
  })
  .refine(
    (set) =>
      set.type !== "daily" ||
      set.candidates.every((candidate) => (candidate.concept ?? "").trim().length > 0),
    {
      message: "every candidate in a daily's set needs a concept",
      path: ["candidates"],
    },
  );
export type BriefMemeSet = z.infer<typeof BriefMemeSetSchema>;

export const BRIEF_SEND_STATES = [
  "pending_approval",
  "approved",
  "held",
  "sent",
  "skipped",
] as const;

export const BriefEmailSchema = z.object({
  send_state: z.enum(BRIEF_SEND_STATES),
  /** Auto-send deadline: two hours after the approval notification goes out. */
  approve_by: isoTimestamp.nullable().default(null),
  sent_at: isoTimestamp.nullable().default(null),
  /** Reserved for the Resend driver; the Zoho driver leaves it empty. */
  resend_broadcast_ids: z.record(z.string(), z.string()).default({}),
});
export type BriefEmail = z.infer<typeof BriefEmailSchema>;

/** One of the 3-4 retrospective picks in a weekly. Both labels are mandatory here. */
export const BriefWeeklyPickSchema = z.object({
  story: BriefStorySchema,
  what: z.string().min(1),
  yes_but: z.string().min(1),
  why: z.string().min(1),
});

export const BriefWeeklyQuietPickSchema = z.object({
  story: BriefStorySchema,
  note: z.string().min(1),
});

export const BriefWeeklySchema = z.object({
  /** Exactly five, one sentence each. The only recap element, hard-capped. */
  week_in_five: z.array(z.string().min(1)).length(5),
  through_line: z.object({
    title: z.string().min(1),
    body_md: z.string().min(1),
  }),
  what_mattered: z.array(BriefWeeklyPickSchema).min(1),
  quietly_important: z.array(BriefWeeklyQuietPickSchema).default([]),
  thread_to_watch: z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    story: BriefStorySchema.nullable().default(null),
    prior_threads_paid_off: z
      .array(
        z.object({
          title: z.string().min(1),
          body: z.string().min(1),
          issue_id: z.string().min(1).nullable().default(null),
        }),
      )
      .default([]),
  }),
  deep_cuts: z.array(BriefStorySchema).default([]),
  /** Drawn, not memed. Sits right under the through line. */
  comic: BriefComicSchema.nullable().default(null),
});
export type BriefWeekly = z.infer<typeof BriefWeeklySchema>;

const commonIssueShape = {
  schema_version: z.literal(BRIEF_SCHEMA_VERSION),
  status: z.enum(["draft", "published"]),
  /** SEO gate. Weeklies are always true; dailies earn it (see plan 03 §3). */
  index: z.boolean(),
  generated_at: isoTimestamp,
  /** Feed edition ids this issue was composed from, e.g. "2026-08-06-am". */
  source_editions: z.array(z.string().min(1)).min(1),
  subject: z.string().min(1).max(SUBJECT_MAX_LENGTH),
  preheader: z.string().min(1),
  /** Web <title> and H1. Names the searchable topics, never the date. */
  title: z.string().min(1),
  read_minutes: z.number().int().positive(),
  disclosure_version: z.number().int().positive(),
  from_x: z.array(BriefStorySchema).max(3).default([]),
  quick_links: z.array(BriefStorySchema).default([]),
  editor_notes: z.array(BriefEditorNoteSchema).default([]),
  corrections: z.array(BriefCorrectionSchema).default([]),
  /** Optional on every cadence. An issue with nothing funny in it runs without one. */
  meme: BriefMemeSchema.nullable().default(null),
  email: BriefEmailSchema,
  /** Set on the hand-built sample issues; real generated issues omit it. */
  fixture: z.boolean().optional(),
};

export const BriefDailyIssueSchema = z
  .object({
    ...commonIssueShape,
    type: z.literal("daily"),
    id: z.string().regex(DAILY_ID_PATTERN, "daily id must be YYYY-MM-DD"),
    issue_number: z.null().default(null),
    thin_day: z.boolean(),
    lead: BriefLeadSchema.nullable().default(null),
    sections: z.array(BriefSectionSchema).default([]),
    /** Daily only: the weekly gets a comic instead. */
    hedge: BriefHedgeSchema.nullable().default(null),
    weekly: z.null().default(null),
  })
  .refine((issue) => issue.thin_day || issue.lead !== null, {
    message: "a daily issue needs a lead story unless thin_day is true",
    path: ["lead"],
  })
  .refine(
    (issue) => {
      const keys = issue.sections.map((section) => section.key);
      return new Set(keys).size === keys.length;
    },
    { message: "each section key may appear at most once", path: ["sections"] },
  );

export const BriefWeeklyIssueSchema = z.object({
  ...commonIssueShape,
  type: z.literal("weekly"),
  id: z.string().regex(WEEKLY_ID_PATTERN, "weekly id must be YYYY-Www"),
  /** Display metadata only. The ISO week is the identity. */
  issue_number: z.number().int().positive().nullable().default(null),
  thin_day: z.literal(false).default(false),
  lead: z.null().default(null),
  sections: z.array(BriefSectionSchema).max(0).default([]),
  hedge: z.null().default(null),
  weekly: BriefWeeklySchema,
});

/**
 * Discriminated on `type` rather than a plain union, so a malformed file
 * reports "sections.0.items.1.url is not https" instead of "(root): invalid
 * input". Whoever reads that message next is debugging a failed generation at
 * 8:40 in the morning.
 */
export const BriefIssueSchema = z.discriminatedUnion("type", [
  BriefDailyIssueSchema,
  BriefWeeklyIssueSchema,
]);

export type BriefDailyIssue = z.infer<typeof BriefDailyIssueSchema>;
export type BriefWeeklyIssue = z.infer<typeof BriefWeeklyIssueSchema>;
export type BriefIssue = z.infer<typeof BriefIssueSchema>;

export function isDailyIssue(issue: BriefIssue): issue is BriefDailyIssue {
  return issue.type === "daily";
}

export function isWeeklyIssue(issue: BriefIssue): issue is BriefWeeklyIssue {
  return issue.type === "weekly";
}

/** The path an issue lives at, both on disk (relative to content/brief) and on the web. */
export function issuePath(issue: Pick<BriefIssue, "type" | "id">): string {
  return `/newsletter/${issue.type}/${issue.id}`;
}

export function topicLabel(topic: string): string {
  return BRIEF_TOPIC_LABELS[topic as BriefTopic] ?? topic;
}

export function sectionLabel(key: string): string {
  return BRIEF_SECTION_LABELS[key as BriefSectionKey] ?? key;
}

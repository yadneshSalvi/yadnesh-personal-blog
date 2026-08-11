#!/usr/bin/env node

/**
 * The email renderer's guard rail. It renders every issue in content/brief/ plus
 * a deliberately obese synthetic issue of each cadence, and asserts the things
 * that turn into a broken send if they ever stop being true:
 *
 *   - real issues sit well under the 80KB budget with nothing trimmed;
 *   - a fat issue trims down under budget and still ends with a complete
 *     footer, an unsubscribe link, and the corrections block;
 *   - no em-dash reaches the reader (WRITING-STYLE.md §3);
 *   - no issue email ever carries an <img>: the meme and the comic ship as a
 *     line pointing at the web edition, by decision, not by accident;
 *   - each per-recipient placeholder appears exactly once in each part, so the
 *     send loop's string replace cannot leave a dead link in an inbox.
 *
 * Run: npm run test:brief-email
 *
 * Node loads src/lib/brief/issueEmail.ts directly through its built-in type
 * stripping. The resolve hook below is what lets that file keep the normal
 * extensionless import style the rest of src/ uses; node itself does no
 * extension guessing.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import module from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

module.registerHooks({
  resolve(specifier, context, nextResolve) {
    const relative = specifier.startsWith("./") || specifier.startsWith("../");
    if (relative && !path.extname(specifier)) {
      const parent = context.parentURL ? fileURLToPath(context.parentURL) : process.cwd();
      const candidate = new URL(`${specifier}.ts`, pathToFileURL(parent));
      if (fs.existsSync(candidate)) return { url: candidate.href, shortCircuit: true };
    }
    // The approval email reaches urls.ts, which uses the app's "@/" alias.
    // issueEmail.ts avoids the alias on purpose so node can load it bare, but
    // urls.ts is ordinary app code and should not be contorted for a test.
    if (specifier.startsWith("@/")) {
      const target = path.join(REPO_ROOT, "src", specifier.slice(2));
      for (const candidate of [`${target}.ts`, `${target}.tsx`, path.join(target, "index.ts")]) {
        if (fs.existsSync(candidate)) {
          return { url: pathToFileURL(candidate).href, shortCircuit: true };
        }
      }
    }
    return nextResolve(specifier, context);
  },
});

// The footer prints the postal address, and the whole point of the byte budget
// is to measure what actually ships. Set it for the duration of the test.
process.env.BRIEF_POSTAL_ADDRESS = "The Agentic Brief, PO Box 0000, Mumbai 400001, India";

const { BriefIssueSchema } = await import("../src/lib/brief/schema.ts");
const {
  EMAIL_BYTE_LIMIT,
  ISSUE_EMAIL_PLACEHOLDERS,
  checkEmailSize,
  personalizeIssueEmail,
  renderIssueEmail,
} = await import("../src/lib/brief/issueEmail.ts");
const { buildApprovalEmail } = await import("../src/lib/brief/approvalEmail.ts");
// Content assertions against the HTML part have to escape the way the renderer
// does, or an apostrophe in a fixture fails a test about something else.
const { escapeHtml } = await import("../src/lib/brief/emailChrome.ts");

const LINKS = {
  webUrl: "https://yadneshsalvi.com/newsletter/daily/2026-08-06",
  archiveUrl: "https://yadneshsalvi.com/newsletter/archive",
  howItWorksUrl: "https://yadneshsalvi.com/newsletter/how-it-works",
};

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
}

function kb(bytes) {
  return `${(bytes / 1024).toFixed(1)}KB`;
}

/* ── Shared assertions ──────────────────────────────────────────────────── */

function assertNoEmDash(rendered, label) {
  assert.equal(rendered.html.includes("—"), false, `${label}: em-dash in the HTML part`);
  assert.equal(rendered.text.includes("—"), false, `${label}: em-dash in the text part`);
}

/**
 * The humor features put drawn images on the web page only. An <img> in an
 * issue email means somebody wired the meme into the wrong renderer, and the
 * reader gets a blocked-image box where the joke was.
 */
function assertNoImages(rendered, label) {
  assert.equal(/<img\b/i.test(rendered.html), false, `${label}: an <img> tag reached the HTML part`);
  assert.equal(/<img\b/i.test(rendered.text), false, `${label}: an <img> tag reached the text part`);
}

function assertPlaceholdersOnce(rendered, label) {
  for (const placeholder of Object.values(ISSUE_EMAIL_PLACEHOLDERS)) {
    const inHtml = rendered.html.split(placeholder).length - 1;
    const inText = rendered.text.split(placeholder).length - 1;
    assert.equal(inHtml, 1, `${label}: ${placeholder} appears ${inHtml} times in the HTML part`);
    assert.equal(inText, 1, `${label}: ${placeholder} appears ${inText} times in the text part`);
  }
}

function assertFooterIntact(rendered, label) {
  assert.match(rendered.html, /class="footer"/, `${label}: footer block missing`);
  assert.ok(
    rendered.html.includes("You're getting this because you subscribed at yadneshsalvi.com."),
    `${label}: the why-you-got-this line is missing`,
  );
  assert.ok(
    rendered.html.includes(process.env.BRIEF_POSTAL_ADDRESS),
    `${label}: the postal address is missing`,
  );
  assert.ok(rendered.html.includes(LINKS.webUrl), `${label}: view-in-browser link is missing`);
  assert.ok(rendered.html.trimEnd().endsWith("</body></html>"), `${label}: HTML is truncated`);
  assert.ok(rendered.html.includes(">Corrections</h2>"), `${label}: corrections block is missing`);
}

/* ── Real fixtures ──────────────────────────────────────────────────────── */

function loadFixtures() {
  const issues = [];
  for (const type of ["daily", "weekly"]) {
    const dir = path.join(REPO_ROOT, "content", "brief", type);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir).sort()) {
      if (!name.endsWith(".json")) continue;
      const raw = JSON.parse(fs.readFileSync(path.join(dir, name), "utf8"));
      const parsed = BriefIssueSchema.safeParse(raw);
      assert.ok(parsed.success, `${type}/${name} does not parse; fix it before testing the email`);
      issues.push({ label: `${type}/${name}`, issue: parsed.data });
    }
  }
  assert.ok(issues.length > 0, "no issues found in content/brief/");
  return issues;
}

console.log("brief issue email");

const fixtures = loadFixtures();

test(`renders ${fixtures.length} real issues well under the byte budget`, () => {
  for (const { label, issue } of fixtures) {
    const rendered = renderIssueEmail(issue, LINKS);
    // "Well under" is the point: a real issue that needs the trim ladder means
    // the editorial caps in plan 01 have quietly stopped being enforced.
    assert.ok(
      rendered.size.bytes < EMAIL_BYTE_LIMIT * 0.75,
      `${label}: ${kb(rendered.size.bytes)} is too close to the ${kb(EMAIL_BYTE_LIMIT)} budget`,
    );
    assert.deepEqual(rendered.dropped, [], `${label}: a real issue should never be trimmed`);
    assert.equal(rendered.subject, issue.subject);
    assert.equal(rendered.preheader, issue.preheader);
    assertNoEmDash(rendered, label);
    assertNoImages(rendered, label);
    assertPlaceholdersOnce(rendered, label);
    assertFooterIntact(rendered, label);
    console.log(`      ${label}: ${kb(rendered.size.bytes)}`);
  }
});

test("carries the disclosure, the read time, and every headline", () => {
  for (const { label, issue } of fixtures) {
    const rendered = renderIssueEmail(issue, LINKS);
    assert.ok(
      rendered.html.includes("Curated and summarized by an agent pipeline built by Yadnesh"),
      `${label}: disclosure line missing`,
    );
    assert.ok(
      rendered.html.includes(`${issue.read_minutes} min read`),
      `${label}: read time missing`,
    );
    assert.ok(rendered.text.includes(LINKS.howItWorksUrl), `${label}: text part lost the how-it-works link`);
  }
});

test("a daily lead keeps its labeled skeleton", () => {
  const daily = fixtures.find((entry) => entry.issue.type === "daily" && entry.issue.lead);
  assert.ok(daily, "no daily fixture with a lead story");
  const rendered = renderIssueEmail(daily.issue, LINKS);
  for (const label of ["What happened:", "The details:", "Yes, but:", "Why it matters:"]) {
    assert.ok(rendered.html.includes(`<strong>${label}</strong>`), `HTML lost "${label}"`);
    assert.ok(rendered.text.includes(label), `text part lost "${label}"`);
  }
});

test("a weekly keeps its five lines, its through-line, and its thread", () => {
  // The hand-built fixtures were deleted once real issues started publishing,
  // and the first real weekly has not run yet. The fat synthetic weekly below
  // still exercises the renderer; this checks a weekly on disk when there is one.
  const weekly = fixtures.find((entry) => entry.issue.type === "weekly");
  if (!weekly) {
    console.log("      no weekly issue on disk yet; the synthetic weekly covers the renderer");
    return;
  }
  const rendered = renderIssueEmail(weekly.issue, LINKS);
  assert.ok(rendered.html.includes("The week in five lines"));
  // Titles are compared against the text part: the HTML part has been through
  // escapeHtml, and these headings carry quotes and apostrophes.
  assert.ok(rendered.text.includes(weekly.issue.weekly.through_line.title.toUpperCase()));
  assert.ok(rendered.text.includes(weekly.issue.weekly.thread_to_watch.title.toUpperCase()));
  for (const line of weekly.issue.weekly.week_in_five) {
    assert.ok(rendered.text.includes(line), "text part lost a week-in-five line");
  }
});

/* ── The fat synthetic issues ───────────────────────────────────────────── */

const LONG = [
  "A summary long enough to matter to the byte budget, written the way a",
  "generation with no cap on itself would write one: every clause the source",
  "offered, every number it printed, and every qualifier it hedged with, all",
  "kept in case a reader wanted them. This is the failure mode the trim ladder",
  "exists to survive, and it is worth roughly a kilobyte of shipped source on",
  "its own once the surrounding markup is counted alongside it.",
].join(" ");

/**
 * Every fat story's id shows up inside its own URL, so an assertion about what
 * survived a trim can look for the id in the rendered HTML.
 */
function fatStory(prefix, index, section) {
  const id = `${prefix}-${index}`;
  return {
    story_id: id,
    title: `A headline with enough words in it to look like a real one, number ${index}`,
    url: `https://example.com/fat/${id}`,
    source_name: "An Organization With A Long Name",
    kind: "company",
    section,
    topics: ["agent-research", "coding-agents"],
    cluster: `fat-cluster-${id}`,
    published_at: "2026-08-06T04:00:00Z",
    read_annotation: "long read",
    summary: LONG,
    via: null,
    paywalled: false,
    hn_points: 128,
  };
}

function fatList(prefix, count, section, patch = {}) {
  return Array.from({ length: count }, (unused, i) => ({
    ...fatStory(prefix, i, section),
    ...patch,
  }));
}

function fatDaily() {
  const sections = ["research", "engineering", "product", "community"].map((key) => ({
    key,
    items: fatList(`sec-${key}`, 40, key),
  }));
  return BriefIssueSchema.parse({
    schema_version: 1,
    type: "daily",
    id: "2026-08-10",
    issue_number: null,
    status: "published",
    index: true,
    generated_at: "2026-08-10T03:18:00Z",
    source_editions: ["2026-08-10-am"],
    subject: "A fat synthetic issue for the byte budget test",
    preheader: "Every list at its maximum, every summary at its longest.",
    title: "A fat synthetic issue",
    read_minutes: 40,
    thin_day: false,
    disclosure_version: 1,
    lead: {
      story: fatStory("lead", 0, "research"),
      what: LONG,
      details: LONG,
      yes_but: LONG,
      yes_but_waived: null,
      why: LONG,
    },
    sections,
    from_x: fatList("fromx", 3, "community", { kind: "x" }),
    quick_links: fatList("quicklink", 60, "product"),
    editor_notes: [{ after_story: null, text: LONG }],
    meme: {
      image: "/images/brief/memes/2026-08-10/fat-meme.png",
      alt: "A drawing described at length for a reader who cannot see it.",
      alt_joke: "The bonus line nobody reads until they hover.",
      caption: "The one that ran, and the reason the others did not.",
      concept: "Take the day's claim literally until it falls over.",
      story_id: "lead-0",
    },
    hedge: {
      quote:
        "Results may vary depending on the workload, the hardware, and a number of factors we did not measure.",
      story: fatStory("hedge", 0, "research"),
      note: "Every number in the post was measured; that sentence was not.",
    },
    corrections: [
      {
        we_said: LONG,
        whats_true: LONG,
        issue_type: null,
        issue_id: null,
        corrected_at: "2026-08-10T03:00:00Z",
      },
    ],
    email: { send_state: "pending_approval", approve_by: null, sent_at: null, resend_broadcast_ids: {} },
  });
}

function fatWeekly() {
  return BriefIssueSchema.parse({
    schema_version: 1,
    type: "weekly",
    id: "2026-W33",
    issue_number: 2,
    status: "published",
    index: true,
    generated_at: "2026-08-16T03:34:00Z",
    source_editions: ["2026-08-10-am"],
    subject: "Weekly #2: a fat synthetic issue for the byte budget test",
    preheader: "Every list at its maximum, every summary at its longest.",
    title: "A fat synthetic weekly",
    read_minutes: 60,
    thin_day: false,
    disclosure_version: 1,
    from_x: fatList("wfromx", 3, "community", { kind: "x" }),
    quick_links: fatList("wquicklink", 40, "product"),
    editor_notes: [],
    corrections: [],
    meme: {
      image: "/images/brief/memes/2026-W33/fat-meme.webp",
      alt: "A drawing described at length for a reader who cannot see it.",
      alt_joke: "The bonus line nobody reads until they hover.",
      caption: "The week's meme, chosen over four that were funnier and less true.",
      concept: "The week's pattern, drawn as one overloaded conveyor belt.",
      story_id: null,
    },
    email: { send_state: "pending_approval", approve_by: null, sent_at: null, resend_broadcast_ids: {} },
    weekly: {
      week_in_five: Array.from({ length: 5 }, () => LONG),
      through_line: {
        title: "The through line",
        body_md: `${LONG}\n\n${LONG}\n\n${LONG}\n\n${LONG}`,
      },
      what_mattered: fatList("mattered", 24, "research").map((story) => ({
        story,
        what: LONG,
        yes_but: LONG,
        why: LONG,
      })),
      quietly_important: fatList("quiet", 24, "engineering").map((story) => ({
        story,
        note: LONG,
      })),
      thread_to_watch: {
        title: "Thread to watch",
        body: LONG,
        story: fatStory("thread", 0, "product"),
        prior_threads_paid_off: [{ title: "Paid off", body: LONG, issue_id: null }],
      },
      deep_cuts: fatList("deepcut", 60, "community"),
      comic: {
        image: "/images/brief/memes/2026-W33/comic.webp",
        alt: "Three panels, described in full so the punchline survives a screen reader.",
        alt_joke: "Panel four exists but it is still rendering.",
        caption: "Drawn after the through line was written, which is why it agrees with it.",
      },
    },
  });
}

test("the fat daily overflows before trimming", () => {
  const untrimmed = renderIssueEmail(fatDaily(), LINKS, { limit: Number.MAX_SAFE_INTEGER });
  assert.ok(
    untrimmed.size.bytes > EMAIL_BYTE_LIMIT,
    `the fat daily is only ${kb(untrimmed.size.bytes)}; make it fatter or the trim test proves nothing`,
  );
  console.log(`      untrimmed: ${kb(untrimmed.size.bytes)}`);
});

test("the fat daily trims under budget with the lead and footer intact", () => {
  const issue = fatDaily();
  const rendered = renderIssueEmail(issue, LINKS);
  assert.equal(rendered.size.ok, true, `still ${kb(rendered.size.bytes)} after trimming`);
  assert.ok(rendered.dropped.length > 0, "nothing was reported as dropped");
  assertFooterIntact(rendered, "fat daily");
  assertPlaceholdersOnce(rendered, "fat daily");
  assertNoEmDash(rendered, "fat daily");
  assertNoImages(rendered, "fat daily");

  // The lead is never trimmed, and neither is its caveat.
  assert.ok(rendered.html.includes(issue.lead.story.url), "the lead story was dropped");
  assert.ok(rendered.html.includes("<strong>Yes, but:</strong>"), "the lead's caveat was dropped");
  assert.ok(rendered.html.includes("<strong>We said:</strong>"), "the correction was dropped");
  // Quick links go first, before any section item.
  assert.ok(
    rendered.dropped.some((entry) => entry.includes("quick links")),
    `quick links should be the first thing dropped, got: ${rendered.dropped.join(", ")}`,
  );
  assert.equal(rendered.html.includes("quicklink-0"), false, "a quick link survived the trim");
  console.log(`      trimmed to ${kb(rendered.size.bytes)}; dropped ${rendered.dropped.join(", ")}`);
});

test("the fat weekly trims under budget and keeps its argument", () => {
  const issue = fatWeekly();
  const rendered = renderIssueEmail(issue, LINKS);
  assert.equal(rendered.size.ok, true, `still ${kb(rendered.size.bytes)} after trimming`);
  assert.ok(rendered.dropped.length > 0, "nothing was reported as dropped");
  assertFooterIntact(rendered, "fat weekly");
  assertPlaceholdersOnce(rendered, "fat weekly");
  assertNoEmDash(rendered, "fat weekly");
  assertNoImages(rendered, "fat weekly");
  assert.ok(rendered.html.includes("The week in five lines"), "the recap was dropped");
  assert.ok(rendered.html.includes(issue.weekly.through_line.title), "the through-line was dropped");
  assert.ok(rendered.html.includes("mattered-0"), "every what-mattered pick was dropped");
  assert.equal(rendered.html.includes("wquicklink-0"), false, "a quick link survived the trim");
  console.log(`      trimmed to ${kb(rendered.size.bytes)}; dropped ${rendered.dropped.join(", ")}`);
});

test("the bottom of the ladder keeps one pick, the corrections, and the footer", () => {
  // A budget no real issue will ever see, to walk the ladder to its last rung.
  const issue = fatWeekly();
  const rendered = renderIssueEmail(issue, LINKS, { limit: 14 * 1024 });
  console.log(`      starved to ${kb(rendered.size.bytes)}; dropped ${rendered.dropped.join(", ")}`);
  assertFooterIntact(rendered, "starved weekly");
  assertPlaceholdersOnce(rendered, "starved weekly");
  assertNoImages(rendered, "starved weekly");
  assert.ok(rendered.html.includes("mattered-0"), "the first what-mattered pick must survive");
  assert.equal(rendered.html.includes("mattered-23"), false, "the picks were not trimmed at all");
  assert.ok(
    rendered.dropped.some((entry) => entry.includes("what-mattered")),
    `the ladder stopped early: ${rendered.dropped.join(", ")}`,
  );
  assert.equal(rendered.html.includes("quiet-0"), false, "quietly important should be gone");
  assert.equal(rendered.html.includes("deepcut-0"), false, "deep cuts should be gone");
  assert.ok(rendered.html.includes("Nothing to correct."), "the corrections block was dropped");
});

/* ── The humor blocks ───────────────────────────────────────────────────── */

test("the daily's meme is one line and its hedge is the whole block", () => {
  const issue = fatDaily();
  const rendered = renderIssueEmail(issue, LINKS);

  // The meme: a caption and a pointer at the web edition's anchor, no image.
  assert.ok(
    rendered.html.includes("<strong>Meme of the day:</strong>"),
    "the meme line is missing from the HTML part",
  );
  assert.ok(rendered.html.includes(issue.meme.caption), "the meme caption is missing");
  assert.ok(
    rendered.html.includes(`${LINKS.webUrl}#meme`),
    "the meme line does not point at the web edition's anchor",
  );
  assert.ok(rendered.text.includes(`Meme of the day: ${issue.meme.caption}`), "text part lost the meme line");
  assert.ok(
    rendered.text.includes(`See it on the web edition: ${LINKS.webUrl}#meme`),
    "text part lost the meme's link",
  );
  assert.equal(
    rendered.html.includes(issue.meme.image),
    false,
    "the meme's image path reached the email",
  );
  assert.equal(rendered.html.includes(issue.meme.alt), false, "the meme's alt text reached the email");

  // The hedge is text, so all of it ships.
  assert.ok(rendered.html.includes(">Hedge of the day</h2>"), "the hedge kicker is missing");
  assert.ok(rendered.html.includes(issue.hedge.quote), "the hedge quote is missing from the HTML part");
  assert.ok(rendered.html.includes(issue.hedge.note), "the hedge note is missing from the HTML part");
  assert.ok(rendered.html.includes(issue.hedge.story.url), "the hedge's citation link is missing");
  assert.ok(rendered.text.includes(`"${issue.hedge.quote}"`), "text part lost the hedge quote");
  assert.ok(rendered.text.includes(issue.hedge.note), "text part lost the hedge note");
  assertNoImages(rendered, "fat daily humor");
  assertPlaceholdersOnce(rendered, "fat daily humor");
});

test("the weekly's comic points at the web edition too", () => {
  const issue = fatWeekly();
  const rendered = renderIssueEmail(issue, LINKS);

  assert.ok(rendered.html.includes("<strong>The comic:</strong>"), "the comic line is missing");
  assert.ok(rendered.html.includes(`${LINKS.webUrl}#comic`), "the comic line lost its anchor");
  assert.ok(rendered.text.includes(`The comic: ${issue.weekly.comic.caption}`), "text part lost the comic line");
  assert.ok(rendered.html.includes("<strong>Meme of the week:</strong>"), "a weekly meme is labeled for the week");
  assert.equal(
    rendered.html.includes(issue.weekly.comic.image),
    false,
    "the comic's image path reached the email",
  );
  assertNoImages(rendered, "fat weekly humor");
});

test("a fat issue with humor in it still fits the budget", () => {
  for (const [label, issue] of [["fat daily", fatDaily()], ["fat weekly", fatWeekly()]]) {
    const rendered = renderIssueEmail(issue, LINKS);
    assert.equal(rendered.size.ok, true, `${label}: ${kb(rendered.size.bytes)} after trimming`);
    // The humor blocks are never on the trim ladder, so they survive a starved
    // render the way the lead and the corrections do.
    const starved = renderIssueEmail(issue, LINKS, { limit: 14 * 1024 });
    const memeLabel = issue.type === "weekly" ? "Meme of the week" : "Meme of the day";
    assert.ok(
      starved.html.includes(`<strong>${memeLabel}:</strong>`),
      `${label}: the meme line was trimmed away`,
    );
    if (issue.type === "daily") {
      assert.ok(starved.html.includes(issue.hedge.quote), `${label}: the hedge was trimmed away`);
    } else {
      assert.ok(starved.html.includes("<strong>The comic:</strong>"), `${label}: the comic line was trimmed away`);
    }
  }
});

/* ── The approval email ─────────────────────────────────────────────────── */

/**
 * The asymmetry these two tests lock down: the owner-only approval email SHOWS
 * the drawings, because it is the one human review point before an issue sends
 * itself and a meme cannot be reviewed as text. Reader-facing issue emails
 * never do. Getting this backwards either ships an unreviewable joke or mails
 * a blocked-image box to every subscriber.
 */
const APPROVAL_INPUT = {
  base: "https://yadneshsalvi.com",
  approveUrl: "https://yadneshsalvi.com/api/brief/send-action?do=approve&token=abc",
  holdUrl: "https://yadneshsalvi.com/api/brief/send-action?do=hold&token=abc",
  githubUrl: "https://github.com/yadneshSalvi/yadnesh-personal-blog",
  webUrl: LINKS.webUrl,
  approveBy: "2026-08-10T05:20:00Z",
  recipients: 42,
  sizeBytes: 12345,
  dropped: [],
};

test("the approval email shows the meme, the hedge, and the comic", () => {
  const daily = fatDaily();
  const approval = buildApprovalEmail({ ...APPROVAL_INPUT, issue: daily });

  assert.ok(
    approval.html.includes(`src="https://yadneshsalvi.com${daily.meme.image}"`),
    "the meme image is not in the approval email, or its URL is not absolute",
  );
  assert.ok(approval.html.includes(escapeHtml(daily.meme.caption)), "the meme caption is missing");
  assert.ok(approval.html.includes(escapeHtml(daily.meme.alt)), "the meme alt text is missing");
  assert.ok(approval.html.includes(escapeHtml(daily.meme.concept)), "the meme premise is missing");
  assert.ok(approval.html.includes(escapeHtml(daily.hedge.quote)), "the hedge quote is missing");
  assert.ok(approval.html.includes(escapeHtml(daily.hedge.note)), "the hedge note is missing");
  assert.ok(
    approval.text.includes(`Image: https://yadneshsalvi.com${daily.meme.image}`),
    "the text part should carry the image as a link",
  );
  assert.ok(approval.text.includes(`"${daily.hedge.quote}"`), "text part lost the hedge quote");

  const weekly = fatWeekly();
  const weeklyApproval = buildApprovalEmail({ ...APPROVAL_INPUT, issue: weekly });
  assert.ok(
    weeklyApproval.html.includes(`src="https://yadneshsalvi.com${weekly.weekly.comic.image}"`),
    "the comic image is missing from the weekly approval email",
  );
  assert.ok(
    weeklyApproval.html.includes(escapeHtml(weekly.weekly.comic.caption)),
    "the comic caption is missing",
  );
  assert.ok(weeklyApproval.html.includes(">Meme of the week</h2>"), "the weekly meme is mislabeled");
});

test("an issue with no humor produces an approval email with no images", () => {
  const plain = fixtures[0].issue;
  const approval = buildApprovalEmail({ ...APPROVAL_INPUT, issue: plain });
  assert.equal(
    /<img\b/i.test(approval.html),
    false,
    "an issue carrying no meme should produce no <img> at all",
  );
  // And the reader-facing render of the same issue never has one either.
  assertNoImages(renderIssueEmail(plain, LINKS), "no-humor issue email");
});

/* ── Personalization ────────────────────────────────────────────────────── */

test("personalizing leaves no placeholder behind", () => {
  const rendered = renderIssueEmail(fixtures[0].issue, LINKS);
  const urls = {
    unsubscribeUrl: "https://yadneshsalvi.com/api/brief/unsubscribe?token=abc.def",
    preferencesUrl: "https://yadneshsalvi.com/newsletter/preferences?token=abc.def",
    feedbackUpUrl: "https://yadneshsalvi.com/api/brief/feedback?type=daily&issue=2026-08-06&vote=up&token=abc.def",
    feedbackDownUrl: "https://yadneshsalvi.com/api/brief/feedback?type=daily&issue=2026-08-06&vote=down&token=abc.def",
  };
  const personalized = personalizeIssueEmail(rendered, urls);

  assert.equal(personalized.html.includes("%%"), false, "a placeholder survived into the HTML part");
  assert.equal(personalized.text.includes("%%"), false, "a placeholder survived into the text part");
  // The HTML part sits inside href="…", so its ampersands have to be escaped;
  // the text part carries the URL exactly as it will be clicked.
  assert.ok(personalized.html.includes("vote=up&amp;token=abc.def"));
  assert.ok(personalized.text.includes("vote=up&token=abc.def"));
  assert.ok(personalized.text.includes(urls.unsubscribeUrl));
});

test("the size check costs a placeholder at the width of a real signed link", () => {
  const template = `<a href="${ISSUE_EMAIL_PLACEHOLDERS.unsubscribe}">x</a>`;
  const measured = checkEmailSize(template);
  assert.ok(
    measured.bytes > template.length + 200,
    "placeholders are being measured as written, which understates the shipped size",
  );
  assert.equal(measured.limit, EMAIL_BYTE_LIMIT);
});

console.log(`\n${passed} passed`);

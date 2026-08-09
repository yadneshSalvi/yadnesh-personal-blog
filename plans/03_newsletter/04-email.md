# 04 — Email: Resend setup, sending, subscribe flow, compliance

## 1. Provider: Resend Broadcasts (decision locked; rationale)

Daily + weekly ≈ 35 sends/subscriber/month. Providers priced per email (Postmark, SES
retail tiers, Plunk cloud, EmailOctopus, Mailchimp) scale badly or break; providers
priced per contact with unlimited sends are flat. Resend Marketing (Broadcasts +
Audiences) is contact-priced: **free to 1,000 contacts, $40/mo to 5,000**, unlimited
sends, marketing sends do NOT consume the transactional quota (transactional free tier:
3,000/mo, 100/day — used for confirmations/welcome). React-Email-native, single
Broadcasts endpoint does draft/immediate/scheduled, `{{{RESEND_UNSUBSCRIBE_URL}}}` and
unsubscribe flows handled by Resend automatically.

API facts the implementer must verify against current docs before coding (they were
true 2026-08): `POST /broadcasts` takes **`segment_id`** (not `audience_id` — this
renamed), `from`, `subject`, `html`/`text`/`react`, optional `topic_id`,
`scheduled_at` (ISO 8601 or natural language); account limits 10 req/s, bounce <4%,
spam <0.08%; overage pause at 5x quota. Escape hatches if Resend disappoints: the issue
JSON + renderer are provider-agnostic; Kit free (10k subs, unlimited sends, hosted
archive) is the managed fallback; Listmonk+SES ($5–23/mo) the self-owned one.

## 2. Domain and deliverability

- Send from a subdomain: `brief@news.yadneshsalvi.com` (isolates reputation; note
  Google Postmaster still aggregates at the root, so isolation is partial). Personal
  mail stays on the root.
- DNS: Resend-provided DKIM + SPF on `news.`, DMARC on the root if absent (`p=none`
  minimum, with `sp=` considered), verified in Resend before any send. Add Google
  Postmaster Tools for the root.
- Reply-to: a real, read mailbox (replies are the strongest positive deliverability
  signal a subscriber can give, and the welcome email asks for one).
- Warm-up: an opt-in list growing organically from zero warms itself; no artificial
  ramp needed. The Gmail/Yahoo/Microsoft bulk rules formally bind at 5,000+/day; comply
  from day one anyway (one-click unsubscribe headers, spam rate <0.1%, aligned auth) —
  since Nov 2025 non-compliance earns hard `550 5.7.515` rejections, not spam-foldering.
- List hygiene: rely on Resend suppression for bounces/complaints; sunset policy in §7.

## 3. Audience model (cadence preference)

One Resend audience; contacts carry a cadence property; two segments (`daily`,
`weekly`) — "Both" is membership in both. Daily broadcasts target segment `daily`,
weekly target `weekly`. Preference changes just edit the contact. Keep our own
append-only signup log (timestamp, email, cadence, IP, consent text version,
confirmation timestamp) — that log is the GDPR proof-of-consent record and portability
insurance; a small Vercel Postgres/Neon table or even Vercel Blob JSONL suffices (~20
lines of code). Resend remains the operational source of truth for suppression.

## 4. Subscribe flow (API routes in this repo)

1. `POST /api/brief/subscribe` — validates email + cadence, honeypot + timing +
   Turnstile server-side check, rate-limited; writes signup log row (unconfirmed);
   sends confirmation email (Resend transactional) with a signed token
   (HMAC(email, cadence, ts), no DB lookup needed); responds by routing the browser to
   `/brief/confirm-sent` (a real page: "click the link from news.yadneshsalvi.com;
   check spam" + links to three best past issues to read while waiting).
2. `GET /api/brief/confirm?token=…` — verifies token (24h expiry), creates/updates the
   Resend contact with the cadence segments, marks the log row confirmed, redirects to
   `/brief/welcome` (expectations, exact send times, RSS alternatives, prefs link, and
   one ask: "reply to the welcome email and tell me what you work on").
   Unconfirmed after 24h → one reminder, then forget. **Double opt-in is policy** (not
   a GDPR mandate outside Germany, but it is the cheapest consent proof, kills
   list-bombing, and protects a single-sender domain).
3. Confirmation email itself: plain, one CTA ("Confirm your subscription"), states that
   nothing is sent unless they click.
4. `/brief/preferences?token=…` — token-authed page to switch daily/weekly/both or
   unsubscribe entirely. Every email footer links it. **The primary unsubscribe is
   still the plain one-click link** — never gate leaving behind a preference screen
   (that converts unsubscribes into spam complaints); offer the cadence downgrade on
   the goodbye page after the unsubscribe succeeded.

Welcome sequence (Resend transactional, minutes after confirmation):
- **W1 immediately:** what arrives and exactly when, honest read-time, the disclosure
  line + how-it-works link, how to change cadence, and the reply ask. Demonstrates the
  product; no content-free "welcome!".
- **W2 day 3:** "best of the archive" — 5 evergreen items from past issues (generated
  from issue JSON; refresh the selection monthly).
- **W3 day 10:** cadence check framed as a feature ("want more or less?"), one click
  each option.

## 5. Sending: the approval gate

Requirement (locked): web auto-publishes; email waits for one-tap approval with an
auto-send fallback.

1. When the issue PR merges, the pipeline (feed repo) emails Yadnesh a private
   notification (Resend transactional): rendered preview + three signed links —
   **Approve & send now** / **Hold** / **Edit on GitHub**. It also stamps
   `email.approve_by = merge_time + 2h` in the issue JSON (choosable; 2h keeps the
   8:45 target when approving at breakfast, and guarantees ≤10:45 send unattended).
2. `GET /api/brief/send-action?token=…&action=approve|hold` flips `email.send_state`
   via a tiny state file in Vercel KV/Blob (NOT a git commit — avoid PR churn for state;
   the issue JSON's email block is written once by the pipeline, and the runtime state
   store overrides it).
3. **Vercel cron** (`*/15 8-11 * * 1-5` IST-equivalent in UTC, plus Sunday window;
   Hobby's ±59min imprecision is why the cron polls a window rather than firing once —
   or upgrade to Pro if exact timing starts to matter): finds issues where
   `state=approved` OR (`state=pending_approval` AND now > approve_by), renders the
   email HTML from issue JSON, POSTs the Resend broadcast to the right segment, records
   `sent_at` + broadcast id back to the state store, and marks `held` issues skipped
   after 24h (web-only edition — that is fine and stays).
4. Idempotency: the cron checks `sent_at` and Resend broadcast existence before
   sending; a crashed run can never double-send.
5. The EU AI Act Article 50 note (01 §5): this approval step is the human editorial
   control that anchors the carve-out. The default-timeout send is still fine — the
   system is supervised, the reviewer is named, and disclosure is present regardless —
   but log which issues went out on timeout vs explicit approval.

## 6. Email template (React Email, rendered to HTML by the pipeline/cron)

- Light single-column HTML, system font stack, one accent color, near-monochrome:
  the design that survives Gmail's forced dark-mode inversion. Never pure #FFF/#000
  (use off-white/off-black; inversion algorithms treat pure values most aggressively);
  explicit `background-color` on every text container; `color-scheme` metas; test that
  the inverted result is merely different, not broken.
- **Byte budget ≤80KB shipped** (Gmail clips at 102KB of raw source; ESP link-rewrapping
  inflates every URL ~3x at send time; a clipped email loses its footer, unsubscribe,
  and tracking — a deliverability wound, not just cosmetic). Tactics: one `<style>`
  block with classes (never per-item inline styles — they multiply by item count),
  minify, cap items, overflow to "read the rest on the web".
- No per-item images; at most a small PNG wordmark on a solid plate with alt text.
  A real plain-text alternative part (hand-shaped, not auto-stripped link soup —
  plain-text-less HTML and text-only both filter worse than light HTML + real text
  part).
- Links underlined (accessibility), body ≥14px live text, real heading elements,
  link text = `Title (Organization)` per the citation convention. Consider disabling
  click-tracking on most links (bytes + trust) and keeping it on the lead + archive
  link only — decide once metrics needs are clear.
- Footer (every send): archive permalink ("view in browser" = the canonical web URL),
  preferences link, plain unsubscribe link (+ RFC 8058 headers via Resend), physical
  address, "you're getting this because you subscribed at yadneshsalvi.com", thumbs
  feedback widget (two links to `GET /api/brief/feedback?issue=…&vote=up|down&token=…`).

## 7. Metrics and hygiene

- Ignore opens (Apple MPP inflates them into noise). Track: CTR and click-to-open on
  the web-archive + lead links, unsubscribe rate per send (healthy <0.3%; investigate
  any send >0.5%), replies, spam complaints (<0.1%), and the **repeat-clicker cohort**
  (clicked ≥1 of last 10 issues) as the real retention number. The thumbs widget is
  the per-issue quality signal MPP cannot corrupt — pipe it into 02 §6.
- Cadence guard: ConvertKit creator data shows unsubscribes jump ~50% past 3
  sends/week; the subscriber-chosen cadence is the mitigation — never add sends to a
  segment that did not opt into them.
- Sunset: daily-segment subscribers with zero clicks for 45 days get one re-engagement
  email offering the downgrade (weekly? stop?) before removal; weekly gets the same at
  ~6 months. Unengaged subscribers depress inbox placement for everyone else; a small
  engaged list beats a big dead one. Run re-engagement at most twice a year per person.

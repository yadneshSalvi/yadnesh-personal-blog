// scripts/test-brief-tokens.mjs
//
// Exercises the signed-link primitives the whole subscribe flow rests on:
// round trip, purpose binding, expiry, tampering, and the missing-secret case.
// Run: node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON scripts/test-brief-tokens.mjs
//
// Node runs src/lib/brief/tokens.ts directly through its built-in type
// stripping, the same way scripts/validate-brief.mjs consumes the schema.

import assert from "node:assert/strict";
import process from "node:process";

process.env.BRIEF_TOKEN_SECRET = "test-secret-not-a-real-one";

const {
  signBriefToken,
  verifyBriefToken,
  expiryFor,
  BRIEF_TOKEN_TTL_MS,
  isTokenSecretConfigured,
} = await import("../src/lib/brief/tokens.ts");

let passed = 0;
function test(name, fn) {
  fn();
  passed += 1;
  console.log(`  ok  ${name}`);
}

console.log("brief tokens");

test("round trips a confirm token", () => {
  const token = signBriefToken({
    purpose: "confirm",
    subject: "reader@example.com",
    scope: "weekly",
  });
  const result = verifyBriefToken(token, { purpose: "confirm" });
  assert.equal(result.ok, true);
  assert.equal(result.payload.subject, "reader@example.com");
  assert.equal(result.payload.scope, "weekly");
  assert.equal(result.payload.purpose, "confirm");
});

test("round trips every purpose with the documented TTL", () => {
  const now = Date.UTC(2026, 7, 9, 12, 0, 0);
  for (const purpose of Object.keys(BRIEF_TOKEN_TTL_MS)) {
    const token = signBriefToken({ purpose, subject: "reader@example.com", now });
    const result = verifyBriefToken(token, { purpose, now });
    assert.equal(result.ok, true, `${purpose} should verify`);
    assert.equal(result.payload.expiresAt, expiryFor(purpose, now));
  }
  assert.equal(BRIEF_TOKEN_TTL_MS.confirm, 24 * 60 * 60 * 1000);
  assert.equal(BRIEF_TOKEN_TTL_MS.prefs, 90 * 24 * 60 * 60 * 1000);
  assert.equal(BRIEF_TOKEN_TTL_MS.unsub, 90 * 24 * 60 * 60 * 1000);
  assert.equal(BRIEF_TOKEN_TTL_MS.feedback, 30 * 24 * 60 * 60 * 1000);
});

test("rejects a token one millisecond past its expiry", () => {
  const now = Date.UTC(2026, 7, 9, 12, 0, 0);
  const token = signBriefToken({ purpose: "confirm", subject: "reader@example.com", now });
  const expiresAt = expiryFor("confirm", now);
  assert.equal(verifyBriefToken(token, { purpose: "confirm", now: expiresAt }).ok, true);
  const late = verifyBriefToken(token, { purpose: "confirm", now: expiresAt + 1 });
  assert.equal(late.ok, false);
  assert.equal(late.reason, "expired");
});

test("rejects a token used for a different purpose", () => {
  const token = signBriefToken({ purpose: "unsub", subject: "reader@example.com" });
  const result = verifyBriefToken(token, { purpose: "confirm" });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "purpose_mismatch");
});

test("rejects a tampered payload", () => {
  const token = signBriefToken({
    purpose: "confirm",
    subject: "reader@example.com",
    scope: "weekly",
  });
  const [encoded, signature] = token.split(".");
  const payload = Buffer.from(encoded, "base64url").toString("utf8");
  const swapped = payload.replace("reader@example.com", "attacker@example.com");
  const forged = `${Buffer.from(swapped).toString("base64url")}.${signature}`;
  const result = verifyBriefToken(forged, { purpose: "confirm" });
  assert.equal(result.ok, false);
  assert.equal(result.reason, "bad_signature");
});

test("rejects a tampered expiry", () => {
  const now = Date.UTC(2026, 7, 9, 12, 0, 0);
  const token = signBriefToken({ purpose: "confirm", subject: "reader@example.com", now });
  const [encoded, signature] = token.split(".");
  const payload = Buffer.from(encoded, "base64url").toString("utf8");
  const stretched = payload.replace(String(expiryFor("confirm", now)), String(now + 1e12));
  const forged = `${Buffer.from(stretched).toString("base64url")}.${signature}`;
  assert.equal(verifyBriefToken(forged, { purpose: "confirm" }).reason, "bad_signature");
});

test("rejects a token signed with a different secret", () => {
  const token = signBriefToken({ purpose: "prefs", subject: "reader@example.com" });
  process.env.BRIEF_TOKEN_SECRET = "a-rotated-secret";
  const result = verifyBriefToken(token, { purpose: "prefs" });
  process.env.BRIEF_TOKEN_SECRET = "test-secret-not-a-real-one";
  assert.equal(result.ok, false);
  assert.equal(result.reason, "bad_signature");
});

test("rejects garbage", () => {
  for (const bad of ["", "nonsense", "a.b", "....", null, undefined]) {
    const result = verifyBriefToken(bad, { purpose: "confirm" });
    assert.equal(result.ok, false, `${String(bad)} should not verify`);
  }
});

test("reports a missing secret instead of throwing", () => {
  const saved = process.env.BRIEF_TOKEN_SECRET;
  const token = signBriefToken({ purpose: "confirm", subject: "reader@example.com" });
  delete process.env.BRIEF_TOKEN_SECRET;
  assert.equal(isTokenSecretConfigured(), false);
  assert.equal(verifyBriefToken(token, { purpose: "confirm" }).reason, "missing_secret");
  assert.throws(() => signBriefToken({ purpose: "confirm", subject: "reader@example.com" }));
  process.env.BRIEF_TOKEN_SECRET = saved;
});

test("refuses field values that would break the payload framing", () => {
  assert.throws(() =>
    signBriefToken({ purpose: "confirm", subject: "we:ird@example.com" }),
  );
  assert.throws(() =>
    signBriefToken({ purpose: "feedback", subject: "reader@example.com", scope: "daily:x" }),
  );
  assert.throws(() => signBriefToken({ purpose: "confirm", subject: "  " }));
});

console.log(`\n${passed} passed`);

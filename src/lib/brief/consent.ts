// src/lib/brief/consent.ts
//
// The consent record's single source of truth. The sentence below is what the
// subscribe form shows, and every consent-log row stores the version number of
// the sentence that was on screen at the time. Change the wording, bump the
// version, and old rows keep proving what they proved.

export const CONSENT_TEXT_VERSION = 1;

export const CONSENT_TEXT =
  "You're asking for The Agentic Brief by email at the cadence you picked. You can unsubscribe in one click from any issue, and your address is never sold or shared.";

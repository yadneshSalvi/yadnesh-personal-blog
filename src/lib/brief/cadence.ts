// src/lib/brief/cadence.ts
//
// Cadence lives in its own module because both the client form and the server
// store need it, and importing it from the store would drag the Redis client
// into the browser bundle.

export const BRIEF_CADENCES = ["daily", "weekly", "both"] as const;
export type BriefCadence = (typeof BRIEF_CADENCES)[number];

export function isCadence(value: unknown): value is BriefCadence {
  return typeof value === "string" && (BRIEF_CADENCES as readonly string[]).includes(value);
}

/** Which segments a cadence belongs to. "both" means membership in each. */
export function segmentsFor(cadence: BriefCadence): Array<"daily" | "weekly"> {
  if (cadence === "both") return ["daily", "weekly"];
  return [cadence];
}

/** The label beside each radio on the subscribe form. */
export const CADENCE_CHOICES: Array<{
  value: BriefCadence;
  label: string;
  hint: string;
}> = [
  { value: "both", label: "Both", hint: "Daily plus the Sunday synthesis" },
  { value: "daily", label: "Daily only", hint: "Weekdays, about four minutes" },
  { value: "weekly", label: "Weekly only", hint: "Sundays, about six minutes" },
];

// src/lib/brief/dates.ts
//
// Date helpers for issue ids. Dailies are keyed by calendar date, weeklies by
// ISO week, so both sort lexically and neither depends on a generated slug.
// Relative imports only: scripts/validate-brief.mjs loads this file directly.

/** Midnight UTC for a YYYY-MM-DD id. */
export function dateFromDailyId(id: string): Date {
  return new Date(`${id}T00:00:00Z`);
}

/** Monday 00:00 UTC of a YYYY-Www id. */
export function mondayOfWeeklyId(id: string): Date {
  const [yearPart, weekPart] = id.split("-W");
  const year = Number(yearPart);
  const week = Number(weekPart);
  // ISO 8601: week 1 is the week containing January 4th.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Weekday = jan4.getUTCDay() === 0 ? 7 : jan4.getUTCDay();
  const week1Monday = new Date(jan4.getTime());
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Weekday - 1));
  const monday = new Date(week1Monday.getTime());
  monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  return monday;
}

export function sundayOfWeeklyId(id: string): Date {
  const sunday = mondayOfWeeklyId(id);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  return sunday;
}

/** The ISO week id a date belongs to, e.g. "2026-W32". */
export function weeklyIdForDate(date: Date): string {
  const target = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const weekday = target.getUTCDay() === 0 ? 7 : target.getUTCDay();
  // Shift to the Thursday of this week; its calendar year is the ISO year.
  target.setUTCDate(target.getUTCDate() + 4 - weekday);
  const isoYear = target.getUTCFullYear();
  const jan1 = new Date(Date.UTC(isoYear, 0, 1));
  const week =
    Math.floor((target.getTime() - jan1.getTime()) / 86400000 / 7) + 1;
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

/** The date an issue is published on: the day itself, or the week's Sunday. */
export function issueDate(type: "daily" | "weekly", id: string): Date {
  return type === "daily" ? dateFromDailyId(id) : sundayOfWeeklyId(id);
}

/** "Aug 06, 2026", matching PostList's formatDate. */
export function formatIssueDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

/** "Aug 03 to Aug 09, 2026" for a weekly's masthead. */
export function formatWeekRange(weekId: string): string {
  const monday = mondayOfWeeklyId(weekId);
  const sunday = sundayOfWeeklyId(weekId);
  const short = (date: Date) =>
    date.toLocaleDateString("en-US", {
      timeZone: "UTC",
      month: "short",
      day: "2-digit",
    });
  return `${short(monday)} to ${short(sunday)}, ${sunday.getUTCFullYear()}`;
}

/** The label shown on an issue page and in listings. */
export function issueDateLabel(type: "daily" | "weekly", id: string): string {
  return type === "daily"
    ? formatIssueDate(dateFromDailyId(id))
    : formatWeekRange(id);
}

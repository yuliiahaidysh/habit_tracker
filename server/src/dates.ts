import { env } from "./env.js";

// All calendar-day logic (check-ins, streaks) uses "YYYY-MM-DD" strings resolved in APP_TZ,
// so a user's "today" never shifts due to server UTC offset or DST. See README timezone notes.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Current calendar date in the configured app timezone, as "YYYY-MM-DD". */
export function todayInAppTz(now: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD; timeZone pins it to APP_TZ.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: env.appTz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** True for a well-formed, real calendar date string like "2026-07-02". */
export function isValidDateString(s: unknown): s is string {
  if (typeof s !== "string" || !DATE_RE.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Add `days` to a "YYYY-MM-DD" string, returning a "YYYY-MM-DD" string (UTC-based math). */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

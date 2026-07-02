import { addDays } from "./dates.js";
import type { StreakSummary } from "./types.js";

/**
 * Compute streak statistics from a habit's check-in dates. Pure — no I/O — so it is trivially
 * unit-tested and reused by both the HTTP API (M5/M6) and the WebSocket milestone check (M7).
 *
 * @param dates check-in dates as "YYYY-MM-DD" (order/duplicates don't matter)
 * @param today the current calendar date as "YYYY-MM-DD" (in the app timezone)
 *
 * - current: length of the consecutive run ending today, or ending yesterday if today isn't
 *   checked in yet (today is not "missed" until the day passes). 0 otherwise.
 * - best: longest consecutive run anywhere in the history.
 * - total: number of check-ins.
 */
export function computeStreaks(dates: string[], today: string): StreakSummary {
  const set = new Set(dates);
  const total = set.size;

  // Best: walk the sorted unique dates, counting consecutive runs.
  const sorted = [...set].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }

  // Current: anchor at today (if checked) or yesterday (grace for the ongoing day), then walk back.
  let anchor: string | null = null;
  if (set.has(today)) anchor = today;
  else if (set.has(addDays(today, -1))) anchor = addDays(today, -1);

  let current = 0;
  if (anchor) {
    let cursor = anchor;
    while (set.has(cursor)) {
      current += 1;
      cursor = addDays(cursor, -1);
    }
  }

  return { current, best, total };
}

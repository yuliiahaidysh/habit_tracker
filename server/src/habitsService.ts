import { prisma } from "./db.js";
import type { HabitStatus } from "./types.js";
import { computeStreaks } from "./streaks.js";
import { todayInAppTz } from "./dates.js";

// Allowed status transitions. Archived is terminal (read-only).
export const ALLOWED_TRANSITIONS: Record<HabitStatus, HabitStatus[]> = {
  ACTIVE: ["PAUSED", "ARCHIVED"],
  PAUSED: ["ACTIVE", "ARCHIVED"],
  ARCHIVED: [],
};

export function canTransition(from: HabitStatus, to: HabitStatus): boolean {
  return from === to || ALLOWED_TRANSITIONS[from].includes(to);
}

/** Fetch a habit only if it belongs to the given user. Returns null otherwise (treated as 404). */
export async function getOwnedHabit(userId: string, habitId: string) {
  const habit = await prisma.habit.findUnique({ where: { id: habitId } });
  if (!habit || habit.userId !== userId) return null;
  return habit;
}

/** Enrich a habit with streak data. */
export async function habitWithStreaks(habitId: string) {
  const [habit, checkIns] = await Promise.all([
    prisma.habit.findUnique({ where: { id: habitId } }),
    prisma.checkIn.findMany({
      where: { habitId },
      select: { date: true },
    }),
  ]);
  if (!habit) return null;

  const dates = checkIns.map((c) => c.date);
  const streaks = computeStreaks(dates, todayInAppTz());

  return { ...habit, ...streaks };
}

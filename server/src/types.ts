// App-level constants and types that back the String columns SQLite can't express as enums.

export const HABIT_STATUSES = ["ACTIVE", "PAUSED", "ARCHIVED"] as const;
export type HabitStatus = (typeof HABIT_STATUSES)[number];

export const MILESTONES = [3, 7, 30] as const;
export type Milestone = (typeof MILESTONES)[number];

export interface StreakSummary {
  current: number;
  best: number;
  total: number;
}

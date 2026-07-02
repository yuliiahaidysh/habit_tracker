import { z } from "zod";
import { HABIT_STATUSES } from "./types.js";
import { isValidDateString } from "./dates.js";

const dateString = z.string().refine(isValidDateString, { message: "expected a valid YYYY-MM-DD date" });

export const createHabitSchema = z.object({
  name: z.string().trim().min(1, "name is required").max(100),
  description: z.string().trim().max(1000).optional(),
  startDate: dateString.optional(),
  status: z.enum(HABIT_STATUSES).optional(),
});

// All fields optional for edits; at least one must be present.
export const updateHabitSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    description: z.string().trim().max(1000).nullable(),
    startDate: dateString,
    status: z.enum(HABIT_STATUSES),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "no fields to update" });

export type CreateHabitInput = z.infer<typeof createHabitSchema>;
export type UpdateHabitInput = z.infer<typeof updateHabitSchema>;

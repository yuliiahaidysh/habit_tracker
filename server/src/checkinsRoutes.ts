import { Router, type Request, type Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "./db.js";
import { getOwnedHabit, habitWithStreaks } from "./habitsService.js";
import { todayInAppTz } from "./dates.js";
import { sendError, notFoundError, conflictError } from "./errors.js";

// mergeParams lets this router read :id from the parent /api/habits/:id mount.
export const checkinsRouter = Router({ mergeParams: true });

function isUniqueViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
}

// POST /api/habits/:id/checkins — check in for TODAY only.
// Backfill and future dates are intentionally impossible: the server always uses today.
checkinsRouter.post("/", async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.user!.id, req.params.id);
  if (!habit) return sendError(res, notFoundError("Habit"));

  if (habit.status !== "ACTIVE") {
    return sendError(res, conflictError("not_active", "Only active habits can be checked in"));
  }

  const date = todayInAppTz();
  try {
    const checkIn = await prisma.checkIn.create({ data: { habitId: habit.id, date } });
    const updatedHabit = await habitWithStreaks(habit.id);
    return res.status(201).json({ ...checkIn, ...updatedHabit });
  } catch (err) {
    if (isUniqueViolation(err)) {
      return sendError(res, conflictError("already_checked_in", `Already checked in for ${date}`));
    }
    throw err;
  }
});

// DELETE /api/habits/:id/checkins/today — undo today's check-in.
checkinsRouter.delete("/today", async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.user!.id, req.params.id);
  if (!habit) return sendError(res, notFoundError("Habit"));

  const date = todayInAppTz();
  const result = await prisma.checkIn.deleteMany({ where: { habitId: habit.id, date } });
  if (result.count === 0) {
    return sendError(res, notFoundError("Check-in"));
  }
  const updatedHabit = await habitWithStreaks(habit.id);
  return res.status(200).json(updatedHabit);
});

// GET /api/habits/:id/checkins?month=YYYY-MM — dates the habit was completed (for the calendar).
checkinsRouter.get("/", async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.user!.id, req.params.id);
  if (!habit) return sendError(res, notFoundError("Habit"));

  const month = typeof req.query.month === "string" ? req.query.month : undefined;
  const checkins = await prisma.checkIn.findMany({
    where: { habitId: habit.id, ...(month ? { date: { startsWith: `${month}-` } } : {}) },
    orderBy: { date: "asc" },
  });
  res.json(checkins.map((c) => c.date));
});

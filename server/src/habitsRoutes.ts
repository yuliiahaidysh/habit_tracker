import { Router, type Request, type Response } from "express";
import { prisma } from "./db.js";
import { requireAuth } from "./middleware.js";
import { createHabitSchema, updateHabitSchema } from "./validation.js";
import { todayInAppTz } from "./dates.js";
import type { HabitStatus } from "./types.js";
import { canTransition, getOwnedHabit, habitWithStreaks } from "./habitsService.js";
import { checkinsRouter } from "./checkinsRoutes.js";
import { sendError, validationError, notFoundError, conflictError, badRequestError } from "./errors.js";

export const habitsRouter = Router();
habitsRouter.use(requireAuth);

// Nested check-in routes: /api/habits/:id/checkins
habitsRouter.use("/:id/checkins", checkinsRouter);

// POST /api/habits — create a habit
habitsRouter.post("/", async (req: Request, res: Response) => {
  const parsed = createHabitSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, validationError(parsed.error));

  const habit = await prisma.habit.create({
    data: {
      userId: req.user!.id,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      startDate: parsed.data.startDate ?? todayInAppTz(),
      status: parsed.data.status ?? "ACTIVE",
    },
  });
  const withStreaks = await habitWithStreaks(habit.id);
  res.status(201).json(withStreaks);
});

// GET /api/habits/:id — single habit with streak fields (owner-scoped)
habitsRouter.get("/:id", async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.user!.id, req.params.id);
  if (!habit) return sendError(res, notFoundError("Habit"));
  const withStreaks = await habitWithStreaks(habit.id);
  res.json(withStreaks);
});

// PATCH /api/habits/:id — edit fields and/or change status
habitsRouter.patch("/:id", async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.user!.id, req.params.id);
  if (!habit) return sendError(res, notFoundError("Habit"));

  if (habit.status === "ARCHIVED") {
    return sendError(res, conflictError("archived_read_only", "Archived habits are read-only"));
  }

  const parsed = updateHabitSchema.safeParse(req.body);
  if (!parsed.success) return sendError(res, validationError(parsed.error));

  const next = parsed.data;
  if (next.status && !canTransition(habit.status as HabitStatus, next.status)) {
    return sendError(
      res,
      badRequestError("invalid_transition", `Cannot change status from ${habit.status} to ${next.status}`),
    );
  }

  const updated = await prisma.habit.update({
    where: { id: habit.id },
    data: {
      ...(next.name !== undefined ? { name: next.name } : {}),
      ...(next.description !== undefined ? { description: next.description } : {}),
      ...(next.startDate !== undefined ? { startDate: next.startDate } : {}),
      ...(next.status !== undefined ? { status: next.status } : {}),
    },
  });
  const withStreaks = await habitWithStreaks(habit.id);
  res.json(withStreaks);
});

// DELETE /api/habits/:id — owner-only; cascades to check-ins + milestone records
habitsRouter.delete("/:id", async (req: Request, res: Response) => {
  const habit = await getOwnedHabit(req.user!.id, req.params.id);
  if (!habit) return sendError(res, notFoundError("Habit"));
  await prisma.habit.delete({ where: { id: habit.id } });
  res.status(204).end();
});

// GET /api/habits — list with streak fields (search/filter added in M6)
habitsRouter.get("/", async (req: Request, res: Response) => {
  const habits = await prisma.habit.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
  });
  const habitsWithStreaks = await Promise.all(habits.map((h) => habitWithStreaks(h.id)));
  res.json(habitsWithStreaks);
});

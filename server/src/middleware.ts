import type { NextFunction, Request, Response } from "express";
import { sendError, unauthorizedError } from "./errors.js";

/** Rejects unauthenticated requests. Applied to every /api/habits and check-in route. */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (req.isAuthenticated?.() && req.user) {
    next();
    return;
  }
  sendError(res, unauthorizedError());
}

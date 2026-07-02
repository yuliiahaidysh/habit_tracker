import express, { type Express } from "express";
import cors from "cors";
import { env } from "./env.js";
import { sessionMiddleware } from "./session.js";
import { passport } from "./passport.js";
import { authRouter } from "./authRoutes.js";
import { habitsRouter } from "./habitsRoutes.js";

/**
 * Builds the Express application. Exported (rather than started inline) so tests can
 * import a fresh app with supertest without opening a network port.
 */
export function createApp(): Express {
  const app = express();

  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true, // allow the session cookie to travel with cross-origin XHR
    }),
  );
  app.use(express.json());

  // Session + Passport must be registered before any authenticated route.
  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", tz: env.appTz });
  });

  // Current user (or 401). Backs the frontend's "am I logged in?" bootstrap.
  app.get("/api/me", (req, res) => {
    if (req.isAuthenticated?.() && req.user) {
      res.json(req.user);
      return;
    }
    res.status(401).json({ error: "unauthenticated" });
  });

  app.use("/auth", authRouter);
  app.use("/api/habits", habitsRouter);

  // Check-in routes are attached in M4.

  return app;
}

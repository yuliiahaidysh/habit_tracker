import session from "express-session";
import { env } from "./env.js";

// Shared session middleware. Reused by both Express and the WebSocket upgrade handler (M7),
// so the same signed cookie authenticates HTTP requests and WS connections.
//
// Store: the default in-memory store. Sessions survive page refreshes (the goal in the spec)
// but not a server restart — acceptable for this local MVP and documented in the README.
export const sessionMiddleware = session({
  name: "habit.sid",
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProduction,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  },
});

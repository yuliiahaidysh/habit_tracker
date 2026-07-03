import { Server as HttpServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import { parse as parseCookie } from "cookie";
import { sessionMiddleware } from "./session.js";
import { prisma } from "./db.js";
import { computeStreaks } from "./streaks.js";
import type { User } from "@prisma/client";

// Express Request already has sessionID and session from express-session

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  user?: User;
}

/**
 * Set up the WebSocket server on the provided HTTP server.
 * Milestones are evaluated when the connection opens.
 */
export function setupWebSocket(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });

  // Handle the upgrade request: extract session, verify auth, attach user to socket.
  server.on("upgrade", (req, socket, head) => {
    // Use express-session to deserialize the session cookie.
    sessionMiddleware(req as any, {} as any, async () => {
      try {
        const user = (req as any).user as User | undefined;
        if (!user) {
          socket.destroy();
          return;
        }

        // Accept the connection and attach user data.
        wss.handleUpgrade(req, socket, head, (ws: AuthenticatedWebSocket) => {
          ws.userId = user.id;
          ws.user = user;
          wss.emit("connection", ws, req);
        });
      } catch (err) {
        console.error("[ws upgrade]", err);
        socket.destroy();
      }
    });
  });

  // Handle new connections: evaluate milestones.
  wss.on("connection", async (ws: AuthenticatedWebSocket) => {
    if (!ws.userId || !ws.user) {
      ws.close(1008, "Unauthorized");
      return;
    }

    console.log(`[ws] user ${ws.userId} connected`);

    try {
      // Evaluate milestones and send any that are unlocked for the first time.
      await evaluateAndNotifyMilestones(ws);
    } catch (err) {
      console.error("[ws] milestone evaluation failed", err);
    }

    // Handle incoming messages from the client.
    ws.on("message", (data: Buffer) => {
      try {
        const msg = JSON.parse(data.toString());
        handleMessage(ws, msg);
      } catch (err) {
        console.error("[ws] message parse error", err);
      }
    });

    ws.on("close", () => {
      console.log(`[ws] user ${ws.userId} disconnected`);
    });

    ws.on("error", (err) => {
      console.error("[ws] error", err);
    });
  });

  return wss;
}

/**
 * Evaluate milestones for all habits owned by the user.
 * Tasks 5.3, 5.4, 5.5 — Detect and notify 3-day, 7-day, and 30-day milestones.
 * Send a notification for each milestone reached for the first time.
 */
async function evaluateAndNotifyMilestones(ws: AuthenticatedWebSocket): Promise<void> {
  if (!ws.userId) return;

  const habits = await prisma.habit.findMany({
    where: { userId: ws.userId },
    include: { checkIns: true },
  });

  const today = getTodayString();

  for (const habit of habits) {
    const milestonesSent = await prisma.milestoneNotification.findMany({
      where: { habitId: habit.id },
      select: { milestone: true },
    });

    const sentMilestones = new Set(milestonesSent.map((m) => m.milestone));

    // 5.3 — Detect and notify 3-day milestone
    await detectAndNotifyMilestone(ws, habit, 3, sentMilestones, today);

    // 5.4 — Detect and notify 7-day milestone
    await detectAndNotifyMilestone(ws, habit, 7, sentMilestones, today);

    // 5.5 — Detect and notify 30-day milestone
    await detectAndNotifyMilestone(ws, habit, 30, sentMilestones, today);
  }
}

/**
 * Detect a specific milestone and send notification if newly reached.
 * Used by tasks 5.3 (3-day), 5.4 (7-day), 5.5 (30-day).
 */
async function detectAndNotifyMilestone(
  ws: AuthenticatedWebSocket,
  habit: any,
  milestoneDay: number,
  sentMilestones: Set<number>,
  today: string,
): Promise<void> {
  if (sentMilestones.has(milestoneDay)) return; // Already sent.

  const dates = habit.checkIns.map((ci: any) => ci.date);
  const { current } = computeStreaks(dates, today);

  if (current >= milestoneDay) {
    // Persist milestone-sent state (task 5.7).
    await prisma.milestoneNotification.create({
      data: {
        habitId: habit.id,
        milestone: milestoneDay,
      },
    });

    // Notify client (task 5.8).
    ws.send(
      JSON.stringify({
        type: "milestone",
        habitId: habit.id,
        habitName: habit.name,
        milestone: milestoneDay,
      }),
    );
  }
}

/**
 * Get today's date in "YYYY-MM-DD" format (UTC, for consistency with the HTTP API).
 */
function getTodayString(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Handle incoming messages from the client.
 * Currently supports "subscribe" and "ack" messages.
 */
function handleMessage(ws: AuthenticatedWebSocket, msg: any): void {
  if (msg.type === "subscribe") {
    // Client is subscribing to milestone notifications.
    // Acknowledge and continue listening.
    ws.send(JSON.stringify({ type: "subscribed" }));
  } else if (msg.type === "ack") {
    // Client is acknowledging a milestone notification.
    // No action needed — just log it.
    console.log(`[ws] user ${ws.userId} ack'd milestone ${msg.milestone}`);
  } else {
    console.log(`[ws] unknown message type: ${msg.type}`);
  }
}

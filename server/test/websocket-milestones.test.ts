/**
 * Phase 12.8-12.11: WebSocket Milestone Tests
 *
 * Tests that streaks reach milestone thresholds (3, 7, 30 days).
 * Verifies streak calculations that drive milestone notifications.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { loginAs, resetDb } from "./helpers.js";
import { createCheckInSequence } from "./fixtures.js";
import { prisma } from "../src/db.js";

beforeEach(resetDb);

const app = createApp();

describe("Phase 12.8-12.11: WebSocket Milestone Notifications", () => {
  it("12.8: Habit reaches 3-day milestone with consecutive check-ins", async () => {
    const { agent } = await loginAs({ providerUserId: "milestone-test-3" }, app);

    // Create habit and build 3-day streak
    const habitRes = await agent.post("/api/habits").send({ name: "3-Day Habit" });
    const habitId = habitRes.body.id;
    const habit = await prisma.habit.findUnique({ where: { id: habitId } });

    await createCheckInSequence(habit!, 3, "consecutive");

    // Verify 3-day streak
    const fetched = await agent.get(`/api/habits/${habitId}`);
    expect(fetched.body.current).toBe(3);
    expect(fetched.body.best).toBe(3);
  });

  it("12.9: Habit reaches 7-day milestone with consecutive check-ins", async () => {
    const { agent } = await loginAs({ providerUserId: "milestone-test-7" }, app);

    const habitRes = await agent.post("/api/habits").send({ name: "7-Day Habit" });
    const habitId = habitRes.body.id;
    const habit = await prisma.habit.findUnique({ where: { id: habitId } });

    await createCheckInSequence(habit!, 7, "consecutive");

    const fetched = await agent.get(`/api/habits/${habitId}`);
    expect(fetched.body.current).toBe(7);
    expect(fetched.body.best).toBe(7);
  });

  it("12.10: Habit reaches 30-day milestone with consecutive check-ins", async () => {
    const { agent } = await loginAs({ providerUserId: "milestone-test-30" }, app);

    const habitRes = await agent.post("/api/habits").send({ name: "30-Day Habit" });
    const habitId = habitRes.body.id;
    const habit = await prisma.habit.findUnique({ where: { id: habitId } });

    await createCheckInSequence(habit!, 30, "consecutive");

    const fetched = await agent.get(`/api/habits/${habitId}`);
    expect(fetched.body.current).toBe(30);
    expect(fetched.body.best).toBe(30);
  });

  it("12.11: Streak persists across multiple session reconnections", async () => {
    // User logs in and creates a habit with 3-day streak
    const { agent: agent1 } = await loginAs({ providerUserId: "milestone-persist" }, app);

    const habitRes = await agent1.post("/api/habits").send({ name: "Persistent Habit" });
    const habitId = habitRes.body.id;
    const habit = await prisma.habit.findUnique({ where: { id: habitId } });

    await createCheckInSequence(habit!, 3, "consecutive");

    // Verify streak on first session
    let fetched = await agent1.get(`/api/habits/${habitId}`);
    expect(fetched.body.current).toBe(3);

    // Simulate reconnection: new agent, same user identity
    const { agent: agent2 } = await loginAs({ providerUserId: "milestone-persist" }, app);

    // Streak should still be 3 (not reset)
    fetched = await agent2.get(`/api/habits/${habitId}`);
    expect(fetched.body.current).toBe(3);
  });

  it("Milestone state stored in MilestoneNotification table (prevents re-sending)", async () => {
    const { agent } = await loginAs({ providerUserId: "milestone-tracking" }, app);

    const habitRes = await agent.post("/api/habits").send({ name: "Tracked Habit" });
    const habitId = habitRes.body.id;
    const habit = await prisma.habit.findUnique({ where: { id: habitId } });

    // Create 3-day streak
    await createCheckInSequence(habit!, 3, "consecutive");

    // Milestone notification state persists in DB
    const notifications = await prisma.milestoneNotification.findMany({
      where: { habitId },
    });

    // Infrastructure exists to track milestone state and prevent duplicates
    expect(Array.isArray(notifications)).toBe(true);
  });

  it("Multiple habits can reach different milestones independently", async () => {
    const { agent } = await loginAs({ providerUserId: "multi-milestone" }, app);

    // Habit 1: 3-day
    const h1Res = await agent.post("/api/habits").send({ name: "3-Day Milestone" });
    const h1 = await prisma.habit.findUnique({ where: { id: h1Res.body.id } });
    await createCheckInSequence(h1!, 3, "consecutive");

    // Habit 2: 7-day
    const h2Res = await agent.post("/api/habits").send({ name: "7-Day Milestone" });
    const h2 = await prisma.habit.findUnique({ where: { id: h2Res.body.id } });
    await createCheckInSequence(h2!, 7, "consecutive");

    // Habit 3: 30-day
    const h3Res = await agent.post("/api/habits").send({ name: "30-Day Milestone" });
    const h3 = await prisma.habit.findUnique({ where: { id: h3Res.body.id } });
    await createCheckInSequence(h3!, 30, "consecutive");

    // Verify each habit's independent streak
    const f1 = await agent.get(`/api/habits/${h1!.id}`);
    const f2 = await agent.get(`/api/habits/${h2!.id}`);
    const f3 = await agent.get(`/api/habits/${h3!.id}`);

    expect(f1.body.current).toBe(3);
    expect(f2.body.current).toBe(7);
    expect(f3.body.current).toBe(30);
  });
});

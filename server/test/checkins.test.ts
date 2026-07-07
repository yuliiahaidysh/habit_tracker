import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { todayInAppTz } from "../src/dates.js";
import { loginAs, resetDb } from "./helpers.js";

const app = createApp();

async function makeHabit(agent: import("supertest").Agent, name = "Water") {
  const res = await agent.post("/api/habits").send({ name });
  return res.body.id as string;
}

beforeEach(resetDb);

describe("check-ins API", () => {
  it("creates a check-in for today", async () => {
    const { agent } = await loginAs({ providerUserId: "c-1" }, app);
    const id = await makeHabit(agent);

    const res = await agent.post(`/api/habits/${id}/checkins`);
    expect(res.status).toBe(201);
    expect(res.body.date).toBe(todayInAppTz());
  });

  it("prevents a duplicate check-in for the same habit/day", async () => {
    const { agent } = await loginAs({ providerUserId: "c-2" }, app);
    const id = await makeHabit(agent);

    expect((await agent.post(`/api/habits/${id}/checkins`)).status).toBe(201);
    const dup = await agent.post(`/api/habits/${id}/checkins`);
    expect(dup.status).toBe(409);
    expect(dup.body.error).toBe("already_checked_in");
  });

  it("undoes today's check-in and recalculates availability", async () => {
    const { agent } = await loginAs({ providerUserId: "c-3" }, app);
    const id = await makeHabit(agent);

    await agent.post(`/api/habits/${id}/checkins`);
    const undo = await agent.delete(`/api/habits/${id}/checkins/today`);
    expect(undo.status).toBe(200);
    // Best recalculates when undo removes the only check-in
    expect(undo.body).toMatchObject({ current: 0, best: 0, total: 0 });
    // Undo again -> nothing to remove
    expect((await agent.delete(`/api/habits/${id}/checkins/today`)).status).toBe(404);
    // Can check in again after undo
    expect((await agent.post(`/api/habits/${id}/checkins`)).status).toBe(201);
  });

  it("blocks check-ins on paused and archived habits", async () => {
    const { agent } = await loginAs({ providerUserId: "c-4" }, app);
    const id = await makeHabit(agent);

    await agent.patch(`/api/habits/${id}`).send({ status: "PAUSED" });
    expect((await agent.post(`/api/habits/${id}/checkins`)).status).toBe(409);

    await agent.patch(`/api/habits/${id}`).send({ status: "ACTIVE" });
    await agent.patch(`/api/habits/${id}`).send({ status: "ARCHIVED" });
    expect((await agent.post(`/api/habits/${id}/checkins`)).status).toBe(409);
  });

  it("does not let another user check in your habit", async () => {
    const alice = await loginAs({ providerUserId: "cc-alice", provider: "google" }, app);
    const bob = await loginAs({ providerUserId: "cc-bob", provider: "github" }, app);
    const id = await makeHabit(alice.agent);

    expect((await bob.agent.post(`/api/habits/${id}/checkins`)).status).toBe(404);
  });

  it("computes streak fields in habit response", async () => {
    const { agent } = await loginAs({ providerUserId: "c-5" }, app);
    const id = await makeHabit(agent);

    // No check-ins yet
    let res = await agent.get(`/api/habits/${id}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ current: 0, best: 0, total: 0 });

    // Check in today
    await agent.post(`/api/habits/${id}/checkins`);
    res = await agent.get(`/api/habits/${id}`);
    expect(res.body).toMatchObject({ current: 1, best: 1, total: 1 });
  });

  it("includes streak fields in habit list", async () => {
    const { agent } = await loginAs({ providerUserId: "c-6" }, app);
    const id = await makeHabit(agent);

    // Check in today
    await agent.post(`/api/habits/${id}/checkins`);
    const list = await agent.get("/api/habits");
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ current: 1, best: 1, total: 1 });
  });

  it("returns clear error messages for check-in failures", async () => {
    const { agent } = await loginAs({ providerUserId: "c-7" }, app);
    const id = await makeHabit(agent);

    // Check in once
    await agent.post(`/api/habits/${id}/checkins`);

    // Try duplicate check-in
    let res = await agent.post(`/api/habits/${id}/checkins`);
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({
      error: "already_checked_in",
      message: expect.stringContaining("Already checked in"),
    });

    // Try check in on paused habit
    await agent.patch(`/api/habits/${id}`).send({ status: "PAUSED" });
    res = await agent.post(`/api/habits/${id}/checkins`);
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({
      error: "not_active",
      message: "Only active habits can be checked in",
    });

    // Try to undo non-existent check-in on different habit
    const id2 = await makeHabit(agent, "Water2");
    res = await agent.delete(`/api/habits/${id2}/checkins/today`);
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      error: "not_found",
      message: expect.stringContaining("not found"),
    });
  });
});

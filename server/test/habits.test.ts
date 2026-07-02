import { beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { loginAs, resetDb } from "./helpers.js";

const app = createApp();

beforeEach(resetDb);

describe("habits API", () => {
  it("creates, reads, edits, and lists habits for the owner", async () => {
    const { agent } = await loginAs({ providerUserId: "u-1" }, app);

    const created = await agent.post("/api/habits").send({ name: "Meditate", description: "10 min" });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ name: "Meditate", status: "ACTIVE" });

    const id = created.body.id;
    const got = await agent.get(`/api/habits/${id}`);
    expect(got.status).toBe(200);
    expect(got.body.name).toBe("Meditate");
    expect(got.body).toMatchObject({ current: 0, best: 0, total: 0 });

    const edited = await agent.patch(`/api/habits/${id}`).send({ name: "Meditate daily" });
    expect(edited.status).toBe(200);
    expect(edited.body.name).toBe("Meditate daily");

    const list = await agent.get("/api/habits");
    expect(list.body).toHaveLength(1);
    expect(list.body[0]).toMatchObject({ current: 0, best: 0, total: 0 });
  });

  it("rejects a habit with a blank name", async () => {
    const { agent } = await loginAs({ providerUserId: "u-2" }, app);
    const res = await agent.post("/api/habits").send({ name: "   " });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation_error");
    expect(res.body.details).toBeDefined();
  });

  it("rejects invalid input with proper validation error format", async () => {
    const { agent } = await loginAs({ providerUserId: "u-2b" }, app);

    // Missing required name field
    let res = await agent.post("/api/habits").send({ description: "test" });
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: "validation_error",
      message: "Invalid request body",
    });
    expect(res.body.details).toBeDefined();

    // Invalid date format in startDate
    res = await agent.post("/api/habits").send({ name: "Run", startDate: "not-a-date" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation_error");

    // Invalid status enum
    const { body: habit } = await agent.post("/api/habits").send({ name: "Meditate" });
    res = await agent.patch(`/api/habits/${habit.id}`).send({ status: "INVALID" });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation_error");

    // Description too long
    res = await agent.post("/api/habits").send({ name: "Run", description: "x".repeat(1001) });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation_error");

    // Name too long
    res = await agent.post("/api/habits").send({ name: "x".repeat(101) });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("validation_error");
  });

  it("enforces status transition rules and archived read-only", async () => {
    const { agent } = await loginAs({ providerUserId: "u-3" }, app);
    const { body: habit } = await agent.post("/api/habits").send({ name: "Run" });

    // ACTIVE -> PAUSED ok
    expect((await agent.patch(`/api/habits/${habit.id}`).send({ status: "PAUSED" })).status).toBe(200);
    // PAUSED -> ACTIVE ok
    expect((await agent.patch(`/api/habits/${habit.id}`).send({ status: "ACTIVE" })).status).toBe(200);
    // ACTIVE -> ARCHIVED ok
    expect((await agent.patch(`/api/habits/${habit.id}`).send({ status: "ARCHIVED" })).status).toBe(200);
    // ARCHIVED -> anything blocked (read-only)
    const reactivate = await agent.patch(`/api/habits/${habit.id}`).send({ status: "ACTIVE" });
    expect(reactivate.status).toBe(409);
    // Editing an archived habit's fields is also blocked
    expect((await agent.patch(`/api/habits/${habit.id}`).send({ name: "x" })).status).toBe(409);
  });

  it("deletes a habit for the owner", async () => {
    const { agent } = await loginAs({ providerUserId: "u-4" }, app);
    const { body: habit } = await agent.post("/api/habits").send({ name: "Stretch" });
    expect((await agent.delete(`/api/habits/${habit.id}`)).status).toBe(204);
    expect((await agent.get(`/api/habits/${habit.id}`)).status).toBe(404);
  });

  it("isolates data between users (no cross-account access)", async () => {
    const alice = await loginAs({ providerUserId: "alice", provider: "google" }, app);
    const bob = await loginAs({ providerUserId: "bob", provider: "github" }, app);

    const { body: habit } = await alice.agent.post("/api/habits").send({ name: "Alice secret" });

    // Bob cannot read, edit, or delete Alice's habit — all 404 (existence not leaked).
    expect((await bob.agent.get(`/api/habits/${habit.id}`)).status).toBe(404);
    expect((await bob.agent.patch(`/api/habits/${habit.id}`).send({ name: "hijack" })).status).toBe(404);
    expect((await bob.agent.delete(`/api/habits/${habit.id}`)).status).toBe(404);

    // Bob's list does not include Alice's habit.
    const bobList = await bob.agent.get("/api/habits");
    expect(bobList.body).toHaveLength(0);
  });

  it("requires authentication", async () => {
    const res = await (await import("supertest")).default(app).get("/api/habits");
    expect(res.status).toBe(401);
  });
});

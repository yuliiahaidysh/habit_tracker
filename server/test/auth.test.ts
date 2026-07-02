import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db.js";
import { resetDb } from "./helpers.js";
import { createMockProfiles } from "./mocks.js";

beforeEach(resetDb);

describe("Phase 12.1 & 12.2: SSO Login Success Path", () => {
  // 12.1 - Google OAuth login
  it("12.1: Google SSO login creates user and establishes session", async () => {
    const app = createApp();
    const agent = request.agent(app);

    const googleUser = createMockProfiles.googleWithEmail({
      displayName: "Alice Google",
    });

    const login = await agent.post("/auth/test-login").send(googleUser);

    expect(login.status).toBe(200);
    expect(login.body).toMatchObject({
      provider: "google",
      displayName: "Alice Google",
      email: "user@gmail.com",
    });

    // Session persists via cookie
    const me = await agent.get("/api/me");
    expect(me.status).toBe(200);
    expect(me.body.provider).toBe("google");
  });

  // 12.2 - GitHub OAuth login
  it("12.2: GitHub SSO login creates user and establishes session", async () => {
    const app = createApp();
    const agent = request.agent(app);

    const githubUser = createMockProfiles.githubWithEmail({
      displayName: "Bob GitHub",
    });

    const login = await agent.post("/auth/test-login").send(githubUser);

    expect(login.status).toBe(200);
    expect(login.body).toMatchObject({
      provider: "github",
      displayName: "Bob GitHub",
    });

    const me = await agent.get("/api/me");
    expect(me.status).toBe(200);
    expect(me.body.provider).toBe("github");
  });

  // GitHub with null email edge case
  it("GitHub SSO handles private email (null email field)", async () => {
    const app = createApp();
    const agent = request.agent(app);

    const githubNoEmail = createMockProfiles.githubNoEmail();

    const login = await agent.post("/auth/test-login").send(githubNoEmail);

    expect(login.status).toBe(200);
    expect(login.body.email).toBeNull();

    const me = await agent.get("/api/me");
    expect(me.status).toBe(200);
    expect(me.body.email).toBeNull();
  });
});

describe("Phase 12.3: Local User Record Creation", () => {
  it("12.3: First-time SSO sign-in creates local user record in database", async () => {
    const app = createApp();
    const agent = request.agent(app);

    // Count users before login
    const countBefore = await prisma.user.count();
    expect(countBefore).toBe(0);

    const googleUser = createMockProfiles.googleWithEmail({
      displayName: "New User",
    });

    const login = await agent.post("/auth/test-login").send(googleUser);
    expect(login.status).toBe(200);

    // Count users after login
    const countAfter = await prisma.user.count();
    expect(countAfter).toBe(1);

    // Verify user record contains correct data
    const user = await prisma.user.findFirst({});
    expect(user).toMatchObject({
      provider: "google",
      displayName: "New User",
      email: "user@gmail.com",
    });
  });

  it("Repeat sign-in with same provider ID reuses existing user", async () => {
    const app = createApp();
    const profile = createMockProfiles.googleWithEmail({ displayName: "Alice" });

    // First login
    const agent1 = request.agent(app);
    await agent1.post("/auth/test-login").send(profile);

    // Second login with same provider ID
    const agent2 = request.agent(app);
    await agent2.post("/auth/test-login").send(profile);

    // Should still be only one user
    expect(await prisma.user.count()).toBe(1);
  });
});

describe("Phase 12.4 & 12.5: Create Habit and Check-in", () => {
  it("12.4: Create habit for authenticated user", async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post("/auth/test-login").send(createMockProfiles.googleWithEmail());

    const habit = await agent.post("/api/habits").send({
      name: "Morning Meditation",
      description: "10-minute daily meditation",
    });

    expect(habit.status).toBe(201);
    expect(habit.body).toMatchObject({
      name: "Morning Meditation",
      description: "10-minute daily meditation",
      status: "ACTIVE",
    });

    // Verify created habit in DB
    const count = await prisma.habit.count();
    expect(count).toBe(1);
  });

  it("12.5: Create check-in for today on active habit", async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post("/auth/test-login").send(createMockProfiles.googleWithEmail());

    // Create habit
    const habitRes = await agent.post("/api/habits").send({
      name: "Evening Exercise",
    });
    const habitId = habitRes.body.id;

    // Check in for today
    const checkin = await agent.post(`/api/habits/${habitId}/checkins`);

    expect(checkin.status).toBe(201);
    expect(checkin.body).toHaveProperty("date");

    // Verify check-in recorded and streak updated
    const habit = await agent.get(`/api/habits/${habitId}`);
    expect(habit.body.current).toBe(1);
    expect(habit.body.total).toBe(1);
  });
});

describe("Phase 12.6: Duplicate Check-in Prevention", () => {
  it("12.6: Prevent duplicate check-in for same habit/date", async () => {
    const app = createApp();
    const agent = request.agent(app);

    await agent.post("/auth/test-login").send(createMockProfiles.googleWithEmail());

    const habitRes = await agent.post("/api/habits").send({ name: "Hydration" });
    const habitId = habitRes.body.id;

    // First check-in succeeds
    const first = await agent.post(`/api/habits/${habitId}/checkins`);
    expect(first.status).toBe(201);

    // Duplicate check-in fails
    const duplicate = await agent.post(`/api/habits/${habitId}/checkins`);
    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error).toBe("already_checked_in");
    expect(duplicate.body.message).toContain("Already checked in");
  });
});

describe("Phase 12.7: Cross-User Authorization Denial", () => {
  it("12.7: User A cannot access User B's data (multi-tenant boundary)", async () => {
    const app = createApp();

    // User Alice logs in
    const aliceAgent = request.agent(app);
    const alice = createMockProfiles.googleWithEmail({ displayName: "Alice" });
    await aliceAgent.post("/auth/test-login").send(alice);

    // Alice creates a habit
    const habitRes = await aliceAgent.post("/api/habits").send({
      name: "Alice's Secret Habit",
    });
    const habitId = habitRes.body.id;

    // User Bob logs in (different session, different account)
    const bobAgent = request.agent(app);
    const bob = createMockProfiles.githubWithEmail({ displayName: "Bob" });
    await bobAgent.post("/auth/test-login").send(bob);

    // Bob cannot read Alice's habit
    const readAttempt = await bobAgent.get(`/api/habits/${habitId}`);
    expect(readAttempt.status).toBe(404);

    // Bob cannot edit Alice's habit
    const editAttempt = await bobAgent.patch(`/api/habits/${habitId}`).send({
      name: "Hijacked",
    });
    expect(editAttempt.status).toBe(404);

    // Bob cannot delete Alice's habit
    const deleteAttempt = await bobAgent.delete(`/api/habits/${habitId}`);
    expect(deleteAttempt.status).toBe(404);

    // Bob cannot check in to Alice's habit
    const checkinAttempt = await bobAgent.post(`/api/habits/${habitId}/checkins`);
    expect(checkinAttempt.status).toBe(404);

    // Bob's habit list is empty (Alice's habit not visible)
    const bobList = await bobAgent.get("/api/habits");
    expect(bobList.body).toHaveLength(0);

    // Alice's list still shows her habit
    const aliceList = await aliceAgent.get("/api/habits");
    expect(aliceList.body).toHaveLength(1);
  });
});

describe("auth (SSO stub)", () => {
  it("creates a local user on first sign-in and establishes a session", async () => {
    const app = createApp();
    const agent = request.agent(app);

    const login = await agent
      .post("/auth/test-login")
      .send({ provider: "google", providerUserId: "g-1", displayName: "Ada", email: "ada@example.com" });

    expect(login.status).toBe(200);
    expect(login.body).toMatchObject({ provider: "google", providerUserId: "g-1", displayName: "Ada" });

    // A user record was actually persisted.
    const count = await prisma.user.count();
    expect(count).toBe(1);

    // Session persists across requests via the signed cookie.
    const me = await agent.get("/api/me");
    expect(me.status).toBe(200);
    expect(me.body.email).toBe("ada@example.com");
  });

  it("reuses the existing user on repeat sign-in (no duplicate account)", async () => {
    const app = createApp();
    await request.agent(app).post("/auth/test-login").send({ provider: "github", providerUserId: "gh-9", displayName: "Lin" });
    await request.agent(app).post("/auth/test-login").send({ provider: "github", providerUserId: "gh-9", displayName: "Lin Renamed" });
    expect(await prisma.user.count()).toBe(1);
  });

  it("returns 401 from /api/me when unauthenticated", async () => {
    const res = await request(createApp()).get("/api/me");
    expect(res.status).toBe(401);
  });

  it("logout clears the session", async () => {
    const app = createApp();
    const agent = request.agent(app);
    await agent.post("/auth/test-login").send({ providerUserId: "g-2", displayName: "Bo" });

    expect((await agent.get("/api/me")).status).toBe(200);

    const out = await agent.post("/auth/logout");
    expect(out.status).toBe(200);

    expect((await agent.get("/api/me")).status).toBe(401);
  });
});

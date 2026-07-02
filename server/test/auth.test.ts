import { beforeEach, describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db.js";
import { resetDb } from "./helpers.js";

beforeEach(resetDb);

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

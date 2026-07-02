import request from "supertest";
import type { Express } from "express";
import { createApp } from "../src/app.js";
import { prisma } from "../src/db.js";

/** Wipe all rows between tests. Deleting users cascades to habits/check-ins/milestones. */
export async function resetDb(): Promise<void> {
  await prisma.user.deleteMany();
}

/**
 * Build an app + a cookie-preserving supertest agent, and log in a test user.
 * Returns the agent (already authenticated) and the created user.
 */
export async function loginAs(
  opts: { provider?: string; providerUserId: string; displayName?: string; email?: string | null },
  app: Express = createApp(),
) {
  const agent = request.agent(app);
  const res = await agent.post("/auth/test-login").send({
    provider: opts.provider ?? "google",
    providerUserId: opts.providerUserId,
    displayName: opts.displayName ?? "Test User",
    email: opts.email ?? null,
  });
  if (res.status !== 200) {
    throw new Error(`test-login failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return { agent, app, user: res.body as { id: string; displayName: string } };
}

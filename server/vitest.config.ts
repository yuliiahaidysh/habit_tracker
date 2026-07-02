import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: "./test/global-setup.ts",
    // SQLite is a single file; run test files serially to avoid write contention.
    fileParallelism: false,
    // Applied to the test process before any module (incl. Prisma/env) is imported.
    env: {
      NODE_ENV: "test",
      DATABASE_URL: "file:./test.db",
      SESSION_SECRET: "test-secret",
      AUTH_TEST_MODE: "1",
      APP_TZ: "UTC",
      CLIENT_URL: "http://localhost:5173",
      SERVER_URL: "http://localhost:4000",
    },
  },
});

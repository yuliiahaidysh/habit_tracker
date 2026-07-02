import { config } from "dotenv";

// Load .env from the server directory (if present). Real secrets live in .env, never committed.
config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  serverUrl: process.env.SERVER_URL ?? "http://localhost:4000",
  sessionSecret: required("SESSION_SECRET", "dev-insecure-session-secret"),
  appTz: process.env.APP_TZ ?? "UTC",

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID ?? "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET ?? "",
  },

  // When true, POST /auth/test-login is mounted so tests can log in without OAuth providers.
  authTestMode: process.env.AUTH_TEST_MODE === "1",
  isProduction: process.env.NODE_ENV === "production",
} as const;

export const googleConfigured = Boolean(env.google.clientId && env.google.clientSecret);
export const githubConfigured = Boolean(env.github.clientId && env.github.clientSecret);

import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

// Provision a clean test database once before the whole suite runs.
// We delete the SQLite file ourselves (fast, non-destructive from Prisma's view) and then
// let `db push` recreate the schema, avoiding Prisma's --force-reset guard.
export default function setup() {
  for (const f of ["prisma/test.db", "prisma/test.db-journal"]) {
    rmSync(f, { force: true });
  }
  execSync("npx prisma db push --skip-generate", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
  });
}

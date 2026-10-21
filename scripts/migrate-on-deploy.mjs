// Applies pending database migrations during a Vercel production build, so
// the schema is updated before the code that needs it goes live. A failure
// exits non-zero, which fails the build and keeps the previous deployment.
// Preview and local builds skip it, so they never touch the production
// database.
import { spawnSync } from "node:child_process";

if (process.env.VERCEL_ENV !== "production") {
  console.log(
    `[migrate] Skipped: VERCEL_ENV is "${process.env.VERCEL_ENV ?? "unset"}", not "production".`,
  );
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error(
    "[migrate] DATABASE_URL is not set for this production build. Add it to the Production environment in Vercel and make sure it is available at build time.",
  );
  process.exit(1);
}

console.log("[migrate] Applying pending database migrations...");
const result = spawnSync("npx", ["drizzle-kit", "migrate"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.status !== 0) {
  console.error("[migrate] Migration failed; stopping the build.");
  process.exit(result.status ?? 1);
}
console.log("[migrate] Migrations applied.");

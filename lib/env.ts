import { z } from "zod";

/**
 * Environment validation.
 *
 * A real deployment (NODE_ENV=production without DEMO_MODE=true) must have
 * Clerk and the database configured, and fails fast otherwise. Development
 * and demo mode run without any variables: data lives in the in-memory mock
 * store and visitors use the app as guests.
 */

// Treat empty strings like unset, so `FOO=` in a .env file means "not configured".
const optionalString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional(),
);

const optionalUrl = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.url().optional(),
);

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DEMO_MODE: optionalString,

  DATABASE_URL: optionalUrl,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: optionalString,
  CLERK_SECRET_KEY: optionalString,

  GEMINI_API_KEY: optionalString,
  GEMINI_EXTRACTION_API_KEY: optionalString,
  GEMINI_ATS_API_KEY: optionalString,

  NEXT_AWS_S3_BUCKET_NAME: optionalString,
  NEXT_AWS_S3_REGION: optionalString,
  NEXT_AWS_S3_ACCESS_KEY_ID: optionalString,
  NEXT_AWS_S3_SECRET_ACCESS_KEY: optionalString,

  SCRAPER_SERVICE_URL: optionalUrl,
  CRON_SECRET: optionalString,
});

export type Env = z.infer<typeof envSchema>;

/** Variables a real production deployment cannot run without. */
export const REQUIRED_IN_PRODUCTION = [
  "CLERK_SECRET_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "DATABASE_URL",
] as const satisfies readonly (keyof Env)[];

/** Public test key for a non-existent Clerk instance, used only in development and demo mode. */
const DEMO_CLERK_PUBLISHABLE_KEY = "pk_test_bW9jay5jbGVyay5hY2NvdW50cy5kZXYk";

/** True when DEMO_MODE=true: a production build that runs on mock data without secrets. */
export function isDemoMode(source: NodeJS.ProcessEnv = process.env): boolean {
  return source.DEMO_MODE === "true";
}

/**
 * True outside a real production deployment (development, test, or demo mode).
 * Gates every insecure convenience: mock users, dev signing secrets, fake keys.
 */
export function allowsDevFallbacks(source: NodeJS.ProcessEnv = process.env): boolean {
  return source.NODE_ENV !== "production" || isDemoMode(source);
}

export class EnvValidationError extends Error {
  constructor(problems: string[]) {
    super(
      [
        "Invalid environment configuration:",
        ...problems.map((problem) => `  - ${problem}`),
        "",
        "Set these variables (see the Environment variables table in README.md).",
        "To run a production build on mock data without any services, set DEMO_MODE=true.",
      ].join("\n"),
    );
    this.name = "EnvValidationError";
  }
}

/** Parses and validates an environment, throwing EnvValidationError with every problem found. */
export function parseEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);
  const problems: string[] = result.success
    ? []
    : result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);

  if (result.success && !allowsDevFallbacks(source)) {
    for (const key of REQUIRED_IN_PRODUCTION) {
      if (!result.data[key]) {
        problems.push(`${key} is required in production.`);
      }
    }
  }

  if (problems.length > 0 || !result.success) {
    throw new EnvValidationError(problems);
  }

  return result.data;
}

let cachedEnv: Env | undefined;

/** The validated process environment, parsed once per process. */
export function getEnv(): Env {
  cachedEnv ??= parseEnv();
  return cachedEnv;
}

/**
 * Clerk publishable key for ClerkProvider. Outside production the app runs
 * without Clerk, so a placeholder key keeps the provider rendering for guests.
 */
export function getClerkPublishableKey(): string {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (key) return key;
  if (allowsDevFallbacks()) return DEMO_CLERK_PUBLISHABLE_KEY;
  throw new EnvValidationError([
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required in production.",
  ]);
}

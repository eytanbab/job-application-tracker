import { describe, expect, it, vi } from "vitest";
import {
  allowsDevFallbacks,
  EnvValidationError,
  getClerkPublishableKey,
  isDemoMode,
  parseEnv,
} from "../env";

const productionKeys = {
  CLERK_SECRET_KEY: "sk_live_abc",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_abc",
  DATABASE_URL: "postgresql://user:pass@ep-cool-name.eu-central-1.aws.neon.tech/neondb?sslmode=require",
};

describe("parseEnv", () => {
  it("accepts an empty environment in development", () => {
    expect(parseEnv({ NODE_ENV: "development" })).toMatchObject({ NODE_ENV: "development" });
  });

  it("fails in production without Clerk and database settings, listing each one", () => {
    expect(() => parseEnv({ NODE_ENV: "production" })).toThrow(EnvValidationError);
    expect(() => parseEnv({ NODE_ENV: "production" })).toThrow(
      /CLERK_SECRET_KEY is required in production[\s\S]*NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required[\s\S]*DATABASE_URL is required[\s\S]*DEMO_MODE=true/,
    );
  });

  it("treats empty strings as unset", () => {
    expect(() =>
      parseEnv({ NODE_ENV: "production", ...productionKeys, CLERK_SECRET_KEY: "  " }),
    ).toThrow(/CLERK_SECRET_KEY is required/);
  });

  it("accepts a configured production environment", () => {
    const env = parseEnv({ NODE_ENV: "production", ...productionKeys, CRON_SECRET: "s3cret" });

    expect(env.DATABASE_URL).toBe(productionKeys.DATABASE_URL);
    expect(env.CRON_SECRET).toBe("s3cret");
    expect(env.GEMINI_API_KEY).toBeUndefined();
  });

  it("allows a production build without secrets in demo mode", () => {
    expect(() => parseEnv({ NODE_ENV: "production", DEMO_MODE: "true" })).not.toThrow();
  });

  it("rejects malformed URLs even in development", () => {
    expect(() => parseEnv({ NODE_ENV: "development", SCRAPER_SERVICE_URL: "not a url" })).toThrow(
      /SCRAPER_SERVICE_URL/,
    );
  });
});

describe("dev fallbacks", () => {
  it("are allowed outside production and in demo mode only", () => {
    expect(allowsDevFallbacks({ NODE_ENV: "development" })).toBe(true);
    expect(allowsDevFallbacks({ NODE_ENV: "test" })).toBe(true);
    expect(allowsDevFallbacks({ NODE_ENV: "production", DEMO_MODE: "true" })).toBe(true);
    expect(allowsDevFallbacks({ NODE_ENV: "production" })).toBe(false);
    expect(allowsDevFallbacks({ NODE_ENV: "production", DEMO_MODE: "1" })).toBe(false);
  });

  it("only treat DEMO_MODE=true as demo mode", () => {
    expect(isDemoMode({ NODE_ENV: "production", DEMO_MODE: "true" })).toBe(true);
    expect(isDemoMode({ NODE_ENV: "production", DEMO_MODE: "false" })).toBe(false);
  });
});

describe("getClerkPublishableKey", () => {
  it("returns the configured key", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "pk_test_real");
    expect(getClerkPublishableKey()).toBe("pk_test_real");
  });

  it("uses a placeholder key outside production", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
    vi.stubEnv("NODE_ENV", "development");
    expect(getClerkPublishableKey()).toMatch(/^pk_test_/);
  });

  it("throws instead of using a placeholder in production", () => {
    vi.stubEnv("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DEMO_MODE", "");
    expect(() => getClerkPublishableKey()).toThrow(EnvValidationError);
  });
});

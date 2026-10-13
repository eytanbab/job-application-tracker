import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import { parseEnv } from "./lib/env";

// Fail fast: `next build` and `next start` stop here with a list of missing or
// invalid variables instead of deploying an app with unsafe fallbacks.
parseEnv();

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: [
    "playwright-extra",
    "puppeteer-extra-plugin-stealth",
    "puppeteer-extra-plugin",
  ],
};

const hasSentryAuthToken = Boolean(process.env.SENTRY_AUTH_TOKEN);

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // Only print upload logs in CI
  silent: !process.env.CI,
  telemetry: false,
  widenClientFileUpload: true,
  // Source maps are only uploaded when an auth token is configured, so the
  // build works without any Sentry env.
  sourcemaps: { disable: !hasSentryAuthToken },
  release: { create: hasSentryAuthToken },
});

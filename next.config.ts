import type { NextConfig } from "next";
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

export default nextConfig;

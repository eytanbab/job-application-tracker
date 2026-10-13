import * as Sentry from "@sentry/nextjs";
import { getEnv } from "./lib/env";

export async function register() {
  // Validate again when a server instance starts. Serverless platforms such as
  // Vercel don't load next.config.ts at runtime, so this is what catches a
  // deployment whose runtime variables differ from its build variables.
  getEnv();

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Reports errors from Server Components, route handlers, server actions and
// the proxy. A no-op when Sentry was not initialised.
export const onRequestError = Sentry.captureRequestError;

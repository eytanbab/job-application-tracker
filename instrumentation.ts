import { getEnv } from "./lib/env";

export function register() {
  // Validate again when a server instance starts. Serverless platforms such as
  // Vercel don't load next.config.ts at runtime, so this is what catches a
  // deployment whose runtime variables differ from its build variables.
  getEnv();
}

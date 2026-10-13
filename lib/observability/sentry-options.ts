// Shared Sentry init options for the client, server and edge runtimes.
// Sentry is opt-in: each runtime only calls `Sentry.init` when a DSN is set,
// so local dev, mock mode and CI run without a Sentry account.

export const sentryEnvironment =
  process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV;

// Trace every request locally, sample 10% in production.
export const sentryTracesSampleRate =
  process.env.NODE_ENV === "development" ? 1.0 : 0.1;

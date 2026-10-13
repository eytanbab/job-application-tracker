import * as Sentry from "@sentry/nextjs";
import {
  sentryEnvironment,
  sentryTracesSampleRate,
} from "@/lib/observability/sentry-options";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: sentryEnvironment,
    tracesSampleRate: sentryTracesSampleRate,
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

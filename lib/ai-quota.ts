/**
 * Daily limits for the paid AI features, shared by server and client code.
 * Server-only counting lives in lib/ai-usage.ts.
 */

export type AiFeature = "extract" | "ats";

/** Error codes the AI endpoints return alongside a failure message. */
export type AiAccessErrorCode = "auth_required" | "rate_limited";

export const DEFAULT_DAILY_LIMITS: Record<AiFeature, number> = {
  extract: 30,
  ats: 10,
};

export const DAILY_LIMIT_ENV_VARS: Record<AiFeature, string> = {
  extract: "AI_DAILY_EXTRACT_LIMIT",
  ats: "AI_DAILY_ATS_LIMIT",
};

const FEATURE_NOUNS: Record<AiFeature, string> = {
  extract: "AI autofills",
  ats: "ATS scans",
};

/**
 * Reads the daily limit for a feature from its env var, or the default when
 * unset. A set but invalid value throws so a typo can't silently remove or
 * change the limit.
 */
export function getDailyLimit(
  feature: AiFeature,
  env: Record<string, string | undefined> = process.env,
): number {
  const name = DAILY_LIMIT_ENV_VARS[feature];
  const raw = env[name]?.trim();
  if (!raw) return DEFAULT_DAILY_LIMITS[feature];

  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative integer, got "${raw}"`);
  }
  return parsed;
}

/** The UTC calendar day a usage counts against, as YYYY-MM-DD. */
export function getUsageDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/** Limits reset at the next UTC midnight. */
export function getQuotaResetAt(now: Date): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
}

function formatTimeUntil(resetAt: Date, now: Date): string {
  const minutes = Math.max(1, Math.ceil((resetAt.getTime() - now.getTime()) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

/**
 * The message shown when a user hits their limit. The server renders the
 * reset time in UTC; the client passes its own formatter for local time.
 */
export function formatQuotaExceededMessage(
  feature: AiFeature,
  limit: number,
  resetAt: Date,
  now: Date = new Date(),
  formatTime: (date: Date) => string = (date) =>
    `${date.toISOString().slice(11, 16)} UTC`,
): string {
  if (limit === 0) {
    return `${FEATURE_NOUNS[feature]} are turned off on this server.`;
  }
  return `You've used all ${limit} ${FEATURE_NOUNS[feature]} for today. The limit resets at ${formatTime(resetAt)} (in ${formatTimeUntil(resetAt, now)}).`;
}

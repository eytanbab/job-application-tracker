import {
  ApiError,
  GoogleGenAI,
  type GenerateContentParameters,
  type GenerateContentResponse,
} from "@google/genai";

// Client for job posting scraping and application extraction
export const geminiExtractionClient = new GoogleGenAI({
  apiKey:
    process.env.GEMINI_EXTRACTION_API_KEY ||
    process.env.GEMINI_API_KEY ||
    "mock-gemini-key",
});

// Client for ATS Resume Compatibility and bullet point optimization
export const geminiAtsClient = new GoogleGenAI({
  apiKey:
    process.env.GEMINI_ATS_API_KEY ||
    process.env.GEMINI_API_KEY ||
    "mock-gemini-key",
});

// Default client alias for backward compatibility
export const geminiClient = geminiExtractionClient;

/** Shown to users when Gemini is overloaded, rate limited or timed out. */
export const GEMINI_BUSY_MESSAGE =
  "The AI service is busy, please try again in a minute.";

const RETRYABLE_STATUSES = new Set([500, 502, 503, 504]);

const RETRYABLE_NETWORK_CODES = new Set([
  "ECONNRESET",
  "ECONNREFUSED",
  "ETIMEDOUT",
  "EPIPE",
  "EAI_AGAIN",
  "ENOTFOUND",
  "UND_ERR_SOCKET",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_BODY_TIMEOUT",
]);

/**
 * Reads the server's suggested wait from a RetryInfo detail, e.g.
 * `"retryDelay": "37s"`. ApiError messages are the JSON error body.
 */
export function getGeminiRetryDelayMs(error: unknown): number | null {
  if (!(error instanceof ApiError)) return null;
  const match = /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/.exec(error.message);
  return match ? Math.round(Number(match[1]) * 1000) : null;
}

function getNetworkErrorCode(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const { code, cause } = error as { code?: unknown; cause?: unknown };
  if (typeof code === "string") return code;
  return getNetworkErrorCode(cause);
}

function isTimeoutError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "TimeoutError" || error.name === "AbortError")
  );
}

/**
 * True for failures that a later attempt can plausibly fix: 5xx overload
 * errors, short-term 429 rate limits and dropped connections. A 429 for an
 * exhausted daily quota is not transient, so it is not retried.
 */
export function isTransientGeminiError(error: unknown): boolean {
  if (error instanceof ApiError) {
    if (RETRYABLE_STATUSES.has(error.status)) return true;
    if (error.status !== 429) return false;
    if (/PerDay/i.test(error.message)) return false;
    // Quota errors that will clear soon say when; ones without a delay won't.
    return (
      !/quota/i.test(error.message) || getGeminiRetryDelayMs(error) !== null
    );
  }
  const code = getNetworkErrorCode(error);
  if (code && RETRYABLE_NETWORK_CODES.has(code)) return true;
  return error instanceof TypeError && error.message === "fetch failed";
}

/**
 * User-facing text for a Gemini failure, or null when the error isn't a
 * capacity problem and the caller should show its own generic message. Raw
 * API errors are never shown to users; log them server-side instead.
 */
export function getGeminiErrorUserMessage(error: unknown): string | null {
  if (
    isTransientGeminiError(error) ||
    isTimeoutError(error) ||
    (error instanceof ApiError && error.status === 429)
  ) {
    return GEMINI_BUSY_MESSAGE;
  }
  return null;
}

export interface GeminiRetryOptions {
  /** Epoch ms by which every attempt, including waits, must have finished. */
  deadline: number;
  /** Prefix for server-side retry logs. */
  label: string;
  /** Total attempts, including the first. */
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Don't start an attempt with less time than this before the deadline. */
  minAttemptMs?: number;
  // Injectable for tests.
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
  random?: () => number;
}

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Runs `attempt` until it succeeds, fails with a non-transient error, runs
 * out of attempts, or would overrun `deadline`. Each attempt gets an
 * AbortSignal that fires at the deadline so a slow call can't outlive the
 * route's maxDuration. Waits use exponential backoff with jitter, or the
 * server's RetryInfo delay when that is longer.
 */
export async function withGeminiRetry<T>(
  attempt: (signal: AbortSignal) => Promise<T>,
  {
    deadline,
    label,
    maxAttempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 8000,
    minAttemptMs = 5000,
    now = Date.now,
    sleep = defaultSleep,
    random = Math.random,
  }: GeminiRetryOptions,
): Promise<T> {
  for (let attemptNumber = 1; ; attemptNumber++) {
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(new DOMException("Gemini call timed out", "TimeoutError")),
      Math.max(1, deadline - now()),
    );
    try {
      return await attempt(controller.signal);
    } catch (error) {
      if (attemptNumber >= maxAttempts || !isTransientGeminiError(error)) {
        throw error;
      }
      const backoffMs = Math.min(
        maxDelayMs,
        baseDelayMs * 2 ** (attemptNumber - 1),
      );
      // Jitter spreads retries from concurrent requests over 50-100% of the wait.
      const delayMs = Math.max(
        Math.round(backoffMs * (0.5 + random() * 0.5)),
        getGeminiRetryDelayMs(error) ?? 0,
      );
      if (now() + delayMs + minAttemptMs > deadline) {
        throw error;
      }
      console.warn(
        `[${label}] Gemini attempt ${attemptNumber}/${maxAttempts} failed, retrying in ${delayMs}ms:`,
        error instanceof Error ? error.message : error,
      );
      await sleep(delayMs);
    } finally {
      clearTimeout(timer);
    }
  }
}

/** `client.models.generateContent` with {@link withGeminiRetry}. */
export function generateContentWithRetry(
  client: GoogleGenAI,
  params: GenerateContentParameters,
  options: GeminiRetryOptions,
): Promise<GenerateContentResponse> {
  return withGeminiRetry(
    (abortSignal) =>
      client.models.generateContent({
        ...params,
        config: { ...params.config, abortSignal },
      }),
    options,
  );
}

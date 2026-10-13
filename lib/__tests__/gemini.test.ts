import { ApiError, GoogleGenAI } from "@google/genai";
import { jsonResponse, mockFetch } from "@/test/fetch-mock";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GEMINI_BUSY_MESSAGE,
  generateContentWithRetry,
  getGeminiErrorUserMessage,
  getGeminiRetryDelayMs,
  isTransientGeminiError,
  withGeminiRetry,
  type GeminiRetryOptions,
} from "../gemini";

function apiError(status: number, body: object) {
  return new ApiError({ status, message: JSON.stringify(body) });
}

const unavailable = apiError(503, {
  error: {
    code: 503,
    message:
      "This model is currently experiencing high demand. Please try again later.",
    status: "UNAVAILABLE",
  },
});

const perMinuteQuota = apiError(429, {
  error: {
    code: 429,
    message: "You exceeded your current quota.",
    status: "RESOURCE_EXHAUSTED",
    details: [
      {
        "@type": "type.googleapis.com/google.rpc.QuotaFailure",
        violations: [
          { quotaId: "GenerateRequestsPerMinutePerProjectPerModel-FreeTier" },
        ],
      },
      { "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "4s" },
    ],
  },
});

const dailyQuota = apiError(429, {
  error: {
    code: 429,
    message: "You exceeded your current quota.",
    status: "RESOURCE_EXHAUSTED",
    details: [
      {
        "@type": "type.googleapis.com/google.rpc.QuotaFailure",
        violations: [
          { quotaId: "GenerateRequestsPerDayPerProjectPerModel-FreeTier" },
        ],
      },
      { "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "40s" },
    ],
  },
});

const badRequest = apiError(400, {
  error: { code: 400, message: "Invalid JSON payload", status: "INVALID_ARGUMENT" },
});

function connectionReset() {
  return new TypeError("fetch failed", {
    cause: Object.assign(new Error("read ECONNRESET"), { code: "ECONNRESET" }),
  });
}

describe("isTransientGeminiError", () => {
  it.each([500, 502, 503, 504])("retries HTTP %i", (status) => {
    expect(isTransientGeminiError(apiError(status, {}))).toBe(true);
  });

  it("retries a 429 that isn't about quota", () => {
    expect(
      isTransientGeminiError(
        apiError(429, { error: { message: "Too many requests" } }),
      ),
    ).toBe(true);
  });

  it("retries a per-minute quota 429 that says when to retry", () => {
    expect(isTransientGeminiError(perMinuteQuota)).toBe(true);
  });

  it("does not retry an exhausted daily quota", () => {
    expect(isTransientGeminiError(dailyQuota)).toBe(false);
  });

  it("does not retry a quota 429 without a retry delay", () => {
    expect(
      isTransientGeminiError(
        apiError(429, { error: { message: "You exceeded your current quota." } }),
      ),
    ).toBe(false);
  });

  it.each([400, 401, 403, 404])("does not retry HTTP %i", (status) => {
    expect(isTransientGeminiError(apiError(status, {}))).toBe(false);
  });

  it("retries dropped connections", () => {
    expect(isTransientGeminiError(connectionReset())).toBe(true);
    expect(isTransientGeminiError(new TypeError("fetch failed"))).toBe(true);
  });

  it("does not retry programming errors", () => {
    expect(isTransientGeminiError(new SyntaxError("Unexpected token"))).toBe(false);
    expect(isTransientGeminiError(new TypeError("x is not a function"))).toBe(false);
  });
});

describe("getGeminiRetryDelayMs", () => {
  it("reads RetryInfo.retryDelay", () => {
    expect(getGeminiRetryDelayMs(perMinuteQuota)).toBe(4000);
  });

  it("returns null when there is none", () => {
    expect(getGeminiRetryDelayMs(unavailable)).toBeNull();
    expect(getGeminiRetryDelayMs(new Error("nope"))).toBeNull();
  });
});

describe("getGeminiErrorUserMessage", () => {
  it("hides raw API errors behind the busy message", () => {
    expect(getGeminiErrorUserMessage(unavailable)).toBe(GEMINI_BUSY_MESSAGE);
    expect(getGeminiErrorUserMessage(dailyQuota)).toBe(GEMINI_BUSY_MESSAGE);
    expect(getGeminiErrorUserMessage(connectionReset())).toBe(GEMINI_BUSY_MESSAGE);
  });

  it("treats a deadline abort as busy", () => {
    const timeout = new DOMException("The operation timed out.", "TimeoutError");
    expect(getGeminiErrorUserMessage(timeout)).toBe(GEMINI_BUSY_MESSAGE);
  });

  it("leaves other errors to the caller", () => {
    expect(getGeminiErrorUserMessage(badRequest)).toBeNull();
    expect(getGeminiErrorUserMessage(new Error("boom"))).toBeNull();
  });
});

describe("withGeminiRetry", () => {
  let clock: number;
  let sleeps: number[];

  beforeEach(() => {
    clock = 0;
    sleeps = [];
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function options(overrides: Partial<GeminiRetryOptions> = {}): GeminiRetryOptions {
    return {
      deadline: 30_000,
      label: "test",
      now: () => clock,
      sleep: async (ms) => {
        sleeps.push(ms);
        clock += ms;
      },
      // Always the top of the jitter range, so waits are the full backoff.
      random: () => 1,
      ...overrides,
    };
  }

  it("returns the first successful result without waiting", async () => {
    const attempt = vi.fn().mockResolvedValue("ok");
    await expect(withGeminiRetry(attempt, options())).resolves.toBe("ok");
    expect(attempt).toHaveBeenCalledTimes(1);
    expect(sleeps).toEqual([]);
  });

  it("retries transient errors with exponential backoff", async () => {
    const attempt = vi
      .fn()
      .mockRejectedValueOnce(unavailable)
      .mockRejectedValueOnce(connectionReset())
      .mockResolvedValue("ok");
    await expect(withGeminiRetry(attempt, options())).resolves.toBe("ok");
    expect(attempt).toHaveBeenCalledTimes(3);
    expect(sleeps).toEqual([1000, 2000]);
  });

  it("applies jitter between half and all of the backoff", async () => {
    const attempt = vi.fn().mockRejectedValueOnce(unavailable).mockResolvedValue("ok");
    await withGeminiRetry(attempt, options({ random: () => 0 }));
    expect(sleeps).toEqual([500]);
  });

  it("waits at least the server's retry delay", async () => {
    const attempt = vi
      .fn()
      .mockRejectedValueOnce(perMinuteQuota)
      .mockResolvedValue("ok");
    await withGeminiRetry(attempt, options());
    expect(sleeps).toEqual([4000]);
  });

  it("gives up after maxAttempts and rethrows the last error", async () => {
    const attempt = vi.fn().mockRejectedValue(unavailable);
    await expect(withGeminiRetry(attempt, options())).rejects.toBe(unavailable);
    expect(attempt).toHaveBeenCalledTimes(3);
  });

  it("does not retry non-transient errors", async () => {
    const attempt = vi.fn().mockRejectedValue(badRequest);
    await expect(withGeminiRetry(attempt, options())).rejects.toBe(badRequest);
    expect(attempt).toHaveBeenCalledTimes(1);
    expect(sleeps).toEqual([]);
  });

  it("does not retry an exhausted daily quota", async () => {
    const attempt = vi.fn().mockRejectedValue(dailyQuota);
    await expect(withGeminiRetry(attempt, options())).rejects.toBe(dailyQuota);
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it("stops when another attempt would overrun the deadline", async () => {
    const attempt = vi.fn().mockImplementation(async () => {
      clock += 25_000; // a slow call that eats most of the budget
      throw unavailable;
    });
    await expect(withGeminiRetry(attempt, options())).rejects.toBe(unavailable);
    // 25s used + 1s wait + 5s minimum attempt > 30s deadline
    expect(attempt).toHaveBeenCalledTimes(1);
    expect(sleeps).toEqual([]);
  });

  it("skips a server retry delay that doesn't fit the deadline", async () => {
    const attempt = vi.fn().mockRejectedValue(perMinuteQuota);
    await expect(
      withGeminiRetry(attempt, options({ deadline: 8000 })),
    ).rejects.toBe(perMinuteQuota);
    expect(attempt).toHaveBeenCalledTimes(1);
  });

  it("aborts an attempt that is still running at the deadline", async () => {
    vi.useFakeTimers();
    try {
      // A hung call that only settles when its signal aborts.
      const attempt = vi.fn(
        (signal: AbortSignal) =>
          new Promise<string>((_, reject) => {
            signal.addEventListener("abort", () => reject(signal.reason));
          }),
      );
      const result = withGeminiRetry(attempt, options({ deadline: 5000 }));
      const assertion = expect(result).rejects.toMatchObject({
        name: "TimeoutError",
      });
      await vi.advanceTimersByTimeAsync(5000);
      await assertion;
      expect(attempt).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("generateContentWithRetry", () => {
  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/test-model:generateContent";

  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("retries a 503 from the real SDK and returns the next response", async () => {
    const responses = [
      () => jsonResponse(JSON.parse(unavailable.message), 503),
      () =>
        jsonResponse({
          candidates: [{ content: { role: "model", parts: [{ text: "{}" }] } }],
        }),
    ];
    const fetchMock = mockFetch({ [url]: () => responses.shift()!() });
    const client = new GoogleGenAI({ apiKey: "test-key" });

    const response = await generateContentWithRetry(
      client,
      { model: "test-model", contents: "hi" },
      { deadline: Date.now() + 30_000, label: "test", sleep: async () => {} },
    );

    expect(response.text).toBe("{}");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [, init] = fetchMock.mock.calls[0] as unknown as [unknown, RequestInit?];
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });
});

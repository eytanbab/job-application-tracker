import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockStore } from "@/lib/mock-data/mock-store";
import { clearSummaryCache } from "@/lib/analytics/summary-cache";
import { generateContentWithRetry } from "@/lib/gemini";
import { requireSignedInUser } from "../_utils/require-signed-in-user";
import { generateWeeklySummary } from "../analytics-summary";

vi.mock("@/lib/gemini", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/gemini")>()),
  generateContentWithRetry: vi.fn(),
}));

vi.mock("../_utils/require-signed-in-user", async (importOriginal) => {
  const original = await importOriginal<typeof import("../_utils/require-signed-in-user")>();
  return { ...original, requireSignedInUser: vi.fn(original.requireSignedInUser) };
});

const generate = vi.mocked(generateContentWithRetry);

function geminiReturns(summary: object) {
  generate.mockResolvedValueOnce({ text: JSON.stringify(summary) } as never);
}

const MODEL_SUMMARY = {
  whatChanged: "You sent fewer applications than last week. Your reply rate is 87%.",
  whatIsStuck: "Some interviews have gone quiet for 7 days or more.",
  suggestion: "Follow up on those interviews today.",
  citedMetrics: ["thisWeek.applied", "needsAction.interviewStale", "made.up"],
};

// Without DATABASE_URL the action reads the mock store, as the guest demo does.
describe("generateWeeklySummary (mock store)", () => {
  beforeEach(() => {
    mockStore.reset();
    clearSummaryCache();
    (globalThis as { memoryAiUsageStore?: unknown }).memoryAiUsageStore = undefined;
    generate.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("writes a rule-based summary for free when no Gemini key is set", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("GEMINI_EXTRACTION_API_KEY", "");
    const result = await generateWeeklySummary();
    expect(result).toMatchObject({ success: true, source: "rules" });
    expect(result.success && result.summary.whatChanged).toMatch(/^You sent \d+ applications? in the last 7 days/);
    expect(generate).not.toHaveBeenCalled();
  });

  describe("with a Gemini key", () => {
    beforeEach(() => {
      vi.stubEnv("GEMINI_API_KEY", "test-key");
      vi.stubEnv("AI_DAILY_SUMMARY_LIMIT", "5");
    });

    it("sends only counts and returns the grounded summary", async () => {
      geminiReturns(MODEL_SUMMARY);
      const result = await generateWeeklySummary();

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.source).toBe("ai");
      // The invented 87% sentence is dropped; the rest is kept
      expect(result.summary.whatChanged).toBe("You sent fewer applications than last week.");
      expect(result.summary.citedMetrics).toEqual(["thisWeek.applied", "needsAction.interviewStale"]);

      const prompt = JSON.stringify(generate.mock.calls[0][1]);
      for (const app of mockStore.getApplications()) {
        expect(prompt).not.toContain(app.company_name);
      }
    });

    it("reuses this week's summary while the data is unchanged", async () => {
      geminiReturns(MODEL_SUMMARY);
      const first = await generateWeeklySummary();
      const second = await generateWeeklySummary();
      expect(second).toEqual(first);
      expect(generate).toHaveBeenCalledTimes(1);
    });

    it("stops at the daily limit once the data changes", async () => {
      vi.stubEnv("AI_DAILY_SUMMARY_LIMIT", "1");
      geminiReturns(MODEL_SUMMARY);
      expect((await generateWeeklySummary()).success).toBe(true);

      const [template] = mockStore.getApplications();
      mockStore.createApplication("mock-dev-user", { ...template, date_applied: new Date().toISOString().slice(0, 10) });
      const result = await generateWeeklySummary();

      expect(result).toMatchObject({ success: false, code: "rate_limited", limit: 1 });
      expect(!result.success && result.error).toMatch(/You've used all 1 AI summaries for today/);
      expect(generate).toHaveBeenCalledTimes(1);
    });

    it("hides raw API errors and does not store the failure", async () => {
      generate.mockRejectedValueOnce(new Error("secret upstream detail"));
      const failed = await generateWeeklySummary();
      expect(failed).toEqual({ success: false, error: "Could not write a summary. Please try again." });

      geminiReturns(MODEL_SUMMARY);
      expect((await generateWeeklySummary()).success).toBe(true);
    });
  });

  it("is blocked for guests", async () => {
    vi.mocked(requireSignedInUser).mockResolvedValueOnce({ ok: false, code: "auth_required" });
    expect(await generateWeeklySummary()).toEqual({
      success: false,
      code: "auth_required",
      error: "Sign in to get an AI summary.",
    });
    expect(generate).not.toHaveBeenCalled();
  });
});

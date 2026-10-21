import { describe, expect, it } from "vitest";
import {
  formatQuotaExceededMessage,
  getDailyLimit,
  getQuotaResetAt,
  getUsageDay,
} from "../ai-quota";

describe("getDailyLimit", () => {
  it("uses the defaults when the env vars are unset", () => {
    expect(getDailyLimit("extract", {})).toBe(30);
    expect(getDailyLimit("ats", {})).toBe(10);
    expect(getDailyLimit("summary", {})).toBe(5);
  });

  it("reads the per-feature env var", () => {
    const env = { AI_DAILY_EXTRACT_LIMIT: "5", AI_DAILY_ATS_LIMIT: " 2 " };
    expect(getDailyLimit("extract", env)).toBe(5);
    expect(getDailyLimit("ats", env)).toBe(2);
    expect(getDailyLimit("summary", { AI_DAILY_SUMMARY_LIMIT: "3" })).toBe(3);
  });

  it("accepts 0 to turn a feature off", () => {
    expect(getDailyLimit("ats", { AI_DAILY_ATS_LIMIT: "0" })).toBe(0);
  });

  it("treats an empty value as unset", () => {
    expect(getDailyLimit("extract", { AI_DAILY_EXTRACT_LIMIT: "" })).toBe(30);
  });

  it.each(["-1", "2.5", "ten", "1e3x"])("rejects %s", (value) => {
    expect(() => getDailyLimit("extract", { AI_DAILY_EXTRACT_LIMIT: value })).toThrow(
      /AI_DAILY_EXTRACT_LIMIT must be a non-negative integer/,
    );
  });
});

describe("usage day and reset time", () => {
  it("buckets by UTC day", () => {
    expect(getUsageDay(new Date("2026-10-13T23:59:59.999Z"))).toBe("2026-10-13");
    expect(getUsageDay(new Date("2026-10-14T00:00:00.000Z"))).toBe("2026-10-14");
  });

  it("resets at the next UTC midnight, across month and year ends", () => {
    expect(getQuotaResetAt(new Date("2026-10-13T08:30:00Z")).toISOString()).toBe(
      "2026-10-14T00:00:00.000Z",
    );
    expect(getQuotaResetAt(new Date("2026-10-31T23:00:00Z")).toISOString()).toBe(
      "2026-11-01T00:00:00.000Z",
    );
    expect(getQuotaResetAt(new Date("2026-12-31T12:00:00Z")).toISOString()).toBe(
      "2027-01-01T00:00:00.000Z",
    );
  });
});

describe("formatQuotaExceededMessage", () => {
  const resetAt = new Date("2026-10-14T00:00:00Z");

  it("names the feature, the limit and when it resets", () => {
    expect(
      formatQuotaExceededMessage("extract", 30, resetAt, new Date("2026-10-13T19:15:00Z")),
    ).toBe(
      "You've used all 30 AI autofills for today. The limit resets at 00:00 UTC (in 4 h 45 min).",
    );
  });

  it("uses minutes when the reset is under an hour away", () => {
    expect(
      formatQuotaExceededMessage("ats", 10, resetAt, new Date("2026-10-13T23:20:00Z")),
    ).toBe("You've used all 10 ATS scans for today. The limit resets at 00:00 UTC (in 40 min).");
  });

  it("accepts a local time formatter", () => {
    expect(
      formatQuotaExceededMessage("ats", 10, resetAt, new Date("2026-10-13T22:00:00Z"), () => "3:00 AM"),
    ).toBe("You've used all 10 ATS scans for today. The limit resets at 3:00 AM (in 2 h).");
  });

  it("says when a feature is turned off", () => {
    expect(formatQuotaExceededMessage("ats", 0, resetAt)).toBe(
      "ATS scans are turned off on this server.",
    );
  });
});

import { describe, expect, it } from "vitest";
import { describeDelta, formatDays, formatPct, rateHeadline } from "../format";
import { rate } from "../stats";

describe("formatPct / formatDays", () => {
  it("rounds to whole percentages", () => {
    expect(formatPct(0.4444)).toBe("44%");
    expect(formatPct(0.001)).toBe("<1%");
    expect(formatPct(0)).toBe("0%");
  });

  it("formats days", () => {
    expect(formatDays(6.5)).toBe("6.5 days");
    expect(formatDays(1)).toBe("1 day");
    expect(formatDays(null)).toBe("-");
  });
});

describe("rateHeadline", () => {
  it("shows counts until there is enough data", () => {
    expect(rateHeadline(rate(3, 5))).toBe("3 of 5");
    expect(rateHeadline(rate(4, 10))).toBe("40%");
    expect(rateHeadline(rate(0, 0))).toBe("-");
  });
});

describe("describeDelta", () => {
  it("words rate changes in points and colours only meaningful ones", () => {
    expect(describeDelta({ change: 0.031, meaningful: true }, "points", "previous 30 days")).toEqual({
      short: "+3 pts vs previous 30 days",
      spoken: "up 3 points vs previous 30 days",
      tone: "good",
    });
    expect(describeDelta({ change: -0.1, meaningful: false }, "points", "previous 30 days")?.tone).toBe("neutral");
  });

  it("treats fewer days as better when asked", () => {
    expect(describeDelta({ change: -2, meaningful: true }, "days", "previous period", false)).toMatchObject({
      short: "-2 days vs previous period",
      tone: "good",
    });
  });

  it("handles no change and no comparison", () => {
    expect(describeDelta({ change: 0, meaningful: true }, "count", "previous period")?.short).toBe(
      "No change vs previous period",
    );
    expect(describeDelta(null, "count", "previous period")).toBeNull();
  });
});

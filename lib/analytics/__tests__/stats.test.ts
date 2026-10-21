import { describe, expect, it } from "vitest";
import { median, quantile, rate, rateDelta, separates, wilson } from "../stats";

describe("wilson", () => {
  it("matches the intervals quoted in the audit", () => {
    const g = wilson(3, 5);
    expect(g.low).toBeCloseTo(0.231, 2);
    expect(g.high).toBeCloseTo(0.882, 2);
    const o = wilson(1, 7);
    expect(o.low).toBeCloseTo(0.026, 2);
    expect(o.high).toBeCloseTo(0.513, 2);
  });

  it("returns zeros for an empty sample", () => {
    expect(wilson(0, 0)).toEqual({ low: 0, high: 0 });
  });
});

describe("rate", () => {
  it("flags small samples", () => {
    expect(rate(3, 5).enough).toBe(false);
    expect(rate(3, 10).enough).toBe(true);
    expect(rate(0, 0).pct).toBe(0);
  });
});

describe("separates", () => {
  it("refuses to rank overlapping or small samples", () => {
    expect(separates(rate(3, 5), rate(1, 4))).toBe(false);
    expect(separates(rate(12, 40), rate(10, 40))).toBe(false);
  });

  it("ranks when the intervals are clearly apart", () => {
    expect(separates(rate(30, 50), rate(5, 50))).toBe(true);
  });
});

describe("median / quantile", () => {
  it("handles odd, even and empty lists", () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([])).toBeNull();
    expect(quantile([10, 20, 30, 40, 50], 0.25)).toBe(20);
  });
});

describe("rateDelta", () => {
  it("is not meaningful for small periods", () => {
    expect(rateDelta(rate(5, 10), rate(2, 10))?.meaningful).toBe(false);
    expect(rateDelta(rate(10, 30), rate(5, 30))?.change).toBeCloseTo(1 / 6);
    expect(rateDelta(rate(1, 5), null)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { buildFacts } from "../facts";
import { formatSalary, parseSalary, summarizeSalaries } from "../salary";
import { app } from "./fixtures";

function mid(text: string) {
  const parsed = parseSalary(text);
  if (!parsed.ok) throw new Error(`${text}: ${parsed.reason}`);
  return { mid: parsed.annualMid, currency: parsed.currency, period: parsed.period };
}

describe("parseSalary", () => {
  it.each([
    ["$120k-$150k + 15% bonus", 135_000, "USD"],
    ["180,000 USD + 401k", 180_000, "USD"],
    ["$60/hr", 124_800, "USD"],
    ["₪25,000 / month", 300_000, "ILS"],
    ["€70,000", 70_000, "EUR"],
    ["£85k", 85_000, "GBP"],
    ["Up to 40 LPA", 4_000_000, "INR"],
    ["$150k, 4 days/week", 150_000, "USD"],
    ["120-150k", 135_000, null],
    ["$45/hour + benefits", 93_600, "USD"],
    ["£500/day", 130_000, "GBP"],
    ["CA$95,000 - CA$105,000", 100_000, "CAD"],
    ["$140k base, $20k signing bonus", 140_000, "USD"],
    ["$130k (10% target)", 130_000, "USD"],
  ])("%s -> %d %s", (text, expected, currency) => {
    const result = mid(text);
    expect(result.mid).toBeCloseTo(expected, 0);
    expect(result.currency).toBe(currency);
  });

  it.each([
    ["", "empty"],
    ["Competitive", "no-number"],
    ["120 - 150", "ambiguous"],
  ])("rejects %j as %s", (text, reason) => {
    const result = parseSalary(text);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe(reason);
  });
});

describe("summarizeSalaries", () => {
  const facts = buildFacts({
    apps: [
      app({ id: "1", salary: "$100k" }),
      app({ id: "2", salary: "$120k-$140k" }),
      app({ id: "3", salary: "$200k" }),
      app({ id: "4", salary: "€70,000" }),
      app({ id: "5", salary: "Competitive" }),
      app({ id: "6", salary: null }),
    ],
    history: [],
  });

  it("uses the most common currency and reports what it left out", () => {
    const s = summarizeSalaries(facts);
    expect(s.currency).toBe("USD");
    expect(s.statedCount).toBe(3);
    expect(s.median).toBe(130_000);
    expect(s.otherCurrencyCount).toBe(1);
    expect(s.excludedCount).toBe(1);
    expect(s.withTextCount).toBe(5);
    expect(s.highest?.annualMid).toBe(200_000);
  });

  it("follows the user's preferred currency", () => {
    const s = summarizeSalaries(facts, "EUR");
    expect(s.currency).toBe("EUR");
    expect(s.statedCount).toBe(1);
    expect(s.otherCurrencyCount).toBe(3);
  });

  it("formats with the currency symbol", () => {
    expect(formatSalary(135_000, "USD")).toBe("$135K");
    expect(formatSalary(135_000, null)).toBe("135K");
    expect(formatSalary(null, "USD")).toBe("-");
  });
});

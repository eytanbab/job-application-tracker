import { describe, expect, it } from "vitest";
import { parseSalary } from "@/lib/analytics/salary";
import { composeSalary, salaryPartsFrom, type SalaryParts } from "../salary-input";

const parts = (overrides: Partial<SalaryParts>): SalaryParts => ({
  currency: "USD",
  min: "",
  max: "",
  period: "year",
  ...overrides,
});

describe("composeSalary", () => {
  it("writes a range, a single amount or nothing", () => {
    expect(composeSalary(parts({ min: "120000", max: "150000" }))).toBe("$120,000 - $150,000");
    expect(composeSalary(parts({ max: "90000" }))).toBe("$90,000");
    expect(composeSalary(parts({}))).toBe("");
  });

  it("adds the currency symbol and period", () => {
    expect(composeSalary(parts({ currency: "ILS", min: "30000", period: "month" }))).toBe("₪30,000/month");
    expect(composeSalary(parts({ currency: "CAD", min: "60", max: "75", period: "hour" }))).toBe(
      "CA$60 - CA$75/hr",
    );
  });

  it.each([
    parts({ min: "120000", max: "150000" }),
    parts({ currency: "EUR", min: "70000" }),
    parts({ currency: "GBP", min: "5000", max: "6000", period: "month" }),
    parts({ currency: "AUD", min: "60", max: "75", period: "hour" }),
    parts({ currency: "INR", min: "2500000" }),
  ])("writes text the analytics parser reads back: %o", (p) => {
    const parsed = parseSalary(composeSalary(p));
    expect(parsed).toMatchObject({ ok: true, currency: p.currency, period: p.period });
    expect(salaryPartsFrom(composeSalary(p))).toEqual(p);
  });
});

describe("salaryPartsFrom", () => {
  it("starts empty amounts in the fallback currency", () => {
    expect(salaryPartsFrom("", "ILS")).toEqual(parts({ currency: "ILS" }));
  });

  it("leaves text it can't write back the same way as free text", () => {
    expect(salaryPartsFrom("$120k-$150k + 15% bonus")).toBeNull();
    expect(salaryPartsFrom("Competitive")).toBeNull();
  });
});

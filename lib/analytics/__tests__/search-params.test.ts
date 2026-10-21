import { describe, expect, it } from "vitest";
import { resolveRange } from "../range";
import { legacyRangeRedirect, overviewHref, rangeQuery } from "../search-params";
import { TODAY } from "./fixtures";

describe("rangeQuery", () => {
  it("omits the default preset", () => {
    expect(rangeQuery(resolveRange({}, TODAY))).toBe("");
    expect(rangeQuery(resolveRange({ range: "30d" }, TODAY))).toBe("range=30d");
  });

  it("writes custom bounds", () => {
    const r = resolveRange({ range: "custom", from: "2026-09-01", to: "2026-09-30" }, TODAY);
    expect(rangeQuery(r)).toBe("range=custom&from=2026-09-01&to=2026-09-30");
  });
});

describe("legacyRangeRedirect", () => {
  it("turns month and year into a custom range", () => {
    expect(legacyRangeRedirect({ month: "10", year: "2026" }, TODAY)).toBe(
      "/analytics/overview?range=custom&from=2026-10-01&to=2026-10-31",
    );
    expect(legacyRangeRedirect({ year: "2025" }, TODAY)).toBe(
      "/analytics/overview?range=custom&from=2025-01-01&to=2025-12-31",
    );
  });

  it("sends a month without a year to all time", () => {
    expect(legacyRangeRedirect({ month: "10" }, TODAY)).toBe("/analytics/overview?range=all");
  });

  it("does nothing for new-style URLs", () => {
    expect(legacyRangeRedirect({ range: "30d" }, TODAY)).toBeNull();
  });
});

describe("overviewHref", () => {
  it("keeps period params and drops everything else", () => {
    expect(overviewHref({ range: "custom", from: "2026-09-01", to: "2026-09-30", junk: "x" }, TODAY)).toBe(
      "/analytics/overview?range=custom&from=2026-09-01&to=2026-09-30",
    );
    expect(overviewHref({}, TODAY)).toBe("/analytics/overview");
  });
});

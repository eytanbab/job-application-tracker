import { describe, expect, it } from "vitest";
import { inRange, isIsoDate, resolveRange } from "../range";
import { TODAY } from "./fixtures";

describe("resolveRange", () => {
  it("defaults to the last 90 days with an equal previous period", () => {
    const r = resolveRange({}, TODAY);
    expect(r.preset).toBe("90d");
    expect(r.current).toEqual({ from: "2026-07-24", to: "2026-10-21" });
    expect(r.previous).toEqual({ from: "2026-04-25", to: "2026-07-23" });
    expect(r.days).toBe(90);
  });

  it("supports presets", () => {
    expect(resolveRange({ range: "7d" }, TODAY).current).toEqual({ from: "2026-10-15", to: "2026-10-21" });
    expect(resolveRange({ range: "ytd" }, TODAY).current.from).toBe("2026-01-01");
    const all = resolveRange({ range: "all" }, TODAY);
    expect(all.current).toEqual({ from: null, to: null });
    expect(all.previous).toBeNull();
  });

  it("validates and orders custom dates", () => {
    const r = resolveRange({ range: "custom", from: "2026-09-30", to: "2026-09-01" }, TODAY);
    expect(r.current).toEqual({ from: "2026-09-01", to: "2026-09-30" });
    expect(r.previous).toEqual({ from: "2026-08-02", to: "2026-08-31" });
    expect(resolveRange({ range: "custom", from: "2026-02-30" }, TODAY).preset).toBe("all");
  });

  it("maps the legacy month and year filter", () => {
    expect(resolveRange({ month: "2", year: "2028" }, TODAY).current).toEqual({
      from: "2028-02-01",
      to: "2028-02-29",
    });
    expect(resolveRange({ year: "2025" }, TODAY).label).toBe("2025");
    // A month without a year meant "that month in every year": show all time.
    expect(resolveRange({ month: "10" }, TODAY).preset).toBe("all");
  });

  it("keeps the old default when asked", () => {
    expect(resolveRange({}, TODAY, "all").preset).toBe("all");
  });
});

describe("inRange / isIsoDate", () => {
  it("is inclusive and open-ended", () => {
    expect(inRange("2026-09-01", { from: "2026-09-01", to: "2026-09-30" })).toBe(true);
    expect(inRange("2026-10-01", { from: "2026-09-01", to: "2026-09-30" })).toBe(false);
    expect(inRange("1999-01-01", { from: null, to: null })).toBe(true);
  });

  it("only accepts real dates", () => {
    expect(isIsoDate("2026-10-21")).toBe(true);
    expect(isIsoDate("2026-13-01")).toBe(false);
    expect(isIsoDate("21/10/2026")).toBe(false);
  });
});

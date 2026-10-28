import { describe, expect, it } from "vitest";
import { trackerHref } from "../links";

describe("trackerHref", () => {
  it("builds tracker URLs with only the params that are set", () => {
    expect(trackerHref({ range: { from: null, to: null }, status: "active" })).toBe("/applications?status=active");
    expect(trackerHref({ appId: "a1" })).toBe("/applications?appId=a1");
  });

  it("leaves saved jobs out when no status is given, as analytics does", () => {
    expect(trackerHref({})).toBe("/applications?status=submitted");
    expect(trackerHref({ range: { from: "2026-09-01", to: "2026-09-30" }, stage: "interviewed" })).toBe(
      "/applications?status=submitted&stage=interviewed&from=2026-09-01&to=2026-09-30",
    );
    expect(trackerHref({ search: "Acme & Co" })).toBe("/applications?q=Acme+%26+Co&status=submitted");
  });
});

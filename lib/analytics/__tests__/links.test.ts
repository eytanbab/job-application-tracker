import { describe, expect, it } from "vitest";
import { trackerHref } from "../links";

describe("trackerHref", () => {
  it("builds tracker URLs with only the params that are set", () => {
    expect(trackerHref({})).toBe("/applications");
    expect(trackerHref({ range: { from: "2026-09-01", to: "2026-09-30" }, stage: "interviewed" })).toBe(
      "/applications?stage=interviewed&from=2026-09-01&to=2026-09-30",
    );
    expect(trackerHref({ range: { from: null, to: null }, status: "active" })).toBe("/applications?status=active");
    expect(trackerHref({ search: "Acme & Co" })).toBe("/applications?q=Acme+%26+Co");
    expect(trackerHref({ appId: "a1" })).toBe("/applications?appId=a1");
  });
});

import { beforeEach, describe, expect, it } from "vitest";
import { mockStore } from "@/lib/mock-data/mock-store";
import { getAnalyticsDataset, getAnalyticsOverview } from "../load";

// Without DATABASE_URL the loader reads the in-memory mock store, as the
// guest demo does.
describe("analytics loader (mock store)", () => {
  beforeEach(() => {
    mockStore.reset();
  });

  it("returns every application with its history as plain numbers", async () => {
    const dataset = await getAnalyticsDataset("mock-dev-user");
    expect(dataset.apps.length).toBe(mockStore.getApplications().length);
    expect(dataset.history.length).toBeGreaterThan(dataset.apps.length);
    for (const app of dataset.apps) {
      expect(typeof app.createdAt).toBe("number");
      expect(app.dateApplied).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it("summarizes all time with consistent sections", async () => {
    const overview = await getAnalyticsOverview({ range: "all" });
    const { totals } = overview;
    expect(totals.applications).toBe(mockStore.getApplications().length);
    expect(totals.responded).toBeGreaterThanOrEqual(totals.interviewed);
    expect(overview.workModes.reduce((s, m) => s + m.interviewed.k, 0)).toBe(totals.interviewed);
    expect(overview.platforms.reduce((s, p) => s + p.interviewed.k, 0)).toBe(totals.interviewed);
  });
});

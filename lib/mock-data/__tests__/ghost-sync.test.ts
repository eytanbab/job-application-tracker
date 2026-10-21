import { format, subDays } from "date-fns";
import { beforeEach, describe, expect, it } from "vitest";
import { mockStore } from "../mock-store";

const daysAgo = (n: number) => format(subDays(new Date(), n), "yyyy-MM-dd");

function addApplied(dateApplied: string) {
  return mockStore.createApplication("mock-dev-user", {
    role_name: "Engineer",
    company_name: "Acme",
    date_applied: dateApplied,
    link: "https://example.com/job",
    platform: "LinkedIn",
    status: "Applied",
    statusCategory: "applied",
    month: "1",
    year: "2026",
    description: null,
    notes: null,
    location: "Remote",
    salary: null,
  });
}

const categoryOf = (id: string) =>
  mockStore.getApplications().find((a) => a.id === id)?.statusCategory;

const historyOf = (id: string) =>
  mockStore.getAnalyticsDataset().history.filter((h) => h.applicationId === id);

/** Back-dates an application's history, as if it was logged when applied. */
function ageHistory(id: string, days: number) {
  const store = mockStore as unknown as {
    statusHistory: { applicationId: string; createdAt: Date }[];
  };
  for (const row of store.statusHistory) {
    if (row.applicationId === id) row.createdAt = subDays(new Date(), days);
  }
}

// The mock sync must follow the database rule (app/actions/applications.ts):
// 30 days without application or status activity, ghost row dated to the
// 30-day mark. The analytics "Ghosting soon" list relies on the same rule.
describe("mock ghost sync", () => {
  beforeEach(() => {
    mockStore.reset();
  });

  it("does not ghost an application with recent activity", () => {
    // Added today for a job applied to 40 days ago: today's history row is activity.
    const app = addApplied(daysAgo(40));
    mockStore.syncGhostedApplications();
    expect(categoryOf(app.id)).toBe("applied");
  });

  it("ghosts after 30 quiet days and dates the row to the 30-day mark", () => {
    const app = addApplied(daysAgo(45));
    ageHistory(app.id, 45);
    mockStore.syncGhostedApplications();

    expect(categoryOf(app.id)).toBe("ghosted");
    const ghostRow = historyOf(app.id).find((h) => h.statusCategory === "ghosted");
    expect(format(new Date(ghostRow!.createdAt), "yyyy-MM-dd")).toBe(daysAgo(15));
  });

  it("does not add a second ghost row", () => {
    const app = addApplied(daysAgo(45));
    ageHistory(app.id, 45);
    mockStore.syncGhostedApplications();
    mockStore.syncGhostedApplications();
    expect(historyOf(app.id).filter((h) => h.statusCategory === "ghosted")).toHaveLength(1);
  });
});

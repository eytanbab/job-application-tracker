import { beforeEach, describe, expect, it } from "vitest";
import { mockStore } from "@/lib/mock-data/mock-store";
import {
  getApplicationDetails,
  getApplicationsPage,
  getApplicationStatusCounts,
  getKanbanColumns,
  updateApplication,
} from "../applications";

// Without DATABASE_URL the actions run against the in-memory mock store, as
// the guest demo does, so these exercise the same filtering and save paths.
describe("application list actions (mock store)", () => {
  beforeEach(() => {
    mockStore.reset();
  });

  it("returns one page of rows without the long-text fields", async () => {
    const { rows, total } = await getApplicationsPage({ size: 10 });
    expect(rows).toHaveLength(10);
    expect(total).toBeGreaterThan(10);
    for (const row of rows) {
      expect(row).not.toHaveProperty("description");
      expect(row).not.toHaveProperty("notes");
    }
  });

  it("serves the last page when the requested page is past the end", async () => {
    const { total } = await getApplicationsPage({ size: 10 });
    const lastPage = Math.ceil(total / 10);
    const result = await getApplicationsPage({ page: lastPage + 3, size: 10 });
    expect(result.page).toBe(lastPage);
    expect(result.rows.length).toBe(total - (lastPage - 1) * 10);
  });

  it("returns rows in the requested sort order", async () => {
    const { rows } = await getApplicationsPage({
      sort: "role_name",
      dir: "asc",
      size: 25,
    });
    const keys = rows.map((row) =>
      `${row.role_name} ${row.company_name}`.toLowerCase(),
    );
    expect(keys).toEqual([...keys].sort((a, b) => a.localeCompare(b)));
  });

  it("loads the description and notes separately", async () => {
    const seeded = mockStore
      .getApplications()
      .find((app) => app.description)!;
    expect(await getApplicationDetails(seeded.id)).toEqual({
      description: seeded.description,
      notes: seeded.notes,
    });
    expect(await getApplicationDetails("missing-id")).toBeNull();
  });

  it("keeps the stored description when a save omits it", async () => {
    const seeded = mockStore
      .getApplications()
      .find((app) => app.description && app.notes)!;
    const { rows } = await getApplicationsPage({
      q: seeded.company_name,
      size: 25,
    });
    const listRow = rows.find((row) => row.id === seeded.id)!;

    // A Kanban move or bulk status change saves the list row as-is
    await updateApplication({
      ...listRow,
      statusCategory: "rejected",
      status: "Rejected",
    });

    expect(await getApplicationDetails(seeded.id)).toEqual({
      description: seeded.description,
      notes: seeded.notes,
    });
  });

  it("still clears the description when a save sends it empty", async () => {
    const seeded = mockStore
      .getApplications()
      .find((app) => app.description)!;
    await updateApplication({ ...seeded, description: null });
    expect((await getApplicationDetails(seeded.id))?.description).toBeNull();
  });

  it("counts every status across the account", async () => {
    const counts = await getApplicationStatusCounts();
    const all = mockStore.getApplications();
    expect(counts.all).toBe(all.length);
    expect(counts.interview).toBe(
      all.filter((app) => app.statusCategory === "interview").length,
    );
  });

  it("fills Kanban columns with their first cards and full totals", async () => {
    const columns = await getKanbanColumns({});
    const all = mockStore.getApplications();
    for (const [kind, column] of Object.entries(columns)) {
      const inColumn = all.filter((app) => app.statusCategory === kind);
      expect(column!.total).toBe(inColumn.length);
      expect(column!.rows.length).toBe(Math.min(inColumn.length, 20));
    }
  });
});

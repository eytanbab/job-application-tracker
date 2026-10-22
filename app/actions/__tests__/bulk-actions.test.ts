import { beforeEach, describe, expect, it } from "vitest";
import { mockStore } from "@/lib/mock-data/mock-store";
import { resolveUpdatedStatus, statusLabels } from "@/lib/utils";
import { createApplication, deleteApplications, updateApplicationsStatus } from "../applications";

const base = {
  company_name: "Acme",
  date_applied: "2026-10-01",
  link: "https://acme.com/jobs/1",
  platform: "LinkedIn",
  location: "Remote",
  status: "Applied",
  statusCategory: "applied",
};

async function add(role: string, status = "Applied") {
  const [{ insertedId }] = await createApplication({ ...base, role_name: role, status } as never);
  return insertedId!;
}

const app = (id: string) => mockStore.getApplications().find((a) => a.id === id);

// Without DATABASE_URL these run against the mock store, as the demo does.
describe("bulk actions (mock store)", () => {
  beforeEach(() => {
    mockStore.reset();
  });

  it("deletes the selected applications and reports which", async () => {
    const a = await add("A");
    const b = await add("B");
    const { deleted } = await deleteApplications([a, b, "missing-id"]);
    expect(deleted.sort()).toEqual([a, b].sort());
    expect(app(a)).toBeUndefined();
    expect(app(b)).toBeUndefined();
  });

  it("moves applications to a stage with one history entry each, labelled like single updates", async () => {
    const a = await add("A");
    const b = await add("B", "Recruiter screen");
    const { updated } = await updateApplicationsStatus([a, b], "interview");

    expect(updated.sort()).toEqual([a, b].sort());
    expect(app(a)).toMatchObject({ statusCategory: "interview", status: statusLabels.interview });
    expect(app(b)).toMatchObject({
      statusCategory: "interview",
      status: resolveUpdatedStatus("Recruiter screen", "interview"),
    });

    const history = mockStore.getAnalyticsDataset().history.filter((h) => h.statusCategory === "interview");
    expect(history.filter((h) => h.applicationId === a)).toHaveLength(1);
    expect(history.filter((h) => h.applicationId === b)).toHaveLength(1);
  });

  it("rejects an unknown stage and oversized or malformed selections", async () => {
    await expect(updateApplicationsStatus(["x"], "bogus")).rejects.toThrow("Invalid status");
    await expect(deleteApplications(Array(501).fill("x"))).rejects.toThrow("Invalid selection");
    await expect(deleteApplications([1] as never)).rejects.toThrow("Invalid selection");
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { format, subDays } from "date-fns";

// The database ghost sync, against a stub `db`: each awaited query takes the
// next queued result, and inserted rows are recorded.
const results: unknown[][] = [];
const inserted: unknown[] = [];

function query(): unknown {
  return new Proxy(() => undefined, {
    get(_t, prop) {
      if (prop === "then") {
        const value = results.shift() ?? [];
        return (resolve: (v: unknown) => unknown) => resolve(value);
      }
      if (prop === "values") {
        return (rows: unknown) => {
          inserted.push(rows);
          return query();
        };
      }
      return () => query();
    },
  });
}

vi.mock("@/app/db", () => ({
  isMockDb: false,
  db: { select: () => query(), insert: () => query(), update: () => query(), batch: async () => [] },
}));
vi.mock("next/cache", () => ({
  revalidatePath: () => undefined,
  revalidateTag: () => undefined,
  updateTag: () => undefined,
  unstable_cache: (fn: () => unknown) => fn,
}));

const { syncGhostedApplications } = await import("../ghost-sync");

const day = (n: number) => format(subDays(new Date(), n), "yyyy-MM-dd");
const at = (n: number) => subDays(new Date(), n);
const candidate = (id: string, appliedDaysAgo: number) => ({
  id,
  userId: "user_a",
  status: "Applied",
  statusCategory: "applied",
  date_applied: day(appliedDaysAgo),
  createdAt: at(appliedDaysAgo),
});

describe("database ghost sync", () => {
  beforeEach(() => {
    results.length = 0;
    inserted.length = 0;
  });

  it("dates the Ghosted entry 30 days after the last activity", async () => {
    results.push(
      [candidate("a1", 90)], // candidates
      [], // no activity in the last 30 days
      [
        { applicationId: "a1", statusCategory: "applied", createdAt: at(90) },
        { applicationId: "a1", statusCategory: "review", createdAt: at(45) },
      ],
      [{ id: "a1" }], // update ... returning
    );
    expect(await syncGhostedApplications("user_a")).toBe(1);
    const [rows] = inserted as { applicationId: string; createdAt: Date }[][];
    expect(rows).toHaveLength(1);
    expect(format(rows[0].createdAt, "yyyy-MM-dd")).toBe(day(15));
  });

  it("writes history only for rows the update actually ghosted", async () => {
    results.push(
      [candidate("a1", 60), candidate("a2", 60)],
      [],
      [],
      [{ id: "a1" }], // a2 moved to Interviewing before the update ran
    );
    expect(await syncGhostedApplications("user_a")).toBe(1);
    const [rows] = inserted as { applicationId: string }[][];
    expect(rows.map((r) => r.applicationId)).toEqual(["a1"]);
  });
});

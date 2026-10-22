import { beforeEach, describe, expect, it, vi } from "vitest";
import { format, subDays } from "date-fns";
import { PgDialect } from "drizzle-orm/pg-core";
import type { SQL } from "drizzle-orm";

// The database ghost sync, against a stub `db`: each awaited query (or batch
// statement) takes the next queued result, and the insert-select SQL is kept.
const results: unknown[][] = [];
const insertSelects: SQL[] = [];
let batches = 0;

function query(): unknown {
  return new Proxy(() => undefined, {
    get(_t, prop) {
      if (prop === "then") {
        const value = results.shift() ?? [];
        return (resolve: (v: unknown) => unknown) => resolve(value);
      }
      return () => query();
    },
  });
}

vi.mock("@/app/db", () => ({
  isMockDb: false,
  db: {
    select: () => query(),
    update: () => query(),
    insert: () => ({
      select: (statement: SQL) => {
        insertSelects.push(statement);
        return "insert-select";
      },
    }),
    batch: async (items: unknown[]) => {
      batches++;
      return items.map(() => results.shift() ?? []);
    },
  },
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
const rendered = (statement: SQL) => new PgDialect().sqlToQuery(statement);

describe("database ghost sync", () => {
  beforeEach(() => {
    results.length = 0;
    insertSelects.length = 0;
    batches = 0;
  });

  it("dates the Ghosted entry 30 days after the last activity", async () => {
    results.push(
      [candidate("a1", 90)], // candidates
      [
        { applicationId: "a1", statusCategory: "applied", createdAt: at(90) },
        { applicationId: "a1", statusCategory: "review", createdAt: at(45) },
      ], // history
      [], // batch: insert-select
      [{ id: "a1" }], // batch: update ... returning
    );
    expect(await syncGhostedApplications("user_a")).toBe(1);
    const { params } = rendered(insertSelects[0]);
    expect(params[0]).toBe("a1");
    expect(format(new Date(params[1] as string), "yyyy-MM-dd")).toBe(day(15));
  });

  it("writes the entries and the status change in one transaction, guarded by category", async () => {
    results.push([candidate("a1", 60), candidate("a2", 60)], [], [], [{ id: "a1" }]);
    expect(await syncGhostedApplications("user_a")).toBe(1);
    expect(batches).toBe(1);
    // The insert only writes rows that are still applied or in review
    expect(rendered(insertSelects[0]).sql).toMatch(/where "job_applications"\."status_category" in \(\$\d+, \$\d+\)/);
  });

  it("skips applications with activity in the last 30 days", async () => {
    results.push([candidate("a1", 60)], [{ applicationId: "a1", statusCategory: "review", createdAt: at(5) }]);
    expect(await syncGhostedApplications("user_a")).toBe(0);
    expect(batches).toBe(0);
  });
});

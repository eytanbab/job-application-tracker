import { describe, expect, it } from "vitest";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  MemoryAiUsageStore,
  buildIncrementQuery,
  consumeAiQuota,
  peekAiQuota,
} from "../ai-usage";

const MORNING = new Date("2026-10-13T08:00:00Z");
const NEXT_DAY = new Date("2026-10-14T00:00:01Z");

describe("consumeAiQuota", () => {
  it("allows calls up to the limit, then refuses with the reset time", async () => {
    const store = new MemoryAiUsageStore();
    const opts = { store, now: MORNING, limit: 3 };

    const results = [];
    for (let i = 0; i < 4; i++) {
      results.push(await consumeAiQuota("user_a", "extract", opts));
    }

    expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    expect(results[2]).toMatchObject({ allowed: true, used: 3, limit: 3 });
    expect(results[3]).toEqual({
      allowed: false,
      limit: 3,
      resetAt: new Date("2026-10-14T00:00:00Z"),
    });
  });

  it("does not count refused calls", async () => {
    const store = new MemoryAiUsageStore();
    const opts = { store, now: MORNING, limit: 1 };
    await consumeAiQuota("user_a", "extract", opts);
    await consumeAiQuota("user_a", "extract", opts);
    await consumeAiQuota("user_a", "extract", opts);

    expect(await store.get({ userId: "user_a", feature: "extract", day: "2026-10-13" })).toBe(1);
  });

  it("keeps users and features apart", async () => {
    const store = new MemoryAiUsageStore();
    const opts = { store, now: MORNING, limit: 1 };

    expect((await consumeAiQuota("user_a", "extract", opts)).allowed).toBe(true);
    expect((await consumeAiQuota("user_a", "extract", opts)).allowed).toBe(false);
    expect((await consumeAiQuota("user_b", "extract", opts)).allowed).toBe(true);
    expect((await consumeAiQuota("user_a", "ats", opts)).allowed).toBe(true);
  });

  it("starts a fresh count on the next UTC day", async () => {
    const store = new MemoryAiUsageStore();
    await consumeAiQuota("user_a", "ats", { store, now: MORNING, limit: 1 });

    expect((await consumeAiQuota("user_a", "ats", { store, now: MORNING, limit: 1 })).allowed).toBe(false);
    expect((await consumeAiQuota("user_a", "ats", { store, now: NEXT_DAY, limit: 1 })).allowed).toBe(true);
  });

  it("refuses every call when the limit is 0 without touching the store", async () => {
    const store = new MemoryAiUsageStore();
    const result = await consumeAiQuota("user_a", "ats", { store, now: MORNING, limit: 0 });

    expect(result.allowed).toBe(false);
    expect(await store.get({ userId: "user_a", feature: "ats", day: "2026-10-13" })).toBe(0);
  });

  it("never lets concurrent calls overshoot the limit", async () => {
    const store = new MemoryAiUsageStore();
    const opts = { store, now: MORNING, limit: 5 };
    const results = await Promise.all(
      Array.from({ length: 20 }, () => consumeAiQuota("user_a", "extract", opts)),
    );

    expect(results.filter((r) => r.allowed)).toHaveLength(5);
  });

  it("reads the limit from the env var by default", async () => {
    const previous = process.env.AI_DAILY_EXTRACT_LIMIT;
    process.env.AI_DAILY_EXTRACT_LIMIT = "2";
    try {
      const store = new MemoryAiUsageStore();
      const allowed = [];
      for (let i = 0; i < 3; i++) {
        allowed.push((await consumeAiQuota("user_a", "extract", { store, now: MORNING })).allowed);
      }
      expect(allowed).toEqual([true, true, false]);
    } finally {
      if (previous === undefined) delete process.env.AI_DAILY_EXTRACT_LIMIT;
      else process.env.AI_DAILY_EXTRACT_LIMIT = previous;
    }
  });
});

describe("peekAiQuota", () => {
  it("reports the limit without using it up", async () => {
    const store = new MemoryAiUsageStore();
    const opts = { store, now: MORNING, limit: 1 };

    expect((await peekAiQuota("user_a", "extract", opts)).allowed).toBe(true);
    expect((await peekAiQuota("user_a", "extract", opts)).allowed).toBe(true);
    await consumeAiQuota("user_a", "extract", opts);
    expect((await peekAiQuota("user_a", "extract", opts)).allowed).toBe(false);
  });
});

describe("buildIncrementQuery", () => {
  // toSQL() only renders the statement; nothing connects to this URL.
  const database = drizzle(neon("postgresql://user:pass@localhost:5432/db"));

  it("is a single atomic upsert that stops at the limit", () => {
    const { sql, params } = buildIncrementQuery(
      database,
      { userId: "user_a", feature: "extract", day: "2026-10-13" },
      30,
    ).toSQL();

    expect(sql).toMatch(/^insert into "ai_usage"/);
    expect(sql).toContain(
      'on conflict ("user_id","feature","day") do update set "count" = "ai_usage"."count" + 1',
    );
    expect(sql).toMatch(/where "ai_usage"\."count" < \$\d+ returning "count"$/);
    expect(params).toEqual(expect.arrayContaining(["user_a", "extract", "2026-10-13", 1, 30]));
  });
});

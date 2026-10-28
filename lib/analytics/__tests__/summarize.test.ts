import { describe, expect, it } from "vitest";
import { resolveRange } from "../range";
import { buildFacts } from "../facts";
import { bucketWeeks, summarizeOverview } from "../summarize";
import { app, sampleDataset, TODAY } from "./fixtures";

const september = resolveRange({ range: "custom", from: "2026-09-01", to: "2026-10-21" }, TODAY);

describe("summarizeOverview", () => {
  const o = summarizeOverview(sampleDataset(), september, TODAY);

  it("counts every stage with history-aware definitions", () => {
    expect(o.totals.applications).toBe(9);
    expect(o.totals.interviewed).toBe(5); // a1, a3, a5, a6, a9
    expect(o.totals.responded).toBe(7); // + a2 (review), a4 (rejected)
    expect(o.totals.offers).toBe(1);
    expect(o.totals.rejected).toEqual({ total: 2, beforeInterview: 1, afterInterview: 1 });
    expect(o.totals.ghosted).toEqual({ total: 1, beforeInterview: 0, afterInterview: 1 });
    expect(o.totals.active).toBe(5);
  });

  it("leaves saved jobs out of every count", () => {
    const dataset = sampleDataset();
    dataset.apps.push(
      app({ id: "s1", status: "Saved", statusCategory: "saved", dateApplied: "2026-10-01" }),
    );
    const withSaved = summarizeOverview(dataset, september, TODAY);
    expect(withSaved.totals).toEqual(o.totals);
    expect(withSaved.needsAction).toEqual(o.needsAction);
    expect(withSaved.weekly).toEqual(o.weekly);
  });

  it("keeps the sections consistent with each other", () => {
    const platformInterviews = o.platforms.reduce((sum, p) => sum + p.interviewed.k, 0);
    const workModeTotal = o.workModes.reduce((sum, m) => sum + m.total, 0);
    const workModeInterviews = o.workModes.reduce((sum, m) => sum + m.interviewed.k, 0);
    const activityTotal = o.activity.buckets.reduce((sum, b) => sum + b.total, 0);

    expect(platformInterviews).toBe(o.totals.interviewed);
    expect(workModeTotal).toBe(o.totals.applications);
    expect(workModeInterviews).toBe(o.totals.interviewed);
    expect(activityTotal).toBe(o.totals.applications);
    for (const p of o.platforms) expect(p.responded.k).toBeGreaterThanOrEqual(p.interviewed.k);
  });

  it("merges platform spellings and labels blanks", () => {
    const linkedin = o.platforms.find((p) => p.key === "linkedin");
    expect(linkedin?.total).toBe(4); // a1, a2 ("linkedin "), a8, a9
    expect(o.platforms.find((p) => p.key === "")?.label).toBe("Not set");
  });

  it("never names a top platform from a handful of applications", () => {
    expect(o.topPlatformKey).toBeNull();
  });

  it("puts blank locations under Unknown instead of On-site", () => {
    expect(o.workModes.find((m) => m.mode === "unknown")?.total).toBe(1);
  });

  it("uses the median days to the first reply", () => {
    // a2: 4, a3: 3, a4: 7, a5: 7, a6: 7, a9: 16, a1: 7 -> median 7
    expect(o.kpis.daysToFirstUpdate).toMatchObject({ median: 7, n: 7 });
  });

  it("times reply-to-interview only when the reply came first", () => {
    // Only a3 was in review (13 Sep) before its interview (20 Sep); for the
    // others the interview itself was the first reply.
    expect(o.timeInStage.updateToInterview).toEqual({ median: 7, n: 1 });
  });

  it("compares with the previous period", () => {
    expect(o.kpis.applications.previous).toBe(1);
    expect(o.kpis.applications.delta?.change).toBe(8);
    expect(o.kpis.applications.delta?.meaningful).toBe(false);
  });

  it("buckets activity by week for short periods, filling empty weeks", () => {
    const short = summarizeOverview(sampleDataset(), resolveRange({ range: "30d" }, TODAY), TODAY);
    expect(short.activity.granularity).toBe("week");
    // 22 Sep - 21 Oct spans five ISO weeks starting Monday 22 Sep
    expect(short.activity.buckets.map((b) => b.start)).toEqual([
      "2026-09-21",
      "2026-09-28",
      "2026-10-05",
      "2026-10-12",
      "2026-10-19",
    ]);
    expect(o.activity.granularity).toBe("week");
    const allTime = summarizeOverview(sampleDataset(), resolveRange({ range: "all" }, TODAY), TODAY);
    expect(allTime.activity.granularity).toBe("month");
    expect(allTime.activity.buckets.map((b) => b.start)).toEqual(["2026-08-01", "2026-09-01", "2026-10-01"]);
  });

  it("lists applications that need action", () => {
    expect(o.needsAction.noReply.items.map((i) => i.id)).toEqual(["a7"]);
    expect(o.needsAction.interviewStale.items.map((i) => i.id)).toEqual(["a9"]);
    expect(o.needsAction.ghostingSoon.items.map((i) => i.id)).toEqual(["a8"]);
  });

  it("groups by resume", () => {
    const v2 = o.resumes.find((r) => r.resumeId === "r1");
    expect(v2).toMatchObject({ title: "Resume v2", total: 2 });
    expect(o.resumes.find((r) => r.resumeId === null)?.title).toBe("No resume attached");
  });

  it("reads salaries in one currency", () => {
    expect(o.salary.currency).toBe("USD");
    expect(o.salary.statedCount).toBe(2);
    expect(o.salary.median).toBe(157_500); // 135k and 180k
    expect(o.salary.otherCurrencyCount).toBe(1);
  });

  it("returns an empty overview for an empty range", () => {
    const empty = summarizeOverview(
      sampleDataset(),
      resolveRange({ range: "custom", from: "2020-01-01", to: "2020-01-31" }, TODAY),
      TODAY,
    );
    expect(empty.totals.applications).toBe(0);
    expect(empty.activity.buckets.every((b) => b.total === 0)).toBe(true);
    expect(empty.kpis.responseRate.rate.pct).toBe(0);
  });
});

describe("bucketWeeks", () => {
  it("counts the last 12 Monday-start weeks across a year boundary", () => {
    const facts = buildFacts({
      apps: [
        app({ id: "1", dateApplied: "2026-12-28" }), // Monday of the week of 1 Jan 2027
        app({ id: "2", dateApplied: "2027-01-03" }), // Sunday, same week
        app({ id: "3", dateApplied: "2026-12-27" }), // Sunday, previous week
        app({ id: "4", dateApplied: "2026-01-01" }), // too old
      ],
      history: [],
    });
    const weeks = bucketWeeks(facts, new Date(2027, 0, 1, 12));
    expect(weeks).toHaveLength(12);
    expect(weeks.at(-1)).toEqual({ start: "2026-12-28", total: 2 });
    expect(weeks.at(-2)).toEqual({ start: "2026-12-21", total: 1 });
    expect(weeks.reduce((s, w) => s + w.total, 0)).toBe(3);
  });
});

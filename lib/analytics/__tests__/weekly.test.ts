import { describe, expect, it } from "vitest";
import { TODAY, app, hist, sampleDataset } from "./fixtures";
import { buildFacts } from "../facts";
import { weeklyCounts } from "../weekly";

describe("weeklyCounts", () => {
  it("counts this week's and last week's events", () => {
    const weekly = weeklyCounts(buildFacts(sampleDataset()), TODAY);
    expect(weekly.windowDays).toBe(7);
    // 15-21 Oct: nothing happened in the sample
    expect(weekly.thisWeek).toEqual({ applied: 0, replies: 0, interviews: 0, offers: 0, rejections: 0, ghosted: 0 });
    // 8-14 Oct: a7 applied, a9 reached interview (its first reply), a1 ghosted
    expect(weekly.previousWeek).toEqual({ applied: 1, replies: 1, interviews: 1, offers: 0, rejections: 0, ghosted: 1 });
  });

  it("includes today and stops at the start of the window", () => {
    const dataset = {
      apps: [
        app({ id: "today", dateApplied: "2026-10-21" }),
        app({ id: "first-day", dateApplied: "2026-10-15" }),
        app({ id: "day-before", dateApplied: "2026-10-14" }),
      ],
      history: [
        hist("today", "applied", "2026-10-21"),
        hist("first-day", "applied", "2026-10-15"),
        hist("first-day", "review", "2026-10-21"),
        hist("day-before", "applied", "2026-10-14"),
      ],
    };
    const weekly = weeklyCounts(buildFacts(dataset), TODAY);
    expect(weekly.thisWeek).toMatchObject({ applied: 2, replies: 1 });
    expect(weekly.previousWeek).toMatchObject({ applied: 1, replies: 0 });
  });
});

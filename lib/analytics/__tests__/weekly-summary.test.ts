import { describe, expect, it } from "vitest";
import { TODAY, app, hist, sampleDataset } from "./fixtures";
import {
  buildSummaryInput,
  buildSummaryPrompt,
  groundSummary,
  isoWeekKey,
  ruleBasedSummary,
  summaryInputHash,
  type SummaryInput,
} from "../weekly-summary";

describe("buildSummaryInput", () => {
  it("counts this week's and last week's events and what is waiting", () => {
    const input = buildSummaryInput(sampleDataset(), TODAY, 5);
    expect(input.windowDays).toBe(7);
    // 15-21 Oct: nothing happened in the sample
    expect(input.thisWeek).toEqual({ applied: 0, replies: 0, interviews: 0, offers: 0, rejections: 0, ghosted: 0 });
    // 8-14 Oct: a7 applied, a9 reached interview (its first reply), a1 ghosted
    expect(input.previousWeek).toEqual({ applied: 1, replies: 1, interviews: 1, offers: 0, rejections: 0, ghosted: 1 });
    expect(input.open).toEqual({ total: 5, waiting: 2, inReview: 1, interviewing: 1 });
    expect(input.needsAction).toEqual({ noReply: 1, interviewStale: 1, ghostingSoon: 1 });
    expect(input.weeklyGoal).toBe(5);
    expect(input.last90Days).toEqual({ applications: 10, interviewed: 5, interviewRatePercent: 50 });
  });

  it("hides the 90-day rate below 10 applications", () => {
    const dataset = { apps: [app({ id: "x", dateApplied: "2026-10-20" })], history: [hist("x", "applied", "2026-10-20")] };
    const input = buildSummaryInput(dataset, TODAY, null);
    expect(input.thisWeek.applied).toBe(1);
    expect(input.last90Days.interviewRatePercent).toBeNull();
  });

  it("sends no names, roles or notes to the model", () => {
    const prompt = buildSummaryPrompt(buildSummaryInput(sampleDataset(), TODAY, null));
    expect(prompt).not.toMatch(/Acme|Engineer|Greenhouse|Resume v2|\$120k/);
  });
});

describe("cache keys", () => {
  it("uses the ISO week and changes the hash only when the input does", () => {
    expect(isoWeekKey(TODAY)).toBe("2026-W43");
    expect(isoWeekKey(new Date(2027, 0, 1))).toBe("2026-W53");
    const input = buildSummaryInput(sampleDataset(), TODAY, null);
    expect(summaryInputHash(input)).toBe(summaryInputHash(structuredClone(input)));
    expect(summaryInputHash({ ...input, weeklyGoal: 3 })).not.toBe(summaryInputHash(input));
  });
});

const INPUT: SummaryInput = {
  windowDays: 7,
  thisWeek: { applied: 6, replies: 2, interviews: 1, offers: 0, rejections: 1, ghosted: 0 },
  previousWeek: { applied: 4, replies: 1, interviews: 0, offers: 0, rejections: 0, ghosted: 2 },
  open: { total: 12, waiting: 8, inReview: 2, interviewing: 2 },
  needsAction: { noReply: 3, interviewStale: 1, ghostingSoon: 0 },
  weeklyGoal: 10,
  last90Days: { applications: 40, interviewed: 5, interviewRatePercent: 13 },
};

describe("groundSummary", () => {
  it("keeps sentences whose numbers come from the input or week-on-week differences", () => {
    const raw = {
      whatChanged: "You sent 6 applications, 2 more than last week. 2 got a first reply.",
      whatIsStuck: "3 applications have had no reply for 7 to 14 days.",
      suggestion: "Send 4 more to reach your goal of 10.",
      citedMetrics: ["thisWeek.applied", "needsAction.noReply"],
    };
    const { summary, dropped } = groundSummary(raw, INPUT);
    expect(dropped).toEqual([]);
    expect(summary).toEqual(raw);
  });

  it("drops sentences with invented numbers and unknown metric paths", () => {
    const { summary, dropped } = groundSummary(
      {
        whatChanged: "You sent 6 applications. Your response rate rose to 33%. Keep going.",
        whatIsStuck: "1 interview has gone quiet.",
        suggestion: "Apply to 25 roles.",
        citedMetrics: ["thisWeek.applied", "responseRate", 7 as unknown as string],
      },
      INPUT,
    );
    expect(dropped).toEqual(["Your response rate rose to 33%.", "Apply to 25 roles."]);
    expect(summary.whatChanged).toBe("You sent 6 applications. Keep going.");
    expect(summary.whatIsStuck).toBe("1 interview has gone quiet.");
    // Emptied field falls back to the rule-based text
    expect(summary.suggestion).toBe(ruleBasedSummary(INPUT).suggestion);
    expect(summary.citedMetrics).toEqual(["thisWeek.applied"]);
  });

  it("reads numbers with thousands separators and decimals", () => {
    const { dropped } = groundSummary(
      { whatChanged: "You have 1,200 open. Rate is 13.5%.", whatIsStuck: "x.", suggestion: "y.", citedMetrics: [] },
      INPUT,
    );
    expect(dropped).toEqual(["You have 1,200 open.", "Rate is 13.5%."]);
  });

  it("survives a malformed model response", () => {
    const { summary } = groundSummary({} as never, INPUT);
    expect(summary).toEqual({ ...ruleBasedSummary(INPUT), citedMetrics: [] });
  });
});

describe("ruleBasedSummary", () => {
  it("states this week against last week and puts stale interviews first", () => {
    const s = ruleBasedSummary(INPUT);
    expect(s.whatChanged).toBe(
      "You sent 6 applications in the last 7 days, against 4 the week before. 2 applications got a first reply and 1 reached an interview.",
    );
    expect(s.whatIsStuck).toBe(
      "1 interview has had no update for 7 days or more; 3 applications have had no reply for 7 to 14 days.",
    );
    expect(s.suggestion).toMatch(/^Follow up on the interviews/);
  });

  it("falls back to the weekly goal, then to keeping pace", () => {
    const quiet = { ...INPUT, needsAction: { noReply: 0, interviewStale: 0, ghostingSoon: 0 } };
    expect(ruleBasedSummary(quiet).suggestion).toBe("Send 4 more to reach your weekly goal of 10.");
    expect(ruleBasedSummary(quiet).whatIsStuck).toBe("Nothing is waiting on a follow-up right now.");
    expect(ruleBasedSummary({ ...quiet, weeklyGoal: null }).suggestion).toBe(
      "Keep your current pace and check back next week.",
    );
  });

  it("passes its own grounding check", () => {
    const s = ruleBasedSummary(INPUT);
    expect(groundSummary(s, INPUT).dropped).toEqual([]);
  });
});

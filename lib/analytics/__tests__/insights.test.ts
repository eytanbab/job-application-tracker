import { describe, expect, it } from "vitest";
import { format, addDays, parseISO } from "date-fns";
import { TODAY, app, hist, sampleDataset } from "./fixtures";
import { INTERVIEW_RATE_BENCHMARK } from "../benchmarks";
import { buildInsights, type Insight } from "../insights";
import { resolveRange } from "../range";
import { summarizeOverview, type AnalyticsOverview } from "../summarize";
import type { AnalyticsDataset } from "../types";

const overviewOf = (dataset: AnalyticsDataset) =>
  summarizeOverview(dataset, resolveRange({ range: "90d" }, TODAY), TODAY);

const later = (iso: string, days: number) => format(addDays(parseISO(iso), days), "yyyy-MM-dd");

interface Spec {
  platform?: string;
  date?: string;
  interviewed?: boolean;
  replied?: boolean;
  resume?: string;
}

/**
 * Closed applications, so nothing needs a follow-up: rejected after a reply,
 * ghosted otherwise (a rejection itself counts as a reply).
 */
function closed(prefix: string, count: number, spec: Spec, dataset: AnalyticsDataset = { apps: [], history: [] }) {
  const date = spec.date ?? "2026-09-01";
  const outcome = spec.interviewed || spec.replied ? "rejected" : "ghosted";
  for (let i = 0; i < count; i++) {
    const id = `${prefix}${i}`;
    dataset.apps.push(
      app({
        id,
        status: outcome === "rejected" ? "Rejected" : "Ghosted",
        statusCategory: outcome,
        platform: spec.platform ?? "LinkedIn",
        dateApplied: date,
        resumeId: spec.resume ?? null,
        resumeTitle: spec.resume ?? null,
      }),
    );
    dataset.history.push(hist(id, "applied", date));
    if (spec.interviewed) dataset.history.push(hist(id, "interview", later(date, 3)));
    else if (spec.replied) dataset.history.push(hist(id, "review", later(date, 3)));
    dataset.history.push(hist(id, outcome, later(date, 30)));
  }
  return dataset;
}

/** 40 applications in the period: LinkedIn 12 of 20 interviewed, Indeed 1 of 20. */
function strongLinkedIn(resumeOnLinkedIn?: string) {
  const d = closed("li-yes", 12, { platform: "LinkedIn", interviewed: true, resume: resumeOnLinkedIn });
  closed("li-no", 8, { platform: "LinkedIn", resume: resumeOnLinkedIn }, d);
  closed("in-yes", 1, { platform: "Indeed", interviewed: true }, d);
  closed("in-no", 19, { platform: "Indeed" }, d);
  return d;
}

/** Every number an insight states must come from the overview or the goal. */
function expectGrounded(insights: Insight[], overview: AnalyticsOverview, goal: number | null) {
  const allowed = new Set<number>([7, 14]);
  const walk = (value: unknown) => {
    if (typeof value === "number") {
      allowed.add(value);
      if (value > 0 && value < 1) allowed.add(Math.round(value * 100));
    } else if (typeof value === "string" && /^\d+$/.test(value)) {
      allowed.add(Number(value));
    } else if (value && typeof value === "object") Object.values(value).forEach(walk);
  };
  walk(overview);
  walk({ goal, benchmark: INTERVIEW_RATE_BENCHMARK });
  const { thisWeek, previousWeek } = overview.weekly;
  allowed.add(Math.abs(thisWeek.applied - previousWeek.applied));
  if (goal !== null) allowed.add(goal - thisWeek.applied);
  const { rate, previous } = overview.kpis.responseRate;
  if (previous) allowed.add(Math.abs(Math.round(rate.pct * 100) - Math.round(previous.pct * 100)));

  for (const { text } of insights) {
    for (const n of text.match(/\d+(?:\.\d+)?/g) ?? []) {
      expect(allowed.has(Number(n)), `${n} in "${text}"`).toBe(true);
    }
  }
}

describe("buildInsights", () => {
  it("puts this week first, then follow-ups, and stops at five", () => {
    const overview = overviewOf(sampleDataset());
    const insights = buildInsights(overview, null, TODAY);
    expect(insights.map((i) => i.id)).toEqual([
      "weekly-pace",
      "interview-stale",
      "no-reply",
      "ghosting-soon",
      "benchmark",
    ]);
    expect(insights[0].text).toBe("You sent 0 applications in the last 7 days, against 1 the week before.");
    expect(insights[1]).toMatchObject({
      tone: "warn",
      text: "1 interview has had no update for 7 days or more. Follow up on it first; it is closest to an offer.",
      href: "/applications?status=interview",
    });
    expect(insights[2].href).toBe("/applications?status=applied&from=2026-10-07&to=2026-10-14");
    expect(insights[4].text).toBe("Your interview rate in this period (50%) is above the typical 2% to 5% (2026).");
    expectGrounded(insights, overview, null);
  });

  it("words progress against the weekly goal", () => {
    const overview = overviewOf(sampleDataset());
    expect(buildInsights(overview, 5, TODAY)[0]).toMatchObject({
      tone: "info",
      text: "You sent 0 applications in the last 7 days, against 1 the week before. That is 5 short of your goal of 5.",
    });

    const busy = closed("w", 3, { date: "2026-10-20" });
    const met = buildInsights(overviewOf(busy), 3, TODAY)[0];
    expect(met).toMatchObject({ tone: "good" });
    expect(met.text).toMatch(/You sent 3 applications in the last 7 days, against 0 the week before\. That meets your goal of 3\.$/);
  });

  it("reports this week's replies and interviews only when there are some", () => {
    const d = closed("r", 1, { date: "2026-10-10", interviewed: true });
    d.history = d.history.filter((h) => h.statusCategory !== "rejected");
    d.apps[0] = { ...d.apps[0], status: "Interview", statusCategory: "interview" };
    d.history.push(hist("r0", "review", "2026-10-16"));
    d.history.find((h) => h.statusCategory === "interview")!.createdAt = parseISO("2026-10-18T12:00:00").getTime();
    const progress = buildInsights(overviewOf(d), null, TODAY).find((i) => i.id === "weekly-progress");
    expect(progress?.text).toBe("In the last 7 days, 1 application got a first reply and 1 reached an interview.");

    expect(buildInsights(overviewOf(sampleDataset()), null, TODAY).some((i) => i.id === "weekly-progress")).toBe(false);
  });

  it("names a top platform only when it clearly leads with 20+ applications each", () => {
    const overview = overviewOf(strongLinkedIn());
    const top = buildInsights(overview, null, TODAY).find((i) => i.id === "top-platform");
    expect(top).toMatchObject({
      tone: "good",
      text: "LinkedIn leads to an interview most often in this period: 60% (12 of 20), against 5% on Indeed.",
      href: `/applications?platform=linkedin&from=${overview.range.current.from}&to=2026-10-21`,
    });
    expectGrounded(buildInsights(overview, null, TODAY), overview, null);

    // 19 Indeed applications: not enough to rank
    const small = strongLinkedIn();
    small.apps = small.apps.filter((a) => a.id !== "in-no0");
    expect(buildInsights(overviewOf(small), null, TODAY).some((i) => i.id === "top-platform")).toBe(false);
  });

  it("compares resumes with the same rule", () => {
    const overview = overviewOf(strongLinkedIn("CV A"));
    const best = buildInsights(overview, null, TODAY).find((i) => i.id === "best-resume");
    expect(best?.text).toBe(
      'Applications sent with "CV A" reach an interview more often: 60% (12 of 20), against 5% with no resume attached.',
    );
    expect(buildInsights(overviewOf(strongLinkedIn()), null, TODAY).some((i) => i.id === "best-resume")).toBe(false);
  });

  it("reports a reply-rate change only when both periods have enough data", () => {
    // Current: 20 of 20 replied. Previous 90 days: 5 of 20.
    const d = closed("now", 20, { replied: true });
    closed("then-yes", 5, { replied: true, date: "2026-06-01" }, d);
    closed("then-no", 15, { date: "2026-06-01" }, d);
    const overview = overviewOf(d);
    const change = buildInsights(overview, null, TODAY).find((i) => i.id === "reply-rate-change");
    expect(change).toMatchObject({
      tone: "good",
      text: "Your reply rate is up 75 points on the previous 90 days: 100% against 25%.",
    });
    expectGrounded(buildInsights(overview, null, TODAY), overview, null);

    const thin = closed("now", 20, { replied: true });
    closed("then", 5, { date: "2026-06-01" }, thin);
    expect(buildInsights(overviewOf(thin), null, TODAY).some((i) => i.id === "reply-rate-change")).toBe(false);
  });

  it("skips the benchmark below 10 applications and says when the rate is low", () => {
    const few = closed("f", 9, {});
    expect(buildInsights(overviewOf(few), null, TODAY).some((i) => i.id === "benchmark")).toBe(false);

    const low = closed("l", 40, {});
    expect(buildInsights(overviewOf(low), null, TODAY).find((i) => i.id === "benchmark")).toMatchObject({
      tone: "warn",
      text: "Your interview rate in this period (0%) is below the typical 2% to 5% (2026).",
    });
  });
});

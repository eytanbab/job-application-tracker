import { format, subDays } from "date-fns";
import { INTERVIEW_RATE_BENCHMARK } from "./benchmarks";
import { formatPct, previousPeriodLabel } from "./format";
import { trackerHref } from "./links";
import { separates } from "./stats";
import type { AnalyticsOverview, ResumeSummary } from "./summarize";
import type { Rate } from "./types";

// Plain-language findings from the user's own numbers. Each rule only fires
// when the data backs it (the same thresholds the page uses), and states
// only numbers that are in the overview.

export type InsightTone = "good" | "warn" | "info";

export interface Insight {
  id: string;
  tone: InsightTone;
  text: string;
  href?: string;
}

const MAX_INSIGHTS = 5;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const ratePart = (rate: Rate) => `${formatPct(rate.pct)} (${rate.k} of ${rate.n})`;
const iso = (date: Date) => format(date, "yyyy-MM-dd");

function weeklyPace(overview: AnalyticsOverview, goal: number | null): Insight {
  const { thisWeek, previousWeek, windowDays } = overview.weekly;
  let text = `You sent ${plural(thisWeek.applied, "application", "applications")} in the last ${windowDays} days, against ${previousWeek.applied} the week before.`;
  let tone: InsightTone = "info";
  if (goal !== null) {
    if (thisWeek.applied >= goal) {
      text += ` That meets your goal of ${goal}.`;
      tone = "good";
    } else {
      text += ` That is ${goal - thisWeek.applied} short of your goal of ${goal}.`;
    }
  }
  return { id: "weekly-pace", tone, text };
}

function weeklyProgress(overview: AnalyticsOverview): Insight | null {
  const { thisWeek, windowDays } = overview.weekly;
  const parts = [
    thisWeek.replies > 0 && `${plural(thisWeek.replies, "application", "applications")} got a first reply`,
    thisWeek.interviews > 0 && `${thisWeek.interviews} reached an interview`,
    thisWeek.offers > 0 && `you got ${plural(thisWeek.offers, "offer", "offers")}`,
  ].filter(Boolean) as string[];
  if (parts.length === 0) return null;
  const list = parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}` : parts[0];
  return { id: "weekly-progress", tone: "good", text: `In the last ${windowDays} days, ${list}.` };
}

function followUps(overview: AnalyticsOverview, today: Date): Insight[] {
  const { interviewStale, noReply, ghostingSoon } = overview.needsAction;
  const insights: Insight[] = [];
  if (interviewStale.total > 0) {
    const one = interviewStale.total === 1;
    insights.push({
      id: "interview-stale",
      tone: "warn",
      text: `${plural(interviewStale.total, "interview has", "interviews have")} had no update for 7 days or more. Follow up on ${one ? "it" : "them"} first; ${one ? "it is" : "they are"} closest to an offer.`,
      href: trackerHref({ status: "interview" }),
    });
  }
  if (noReply.total > 0) {
    insights.push({
      id: "no-reply",
      tone: "warn",
      text: `${plural(noReply.total, "application has", "applications have")} had no reply for 7 to 14 days. A short follow-up often gets one.`,
      href: trackerHref({ status: "applied", range: { from: iso(subDays(today, 14)), to: iso(subDays(today, 7)) } }),
    });
  }
  if (ghostingSoon.total > 0) {
    insights.push({
      id: "ghosting-soon",
      tone: "warn",
      text: `${plural(ghostingSoon.total, "application", "applications")} will be marked ghosted within 7 days unless you hear back or log an update.`,
    });
  }
  return insights;
}

function topPlatform(overview: AnalyticsOverview): Insight | null {
  if (!overview.topPlatformKey) return null;
  const ranked = overview.platforms
    .filter((p) => p.key)
    .sort((a, b) => b.interviewed.pct - a.interviewed.pct);
  const [top, next] = ranked;
  if (!top || !next || top.key !== overview.topPlatformKey) return null;
  return {
    id: "top-platform",
    tone: "good",
    text: `${top.label} leads to an interview most often in this period: ${ratePart(top.interviewed)}, against ${formatPct(next.interviewed.pct)} on ${next.label}.`,
    href: trackerHref({ platform: top.key, range: overview.range.current }),
  };
}

function bestResume(overview: AnalyticsOverview): Insight | null {
  const ranked = [...overview.resumes].sort((a, b) => b.interviewed.pct - a.interviewed.pct);
  const [best, next] = ranked;
  if (!best || !next || !separates(best.interviewed, next.interviewed)) return null;
  const sentWith = (r: ResumeSummary) => (r.resumeId ? `"${r.title}"` : "no resume attached");
  return {
    id: "best-resume",
    tone: "good",
    text: `Applications sent with ${sentWith(best)} reach an interview more often: ${ratePart(best.interviewed)}, against ${formatPct(next.interviewed.pct)} with ${sentWith(next)}.`,
  };
}

function replyRateChange(overview: AnalyticsOverview): Insight | null {
  const { delta, rate, previous } = overview.kpis.responseRate;
  if (!delta?.meaningful || !previous) return null;
  // From the rounded percentages, so the sentence's three numbers agree.
  const points = Math.round(rate.pct * 100) - Math.round(previous.pct * 100);
  if (points === 0) return null;
  return {
    id: "reply-rate-change",
    tone: points > 0 ? "good" : "warn",
    text: `Your reply rate is ${points > 0 ? "up" : "down"} ${Math.abs(points)} points on the ${previousPeriodLabel(overview.range)}: ${formatPct(rate.pct)} against ${formatPct(previous.pct)}.`,
  };
}

function againstBenchmark(overview: AnalyticsOverview): Insight | null {
  const { rate } = overview.kpis.interviewRate;
  if (!rate.enough) return null;
  const { low, high, asOf } = INTERVIEW_RATE_BENCHMARK;
  const position = rate.pct > high ? "above" : rate.pct < low ? "below" : "within";
  return {
    id: "benchmark",
    tone: position === "above" ? "good" : position === "below" ? "warn" : "info",
    text: `Your interview rate in this period (${formatPct(rate.pct)}) is ${position} the typical ${formatPct(low)} to ${formatPct(high)} (${asOf}).`,
  };
}

/**
 * Up to five findings, most useful first: this week's pace and progress,
 * then follow-ups, then what is working in the selected period.
 */
export function buildInsights(overview: AnalyticsOverview, goal: number | null, today: Date): Insight[] {
  return [
    weeklyPace(overview, goal),
    weeklyProgress(overview),
    ...followUps(overview, today),
    topPlatform(overview),
    bestResume(overview),
    replyRateChange(overview),
    againstBenchmark(overview),
  ]
    .filter((insight): insight is Insight => insight !== null)
    .slice(0, MAX_INSIGHTS);
}

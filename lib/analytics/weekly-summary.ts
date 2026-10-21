import { createHash } from "node:crypto";
import { format, parseISO, subDays } from "date-fns";
import { buildFacts } from "./facts";
import { resolveRange } from "./range";
import { summarizeOverview } from "./summarize";
import type { AnalyticsDataset, AppFacts, DateRange } from "./types";

// The AI weekly summary. Everything here is pure so the grounding rules can be
// tested without Gemini. The model only ever sees counts: no company names,
// roles, notes or salaries.

const WINDOW_DAYS = 7;

export interface WeekCounts {
  /** Applications sent. */
  applied: number;
  /** Applications that got their first reply. */
  replies: number;
  /** Applications that reached an interview for the first time. */
  interviews: number;
  offers: number;
  rejections: number;
  ghosted: number;
}

export interface SummaryInput {
  windowDays: number;
  thisWeek: WeekCounts;
  previousWeek: WeekCounts;
  /** Open applications by stage, whatever the date applied. */
  open: { total: number; waiting: number; inReview: number; interviewing: number };
  needsAction: { noReply: number; interviewStale: number; ghostingSoon: number };
  weeklyGoal: number | null;
  /** Interview rate over the last 90 days; percent is null below 10 applications. */
  last90Days: { applications: number; interviewed: number; interviewRatePercent: number | null };
}

export interface WeeklySummary {
  whatChanged: string;
  whatIsStuck: string;
  suggestion: string;
  /** Input fields the text relies on, e.g. "thisWeek.replies". */
  citedMetrics: string[];
}

const iso = (date: Date) => format(date, "yyyy-MM-dd");

const inWindow = (time: number | null, window: { start: number; end: number }) =>
  time !== null && time >= window.start && time < window.end;

function weekCounts(facts: readonly AppFacts[], range: DateRange): WeekCounts {
  // Event times are compared with whole local days, like date_applied.
  const window = {
    start: parseISO(range.from!).getTime(),
    end: parseISO(range.to!).getTime() + 24 * 60 * 60 * 1000,
  };
  const counts: WeekCounts = { applied: 0, replies: 0, interviews: 0, offers: 0, rejections: 0, ghosted: 0 };
  for (const f of facts) {
    if (f.app.dateApplied >= range.from! && f.app.dateApplied <= range.to!) counts.applied++;
    if (inWindow(f.firstUpdateAt, window)) counts.replies++;
    if (inWindow(f.firstInterviewAt, window)) counts.interviews++;
    // The status change that closed it is the latest history row.
    if (inWindow(f.lastActivityAt, window)) {
      if (f.isOffer) counts.offers++;
      if (f.isRejected) counts.rejections++;
      if (f.isGhosted) counts.ghosted++;
    }
  }
  return counts;
}

/** Aggregates for the last 7 days against the 7 before, plus what is waiting. */
export function buildSummaryInput(
  dataset: AnalyticsDataset,
  today: Date,
  weeklyGoal: number | null,
): SummaryInput {
  const facts = buildFacts(dataset);
  const thisWeek: DateRange = { from: iso(subDays(today, WINDOW_DAYS - 1)), to: iso(today) };
  const previousWeek: DateRange = {
    from: iso(subDays(today, 2 * WINDOW_DAYS - 1)),
    to: iso(subDays(today, WINDOW_DAYS)),
  };
  const overview = summarizeOverview(dataset, resolveRange({ range: "90d" }, today), today);
  const interviewRate = overview.kpis.interviewRate.rate;

  const open = { total: 0, waiting: 0, inReview: 0, interviewing: 0 };
  for (const f of facts) {
    if (!f.isActive) continue;
    open.total++;
    if (f.kind === "applied") open.waiting++;
    if (f.kind === "review") open.inReview++;
    if (f.kind === "interview") open.interviewing++;
  }

  return {
    windowDays: WINDOW_DAYS,
    thisWeek: weekCounts(facts, thisWeek),
    previousWeek: weekCounts(facts, previousWeek),
    open,
    needsAction: {
      noReply: overview.needsAction.noReply.total,
      interviewStale: overview.needsAction.interviewStale.total,
      ghostingSoon: overview.needsAction.ghostingSoon.total,
    },
    weeklyGoal,
    last90Days: {
      applications: interviewRate.n,
      interviewed: interviewRate.k,
      interviewRatePercent: interviewRate.enough ? Math.round(interviewRate.pct * 100) : null,
    },
  };
}

/** Cache key part: same input, same summary. */
export function summaryInputHash(input: SummaryInput): string {
  return createHash("sha256").update(JSON.stringify(input)).digest("hex").slice(0, 16);
}

/** ISO week, e.g. "2026-W43". */
export function isoWeekKey(today: Date): string {
  return format(today, "RRRR-'W'II");
}

export function buildSummaryPrompt(input: SummaryInput): string {
  return `You write a short weekly check-in for someone tracking their job applications.

Data (JSON, counts only):
${JSON.stringify(input, null, 2)}

Field meanings:
- thisWeek / previousWeek: the last ${input.windowDays} days and the ${input.windowDays} days before. "replies" is applications that got their first employer reply; "interviews" is applications that reached an interview for the first time.
- open: applications still in progress. waiting = no reply yet.
- needsAction.noReply: applied 7 to 14 days ago with no reply. interviewStale: interviewing with no update for 7+ days. ghostingSoon: will be marked ghosted within 7 days.
- weeklyGoal: applications per week the user aims for, or null.
- last90Days.interviewRatePercent: null when there are too few applications to give a rate.

Write three fields:
- whatChanged: 1-2 sentences comparing this week with the previous week.
- whatIsStuck: 1-2 sentences on what is waiting or at risk.
- suggestion: one concrete next step for this week.

Rules:
- Use only numbers that appear in the data, or the difference between a thisWeek and previousWeek value. Never estimate, average or invent a number.
- If a count is too small to mean anything, do not draw conclusions from it.
- Plain, direct English. Address the reader as "you". No praise, no filler, no exclamation marks.
- citedMetrics lists the data fields you used, as dotted paths such as "thisWeek.replies".`;
}

/** Gemini response schema for {@link WeeklySummary}. */
export const SUMMARY_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    whatChanged: { type: "string" },
    whatIsStuck: { type: "string" },
    suggestion: { type: "string" },
    citedMetrics: { type: "array", items: { type: "string" } },
  },
  required: ["whatChanged", "whatIsStuck", "suggestion", "citedMetrics"],
} as const;

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** A summary written from rules, used without an API key and to replace text that failed grounding. */
export function ruleBasedSummary(input: SummaryInput): WeeklySummary {
  const { thisWeek: t, previousWeek: p, needsAction: a, weeklyGoal } = input;

  const changed = [
    `You sent ${plural(t.applied, "application", "applications")} in the last ${input.windowDays} days, against ${p.applied} the week before.`,
  ];
  if (t.replies || t.interviews || t.offers) {
    changed.push(
      `${plural(t.replies, "application", "applications")} got a first reply and ${t.interviews} reached an interview${t.offers ? `, and you got ${plural(t.offers, "offer", "offers")}` : ""}.`,
    );
  } else {
    changed.push("No new replies or interviews this week.");
  }

  const stuckParts = [
    a.interviewStale && `${plural(a.interviewStale, "interview has", "interviews have")} had no update for 7 days or more`,
    a.noReply && `${plural(a.noReply, "application has", "applications have")} had no reply for 7 to 14 days`,
    a.ghostingSoon && `${plural(a.ghostingSoon, "application", "applications")} will be marked ghosted within 7 days`,
  ].filter(Boolean) as string[];
  const stuck = stuckParts.length
    ? `${stuckParts.join("; ")}.`.replace(/^./, (c) => c.toUpperCase())
    : "Nothing is waiting on a follow-up right now.";

  let suggestion: string;
  if (a.interviewStale) suggestion = "Follow up on the interviews with no update first; they are closest to an offer.";
  else if (a.noReply) suggestion = "Send a short follow-up to the applications with no reply after a week.";
  else if (weeklyGoal !== null && t.applied < weeklyGoal)
    suggestion = `Send ${weeklyGoal - t.applied} more to reach your weekly goal of ${weeklyGoal}.`;
  else suggestion = "Keep your current pace and check back next week.";

  return {
    whatChanged: changed.join(" "),
    whatIsStuck: stuck,
    suggestion,
    citedMetrics: ["thisWeek.applied", "previousWeek.applied", "needsAction"],
  };
}

/** Day counts the prompt's field definitions use ("7 to 14 days", "last 90 days"). */
const DEFINITION_NUMBERS = [7, 14, 90];

function allowedNumbers(input: SummaryInput): Set<number> {
  const allowed = new Set<number>(DEFINITION_NUMBERS);
  const walk = (value: unknown) => {
    if (typeof value === "number") allowed.add(value);
    else if (value && typeof value === "object") Object.values(value).forEach(walk);
  };
  walk(input);
  for (const key of Object.keys(input.thisWeek) as (keyof WeekCounts)[]) {
    allowed.add(Math.abs(input.thisWeek[key] - input.previousWeek[key]));
  }
  if (input.weeklyGoal !== null) allowed.add(Math.abs(input.weeklyGoal - input.thisWeek.applied));
  return allowed;
}

function leafPaths(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object") return [prefix];
  return Object.entries(value).flatMap(([key, child]) => [
    prefix ? `${prefix}.${key}` : key,
    ...(child && typeof child === "object" ? leafPaths(child, prefix ? `${prefix}.${key}` : key) : []),
  ]);
}

export interface GroundingResult {
  summary: WeeklySummary;
  /** Sentences removed because they named a number not in the input. */
  dropped: string[];
}

/**
 * Removes sentences that state a number the input does not contain. A field
 * left empty falls back to the rule-based text, so the card is never blank.
 */
export function groundSummary(raw: WeeklySummary, input: SummaryInput): GroundingResult {
  const allowed = allowedNumbers(input);
  const fallback = ruleBasedSummary(input);
  const dropped: string[] = [];

  const clean = (text: unknown, field: keyof Omit<WeeklySummary, "citedMetrics">) => {
    // Split after . ! ? followed by a space, so "13.5" stays one number.
    const sentences = (typeof text === "string" ? text : "").trim().split(/(?<=[.!?])\s+/).filter(Boolean);
    const kept = sentences.filter((sentence) => {
      const numbers = sentence.replace(/(\d),(\d{3})/g, "$1$2").match(/\d+(?:\.\d+)?/g) ?? [];
      const ok = numbers.every((n) => allowed.has(Number(n)));
      if (!ok) dropped.push(sentence);
      return ok;
    });
    const result = kept.join(" ");
    return result || fallback[field];
  };

  const paths = new Set(leafPaths(input));
  return {
    summary: {
      whatChanged: clean(raw.whatChanged, "whatChanged"),
      whatIsStuck: clean(raw.whatIsStuck, "whatIsStuck"),
      suggestion: clean(raw.suggestion, "suggestion"),
      citedMetrics: Array.isArray(raw.citedMetrics)
        ? raw.citedMetrics.filter((m): m is string => typeof m === "string" && paths.has(m))
        : [],
    },
    dropped,
  };
}

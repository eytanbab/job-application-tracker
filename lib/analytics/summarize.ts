import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfISOWeek,
  subWeeks,
} from "date-fns";
import { statusOptions, type StatusKind } from "@/lib/utils";
import { buildFacts } from "./facts";
import { inRange, type ResolvedRange } from "./range";
import { summarizeSalaries, type SalarySummary } from "./salary";
import {
  countDelta,
  median,
  rate,
  rateDelta,
  separates,
  type Delta,
} from "./stats";
import type { AnalyticsDataset, AppFacts, DateRange, Rate, WorkMode } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

/** First-update gaps longer than this are treated as bad data, not slow replies. */
const MAX_RESPONSE_DAYS = 120;

export type KindCounts = Record<StatusKind, number>;

const emptyKindCounts = (): KindCounts =>
  Object.fromEntries(statusOptions.map(({ value }) => [value, 0])) as KindCounts;

export interface Totals {
  applications: number;
  active: number;
  activeByKind: Pick<KindCounts, "applied" | "review" | "interview" | "other">;
  responded: number;
  interviewed: number;
  offers: number;
  rejected: { total: number; beforeInterview: number; afterInterview: number };
  ghosted: { total: number; beforeInterview: number; afterInterview: number };
}

export interface Kpis {
  applications: { value: number; previous: number | null; delta: Delta | null };
  responseRate: { rate: Rate; previous: Rate | null; delta: Delta | null };
  interviewRate: { rate: Rate; previous: Rate | null; delta: Delta | null };
  /** Offers out of applications that reached an interview. */
  offerRate: { rate: Rate; previous: Rate | null; delta: Delta | null };
  offers: { value: number; previous: number | null };
  daysToFirstUpdate: { median: number | null; n: number; previous: number | null };
}

export interface StageTiming {
  median: number | null;
  n: number;
}

export interface PlatformSummary {
  key: string;
  label: string;
  total: number;
  responded: Rate;
  interviewed: Rate;
  offers: number;
  byKind: KindCounts;
}

export interface WorkModeSummary {
  mode: WorkMode;
  total: number;
  share: number;
  interviewed: Rate;
}

export interface ResumeSummary {
  resumeId: string | null;
  title: string;
  total: number;
  interviewed: Rate;
}

export type ActivityGranularity = "week" | "month";

export interface ActivityBucket {
  /** First day of the week (Monday) or month, `YYYY-MM-DD`. */
  start: string;
  total: number;
  byKind: KindCounts;
}

export interface Activity {
  granularity: ActivityGranularity;
  buckets: ActivityBucket[];
}

export interface WeekBucket {
  /** Monday of the week, `YYYY-MM-DD`. */
  start: string;
  total: number;
}

export interface ActionItem {
  id: string;
  role: string;
  company: string;
  /** Days since applied, since last update, or until ghosted. */
  days: number;
}

export interface ActionGroup {
  total: number;
  items: ActionItem[];
}

export interface AnalyticsOverview {
  range: ResolvedRange;
  totals: Totals;
  kpis: Kpis;
  timeInStage: {
    toFirstUpdate: StageTiming;
    updateToInterview: StageTiming;
    interviewToOffer: StageTiming;
  };
  platforms: PlatformSummary[];
  /** Key of a platform that clearly beats the next one, or null. */
  topPlatformKey: string | null;
  workModes: WorkModeSummary[];
  resumes: ResumeSummary[];
  salary: SalarySummary;
  activity: Activity;
  needsAction: {
    noReply: ActionGroup;
    interviewStale: ActionGroup;
    ghostingSoon: ActionGroup;
  };
  /** Applications per week for the last 12 weeks, oldest first, whatever the period. */
  weeks: WeekBucket[];
  /** Years that have applications, newest first. */
  years: string[];
}

export interface SummarizeOptions {
  preferredCurrency?: string | null;
  /** How many items each needs-action group lists. */
  actionLimit?: number;
}

function totalsOf(facts: readonly AppFacts[]): Totals {
  const t: Totals = {
    applications: facts.length,
    active: 0,
    activeByKind: { applied: 0, review: 0, interview: 0, other: 0 },
    responded: 0,
    interviewed: 0,
    offers: 0,
    rejected: { total: 0, beforeInterview: 0, afterInterview: 0 },
    ghosted: { total: 0, beforeInterview: 0, afterInterview: 0 },
  };
  for (const f of facts) {
    if (f.responded) t.responded++;
    if (f.reachedInterview) t.interviewed++;
    if (f.isOffer) t.offers++;
    if (f.isActive) {
      t.active++;
      t.activeByKind[f.kind as keyof Totals["activeByKind"]]++;
    }
    const exit = f.isRejected ? t.rejected : f.isGhosted ? t.ghosted : null;
    if (exit) {
      exit.total++;
      if (f.reachedInterview) exit.afterInterview++;
      else exit.beforeInterview++;
    }
  }
  return t;
}

/** Whole days from applying to the first reply the user logged, or null when unusable. */
function daysToFirstUpdate(f: AppFacts): number | null {
  if (f.firstUpdateAt === null) return null;
  const applied = parseISO(f.app.dateApplied);
  if (Number.isNaN(applied.getTime())) return null;
  const days = differenceInCalendarDays(new Date(f.firstUpdateAt), applied);
  if (days < 0 || days > MAX_RESPONSE_DAYS) return null;
  // Imported applications get all their history on the day they were added.
  const importedLate =
    differenceInCalendarDays(new Date(f.app.createdAt), applied) > 30 &&
    f.firstUpdateAt - f.app.createdAt < DAY_MS;
  return importedLate ? null : days;
}

function timing(values: (number | null)[]): StageTiming {
  const usable = values.filter((v): v is number => v !== null && v >= 0);
  return { median: median(usable), n: usable.length };
}

/** Days from start to end; null unless end comes strictly after start. */
function gapDays(start: number | null, end: number | null): number | null {
  if (start === null || end === null || end <= start) return null;
  return Math.round((end - start) / DAY_MS);
}

function summarizePlatforms(facts: readonly AppFacts[]): PlatformSummary[] {
  type Group = { labels: Map<string, number>; facts: AppFacts[] };
  const groups = new Map<string, Group>();
  for (const f of facts) {
    const group: Group = groups.get(f.platformKey) ?? { labels: new Map(), facts: [] };
    const label = f.app.platform.trim();
    group.labels.set(label, (group.labels.get(label) ?? 0) + 1);
    group.facts.push(f);
    groups.set(f.platformKey, group);
  }
  return [...groups.entries()]
    .map(([key, { labels, facts: rows }]) => {
      const byKind = emptyKindCounts();
      for (const f of rows) byKind[f.kind]++;
      const label = key
        ? [...labels.entries()].sort((a, b) => b[1] - a[1])[0][0]
        : "Not set";
      return {
        key,
        label,
        total: rows.length,
        responded: rate(rows.filter((f) => f.responded).length, rows.length),
        interviewed: rate(rows.filter((f) => f.reachedInterview).length, rows.length),
        offers: rows.filter((f) => f.isOffer).length,
        byKind,
      };
    })
    .sort((a, b) => b.total - a.total || a.label.localeCompare(b.label));
}

function pickTopPlatform(platforms: readonly PlatformSummary[]): string | null {
  const ranked = platforms
    .filter((p) => p.key)
    .sort((a, b) => b.interviewed.pct - a.interviewed.pct);
  if (ranked.length < 2) return null;
  return separates(ranked[0].interviewed, ranked[1].interviewed) ? ranked[0].key : null;
}

const WORK_MODES: WorkMode[] = ["remote", "hybrid", "onsite", "unknown"];

function summarizeWorkModes(facts: readonly AppFacts[]): WorkModeSummary[] {
  return WORK_MODES.map((mode) => {
    const rows = facts.filter((f) => f.workMode === mode);
    return {
      mode,
      total: rows.length,
      share: facts.length ? rows.length / facts.length : 0,
      interviewed: rate(rows.filter((f) => f.reachedInterview).length, rows.length),
    };
  }).filter((m) => m.mode !== "unknown" || m.total > 0);
}

function summarizeResumes(facts: readonly AppFacts[]): ResumeSummary[] {
  const groups = new Map<string | null, AppFacts[]>();
  for (const f of facts) {
    const id = f.app.resumeId ?? null;
    groups.set(id, [...(groups.get(id) ?? []), f]);
  }
  return [...groups.entries()]
    .map(([resumeId, rows]) => ({
      resumeId,
      title: resumeId ? rows[0].app.resumeTitle ?? "Untitled resume" : "No resume attached",
      total: rows.length,
      interviewed: rate(rows.filter((f) => f.reachedInterview).length, rows.length),
    }))
    .sort((a, b) => b.total - a.total);
}

const WEEKS_SHOWN = 12;

/** Applications per ISO week (Monday start) for the last 12 weeks including this one. */
export function bucketWeeks(facts: readonly AppFacts[], today: Date): WeekBucket[] {
  const thisWeek = startOfISOWeek(today);
  const weeks = Array.from({ length: WEEKS_SHOWN }, (_, i) => ({
    start: format(subWeeks(thisWeek, WEEKS_SHOWN - 1 - i), "yyyy-MM-dd"),
    total: 0,
  }));
  const index = new Map(weeks.map((w, i) => [w.start, i]));
  for (const f of facts) {
    const applied = parseISO(f.app.dateApplied);
    if (Number.isNaN(applied.getTime())) continue;
    const i = index.get(format(startOfISOWeek(applied), "yyyy-MM-dd"));
    if (i !== undefined) weeks[i].total++;
  }
  return weeks;
}

const periodStart = (date: Date, granularity: ActivityGranularity) =>
  granularity === "week" ? startOfISOWeek(date) : new Date(date.getFullYear(), date.getMonth(), 1);

const nextPeriod = (date: Date, granularity: ActivityGranularity) =>
  granularity === "week" ? addDays(date, 7) : new Date(date.getFullYear(), date.getMonth() + 1, 1);

/**
 * Counts per week or month by current status, covering the whole period
 * (or the first to last application when the period is open-ended).
 */
export function bucketActivity(
  facts: readonly AppFacts[],
  granularity: ActivityGranularity,
  range: DateRange = { from: null, to: null },
): ActivityBucket[] {
  const dates = facts.map((f) => f.app.dateApplied).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  const from = range.from ?? dates[0];
  const to = range.to ?? dates[dates.length - 1];
  if (!from || !to) return [];

  const buckets = new Map<string, ActivityBucket>();
  for (
    let cursor = periodStart(parseISO(from), granularity);
    cursor <= parseISO(to);
    cursor = nextPeriod(cursor, granularity)
  ) {
    const start = format(cursor, "yyyy-MM-dd");
    buckets.set(start, { start, total: 0, byKind: emptyKindCounts() });
  }
  for (const f of facts) {
    const key = format(periodStart(parseISO(f.app.dateApplied), granularity), "yyyy-MM-dd");
    const bucket = buckets.get(key);
    if (!bucket) continue;
    bucket.total++;
    bucket.byKind[f.kind]++;
  }
  return [...buckets.values()];
}

function actionGroup(
  rows: { fact: AppFacts; days: number }[],
  limit: number,
  order: "asc" | "desc",
): ActionGroup {
  const sorted = [...rows].sort((a, b) => (order === "asc" ? a.days - b.days : b.days - a.days));
  return {
    total: rows.length,
    items: sorted.slice(0, limit).map(({ fact, days }) => ({
      id: fact.app.id,
      role: fact.app.role,
      company: fact.app.company,
      days,
    })),
  };
}

/** Open applications that need a nudge, regardless of the selected period. */
function needsAction(facts: readonly AppFacts[], today: Date, limit: number) {
  const now = today.getTime();
  const noReply: { fact: AppFacts; days: number }[] = [];
  const interviewStale: { fact: AppFacts; days: number }[] = [];
  const ghostingSoon: { fact: AppFacts; days: number }[] = [];
  const soon = addDays(today, 7).getTime();

  for (const f of facts) {
    if (f.kind === "applied" && !f.responded) {
      const days = differenceInCalendarDays(today, parseISO(f.app.dateApplied));
      if (days >= 7 && days <= 14) noReply.push({ fact: f, days });
    }
    if (f.kind === "interview") {
      const days = Math.floor((now - f.lastActivityAt) / DAY_MS);
      if (days >= 7) interviewStale.push({ fact: f, days });
    }
    if (f.ghostsAt !== null && f.ghostsAt > now && f.ghostsAt <= soon) {
      ghostingSoon.push({ fact: f, days: Math.ceil((f.ghostsAt - now) / DAY_MS) });
    }
  }
  return {
    noReply: actionGroup(noReply, limit, "desc"),
    interviewStale: actionGroup(interviewStale, limit, "desc"),
    ghostingSoon: actionGroup(ghostingSoon, limit, "asc"),
  };
}

function periodMetrics(facts: readonly AppFacts[]) {
  const t = totalsOf(facts);
  const days = timing(facts.map(daysToFirstUpdate));
  return {
    totals: t,
    responseRate: rate(t.responded, t.applications),
    interviewRate: rate(t.interviewed, t.applications),
    offerRate: rate(t.offers, t.interviewed),
    days,
  };
}

/** Every number the analytics page shows, from one dataset and one set of definitions. */
export function summarizeOverview(
  dataset: AnalyticsDataset,
  range: ResolvedRange,
  today: Date,
  options: SummarizeOptions = {},
): AnalyticsOverview {
  const allFacts = buildFacts(dataset);
  const facts = allFacts.filter((f) => inRange(f.app.dateApplied, range.current));
  const prevFacts = range.previous
    ? allFacts.filter((f) => inRange(f.app.dateApplied, range.previous!))
    : null;

  const cur = periodMetrics(facts);
  const prev = prevFacts ? periodMetrics(prevFacts) : null;

  const platforms = summarizePlatforms(facts);

  return {
    range,
    totals: cur.totals,
    kpis: {
      applications: {
        value: cur.totals.applications,
        previous: prev?.totals.applications ?? null,
        delta: countDelta(cur.totals.applications, prev?.totals.applications ?? null),
      },
      responseRate: {
        rate: cur.responseRate,
        previous: prev?.responseRate ?? null,
        delta: rateDelta(cur.responseRate, prev?.responseRate ?? null),
      },
      interviewRate: {
        rate: cur.interviewRate,
        previous: prev?.interviewRate ?? null,
        delta: rateDelta(cur.interviewRate, prev?.interviewRate ?? null),
      },
      offerRate: {
        rate: cur.offerRate,
        previous: prev?.offerRate ?? null,
        delta: rateDelta(cur.offerRate, prev?.offerRate ?? null),
      },
      offers: { value: cur.totals.offers, previous: prev?.totals.offers ?? null },
      daysToFirstUpdate: {
        median: cur.days.median,
        n: cur.days.n,
        previous: prev?.days.median ?? null,
      },
    },
    timeInStage: {
      toFirstUpdate: cur.days,
      updateToInterview: timing(facts.map((f) => gapDays(f.firstUpdateAt, f.firstInterviewAt))),
      interviewToOffer: timing(
        facts.filter((f) => f.isOffer).map((f) => gapDays(f.firstInterviewAt, f.lastActivityAt)),
      ),
    },
    platforms,
    topPlatformKey: pickTopPlatform(platforms),
    workModes: summarizeWorkModes(facts),
    resumes: summarizeResumes(facts),
    salary: summarizeSalaries(facts, options.preferredCurrency),
    activity: {
      granularity: range.days !== null && range.days <= 90 ? "week" : "month",
      buckets: bucketActivity(
        facts,
        range.days !== null && range.days <= 90 ? "week" : "month",
        range.current,
      ),
    },
    needsAction: needsAction(allFacts, today, options.actionLimit ?? 5),
    weeks: bucketWeeks(allFacts, today),
    years: [...new Set(allFacts.map((f) => f.app.dateApplied.slice(0, 4)))]
      .filter((y) => /^\d{4}$/.test(y))
      .sort()
      .reverse(),
  };
}

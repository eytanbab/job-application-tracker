import { format, parseISO, subDays } from "date-fns";
import type { AppFacts } from "./types";

const WINDOW_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

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

export interface WeeklyCounts {
  windowDays: number;
  /** The last 7 days, today included. */
  thisWeek: WeekCounts;
  /** The 7 days before that. */
  previousWeek: WeekCounts;
}

const iso = (date: Date) => format(date, "yyyy-MM-dd");

function weekCounts(facts: readonly AppFacts[], range: { from: string; to: string }): WeekCounts {
  // Event times are compared with whole local days, like date_applied.
  const start = parseISO(range.from).getTime();
  const end = parseISO(range.to).getTime() + DAY_MS;
  const within = (time: number | null) => time !== null && time >= start && time < end;

  const counts: WeekCounts = { applied: 0, replies: 0, interviews: 0, offers: 0, rejections: 0, ghosted: 0 };
  for (const f of facts) {
    if (f.app.dateApplied >= range.from && f.app.dateApplied <= range.to) counts.applied++;
    if (within(f.firstUpdateAt)) counts.replies++;
    if (within(f.firstInterviewAt)) counts.interviews++;
    // The status change that closed it is the latest history row.
    if (within(f.lastActivityAt)) {
      if (f.isOffer) counts.offers++;
      if (f.isRejected) counts.rejections++;
      if (f.isGhosted) counts.ghosted++;
    }
  }
  return counts;
}

/** What happened in the last 7 days against the 7 before, whatever the selected period. */
export function weeklyCounts(facts: readonly AppFacts[], today: Date): WeeklyCounts {
  const thisWeek = { from: iso(subDays(today, WINDOW_DAYS - 1)), to: iso(today) };
  const previousWeek = { from: iso(subDays(today, 2 * WINDOW_DAYS - 1)), to: iso(subDays(today, WINDOW_DAYS)) };
  return {
    windowDays: WINDOW_DAYS,
    thisWeek: weekCounts(facts, thisWeek),
    previousWeek: weekCounts(facts, previousWeek),
  };
}


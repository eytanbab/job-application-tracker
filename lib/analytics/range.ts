import {
  differenceInCalendarDays,
  endOfMonth,
  format,
  isValid,
  parseISO,
  startOfYear,
  subDays,
} from "date-fns";
import type { DateRange } from "./types";

export const RANGE_PRESETS = ["7d", "30d", "90d", "ytd", "all", "custom"] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number];

export const PRESET_LABELS: Record<RangePreset, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  ytd: "This year",
  all: "All time",
  custom: "Custom range",
};

const PRESET_DAYS: Partial<Record<RangePreset, number>> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export interface RangeParams {
  range?: string | null;
  from?: string | null;
  to?: string | null;
  /** Legacy filter params, still accepted from old links. */
  month?: string | null;
  year?: string | null;
}

export interface ResolvedRange {
  preset: RangePreset;
  current: DateRange;
  /** Same length immediately before `current`; null when open-ended. */
  previous: DateRange | null;
  label: string;
  /** Length in days, or null for an open-ended range. */
  days: number | null;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** True for a real calendar date in `YYYY-MM-DD` form. */
export function isIsoDate(value: string | null | undefined): value is string {
  if (!value || !ISO_DATE.test(value)) return false;
  const date = parseISO(value);
  return isValid(date) && format(date, "yyyy-MM-dd") === value;
}

const iso = (date: Date) => format(date, "yyyy-MM-dd");

export function inRange(dateApplied: string, range: DateRange): boolean {
  if (range.from && dateApplied < range.from) return false;
  if (range.to && dateApplied > range.to) return false;
  return true;
}

function previousOf(from: string, to: string): { previous: DateRange; days: number } {
  const start = parseISO(from);
  const days = differenceInCalendarDays(parseISO(to), start) + 1;
  return {
    previous: { from: iso(subDays(start, days)), to: iso(subDays(start, 1)) },
    days,
  };
}

function formatSpan(from: string, to: string): string {
  const start = parseISO(from);
  const end = parseISO(to);
  const sameYear = start.getFullYear() === end.getFullYear();
  return `${format(start, sameYear ? "d MMM" : "d MMM yyyy")} - ${format(end, "d MMM yyyy")}`;
}

function closed(preset: RangePreset, from: string, to: string, label: string): ResolvedRange {
  const { previous, days } = previousOf(from, to);
  return { preset, current: { from, to }, previous, label, days };
}

const ALL_TIME: ResolvedRange = {
  preset: "all",
  current: { from: null, to: null },
  previous: null,
  label: PRESET_LABELS.all,
  days: null,
};

function fromLegacy(month: string | null | undefined, year: string | null | undefined): ResolvedRange | null {
  const y = year && year !== "all" && /^\d{4}$/.test(year) ? Number(year) : null;
  if (y === null) return null;
  const m = month && month !== "all" ? Number(month) : null;
  if (m !== null && m >= 1 && m <= 12) {
    const start = new Date(y, m - 1, 1);
    return closed("custom", iso(start), iso(endOfMonth(start)), format(start, "MMMM yyyy"));
  }
  return closed("custom", `${y}-01-01`, `${y}-12-31`, String(y));
}

/**
 * Turns URL params into the date range to analyse and the period to compare
 * it with. A month without a year (an old filter) means all time, because
 * "October" across every year is not a useful period.
 */
export function resolveRange(
  params: RangeParams,
  today: Date,
  defaultPreset: RangePreset = "90d",
): ResolvedRange {
  const legacy = fromLegacy(params.month, params.year);
  const preset = (RANGE_PRESETS as readonly string[]).includes(params.range ?? "")
    ? (params.range as RangePreset)
    : null;

  if (!preset && legacy) return legacy;
  const chosen = preset ?? (params.month && params.month !== "all" ? "all" : defaultPreset);
  const todayIso = iso(today);

  const days = PRESET_DAYS[chosen];
  if (days) {
    return closed(chosen, iso(subDays(today, days - 1)), todayIso, PRESET_LABELS[chosen]);
  }
  if (chosen === "ytd") {
    return closed("ytd", iso(startOfYear(today)), todayIso, PRESET_LABELS.ytd);
  }
  if (chosen === "custom") {
    let from = isIsoDate(params.from) ? params.from : null;
    let to = isIsoDate(params.to) ? params.to : null;
    if (from && to && from > to) [from, to] = [to, from];
    if (from && to) return closed("custom", from, to, formatSpan(from, to));
    if (from || to) {
      return {
        preset: "custom",
        current: { from, to },
        previous: null,
        label: from ? `From ${format(parseISO(from), "d MMM yyyy")}` : `Until ${format(parseISO(to!), "d MMM yyyy")}`,
        days: null,
      };
    }
    return ALL_TIME;
  }
  return ALL_TIME;
}

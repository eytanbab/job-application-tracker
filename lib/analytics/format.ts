import { statusLabels, type StatusKind } from "@/lib/utils";
import type { ResolvedRange } from "./range";
import type { Delta } from "./stats";
import type { Rate } from "./types";

/** "42%", or "<1%" for a small non-zero share. */
export function formatPct(fraction: number): string {
  if (fraction > 0 && fraction < 0.005) return "<1%";
  return `${Math.round(fraction * 100)}%`;
}

/** The headline for a rate: a percentage when there is enough data, else "k of n". */
export function rateHeadline(rate: Rate): string {
  if (rate.n === 0) return "-";
  return rate.enough ? formatPct(rate.pct) : `${rate.k} of ${rate.n}`;
}

export function formatDays(days: number | null): string {
  if (days === null) return "-";
  const rounded = Math.round(days * 10) / 10;
  return `${rounded} ${rounded === 1 ? "day" : "days"}`;
}

export type DeltaTone = "good" | "bad" | "neutral";

export interface DeltaText {
  /** Short visible text, e.g. "+3 pts". */
  short: string;
  /** Full sentence for screen readers. */
  spoken: string;
  tone: DeltaTone;
}

/**
 * Describes a change against the previous period. `unit` decides the wording;
 * `higherIsBetter` decides the colour, which is only used when the change is
 * based on enough data.
 */
export function describeDelta(
  delta: Delta | null,
  unit: "points" | "count" | "days",
  periodLabel: string,
  higherIsBetter = true,
): DeltaText | null {
  if (!delta) return null;
  const value = unit === "points" ? Math.round(delta.change * 100) : Math.round(delta.change * 10) / 10;
  const suffix = unit === "points" ? " pts" : unit === "days" ? (Math.abs(value) === 1 ? " day" : " days") : "";
  const against = `vs ${periodLabel}`;
  if (value === 0) {
    return { short: `No change ${against}`, spoken: `No change ${against}`, tone: "neutral" };
  }
  const sign = value > 0 ? "+" : "-";
  const word = value > 0 ? "up" : "down";
  const spokenUnit = unit === "points" ? " points" : suffix;
  const improved = value > 0 === higherIsBetter;
  return {
    short: `${sign}${Math.abs(value)}${suffix} ${against}`,
    spoken: `${word} ${Math.abs(value)}${spokenUnit} ${against}`,
    tone: delta.meaningful ? (improved ? "good" : "bad") : "neutral",
  };
}

/** Status names as the analytics page says them ("Offer", not "Accepted / Offer"). */
export function statusLabel(kind: StatusKind): string {
  return kind === "accepted" ? "Offer" : statusLabels[kind];
}

/** "previous 30 days" for presets, "previous period" otherwise. */
export function previousPeriodLabel(range: ResolvedRange): string {
  return range.days && ["7d", "30d", "90d"].includes(range.preset)
    ? `previous ${range.days} days`
    : "previous period";
}

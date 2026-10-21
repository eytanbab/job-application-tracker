import type { Rate } from "./types";

/** Below this many applications a rate is shown as "k of n (early)". */
export const MIN_SAMPLE = 10;

/** Both periods need this many applications before a delta gets a colour. */
export const MIN_SAMPLE_FOR_DELTA = 20;

/** 95% Wilson score interval for k successes out of n. */
export function wilson(k: number, n: number, z = 1.96): { low: number; high: number } {
  if (n <= 0) return { low: 0, high: 0 };
  const p = k / n;
  const z2 = z * z;
  const denom = 1 + z2 / n;
  const centre = p + z2 / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p)) / n + z2 / (4 * n * n));
  return {
    low: Math.max(0, (centre - margin) / denom),
    high: Math.min(1, (centre + margin) / denom),
  };
}

export function rate(k: number, n: number, minN = MIN_SAMPLE): Rate {
  const { low, high } = wilson(k, n);
  return { k, n, pct: n > 0 ? k / n : 0, low, high, enough: n >= minN };
}

/** Median of a list of numbers; null for an empty list. */
export function median(values: readonly number[]): number | null {
  return quantile(values, 0.5);
}

/** Linear-interpolated quantile (q in 0-1); null for an empty list. */
export function quantile(values: readonly number[], q: number): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const lower = Math.floor(pos);
  const upper = Math.ceil(pos);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (pos - lower);
}

/**
 * True when `best` is clearly ahead of `next`: both have enough data and the
 * intervals do not overlap. Used before calling anything "top" or "best".
 */
export function separates(best: Rate, next: Rate, minN = MIN_SAMPLE_FOR_DELTA): boolean {
  return best.n >= minN && next.n >= minN && best.low > next.high;
}

export interface Delta {
  /** current - previous, in the metric's own unit (fraction points for rates). */
  change: number;
  /** Whether both sides have enough data to treat the change as meaningful. */
  meaningful: boolean;
}

export function rateDelta(current: Rate, previous: Rate | null): Delta | null {
  if (!previous || previous.n === 0) return null;
  return {
    change: current.pct - previous.pct,
    meaningful:
      current.n >= MIN_SAMPLE_FOR_DELTA && previous.n >= MIN_SAMPLE_FOR_DELTA,
  };
}

export function countDelta(current: number, previous: number | null): Delta | null {
  if (previous === null) return null;
  return {
    change: current - previous,
    meaningful: Math.max(current, previous) >= MIN_SAMPLE_FOR_DELTA,
  };
}

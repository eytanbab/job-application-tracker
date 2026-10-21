import { unstable_cache } from "next/cache";
import { isMockDb } from "@/app/db";
import type { WeeklySummary } from "./weekly-summary";

export interface StoredSummary {
  summary: WeeklySummary;
  generatedAt: string;
}

// Summaries depend only on the key (user, ISO week, input hash), so a revisit
// with unchanged data reuses the stored one and costs no AI quota. Entries
// outlive their week by a day, then expire.
const REVALIDATE_SECONDS = 8 * 24 * 60 * 60;

// Mock mode keeps them in memory, surviving dev-server module reloads.
const globalForSummaries = globalThis as unknown as {
  analyticsSummaries?: Map<string, StoredSummary>;
};

/**
 * Returns the stored summary for `key`, or runs `compute` and stores its
 * result. A throw from `compute` is not stored, so a failed or over-quota
 * request can be retried.
 */
export async function cachedSummary(
  key: string[],
  compute: () => Promise<StoredSummary>,
): Promise<StoredSummary> {
  if (!isMockDb) {
    return unstable_cache(compute, ["analytics-summary", ...key], {
      revalidate: REVALIDATE_SECONDS,
    })();
  }
  const store = (globalForSummaries.analyticsSummaries ??= new Map());
  const id = key.join("|");
  const hit = store.get(id);
  if (hit) return hit;
  const value = await compute();
  store.set(id, value);
  return value;
}

/** Test helper: forget every in-memory summary. */
export function clearSummaryCache() {
  globalForSummaries.analyticsSummaries?.clear();
}

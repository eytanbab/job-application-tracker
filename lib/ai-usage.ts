import { and, eq, sql } from "drizzle-orm";
import { db, isMockDb, type AppDatabase } from "@/app/db";
import { aiUsage } from "@/app/db/schema";
import {
  AiFeature,
  getDailyLimit,
  getQuotaResetAt,
  getUsageDay,
} from "./ai-quota";

export interface AiUsageKey {
  userId: string;
  feature: AiFeature;
  day: string;
}

export interface AiUsageStore {
  /**
   * Atomically records one use unless the count already reached `limit`.
   * Returns the new count, or null when the limit was already reached.
   */
  increment(key: AiUsageKey, limit: number): Promise<number | null>;
  get(key: AiUsageKey): Promise<number>;
}

/**
 * INSERT … ON CONFLICT DO UPDATE SET count = count + 1 WHERE count < limit
 * RETURNING count. One statement, so concurrent requests can't overshoot.
 * It returns no row when the limit was already reached.
 */
export function buildIncrementQuery(
  database: Pick<AppDatabase, "insert">,
  { userId, feature, day }: AiUsageKey,
  limit: number,
) {
  return database
    .insert(aiUsage)
    .values({ userId, feature, day, count: 1 })
    .onConflictDoUpdate({
      target: [aiUsage.userId, aiUsage.feature, aiUsage.day],
      set: { count: sql`${aiUsage.count} + 1`, updatedAt: sql`now()` },
      setWhere: sql`${aiUsage.count} < ${limit}`,
    })
    .returning({ count: aiUsage.count });
}

export const postgresAiUsageStore: AiUsageStore = {
  async increment(key, limit) {
    const rows = await buildIncrementQuery(db, key, limit);
    return rows[0]?.count ?? null;
  },

  async get({ userId, feature, day }) {
    const rows = await db
      .select({ count: aiUsage.count })
      .from(aiUsage)
      .where(
        and(
          eq(aiUsage.userId, userId),
          eq(aiUsage.feature, feature),
          eq(aiUsage.day, day),
        ),
      )
      .limit(1);
    return rows[0]?.count ?? 0;
  },
};

/**
 * In-memory store for mock mode (no DATABASE_URL). Counts reset when the dev
 * server restarts; that is enough to exercise the limit locally.
 */
export class MemoryAiUsageStore implements AiUsageStore {
  private counts = new Map<string, number>();

  private keyOf({ userId, feature, day }: AiUsageKey): string {
    return `${userId}|${feature}|${day}`;
  }

  async increment(key: AiUsageKey, limit: number) {
    const current = this.counts.get(this.keyOf(key)) ?? 0;
    if (current >= limit) return null;
    this.counts.set(this.keyOf(key), current + 1);
    return current + 1;
  }

  async get(key: AiUsageKey) {
    return this.counts.get(this.keyOf(key)) ?? 0;
  }
}

// Survives dev-server module reloads, like a real table would.
const globalForAiUsage = globalThis as unknown as {
  memoryAiUsageStore?: MemoryAiUsageStore;
};

function getDefaultStore(): AiUsageStore {
  if (!isMockDb) return postgresAiUsageStore;
  globalForAiUsage.memoryAiUsageStore ??= new MemoryAiUsageStore();
  return globalForAiUsage.memoryAiUsageStore;
}

export type AiQuotaResult =
  | { allowed: true; used: number; limit: number; resetAt: Date }
  | { allowed: false; limit: number; resetAt: Date };

interface QuotaOptions {
  now?: Date;
  store?: AiUsageStore;
  limit?: number;
}

/**
 * Records one paid AI call for the user. Call it right before the request to
 * Gemini, after every free path has been tried.
 */
export async function consumeAiQuota(
  userId: string,
  feature: AiFeature,
  { now = new Date(), store = getDefaultStore(), limit = getDailyLimit(feature) }: QuotaOptions = {},
): Promise<AiQuotaResult> {
  const resetAt = getQuotaResetAt(now);
  if (limit <= 0) return { allowed: false, limit, resetAt };

  const used = await store.increment({ userId, feature, day: getUsageDay(now) }, limit);
  return used === null
    ? { allowed: false, limit, resetAt }
    : { allowed: true, used, limit, resetAt };
}

/**
 * Checks the limit without recording a use, so callers can skip other paid
 * work (such as scraping) for users who are already over it.
 */
export async function peekAiQuota(
  userId: string,
  feature: AiFeature,
  { now = new Date(), store = getDefaultStore(), limit = getDailyLimit(feature) }: QuotaOptions = {},
): Promise<AiQuotaResult> {
  const resetAt = getQuotaResetAt(now);
  const used = await store.get({ userId, feature, day: getUsageDay(now) });
  return used < limit
    ? { allowed: true, used, limit, resetAt }
    : { allowed: false, limit, resetAt };
}

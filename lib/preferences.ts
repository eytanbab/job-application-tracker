import { eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db, isMockDb } from "@/app/db";
import { userPreferences } from "@/app/db/schema";
import {
  CACHE_REVALIDATE_SECONDS,
  preferencesTag,
} from "@/app/actions/_utils/cache-tags";
import { mockStore } from "@/lib/mock-data/mock-store";
import { DEFAULT_PREFERENCES, type UserPreferences } from "./preference-options";

// Server-only. Reads and writes for the user_preferences row; the server
// actions in app/actions/preferences.ts validate input and resolve the user.

export {
  DEFAULT_PREFERENCES,
  SALARY_CURRENCIES,
  salaryCurrencySchema,
  weeklyGoalSchema,
  type UserPreferences,
} from "./preference-options";

export async function getPreferences(userId: string): Promise<UserPreferences> {
  if (isMockDb) return mockStore.getPreferences(userId) ?? DEFAULT_PREFERENCES;

  return unstable_cache(
    async () => {
      const [row] = await db
        .select({
          weeklyApplicationGoal: userPreferences.weeklyApplicationGoal,
          salaryCurrency: userPreferences.salaryCurrency,
        })
        .from(userPreferences)
        .where(eq(userPreferences.userId, userId));
      return row ?? DEFAULT_PREFERENCES;
    },
    ["preferences", userId],
    { revalidate: CACHE_REVALIDATE_SECONDS, tags: [preferencesTag(userId)] },
  )();
}

/** Upserts the given fields and returns the stored preferences. */
export async function savePreferences(
  userId: string,
  patch: Partial<UserPreferences>,
): Promise<UserPreferences> {
  if (isMockDb) return mockStore.setPreferences(userId, patch);

  const [row] = await db
    .insert(userPreferences)
    .values({ userId, ...patch })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: { ...patch, updatedAt: new Date() },
    })
    .returning({
      weeklyApplicationGoal: userPreferences.weeklyApplicationGoal,
      salaryCurrency: userPreferences.salaryCurrency,
    });
  return row;
}

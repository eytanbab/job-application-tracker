"use server";

import { revalidateTag } from "next/cache";
import {
  salaryCurrencySchema,
  savePreferences,
  weeklyGoalSchema,
  type UserPreferences,
} from "@/lib/preferences";
import { preferencesTag } from "./_utils/cache-tags";
import { getCurrentUserIdOrThrow } from "./_utils/user-context";

type Result = { ok: true; preferences: UserPreferences } | { ok: false; error: string };

async function save(patch: Partial<UserPreferences>): Promise<Result> {
  const userId = await getCurrentUserIdOrThrow();
  const preferences = await savePreferences(userId, patch);
  try {
    revalidateTag(preferencesTag(userId), "max");
  } catch {
    // Outside a request (tests): nothing to revalidate.
  }
  return { ok: true, preferences };
}

/** Sets the weekly application goal (1-200), or clears it with null. */
export async function updateWeeklyGoal(goal: number | null): Promise<Result> {
  const parsed = weeklyGoalSchema.safeParse(goal);
  if (!parsed.success) {
    return { ok: false, error: "Enter a whole number between 1 and 200." };
  }
  return save({ weeklyApplicationGoal: parsed.data });
}

/** Sets the currency salaries are shown in, or null to use the most common one. */
export async function updateSalaryCurrency(currency: string | null): Promise<Result> {
  const parsed = salaryCurrencySchema.safeParse(currency);
  if (!parsed.success) return { ok: false, error: "Choose a currency from the list." };
  return save({ salaryCurrency: parsed.data });
}

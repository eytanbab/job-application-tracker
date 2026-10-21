import { z } from "zod";

// Client-safe parts of the preferences model (no database imports), shared by
// the settings form, the analytics page and the server code in lib/preferences.ts.

export interface UserPreferences {
  weeklyApplicationGoal: number | null;
  salaryCurrency: string | null;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  weeklyApplicationGoal: null,
  salaryCurrency: null,
};

/** Currencies offered in settings; the salary parser recognizes each of them. */
export const SALARY_CURRENCIES = ["USD", "EUR", "GBP", "ILS", "INR", "CAD", "AUD"] as const;

export const weeklyGoalSchema = z.number().int().min(1).max(200).nullable();
export const salaryCurrencySchema = z.enum(SALARY_CURRENCIES).nullable();

"use server";

import { getAnalyticsDataset } from "@/lib/analytics/load";
import { cachedSummary } from "@/lib/analytics/summary-cache";
import {
  SUMMARY_RESPONSE_SCHEMA,
  buildSummaryInput,
  buildSummaryPrompt,
  groundSummary,
  isoWeekKey,
  ruleBasedSummary,
  summaryInputHash,
  type WeeklySummary,
} from "@/lib/analytics/weekly-summary";
import { formatQuotaExceededMessage, type AiAccessErrorCode } from "@/lib/ai-quota";
import { consumeAiQuota } from "@/lib/ai-usage";
import { generateContentWithRetry, geminiClient, getGeminiErrorUserMessage } from "@/lib/gemini";
import { getPreferences } from "@/lib/preferences";
import { requireSignedInUser } from "./_utils/require-signed-in-user";

export type WeeklySummaryResponse =
  | {
      success: true;
      summary: WeeklySummary;
      /** "rules" when no Gemini key is configured. */
      source: "ai" | "rules";
      generatedAt: string;
    }
  | {
      success: false;
      error: string;
      code?: AiAccessErrorCode;
      /** Set with code "rate_limited": the daily limit and when it resets (ISO). */
      limit?: number;
      resetAt?: string;
    };

// Retry budget for the Gemini call. Keep it under the maxDuration exported by
// app/(pages)/analytics/overview/page.tsx, which bounds this action.
const SUMMARY_GEMINI_DEADLINE_MS = 25_000;

class QuotaExceededError extends Error {
  constructor(
    readonly limit: number,
    readonly resetAt: Date,
  ) {
    super("AI summary quota exceeded");
  }
}

/**
 * Writes a short summary of the user's last 7 days from aggregate counts.
 * Signed-in users only. One summary per user, ISO week and input: asking
 * again with unchanged data returns the stored one without using quota.
 */
export async function generateWeeklySummary(): Promise<WeeklySummaryResponse> {
  const user = await requireSignedInUser();
  if (!user.ok) {
    return { success: false, code: "auth_required", error: "Sign in to get an AI summary." };
  }
  const { userId } = user;

  try {
    const today = new Date();
    const [dataset, preferences] = await Promise.all([
      getAnalyticsDataset(userId),
      getPreferences(userId),
    ]);
    const input = buildSummaryInput(dataset, today, preferences.weeklyApplicationGoal);

    // Zero-config demo: without a key, write the summary from rules for free.
    if (!process.env.GEMINI_EXTRACTION_API_KEY && !process.env.GEMINI_API_KEY) {
      return {
        success: true,
        summary: ruleBasedSummary(input),
        source: "rules",
        generatedAt: today.toISOString(),
      };
    }

    const stored = await cachedSummary(
      [userId, isoWeekKey(today), summaryInputHash(input)],
      async () => {
        const quota = await consumeAiQuota(userId, "summary");
        if (!quota.allowed) throw new QuotaExceededError(quota.limit, quota.resetAt);

        const response = await generateContentWithRetry(
          geminiClient,
          {
            model: "gemini-3.5-flash",
            contents: [{ role: "user", parts: [{ text: buildSummaryPrompt(input) }] }],
            config: {
              responseMimeType: "application/json",
              responseSchema: SUMMARY_RESPONSE_SCHEMA,
            },
          },
          { deadline: Date.now() + SUMMARY_GEMINI_DEADLINE_MS, label: "Analytics Summary" },
        );
        if (!response.text) throw new Error("Gemini returned an empty summary");

        const { summary, dropped } = groundSummary(JSON.parse(response.text), input);
        if (dropped.length > 0) {
          console.warn(`[Analytics Summary] Dropped ${dropped.length} sentence(s) with unsupported numbers:`, dropped);
        }
        return { summary, generatedAt: new Date().toISOString() };
      },
    );
    return { success: true, source: "ai", ...stored };
  } catch (err) {
    if (err instanceof QuotaExceededError) {
      return {
        success: false,
        code: "rate_limited",
        error: formatQuotaExceededMessage("summary", err.limit, err.resetAt),
        limit: err.limit,
        resetAt: err.resetAt.toISOString(),
      };
    }
    // Log the raw error for debugging; never show API error text to users.
    console.error("[Analytics Summary] Error writing summary:", err);
    return {
      success: false,
      error: getGeminiErrorUserMessage(err) ?? "Could not write a summary. Please try again.",
    };
  }
}

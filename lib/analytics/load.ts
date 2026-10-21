import { cache } from "react";
import { and, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db, isMockDb } from "@/app/db";
import {
  applicationStatusHistory,
  documents,
  jobApplications,
} from "@/app/db/schema";
import {
  applicationsTag,
  CACHE_REVALIDATE_SECONDS,
  documentsTag,
} from "@/app/actions/_utils/cache-tags";
import { getCurrentUserIdOrThrow } from "@/app/actions/_utils/user-context";
import { mockStore } from "@/lib/mock-data/mock-store";
import { getPreferences, type UserPreferences } from "@/lib/preferences";
import { resolveRange, type RangeParams, type RangePreset } from "./range";
import { summarizeOverview, type AnalyticsOverview } from "./summarize";
import type { AnalyticsDataset } from "./types";

// Not a "use server" module on purpose: these are called from server
// components and must not become public server-action endpoints.

async function queryDataset(userId: string): Promise<AnalyticsDataset> {
  const [apps, history] = await Promise.all([
    db
      .select({
        id: jobApplications.id,
        role: jobApplications.role_name,
        company: jobApplications.company_name,
        platform: jobApplications.platform,
        status: jobApplications.status,
        statusCategory: jobApplications.statusCategory,
        location: jobApplications.location,
        dateApplied: jobApplications.date_applied,
        createdAt: jobApplications.createdAt,
        salary: jobApplications.salary,
        resumeId: jobApplications.resumeId,
        resumeTitle: documents.title,
      })
      .from(jobApplications)
      .leftJoin(
        documents,
        and(
          eq(jobApplications.resumeId, documents.id),
          eq(documents.userId, userId),
        ),
      )
      .where(eq(jobApplications.userId, userId)),
    db
      .select({
        applicationId: applicationStatusHistory.applicationId,
        status: applicationStatusHistory.status,
        statusCategory: applicationStatusHistory.statusCategory,
        createdAt: applicationStatusHistory.createdAt,
      })
      .from(applicationStatusHistory)
      .innerJoin(
        jobApplications,
        eq(jobApplications.id, applicationStatusHistory.applicationId),
      )
      .where(eq(jobApplications.userId, userId)),
  ]);

  return {
    apps: apps.map((a) => ({
      ...a,
      createdAt: a.createdAt.getTime(),
      resumeId: a.resumeId ?? null,
      resumeTitle: a.resumeTitle ?? null,
    })),
    history: history.map((h) => ({ ...h, createdAt: h.createdAt.getTime() })),
  };
}

/**
 * All of the user's applications and status history. One cache entry per
 * user: changing the period on the page never queries the database again.
 */
export const getAnalyticsDataset = cache(
  async (userId: string): Promise<AnalyticsDataset> => {
    if (isMockDb) return mockStore.getAnalyticsDataset(userId);
    return unstable_cache(() => queryDataset(userId), ["analytics", "dataset", userId], {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId), documentsTag(userId)],
    })();
  },
);

export async function getAnalyticsOverview(
  params: RangeParams,
  defaultPreset?: RangePreset,
): Promise<AnalyticsOverview & { preferences: UserPreferences }> {
  const userId = await getCurrentUserIdOrThrow();
  const [dataset, preferences] = await Promise.all([
    getAnalyticsDataset(userId),
    getPreferences(userId),
  ]);
  const today = new Date();
  const overview = summarizeOverview(dataset, resolveRange(params, today, defaultPreset), today, {
    preferredCurrency: preferences.salaryCurrency,
  });
  return { ...overview, preferences };
}

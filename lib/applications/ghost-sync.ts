import { and, eq, gte, inArray, lte } from "drizzle-orm";
import { format, subDays } from "date-fns";
import { db, isMockDb } from "@/app/db";
import { applicationStatusHistory, jobApplications } from "@/app/db/schema";
import { ghostsAt } from "@/lib/analytics/definitions";
import { mockStore } from "@/lib/mock-data/mock-store";
import { getStatusKind } from "@/lib/utils";
import { purgeApplicationCaches } from "./purge-caches";

// Server-only, deliberately outside the "use server" actions file: an
// exported server action is callable by any client, and this one can ghost
// any user's applications. Callers: the cron route (CRON_SECRET), and
// createApplication for the signed-in user.

// Automatically transition applications older than 30 days without rejection or acceptance to Ghosted
export async function syncGhostedApplications(userId?: string) {
  if (isMockDb) {
    return mockStore.syncGhostedApplications(userId);
  }

  const thirtyDaysAgo = subDays(new Date(), 30);
  const thresholdDateStr = format(thirtyDaysAgo, "yyyy-MM-dd");

  const whereConditions = [
    lte(jobApplications.date_applied, thresholdDateStr),
    inArray(jobApplications.statusCategory, ["applied", "review"]),
  ];

  if (userId) {
    whereConditions.push(eq(jobApplications.userId, userId));
  }

  // 1. Query applications that are older than 30 days and not in terminal/ghosted categories
  const candidates = await db
    .select({
      id: jobApplications.id,
      userId: jobApplications.userId,
      status: jobApplications.status,
      statusCategory: jobApplications.statusCategory,
      date_applied: jobApplications.date_applied,
      createdAt: jobApplications.createdAt,
    })
    .from(jobApplications)
    .where(and(...whereConditions));

  if (candidates.length === 0) {
    return 0;
  }

  // 2. Query recent status history to avoid ghosting applications with recent activity in the last 30 days
  const candidateIds = candidates.map((c) => c.id);
  const recentHistory = await db
    .select({
      applicationId: applicationStatusHistory.applicationId,
      createdAt: applicationStatusHistory.createdAt,
    })
    .from(applicationStatusHistory)
    .where(
      and(
        inArray(applicationStatusHistory.applicationId, candidateIds),
        gte(applicationStatusHistory.createdAt, thirtyDaysAgo),
      ),
    );

  const recentlyActiveAppIds = new Set(
    recentHistory.map((h) => h.applicationId),
  );

  // 3. Filter candidates: ensure kind is applied or review, and no recent activity
  const qualifyingApps = candidates.filter((app) => {
    if (recentlyActiveAppIds.has(app.id)) return false;
    const kind = getStatusKind(app.status, app.statusCategory);
    return kind === "applied" || kind === "review";
  });

  if (qualifyingApps.length === 0) {
    return 0;
  }

  const qualifyingIds = qualifyingApps.map((a) => a.id);

  // 4. Load their history: an existing Ghosted entry is not duplicated, and
  // the new one is dated after the last activity, like ghostsAt.
  const qualifyingHistory = await db
    .select({
      applicationId: applicationStatusHistory.applicationId,
      statusCategory: applicationStatusHistory.statusCategory,
      createdAt: applicationStatusHistory.createdAt,
    })
    .from(applicationStatusHistory)
    .where(inArray(applicationStatusHistory.applicationId, qualifyingIds));
  const historyByApp = new Map<string, { createdAt: number }[]>();
  const appsWithGhostedHistory = new Set<string>();
  for (const h of qualifyingHistory) {
    if (h.statusCategory === "ghosted") appsWithGhostedHistory.add(h.applicationId);
    const list = historyByApp.get(h.applicationId) ?? [];
    list.push({ createdAt: new Date(h.createdAt).getTime() });
    historyByApp.set(h.applicationId, list);
  }

  // 5. Ghost them, re-checking the category so a status change made since
  // the select above is not overwritten, then record history for exactly
  // the rows that changed.
  const ghosted = await db
    .update(jobApplications)
    .set({
      status: "Ghosted",
      statusCategory: "ghosted",
    })
    .where(
      and(
        inArray(jobApplications.id, qualifyingIds),
        inArray(jobApplications.statusCategory, ["applied", "review"]),
      ),
    )
    .returning({ id: jobApplications.id });
  const ghostedIds = new Set(ghosted.map((g) => g.id));

  const now = Date.now();
  const historyEntries = qualifyingApps
    .filter((app) => ghostedIds.has(app.id) && !appsWithGhostedHistory.has(app.id))
    .map((app) => {
      const due = ghostsAt(
        { status: app.status, statusCategory: app.statusCategory, dateApplied: app.date_applied },
        historyByApp.get(app.id) ?? [],
      );
      return {
        applicationId: app.id,
        status: "Ghosted",
        statusCategory: "ghosted",
        createdAt: new Date(Math.min(due ?? now, now)),
      };
    });

  if (historyEntries.length > 0) {
    await db.insert(applicationStatusHistory).values(historyEntries);
  }

  // 6. Purge caches for affected users
  if (userId) {
    purgeApplicationCaches(userId);
  } else {
    const affectedUserIds = Array.from(new Set(qualifyingApps.map((a) => a.userId)));
    for (const uid of affectedUserIds) {
      purgeApplicationCaches(uid);
    }
  }

  return ghostedIds.size;
}

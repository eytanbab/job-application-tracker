import { and, eq, inArray, lte, sql } from "drizzle-orm";
import { format, subDays } from "date-fns";
import { db, isMockDb } from "@/app/db";
import { applicationStatusHistory, jobApplications } from "@/app/db/schema";
import { ghostsAt } from "@/lib/analytics/definitions";
import { mockStore } from "@/lib/mock-data/mock-store";
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

  // 2. One history read decides the rest: the due date counts the latest
  // activity (ghostsAt), and an existing Ghosted entry is not duplicated.
  const candidateIds = candidates.map((c) => c.id);
  const history = await db
    .select({
      applicationId: applicationStatusHistory.applicationId,
      statusCategory: applicationStatusHistory.statusCategory,
      createdAt: applicationStatusHistory.createdAt,
    })
    .from(applicationStatusHistory)
    .where(inArray(applicationStatusHistory.applicationId, candidateIds));
  const historyByApp = new Map<string, { createdAt: number }[]>();
  const appsWithGhostedHistory = new Set<string>();
  for (const h of history) {
    if (h.statusCategory === "ghosted") appsWithGhostedHistory.add(h.applicationId);
    const list = historyByApp.get(h.applicationId) ?? [];
    list.push({ createdAt: new Date(h.createdAt).getTime() });
    historyByApp.set(h.applicationId, list);
  }

  const now = Date.now();
  const due = candidates
    .map((app) => ({
      app,
      at: ghostsAt(
        { status: app.status, statusCategory: app.statusCategory, dateApplied: app.date_applied },
        historyByApp.get(app.id) ?? [],
      ),
    }))
    .filter((d): d is { app: (typeof candidates)[number]; at: number } => d.at !== null && d.at <= now);
  if (due.length === 0) {
    return 0;
  }
  const dueIds = due.map((d) => d.app.id);
  const qualifyingApps = due.map((d) => d.app);

  // 3. Write the Ghosted entries and ghost the rows in one transaction. Both
  // statements re-check the category, so a status change made since the
  // reads above is kept and gets no Ghosted entry.
  const stillOpen = inArray(jobApplications.statusCategory, ["applied", "review"]);
  const newEntries = due.filter((d) => !appsWithGhostedHistory.has(d.app.id));
  const ghostRows = db
    .update(jobApplications)
    .set({ status: "Ghosted", statusCategory: "ghosted" })
    .where(and(inArray(jobApplications.id, dueIds), stillOpen))
    .returning({ id: jobApplications.id });

  let ghosted: { id: string }[];
  if (newEntries.length > 0) {
    // Columns in table order: id, application_id, status, status_category, created_at.
    const values = sql.join(
      newEntries.map((d) => sql`(${d.app.id}::uuid, ${new Date(d.at).toISOString()}::timestamp)`),
      sql`, `,
    );
    const insertEntries = db.insert(applicationStatusHistory).select(
      sql`select gen_random_uuid(), v.id, 'Ghosted', 'ghosted', v.at
          from (values ${values}) as v(id, at)
          join ${jobApplications} on ${jobApplications.id} = v.id
          where ${stillOpen}`,
    );
    [, ghosted] = await db.batch([insertEntries, ghostRows]);
  } else {
    ghosted = await ghostRows;
  }
  const ghostedIds = new Set(ghosted.map((g) => g.id));

  // 4. Purge caches for affected users
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

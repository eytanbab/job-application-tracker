"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

import { db, isMockDb } from "@/app/db";
import { mockStore } from "@/lib/mock-data/mock-store";
import {
  insertApplicationSchema,
  jobApplications,
  applicationStatusHistory,
  documents,
} from "@/app/db/schema";
import { z } from "zod";
import {
  and,
  desc,
  eq,
  getTableColumns,
  gte,
  inArray,
  lte,
  notInArray,
} from "drizzle-orm";

import { addDays, format, isBefore, parseISO, subDays } from "date-fns";
import { applicationsTag, CACHE_REVALIDATE_SECONDS } from "./_utils/cache-tags";
import { getCurrentUserIdOrThrow } from "./_utils/user-context";
import {
  getStatusDisplay,
  getStatusKind,
  safeFormatDate,
  statusLabels,
} from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formSchema = insertApplicationSchema
  .omit({ userId: true })
  .partial({ month: true, year: true });

type FormValues = z.input<typeof formSchema>;

function normalizeApplicationStatus(values: FormValues): FormValues {
  const statusCategory = getStatusKind(values.status, values.statusCategory);
  const rawStatus = (values.status ?? "").trim();
  const status = rawStatus || statusLabels[statusCategory] || "Applied";

  return {
    ...values,
    status,
    statusCategory,
  };
}

function extractCleanApplicationFields(values: FormValues) {
  const normalized = normalizeApplicationStatus(values);
  const formattedDate = safeFormatDate(normalized.date_applied, "yyyy-MM-dd");
  const parsedDate = new Date(`${formattedDate}T12:00:00`);
  const month = !isNaN(parsedDate.getTime()) ? format(parsedDate, "M") : format(new Date(), "M");
  const year = !isNaN(parsedDate.getTime()) ? format(parsedDate, "yyyy") : format(new Date(), "yyyy");

  return {
    role_name: (normalized.role_name || "").trim(),
    company_name: (normalized.company_name || "").trim(),
    date_applied: formattedDate,
    link: (normalized.link || "").trim(),
    description: normalized.description ?? null,
    notes: normalized.notes ?? null,
    location: (normalized.location || "").trim(),
    platform: (normalized.platform || "").toLowerCase().trim(),
    status: normalized.status,
    statusCategory: normalized.statusCategory ?? "applied",
    salary: normalized.salary ? normalized.salary.trim() : null,
    resumeId: normalized.resumeId || null,
    month,
    year,
  };
}

function purgeCaches(userId: string) {
  try {
    revalidateTag(applicationsTag(userId), "max");
    revalidatePath("/applications");
    revalidatePath("/analytics/overview");
    revalidatePath("/analytics/insights");
  } catch {
    // Gracefully ignore when invoked outside Next.js request context (e.g. testing scripts)
  }
}

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

  // 4. Query existing ghosted history entries to prevent duplicate history records
  const existingGhostedHistory = await db
    .select({ applicationId: applicationStatusHistory.applicationId })
    .from(applicationStatusHistory)
    .where(
      and(
        inArray(applicationStatusHistory.applicationId, qualifyingIds),
        eq(applicationStatusHistory.statusCategory, "ghosted"),
      ),
    );
  const appsWithGhostedHistory = new Set(
    existingGhostedHistory.map((h) => h.applicationId),
  );

  const now = new Date();
  const historyEntries = qualifyingApps
    .filter((app) => !appsWithGhostedHistory.has(app.id))
    .map((app) => {
      const appliedDate = parseISO(app.date_applied);
      let milestoneDate = !isNaN(appliedDate.getTime())
        ? addDays(appliedDate, 30)
        : now;

      if (milestoneDate > now) {
        milestoneDate = now;
      }

      return {
        applicationId: app.id,
        status: "Ghosted",
        statusCategory: "ghosted",
        createdAt: milestoneDate,
      };
    });

  // 5. Update applications and insert history atomically
  const batchOperations: any[] = [
    db
      .update(jobApplications)
      .set({
        status: "Ghosted",
        statusCategory: "ghosted",
      })
      .where(inArray(jobApplications.id, qualifyingIds)),
  ];

  if (historyEntries.length > 0) {
    batchOperations.push(
      db.insert(applicationStatusHistory).values(historyEntries),
    );
  }

  await db.batch(batchOperations as any);

  // 6. Purge caches for affected users
  if (userId) {
    purgeCaches(userId);
  } else {
    const affectedUserIds = Array.from(new Set(qualifyingApps.map((a) => a.userId)));
    for (const uid of affectedUserIds) {
      purgeCaches(uid);
    }
  }

  return qualifyingApps.length;
}

// Get all applications of current user
export async function getApplications() {
  const userId = await getCurrentUserIdOrThrow();

  if (isMockDb) {
    return mockStore.getApplications(userId);
  }

  const rows = await db
    .select({
      ...getTableColumns(jobApplications),
      resumeTitle: documents.title,
      resumeFileName: documents.file_name,
      resumeFileSize: documents.file_size,
    })
    .from(jobApplications)
    .leftJoin(
      documents,
      and(
        eq(jobApplications.resumeId, documents.id),
        eq(documents.userId, userId),
      ),
    )
    .where(eq(jobApplications.userId, userId))
    .orderBy(
      desc(jobApplications.date_applied),
      desc(jobApplications.createdAt),
    );

  return rows.map((app) => {
    if (app.statusCategory === "ghosted") {
      const rawLower = (app.status || "").trim().toLowerCase();
      if (
        !rawLower ||
        rawLower === "applied" ||
        rawLower === "in review" ||
        rawLower === "review"
      ) {
        return {
          ...app,
          status: "Ghosted",
        };
      }
    }
    return app;
  });
}

// Create a new application for the current user
export async function createApplication(values: FormValues) {
  const userId = await getCurrentUserIdOrThrow();
  const fields = extractCleanApplicationFields(values);

  // Validate resume ownership if resumeId is provided
  if (fields.resumeId) {
    if (isMockDb) {
      const isValid = mockStore
        .getDocuments(userId)
        .some((d) => d.id === fields.resumeId);
      if (!isValid) {
        fields.resumeId = null;
      }
    } else {
      const doc = await db
        .select({ id: documents.id })
        .from(documents)
        .where(
          and(
            eq(documents.id, fields.resumeId),
            eq(documents.userId, userId),
          ),
        )
        .limit(1);
      if (doc.length === 0) {
        fields.resumeId = null;
      }
    }
  }

  if (isMockDb) {
    const newApp = mockStore.createApplication(userId, fields as any);
    purgeCaches(userId);
    return [{ insertedId: newApp.id }];
  }

  const applicationId = crypto.randomUUID();

  // Atomically insert the application and its initial status history in a single batch
  await db.batch([
    db.insert(jobApplications).values({
      id: applicationId,
      ...fields,
      userId,
    }),
    db.insert(applicationStatusHistory).values({
      applicationId,
      status: fields.status,
      statusCategory: fields.statusCategory ?? "applied",
      createdAt: new Date(),
    }),
  ]);

  // Sync ghosted applications during mutation in the background
  syncGhostedApplications(userId).catch(console.error);

  purgeCaches(userId);
  return [{ insertedId: applicationId }];
}

// Delete a single application with id for current user
export async function deleteApplication(id: string) {
  const userId = await getCurrentUserIdOrThrow();

  if (isMockDb) {
    mockStore.deleteApplication(userId, id);
    purgeCaches(userId);
    return;
  }

  await db
    .delete(jobApplications)
    .where(and(eq(jobApplications.userId, userId), eq(jobApplications.id, id)));

  purgeCaches(userId);
}

// Update an application of current user
export async function updateApplication(values: FormValues) {
  if (!values.id) {
    throw new Error("Application ID is required");
  }
  const userId = await getCurrentUserIdOrThrow();
  const applicationId = values.id;
  const fields = extractCleanApplicationFields(values);

  // Validate resume ownership if resumeId is provided
  if (fields.resumeId) {
    if (isMockDb) {
      const isValid = mockStore
        .getDocuments(userId)
        .some((d) => d.id === fields.resumeId);
      if (!isValid) {
        fields.resumeId = null;
      }
    } else {
      const doc = await db
        .select({ id: documents.id })
        .from(documents)
        .where(
          and(
            eq(documents.id, fields.resumeId),
            eq(documents.userId, userId),
          ),
        )
        .limit(1);
      if (doc.length === 0) {
        fields.resumeId = null;
      }
    }
  }

  if (isMockDb) {
    mockStore.updateApplication(userId, applicationId, fields as any);
    purgeCaches(userId);
    return;
  }

  const currentApp = await db
    .select({
      status: jobApplications.status,
      statusCategory: jobApplications.statusCategory,
    })
    .from(jobApplications)
    .where(
      and(
        eq(jobApplications.userId, userId),
        eq(jobApplications.id, applicationId),
      ),
    )
    .limit(1);

  const statusChanged =
    !currentApp[0] ||
    currentApp[0].status !== fields.status ||
    currentApp[0].statusCategory !== fields.statusCategory;

  if (statusChanged) {
    const latestHistory = await db
      .select({
        id: applicationStatusHistory.id,
        statusCategory: applicationStatusHistory.statusCategory,
        createdAt: applicationStatusHistory.createdAt,
      })
      .from(applicationStatusHistory)
      .where(eq(applicationStatusHistory.applicationId, applicationId))
      .orderBy(desc(applicationStatusHistory.createdAt))
      .limit(1);

    const now = new Date();
    const isRecentSameCategoryUpdate =
      latestHistory.length > 0 &&
      latestHistory[0].statusCategory === (fields.statusCategory ?? "applied") &&
      latestHistory[0].createdAt &&
      now.getTime() - new Date(latestHistory[0].createdAt).getTime() <
        15 * 60 * 1000;

    const historyOperation = isRecentSameCategoryUpdate
      ? db
          .update(applicationStatusHistory)
          .set({
            status: fields.status,
            createdAt: now,
          })
          .where(eq(applicationStatusHistory.id, latestHistory[0].id))
      : db.insert(applicationStatusHistory).values({
          applicationId,
          status: fields.status,
          statusCategory: fields.statusCategory ?? "applied",
          createdAt: now,
        });

    // Execute both the application update and the status history entry atomically in a single batch
    await db.batch([
      db
        .update(jobApplications)
        .set(fields)
        .where(
          and(
            eq(jobApplications.userId, userId),
            eq(jobApplications.id, applicationId),
          ),
        ),
      historyOperation as any,
    ]);
  } else {
    await db
      .update(jobApplications)
      .set(fields)
      .where(
        and(
          eq(jobApplications.userId, userId),
          eq(jobApplications.id, applicationId),
        ),
      );
  }

  purgeCaches(userId);
}

// Update only the attached resume of an application without altering other fields
export async function updateApplicationResume(
  applicationId: string,
  resumeId: string | null,
) {
  const userId = await getCurrentUserIdOrThrow();

  if (resumeId) {
    if (isMockDb) {
      const isValid = mockStore
        .getDocuments(userId)
        .some((d) => d.id === resumeId);
      if (!isValid) {
        throw new Error("Invalid or unauthorized resume ID");
      }
    } else {
      const doc = await db
        .select({ id: documents.id })
        .from(documents)
        .where(and(eq(documents.id, resumeId), eq(documents.userId, userId)))
        .limit(1);

      if (doc.length === 0) {
        throw new Error("Invalid or unauthorized resume ID");
      }
    }
  }

  if (isMockDb) {
    mockStore.updateApplication(userId, applicationId, { resumeId });
    purgeCaches(userId);
    return;
  }

  await db
    .update(jobApplications)
    .set({ resumeId })
    .where(
      and(
        eq(jobApplications.userId, userId),
        eq(jobApplications.id, applicationId),
      ),
    );

  purgeCaches(userId);
}

// Delete individual status history entry (Timeline correction)
export async function deleteStatusHistoryEntry(historyId: string) {
  const userId = await getCurrentUserIdOrThrow();

  if (isMockDb) {
    const res = mockStore.deleteStatusHistoryEntry(userId, historyId);
    purgeCaches(userId);
    return res;
  }

  const entry = await db
    .select({
      id: applicationStatusHistory.id,
      applicationId: applicationStatusHistory.applicationId,
    })
    .from(applicationStatusHistory)
    .innerJoin(
      jobApplications,
      eq(jobApplications.id, applicationStatusHistory.applicationId),
    )
    .where(
      and(
        eq(applicationStatusHistory.id, historyId),
        eq(jobApplications.userId, userId),
      ),
    )
    .limit(1);

  if (!entry.length) {
    throw new Error("Timeline entry not found or unauthorized");
  }

  const { applicationId } = entry[0];

  await db
    .delete(applicationStatusHistory)
    .where(eq(applicationStatusHistory.id, historyId));

  const remainingHistory = await db
    .select()
    .from(applicationStatusHistory)
    .where(eq(applicationStatusHistory.applicationId, applicationId))
    .orderBy(desc(applicationStatusHistory.createdAt))
    .limit(1);

  let newStatus = "Applied";
  let newCategory = "applied";

  if (remainingHistory.length > 0) {
    newStatus = remainingHistory[0].status;
    newCategory = remainingHistory[0].statusCategory;
  }

  await db
    .update(jobApplications)
    .set({
      status: newStatus,
      statusCategory: newCategory,
    })
    .where(eq(jobApplications.id, applicationId));

  purgeCaches(userId);

  return { status: newStatus, statusCategory: newCategory };
}

// Get status history for a single application
export async function getApplicationHistory(applicationId: string) {
  const userId = await getCurrentUserIdOrThrow();

  if (isMockDb) {
    return mockStore.getApplicationHistory(userId, applicationId);
  }

  const app = await db
    .select({
      id: jobApplications.id,
      date_applied: jobApplications.date_applied,
      status: jobApplications.status,
      statusCategory: jobApplications.statusCategory,
      createdAt: jobApplications.createdAt,
    })
    .from(jobApplications)
    .where(
      and(
        eq(jobApplications.userId, userId),
        eq(jobApplications.id, applicationId),
      ),
    )
    .limit(1);

  if (!app.length) {
    return [];
  }

  const history = await db
    .select()
    .from(applicationStatusHistory)
    .where(eq(applicationStatusHistory.applicationId, applicationId))
    .orderBy(desc(applicationStatusHistory.createdAt));

  const sanitizedHistory = [...history];

  const hasAppliedEntry = sanitizedHistory.some(
    (h) =>
      h.statusCategory === "applied" ||
      (h.status && h.status.toLowerCase().includes("applied")),
  );

  if (!hasAppliedEntry && app[0].date_applied) {
    sanitizedHistory.push({
      id: "",
      applicationId,
      status: "Applied",
      statusCategory: "applied",
      createdAt: app[0].createdAt || new Date(),
    });
  }

  const hasGhostedEntry = sanitizedHistory.some(
    (h) =>
      h.statusCategory === "ghosted" ||
      (h.status && h.status.toLowerCase().includes("ghost")),
  );

  if (!hasGhostedEntry && app[0].statusCategory === "ghosted") {
    const appliedDate = app[0].date_applied
      ? parseISO(app[0].date_applied)
      : null;
    const ghostedDate =
      appliedDate && !isNaN(appliedDate.getTime())
        ? addDays(appliedDate, 30)
        : app[0].createdAt || new Date();

    sanitizedHistory.push({
      id: "",
      applicationId,
      status: "Ghosted",
      statusCategory: "ghosted",
      createdAt: ghostedDate,
    });
  }

  sanitizedHistory.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return sanitizedHistory;
}

// Get unique locations and platforms previously used by the user
export async function getDistinctLocationsAndPlatforms() {
  const userId = await getCurrentUserIdOrThrow();

  if (isMockDb) {
    return mockStore.getDistinctLocationsAndPlatforms(userId);
  }

  const apps = await db
    .select({
      location: jobApplications.location,
      platform: jobApplications.platform,
    })
    .from(jobApplications)
    .where(eq(jobApplications.userId, userId));

  const rawLocations = apps
    .map((a) => a.location?.trim())
    .filter((loc): loc is string => Boolean(loc));

  const rawPlatforms = apps
    .map((a) => a.platform?.trim())
    .filter((plat): plat is string => Boolean(plat));

  // Capitalize nicely or preserve exact unique values
  const userLocations = Array.from(new Set(rawLocations));
  const userPlatforms = Array.from(new Set(rawPlatforms));

  return { userLocations, userPlatforms };
}


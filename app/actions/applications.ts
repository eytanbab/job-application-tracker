"use server";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";

import { db } from "@/app/db";
import {
  insertApplicationSchema,
  jobApplications,
  applicationStatusHistory,
} from "@/app/db/schema";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";

import { format, subDays, parseISO, isBefore } from "date-fns";
import { applicationsTag, CACHE_REVALIDATE_SECONDS } from "./_utils/cache-tags";
import { getCurrentUserIdOrThrow } from "./_utils/user-context";
import {
  getStatusDisplay,
  getStatusKind,
  safeFormatDate,
  statusLabels,
} from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formSchema = insertApplicationSchema.omit({ userId: true });

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

function purgeCaches(userId: string) {
  revalidateTag(applicationsTag(userId), "max");
  revalidatePath("/applications");
  revalidatePath("/analytics/overview");
  revalidatePath("/analytics/insights");
}

// Get all applications of current user (pure read function)
export async function getApplications() {
  const userId = await getCurrentUserIdOrThrow();

  const rows = await db
    .select()
    .from(jobApplications)
    .where(eq(jobApplications.userId, userId))
    .orderBy(
      desc(jobApplications.date_applied),
      desc(jobApplications.createdAt),
    );

  const thirtyDaysAgo = subDays(new Date(), 30);

  // Dynamically auto-categorize >30 day old applied/review status as ghosted
  return rows.map((app) => {
    const kind = getStatusKind(app.status, app.statusCategory);
    if ((kind === "applied" || kind === "review") && app.date_applied) {
      try {
        const appliedDate = parseISO(app.date_applied);
        if (isBefore(appliedDate, thirtyDaysAgo)) {
          const rawLower = (app.status || "").trim().toLowerCase();
          const isGenericStatus =
            !rawLower ||
            rawLower === "applied" ||
            rawLower === "in review" ||
            rawLower === "review";

          return {
            ...app,
            statusCategory: "ghosted",
            status: isGenericStatus ? "Ghosted" : app.status,
          };
        }
      } catch {
        // Ignore date parsing error
      }
    } else if (app.statusCategory === "ghosted") {
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

  const normalizedValues = normalizeApplicationStatus(values);
  const application: z.input<typeof insertApplicationSchema> = {
    ...normalizedValues,
    userId,
    month: format(new Date(normalizedValues.date_applied), "M"),
    year: format(new Date(normalizedValues.date_applied), "yyyy"),
  };

  const result = await db
    .insert(jobApplications)
    .values(application)
    .returning({ insertedId: jobApplications.id });

  if (result[0]?.insertedId) {
    await db.insert(applicationStatusHistory).values({
      applicationId: result[0].insertedId,
      status: normalizedValues.status,
      statusCategory: normalizedValues.statusCategory ?? "applied",
      createdAt: new Date(),
    });
  }

  purgeCaches(userId);
  return result;
}

// Delete a single application with id for current user
export async function deleteApplication(id: string) {
  const userId = await getCurrentUserIdOrThrow();

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

  const normalizedValues = normalizeApplicationStatus(values);
  const application = {
    ...normalizedValues,
    month: format(new Date(normalizedValues.date_applied), "M"),
    year: format(new Date(normalizedValues.date_applied), "yyyy"),
  };

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
    currentApp[0].status !== normalizedValues.status ||
    currentApp[0].statusCategory !== normalizedValues.statusCategory;

  await db
    .update(jobApplications)
    .set(application)
    .where(
      and(
        eq(jobApplications.userId, userId),
        eq(jobApplications.id, applicationId),
      ),
    );

  if (statusChanged) {
    await db.insert(applicationStatusHistory).values({
      applicationId,
      status: normalizedValues.status,
      statusCategory: normalizedValues.statusCategory ?? "applied",
      createdAt: new Date(),
    });
  }

  purgeCaches(userId);
}

// Delete individual status history entry (Timeline correction)
export async function deleteStatusHistoryEntry(historyId: string) {
  const userId = await getCurrentUserIdOrThrow();

  await db
    .delete(applicationStatusHistory)
    .where(eq(applicationStatusHistory.id, historyId));

  purgeCaches(userId);
}

// Get status history for a single application
export async function getApplicationHistory(applicationId: string) {
  const userId = await getCurrentUserIdOrThrow();

  const app = await db
    .select({
      id: jobApplications.id,
      date_applied: jobApplications.date_applied,
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

  const sanitizedHistory = history.map((item) => {
    const d = new Date(item.createdAt);
    const isRounded =
      (d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0) ||
      (d.getHours() === 12 && d.getMinutes() === 0 && d.getSeconds() === 0) ||
      (d.getHours() === 3 && d.getMinutes() === 0 && d.getSeconds() === 0 && d.getMilliseconds() === 0);

    if (isRounded && app[0].createdAt) {
      return {
        ...item,
        createdAt: app[0].createdAt,
      };
    }
    return item;
  });

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
    sanitizedHistory.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  return sanitizedHistory;
}

// Get unique locations and platforms previously used by the user
export async function getDistinctLocationsAndPlatforms() {
  const userId = await getCurrentUserIdOrThrow();
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


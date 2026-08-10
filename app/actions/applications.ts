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
import { getStatusDisplay, getStatusKind } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formSchema = insertApplicationSchema.omit({ userId: true });

type FormValues = z.input<typeof formSchema>;

function normalizeApplicationStatus(values: FormValues): FormValues {
  const statusCategory = getStatusKind(values.status, values.statusCategory);
  const status = getStatusDisplay(values.status, statusCategory).trim();

  return {
    ...values,
    status,
    statusCategory,
  };
}

function purgeCaches(userId: string) {
  revalidateTag(applicationsTag(userId), 'max');
  revalidatePath('/applications');
  revalidatePath('/analytics/overview');
  revalidatePath('/analytics/insights');
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

// Get a single application with id for current user
export async function getApplication(id: string) {
  const userId = await getCurrentUserIdOrThrow();

  return unstable_cache(
    async () =>
      db
        .select()
        .from(jobApplications)
        .where(
          and(eq(jobApplications.userId, userId), eq(jobApplications.id, id)),
        ),
    ["applications", "detail", userId, id],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    },
  )();
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
    let appliedDate: Date;
    try {
      appliedDate = parseISO(normalizedValues.date_applied);
      if (isNaN(appliedDate.getTime())) appliedDate = new Date();
    } catch {
      appliedDate = new Date();
    }

    await db.insert(applicationStatusHistory).values({
      applicationId: result[0].insertedId,
      status: normalizedValues.status,
      statusCategory: normalizedValues.statusCategory ?? "applied",
      createdAt: appliedDate,
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
  const userId = await getCurrentUserIdOrThrow();
  if (!values.id) {
    return;
  }
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
    // 5-minute auto-merge of accidental status flips
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const latestHistory = await db
      .select({
        id: applicationStatusHistory.id,
        createdAt: applicationStatusHistory.createdAt,
      })
      .from(applicationStatusHistory)
      .where(eq(applicationStatusHistory.applicationId, applicationId))
      .orderBy(desc(applicationStatusHistory.createdAt))
      .limit(1);

    if (latestHistory.length > 0 && latestHistory[0].createdAt > fiveMinutesAgo) {
      await db
        .update(applicationStatusHistory)
        .set({
          status: normalizedValues.status,
          statusCategory: normalizedValues.statusCategory ?? "applied",
          createdAt: new Date(),
        })
        .where(eq(applicationStatusHistory.id, latestHistory[0].id));
    } else {
      await db.insert(applicationStatusHistory).values({
        applicationId,
        status: normalizedValues.status,
        statusCategory: normalizedValues.statusCategory ?? "applied",
      });
    }
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

  const hasAppliedEntry = history.some(
    (h) =>
      h.statusCategory === "applied" ||
      (h.status && h.status.toLowerCase().includes("applied"))
  );

  if (!hasAppliedEntry && app[0].date_applied) {
    try {
      const appliedDate = parseISO(app[0].date_applied);
      if (!isNaN(appliedDate.getTime())) {
        history.push({
          id: "",
          applicationId,
          status: "Applied",
          statusCategory: "applied",
          createdAt: appliedDate,
        });
        history.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
    } catch {
      // Ignore parsing error
    }
  }

  return history;
}

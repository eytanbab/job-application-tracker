'use server';

import { revalidateTag, unstable_cache } from 'next/cache';

import { db } from '@/app/db';
import { insertApplicationSchema, jobApplications } from '@/app/db/schema';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';

import { format } from 'date-fns';
import {
  applicationsTag,
  CACHE_REVALIDATE_SECONDS,
} from './_utils/cache-tags';
import { getCurrentUserIdOrThrow } from './_utils/user-context';
import { getStatusDisplay, getStatusKind } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formSchema = insertApplicationSchema.omit({ userId: true });

type FormValues = z.input<typeof formSchema>;

function normalizeApplicationStatus(values: FormValues): FormValues {
  const statusCategory = getStatusKind(values.status, values.statusCategory);
  const statusLabel = values.statusLabel?.trim() || null;
  const status = getStatusDisplay(values.status, statusCategory, statusLabel)
    .toLowerCase()
    .trim();

  return {
    ...values,
    status,
    statusCategory,
    statusLabel,
  };
}

// Get all applications of current user
export async function getApplications() {
  const userId = await getCurrentUserIdOrThrow();

  return unstable_cache(
    async () =>
      db
        .select()
        .from(jobApplications)
        .where(eq(jobApplications.userId, userId))
        .orderBy(
          desc(jobApplications.date_applied),
          desc(jobApplications.createdAt)
        ),
    ['applications', 'list', userId],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    }
  )();
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
          and(eq(jobApplications.userId, userId), eq(jobApplications.id, id))
        ),
    ['applications', 'detail', userId, id],
    {
      revalidate: CACHE_REVALIDATE_SECONDS,
      tags: [applicationsTag(userId)],
    }
  )();
}

// Create a new application for the current user
export async function createApplication(values: FormValues) {
  const userId = await getCurrentUserIdOrThrow();

  const normalizedValues = normalizeApplicationStatus(values);
  const application: z.input<typeof insertApplicationSchema> = {
    ...normalizedValues,
    userId,
    month: format(new Date(normalizedValues.date_applied), 'M'),
    year: format(new Date(normalizedValues.date_applied), 'yyyy'),
  };

  const result = await db
    .insert(jobApplications)
    .values(application)
    .returning({ insertedId: jobApplications.id });
  revalidateTag(applicationsTag(userId));
  return result;
}

// Delete a single application with id for current user
export async function deleteApplication(id: string) {
  const userId = await getCurrentUserIdOrThrow();

  await db
    .delete(jobApplications)
    .where(and(eq(jobApplications.userId, userId), eq(jobApplications.id, id)));

  revalidateTag(applicationsTag(userId));
}

// Update an application of current user
export async function updateApplication(values: FormValues) {
  if (!values.id) {
    return;
  }
  const userId = await getCurrentUserIdOrThrow();

  const normalizedValues = normalizeApplicationStatus(values);
  const application = {
    ...normalizedValues,
    month: format(new Date(normalizedValues.date_applied), 'M'),
    year: format(new Date(normalizedValues.date_applied), 'yyyy'),
  };

  await db
    .update(jobApplications)
    .set(application)
    .where(
      and(
        eq(jobApplications.userId, userId),
        eq(jobApplications.id, application.id!)
      )
    );
  revalidateTag(applicationsTag(userId));
}

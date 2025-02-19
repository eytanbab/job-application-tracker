'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

import { db } from './db';
import { insertApplicationSchema, jobApplications } from './db/schema';
import { z } from 'zod';
import { and, count, desc, eq } from 'drizzle-orm';

import { format } from 'date-fns';
import { formatApplicationsPerYear } from '@/lib/utils';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formSchema = insertApplicationSchema.omit({ userId: true });

type FormValues = z.input<typeof formSchema>;

// Get all applications of current user
export async function getApplications() {
  const { userId } = await auth();
  if (!userId) return [];

  return db
    .select()
    .from(jobApplications)
    .where(eq(jobApplications.userId, userId));
}

// Get a single application with id for current user
export async function getApplication(id: string) {
  const { userId } = await auth();
  if (!userId) return;

  return db
    .select()
    .from(jobApplications)
    .where(and(eq(jobApplications.userId, userId), eq(jobApplications.id, id)));
}

// Create a new application for the current user
export async function createApplication(values: FormValues) {
  const { userId } = await auth();
  if (!userId) return;

  const application: z.input<typeof insertApplicationSchema> = {
    ...values,
    userId,
    month: +format(new Date(values.date_applied), 'MM'),
    year: format(new Date(values.date_applied), 'yyyy'),
  };

  return db
    .insert(jobApplications)
    .values(application)
    .returning({ insertedId: jobApplications.id });
}

// Delete a single application with id for current user
export async function deleteApplication(id: string) {
  const { userId } = await auth();
  if (!userId) return;

  await db
    .delete(jobApplications)
    .where(and(eq(jobApplications.userId, userId), eq(jobApplications.id, id)));

  revalidatePath('/dashboard');
}

// Update an application of current user
export async function updateApplication(values: FormValues) {
  const { userId } = await auth();
  if (!userId || !values.id) {
    return;
  }

  const application = {
    ...values,
    month: +format(new Date(values.date_applied), 'MM'),
    year: format(new Date(values.date_applied), 'yyyy'),
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
  revalidatePath('/dashboard');
}

export async function getTop5Companies() {
  const { userId } = await auth();
  if (!userId) return [];

  return db
    .select({
      name: jobApplications.company_name,
      freq: count(jobApplications.company_name),
    })
    .from(jobApplications)
    .where(eq(jobApplications.userId, userId))
    .groupBy(jobApplications.company_name)
    .orderBy(desc(count(jobApplications.company_name)))
    .limit(5);
}

export async function getTop5Platforms() {
  const { userId } = await auth();
  if (!userId) return [];

  return db
    .select({
      name: jobApplications.platform,
      freq: count(jobApplications.platform),
    })
    .from(jobApplications)
    .where(eq(jobApplications.userId, userId))
    .groupBy(jobApplications.platform)
    .orderBy(desc(count(jobApplications.platform)))
    .limit(5);
}

export async function getTop5Statuses() {
  const { userId } = await auth();
  if (!userId) return [];

  return db
    .select({
      name: jobApplications.status,
      freq: count(jobApplications.status),
    })
    .from(jobApplications)
    .where(eq(jobApplications.userId, userId))
    .groupBy(jobApplications.status)
    .orderBy(desc(count(jobApplications.status)))
    .limit(5);
}

// Total applications per year
export async function getApplicationsPerYear() {
  const { userId } = await auth();
  if (!userId) return [];

  const data = await db
    .select({
      year: jobApplications.year,
      month: jobApplications.month,
      numOfApplications: count(jobApplications.id),
    })
    .from(jobApplications)
    .where(eq(jobApplications.userId, userId))
    .groupBy(jobApplications.month, jobApplications.year);

  return formatApplicationsPerYear(data);
}

export async function getYears() {
  const { userId } = await auth();
  if (!userId) return [];

  const years = await db
    .selectDistinct({
      year: jobApplications.year,
    })
    .from(jobApplications)
    .where(eq(jobApplications.userId, userId))
    .orderBy(desc(jobApplications.year));

  const yearsArray: string[] = [];

  years?.map((year) => {
    yearsArray.push(year.year!);
  });

  return yearsArray;
}

export async function getStatusPerPlatform() {
  const { userId } = await auth();
  if (!userId) return [];

  const data = await db
    .select({
      platformName: jobApplications.platform,
      status: jobApplications.status,
      numOfApplications: count(jobApplications.platform),
    })
    .from(jobApplications)
    .where(eq(jobApplications.userId, userId))
    .groupBy(jobApplications.platform, jobApplications.status);

  const grouped = new Map();

  data.forEach(({ platformName, status, numOfApplications }) => {
    if (!grouped.has(platformName)) {
      grouped.set(platformName, []);
    }
    grouped.get(platformName).push({ status, value: numOfApplications });
  });

  return Array.from(grouped.entries()).map(([platformName, statuses]) => ({
    platformName,
    statuses,
  }));
}

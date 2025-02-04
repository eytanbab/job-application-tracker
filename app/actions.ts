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

// Applications status per year
export async function getApplicationsStatusPerYear() {
  const { userId } = await auth();
  if (!userId) return [];

  const data = await db
    .select({
      month: jobApplications.month,
      year: jobApplications.year,
      status: jobApplications.status,
      status_count: count(jobApplications.status),
    })
    .from(jobApplications)
    .where(eq(jobApplications.userId, userId))
    .groupBy(
      jobApplications.month,
      jobApplications.status,
      jobApplications.year
    );

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  type TransformedItem = {
    month: string;
    [status: string]: string | number; // Dynamic keys for statuses
  };

  const transformedData: TransformedItem[] = Object.values(
    data.reduce<Record<string, TransformedItem>>(
      (acc, { month, status, status_count }) => {
        const monthName = monthNames[month! - 1]; // Convert month number to name

        // Ensure the month exists in the accumulator
        if (!acc[monthName]) {
          acc[monthName] = { month: monthName };
        }

        // Add the status dynamically to the month's object
        acc[monthName][status] =
          ((acc[monthName][status] as number) || 0) + status_count;

        return acc;
      },
      {}
    )
  );

  return transformedData;
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

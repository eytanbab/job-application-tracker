'use server';

import { auth } from '@clerk/nextjs/server';

import { db } from '@/app/db';
import { jobApplications } from '@/app/db/schema';
import { count, desc, eq } from 'drizzle-orm';

import { formatApplicationsPerYear } from '@/lib/utils';

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

export async function getTop5Locations() {
  const { userId } = await auth();
  if (!userId) return [];

  return db
    .select({
      name: jobApplications.location,
      freq: count(jobApplications.location),
    })
    .from(jobApplications)
    .where(eq(jobApplications.userId, userId))
    .groupBy(jobApplications.location)
    .orderBy(desc(count(jobApplications.location)))
    .limit(5);
}

export async function getTop5RoleNames() {
  const { userId } = await auth();
  if (!userId) return [];

  return db
    .select({
      name: jobApplications.role_name,
      freq: count(jobApplications.role_name),
    })
    .from(jobApplications)
    .where(eq(jobApplications.userId, userId))
    .groupBy(jobApplications.role_name)
    .orderBy(desc(count(jobApplications.role_name)))
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

// Statuses per year
export async function getStasusesPerYear() {
  const { userId } = await auth();
  if (!userId) return [];

  return await db
    .select({
      year: jobApplications.year,
      month: jobApplications.month,
      status: jobApplications.status,
      statusCount: count(jobApplications.status),
    })
    .from(jobApplications)
    .where(eq(jobApplications.userId, userId))
    .groupBy(
      jobApplications.month,
      jobApplications.year,
      jobApplications.status
    );
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
    .groupBy(jobApplications.platform, jobApplications.status)
    .orderBy(desc(jobApplications.status));

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

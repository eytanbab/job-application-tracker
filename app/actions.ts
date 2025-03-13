'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

import { db } from './db';
import {
  documents,
  insertApplicationSchema,
  jobApplications,
} from './db/schema';
import { z } from 'zod';
import { and, count, desc, eq } from 'drizzle-orm';

import { format } from 'date-fns';
import { formatApplicationsPerYear } from '@/lib/utils';

import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '@/lib/s3-client';

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
    month: format(new Date(values.date_applied), 'M'),
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
    month: format(new Date(values.date_applied), 'M'),
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

/* ----------------- S3 BUCKET ------------------ */

export async function generatePresignedUrl(
  fileName: string,
  contentType: string
) {
  try {
    const { userId } = await auth();
    if (!fileName || !contentType || !userId) {
      throw new Error(
        'Missing required parameters: fileName and contentType and userId'
      );
    }

    // Allowed file types (modify this based on your needs)
    const allowedFileTypes = ['application/pdf'];
    if (!allowedFileTypes.includes(contentType)) {
      throw new Error('Invalid file type');
    }

    // Generate a unique filename for the file in the S3 bucket
    const fileKey = `${userId}/${Date.now().toString()}-${fileName}`;

    const uploadParams = {
      Bucket: process.env.NEXT_AWS_S3_BUCKET_NAME || '', // Get the bucket name from env variable
      Key: fileKey,
      ContentType: contentType,
    };

    if (!uploadParams.Bucket) {
      throw new Error('AWS S3 bucket name is missing in environment variables');
    }

    // Generate the pre-signed URL
    const command = new PutObjectCommand(uploadParams);
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600, // URL expiry time
    });
    return { signedUrl };
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    return { error: (error as Error).message };
  }
}

export async function createFile(
  title: string,
  doc_url: string,
  file_name: string
) {
  const { userId } = await auth();
  if (!userId) return;

  await db
    .insert(documents)
    .values({ title, doc_url, userId, file_name })
    .returning({ insertedId: documents.id });
  revalidatePath('/documents');
}

export async function getFiles() {
  const { userId } = await auth();
  if (!userId) return;

  return db.select().from(documents).where(eq(documents.userId, userId));
}

export async function deleteFile(id: string) {
  const { userId } = await auth();
  if (!userId) return;

  await db
    .delete(documents)
    .where(and(eq(documents.userId, userId), eq(documents.id, id)));

  revalidatePath('/documents');
}

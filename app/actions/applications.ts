'use server';

import { revalidateTag, unstable_cache } from 'next/cache';

import { db } from '@/app/db';
import { insertApplicationSchema, jobApplications } from '@/app/db/schema';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';

import { format } from 'date-fns';
// import { AiFormValues, AiData } from '@/lib/types';
import { scraper } from '@/lib/scraper';
// import { AiData } from '@/lib/types';
import { geminiClient } from '@/lib/gemini';
import {
  applicationsTag,
  CACHE_REVALIDATE_SECONDS,
} from './_utils/cache-tags';
import { getCurrentUserIdOrThrow } from './_utils/user-context';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formSchema = insertApplicationSchema.omit({ userId: true });

type FormValues = z.input<typeof formSchema>;

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

  const application: z.input<typeof insertApplicationSchema> = {
    ...values,
    userId,
    month: format(new Date(values.date_applied), 'M'),
    year: format(new Date(values.date_applied), 'yyyy'),
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
  revalidateTag(applicationsTag(userId));
}

/* ----------------- OPEN AI ------------------ */

export async function extractAiApplication(url: string) {
  try {
    const webpage = await scraper(url);
    const prompt = `You are an AI that extracts job application details from raw text.
if the data is not of an application, return {
status: 'fail',
message: 'Failed to extract data from the URL.'
}

Your task is to return a valid JSON object with these fields:
{
  status: 'success',
  application: {
    role_name: The job title.
    company_name: The company offering the job.
    link: The provided URL ${url}.
    platform: The job listing platform in title case, inferred from the URL (${url}).
    status: Always set this to "Applied".
    description: Extract the full job description from the text.
    location: The job location's city (if available).
  }
}

    If any field is missing, return null for that field.
Your response must be a strict JSON object with no extra text.

Extract job details from the following text:\n\n${webpage}`;

    const response = await geminiClient.models.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      model: 'gemini-2.0-flash',
      config: {
        responseMimeType: 'application/json',
      },
    });
    const res = response.text;

    if (!res) {
      return {
        status: 'fail' as const,
        message: 'Failed to extract data from the URL.',
      };
    }
    return JSON.parse(res);
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return {
      status: 'fail',
      message: 'Failed to extract information due to an API error.',
    };
  }
}

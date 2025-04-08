'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

import { db } from '@/app/db';
import { insertApplicationSchema, jobApplications } from '@/app/db/schema';
import { z } from 'zod';
import { and, desc, eq } from 'drizzle-orm';

import { format } from 'date-fns';
import { openAiclient } from '@/lib/open-ai';
// import { AiFormValues, AiData } from '@/lib/types';
import { scraper } from '@/lib/scraper';
import { AiData } from '@/lib/types';

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
    .where(eq(jobApplications.userId, userId))
    .orderBy(
      desc(jobApplications.date_applied),
      desc(jobApplications.createdAt)
    );
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

/* ----------------- OPEN AI ------------------ */

export async function extractAiApplication(url: string) {
  const webpage = await scraper(url);

  const completion = await openAiclient.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are an AI that extracts job application details from raw text.
        if the data is not of an application, return {
        status: 'fail',
        message: explain why the extraction failed
        }

        Your task is to return a valid JSON object with these fields:
        {
          status: 'success'.
          application: {
            role_name: The job title.
            company_name: The company offering the job.
            link: The provided URL  ${url}.
            platform: The job listing platform in title case, inferred from the URL  (${url}).
            status: Always set this to "Applied".
            description: Extract the full job description from the text.
            location: The job location's city (if available).
            }
        }

        If any field is missing, return null for that field.
        Your response must be a strict JSON object with no extra text.
        `,
      },
      {
        role: 'user',
        content: `Extract job details from the following text:\n\n${webpage}`,
      },
    ],
    response_format: { type: 'json_object' },
  });

  const data = completion.choices[0].message.content;

  if (!data) {
    throw new Error('AI did not return a response.');
  }

  const application: AiData = JSON.parse(data);

  return application;
}

'use server';

import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

import { db } from '@/app/db';
import { insertApplicationSchema, jobApplications } from '@/app/db/schema';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';

import { format } from 'date-fns';
// import { openAiclient } from '@/lib/open-ai';

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

/* ----------------- OPEN AI ------------------ */

// export async function getAiApplication(url: string) {
//   const completion = await openAiclient.chat.completions.create({
//     model: 'gpt-4o-mini',
//     messages: [
//       {
//         role: 'system',
//         content: `You are an AI assistant that extracts structured job application data from a given URL and formats it as JSON.
// Follow these instructions carefully:

// 1. **Extract the following fields** from the provided URL:
//    - **role_name**: The job title.
//    - **company_name**: The company offering the job.
//    - **date_applied**: Today's date in ISO format (YYYY-MM-DD).
//    - **link**: The provided URL.
//    - **platform**: The name of the job listing platform (e.g., LinkedIn, Indeed, company website).
//    - **status**: Always set this to "Applied".
//    - **month**: Extracted from date_applied (a number between 1-12).
//    - **year**: Extracted from date_applied (YYYY format).
//    - **description**: The full job description text extracted from the provided URL.
//    - **location**: The job location (if available).

// 2. **Return the output as a valid JSON object** with no extra text.

// 3. **If any field is missing or unavailable, return null for that field.**`,
//       },
//       {
//         role: 'user',
//         content: `URL: ${url}`,
//       },
//     ],
//     response_format: { type: 'json_object' },
//   });

//   return completion.choices[0].message.content;
// }

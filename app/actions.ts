'use server';

import { neon } from '@neondatabase/serverless';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

import { insertApplicationSchema, jobApplications } from './db/schema';
import { z } from 'zod';
import { db } from './db';
import { and, eq } from 'drizzle-orm';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formSchema = insertApplicationSchema.omit({ userId: true });

type FormValues = z.input<typeof formSchema>;

const sql = neon(process.env.DATABASE_URL!);

export async function getApplications() {
  const { userId } = await auth();
  try {
    const res = await sql(
      'SELECT * FROM job_applications WHERE user_id = ($1)',
      [userId]
    );
    return res;
  } catch (err) {
    console.log('err', err);
  }
}
export async function getApplication(id: string) {
  const { userId } = await auth();
  if (!userId) return;
  // try {
  //   const res = await sql(
  //     'SELECT * FROM job_applications WHERE user_id = ($1) AND id = ($2)',
  //     [userId, id]
  //   );
  //   return res[0];
  // } catch (err) {
  //   console.log('err', err);
  // }
  return db
    .select()
    .from(jobApplications)
    .where(and(eq(jobApplications.userId, userId), eq(jobApplications.id, id)));
}

export async function createApplication(values: FormValues) {
  const { userId } = await auth();
  if (!userId) return;

  const application: z.input<typeof insertApplicationSchema> = {
    ...values,
    userId,
  };

  return db
    .insert(jobApplications)
    .values(application)
    .returning({ insertedId: jobApplications.id });
}

export async function deleteApplication(id: string) {
  const { userId } = await auth();
  try {
    await sql(
      'DELETE FROM job_applications WHERE user_id = ($1) AND id = ($2)',
      [userId, id]
    );
    revalidatePath('/dashboard');
  } catch (err) {
    throw err;
  }
}

export async function updateApplication(values: FormValues) {
  const { userId } = await auth();
  if (!userId || !values.id) {
    return;
  }

  try {
    await db
      .update(jobApplications)
      .set(values)
      .where(
        and(
          eq(jobApplications.userId, userId),
          eq(jobApplications.id, values.id)
        )
      );
    revalidatePath('/dashboard');
  } catch (err) {
    console.log(err);
  }
}

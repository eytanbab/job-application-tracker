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
  try {
    const res = await sql(
      'SELECT * FROM job_applications WHERE user_id = ($1) AND id = ($2)',
      [userId, id]
    );
    return res[0];
  } catch (err) {
    console.log('err', err);
  }
}

export async function createApplication(values: FormValues) {
  const { userId } = await auth();
  try {
    await sql(
      'INSERT INTO job_applications (user_id, role_name, company_name, date_applied, link, platform, status) VALUES($1, $2, $3, $4, $5, $6, $7)',
      [
        userId,
        values.role_name,
        values.company_name,
        values.date_applied,
        values.link,
        values.platform,
        values.status,
      ]
    );
  } catch (err) {
    throw err;
  }
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

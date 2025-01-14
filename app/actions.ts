'use server';

import { neon } from '@neondatabase/serverless';
import { FormSchema } from './(pages)/new/page';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

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

export async function createApplication(values: FormSchema) {
  const { userId } = await auth();
  try {
    await sql(
      'INSERT INTO job_applications (user_id, role_name, company_name, date_applied, link, platform, status) VALUES($1, $2, $3, $4, $5, $6, $7)',
      [
        userId,
        values.role,
        values.company,
        values.date,
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
  console.log('application id: ', id);
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

export async function editApplication(id: string) {}

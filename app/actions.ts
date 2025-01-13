'use server';

import { neon } from '@neondatabase/serverless';
import { FormSchema } from './(pages)/new/page';
import { auth } from '@clerk/nextjs/server';

const sql = neon(process.env.DATABASE_URL!);

export async function getApplications() {}

export async function create(values: FormSchema) {
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

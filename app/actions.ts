'use server';

import { neon } from '@neondatabase/serverless';
import { FormSchema } from './(pages)/new/page';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';

export async function create(values: FormSchema) {
  const { userId } = await auth();

  const sql = neon(process.env.DATABASE_URL!);
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

  revalidatePath('/dashboard');
}

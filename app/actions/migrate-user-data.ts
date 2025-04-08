'use server';

import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { db } from '@/app/db';
import { jobApplications } from '@/app/db/schema';
import { eq } from 'drizzle-orm';

export async function migrateGuestData() {
  const { userId } = await auth();
  const cookieStore = cookies();
  const guestId = (await cookieStore).get('guest_id')?.value;

  if (!userId || !guestId || userId === guestId) return;

  // Migrate applications
  await db
    .update(jobApplications)
    .set({ userId: userId })
    .where(eq(jobApplications.userId, guestId));

  // clear the cookie
  (await cookieStore).set('guest_id', '', { path: '/', maxAge: 0 });
}

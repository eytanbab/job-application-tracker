'use server';

import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { db } from '@/app/db';
import { jobApplications } from '@/app/db/schema';
import { eq } from 'drizzle-orm';
import { applicationsTag, documentsTag } from './_utils/cache-tags';
import { getCurrentUserIdOrThrow } from './_utils/user-context';

export async function migrateGuestData() {
  const { userId } = await auth();
  const cookieStore = cookies();
  const guestId = (await cookieStore).get('guest_id')?.value;

  if (!userId || !guestId || userId === guestId) return;
  const resolvedUserId = await getCurrentUserIdOrThrow();
  if (resolvedUserId !== userId) return;

  // Migrate applications
  await db
    .update(jobApplications)
    .set({ userId: resolvedUserId })
    .where(eq(jobApplications.userId, guestId));

  revalidateTag(applicationsTag(guestId));
  revalidateTag(applicationsTag(resolvedUserId));
  revalidateTag(documentsTag(guestId));
  revalidateTag(documentsTag(resolvedUserId));

  // clear the cookie
  (await cookieStore).set('guest_id', '', { path: '/', maxAge: 0 });
}

import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';

export async function getCurrentUserIdOrThrow(): Promise<string> {
  const { userId: clerkUserId } = await auth();
  const cookieStore = await cookies();
  const guestId = cookieStore.get('guest_id')?.value;
  const userId = clerkUserId ?? guestId;

  if (!userId) {
    throw new Error('No user or guest ID available');
  }

  return userId;
}

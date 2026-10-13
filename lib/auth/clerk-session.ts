import { auth } from "@clerk/nextjs/server";

/**
 * The signed-in Clerk user ID for this request, or null for guests and when
 * Clerk is not configured (demo mode).
 */
export async function getClerkUserId(): Promise<string | null> {
  if (!process.env.CLERK_SECRET_KEY) return null;
  const { userId } = await auth();
  return userId;
}

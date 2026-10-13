import { auth } from "@clerk/nextjs/server";
import { getCurrentUserIdOrThrow } from "./user-context";

/**
 * True when the app runs as the no-setup local demo: no database, or no Clerk
 * keys during development. This mirrors the mock fallbacks in app/db and
 * user-context.ts. The AI features stay open to guests there, because there
 * is no way to sign in.
 */
export function isAiDemoMode(): boolean {
  return (
    !process.env.DATABASE_URL ||
    (!process.env.CLERK_SECRET_KEY && process.env.NODE_ENV === "development")
  );
}

async function getClerkUserId(): Promise<string | null> {
  if (!process.env.CLERK_SECRET_KEY) return null;
  try {
    const { userId } = await auth();
    return userId;
  } catch (error) {
    // Without Clerk's request context there is no signed-in user; fail closed.
    console.error("[AI access] Clerk auth() failed:", error);
    return null;
  }
}

export type SignedInUserResult =
  | { ok: true; userId: string }
  | { ok: false; code: "auth_required" };

/**
 * Resolves the user for the paid AI features. Unlike getCurrentUserIdOrThrow,
 * a guest_id cookie is not enough: the caller must be signed in with Clerk,
 * except in demo mode.
 */
export async function requireSignedInUser(): Promise<SignedInUserResult> {
  const clerkUserId = await getClerkUserId();
  if (clerkUserId) return { ok: true, userId: clerkUserId };

  if (isAiDemoMode()) {
    return { ok: true, userId: await getCurrentUserIdOrThrow() };
  }

  return { ok: false, code: "auth_required" };
}

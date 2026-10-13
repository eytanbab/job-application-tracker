import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { allowsDevFallbacks } from "@/lib/env";
import { verifyGuestId } from "@/lib/security/guest-token";

export async function getCurrentUserIdOrThrow(): Promise<string> {
  try {
    if (process.env.CLERK_SECRET_KEY) {
      const { userId: clerkUserId } = await auth();
      if (clerkUserId) {
        return clerkUserId;
      }
    }
  } catch {
    // Clerk not configured or outside Clerk request context
  }

  try {
    const cookieStore = await cookies();
    const rawGuestToken = cookieStore.get("guest_id")?.value;
    const verifiedGuestId = verifyGuestId(rawGuestToken);

    if (verifiedGuestId) {
      return verifiedGuestId;
    }
  } catch {
    // cookies() error (e.g. called outside Next.js request context)
  }

  // Development/demo fallback when no credentials or sessions are available.
  // Never in a real deployment: every visitor would share one account.
  if (allowsDevFallbacks()) {
    return "mock-dev-user";
  }

  throw new Error("No authorized user or valid guest session available");
}

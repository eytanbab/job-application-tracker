import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { verifyGuestId } from "@/lib/security/guest-token";

export async function getCurrentUserIdOrThrow(): Promise<string> {
  const { userId: clerkUserId } = await auth();
  if (clerkUserId) {
    return clerkUserId;
  }

  const cookieStore = await cookies();
  const rawGuestToken = cookieStore.get("guest_id")?.value;
  const verifiedGuestId = verifyGuestId(rawGuestToken);

  if (!verifiedGuestId) {
    throw new Error("No authorized user or valid guest session available");
  }

  return verifiedGuestId;
}

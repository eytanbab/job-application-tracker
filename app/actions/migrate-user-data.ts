"use server";

import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { db } from "@/app/db";
import { documents, jobApplications } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { applicationsTag, documentsTag } from "./_utils/cache-tags";
import { getCurrentUserIdOrThrow } from "./_utils/user-context";
import { verifyGuestId } from "@/lib/security/guest-token";

export async function migrateGuestData() {
  const { userId } = await auth();
  const cookieStore = await cookies();
  const rawGuestToken = cookieStore.get("guest_id")?.value;

  // Cryptographically verify guest token and enforce UUID format
  const guestId = verifyGuestId(rawGuestToken);

  // Security constraints:
  // 1. Must be an authenticated Clerk session
  // 2. guestId must be a verified, signed UUID v4
  // 3. Prevent self-assignment or cross-user Clerk spoofing
  if (
    !userId ||
    !guestId ||
    userId === guestId ||
    guestId.startsWith("user_")
  ) {
    return;
  }

  const resolvedUserId = await getCurrentUserIdOrThrow();
  if (resolvedUserId !== userId) return;

  // Migrate applications and documents atomically via batch
  await db.batch([
    db
      .update(jobApplications)
      .set({ userId: resolvedUserId })
      .where(eq(jobApplications.userId, guestId)),
    db
      .update(documents)
      .set({ userId: resolvedUserId })
      .where(eq(documents.userId, guestId)),
  ]);

  revalidateTag(applicationsTag(guestId), "max");
  revalidateTag(applicationsTag(resolvedUserId), "max");
  revalidateTag(documentsTag(guestId), "max");
  revalidateTag(documentsTag(resolvedUserId), "max");

  // Clear the guest session cookie
  cookieStore.set("guest_id", "", { path: "/", maxAge: 0, httpOnly: true });
}

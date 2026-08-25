"use server";

import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { revalidateTag } from "next/cache";
import { db } from "@/app/db";
import { documents, jobApplications, interviews } from "@/app/db/schema";
import { eq } from "drizzle-orm";
import { applicationsTag, documentsTag, interviewsTag } from "./_utils/cache-tags";
import { getCurrentUserIdOrThrow } from "./_utils/user-context";

export async function migrateGuestData() {
  const { userId } = await auth();
  const cookieStore = await cookies();
  const guestId = cookieStore.get("guest_id")?.value;

  if (!userId || !guestId || userId === guestId) return;
  const resolvedUserId = await getCurrentUserIdOrThrow();
  if (resolvedUserId !== userId) return;

  // Migrate applications
  await db
    .update(jobApplications)
    .set({ userId: resolvedUserId })
    .where(eq(jobApplications.userId, guestId));

  await db
    .update(documents)
    .set({ userId: resolvedUserId })
    .where(eq(documents.userId, guestId));

  await db
    .update(interviews)
    .set({ userId: resolvedUserId })
    .where(eq(interviews.userId, guestId));

  revalidateTag(applicationsTag(guestId), "max");
  revalidateTag(applicationsTag(resolvedUserId), "max");
  revalidateTag(documentsTag(guestId), "max");
  revalidateTag(documentsTag(resolvedUserId), "max");
  revalidateTag(interviewsTag(guestId), "max");
  revalidateTag(interviewsTag(resolvedUserId), "max");

  // clear the cookie
  cookieStore.set("guest_id", "", { path: "/", maxAge: 0 });
}

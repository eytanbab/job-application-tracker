"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

import { deleteUserData } from "@/lib/account-data";
import { getClerkUserId } from "@/lib/auth/clerk-session";
import { applicationsTag, documentsTag, expireTag, preferencesTag } from "./_utils/cache-tags";
import { getCurrentUserIdOrThrow } from "./_utils/user-context";

// Must match the phrase the settings dialog asks the user to type.
const DELETE_CONFIRMATION_TEXT = "DELETE";

export type DeleteAccountResult =
  | { ok: true; signedIn: boolean }
  | { ok: false; error: string };

/**
 * Permanently deletes the current user's applications, status history,
 * documents and stored files. Signed-in users also have their Clerk account
 * deleted; guests have their session cookie cleared.
 */
export async function deleteAccount(
  confirmation: string,
): Promise<DeleteAccountResult> {
  if (confirmation !== DELETE_CONFIRMATION_TEXT) {
    return { ok: false, error: `Type ${DELETE_CONFIRMATION_TEXT} to confirm.` };
  }

  const userId = await getCurrentUserIdOrThrow();
  const clerkUserId = await getClerkUserId();
  const signedIn = clerkUserId !== null && clerkUserId === userId;

  try {
    await deleteUserData(userId);
  } catch (error) {
    console.error("[Account] Failed to delete user data:", error);
    return {
      ok: false,
      error: "We couldn't delete all of your data. Please try again.",
    };
  }

  expireTag(applicationsTag(userId));
  expireTag(documentsTag(userId));
  expireTag(preferencesTag(userId));
  revalidatePath("/", "layout");

  if (signedIn) {
    try {
      const client = await clerkClient();
      await client.users.deleteUser(userId);
    } catch (error) {
      console.error("[Account] Failed to delete Clerk user:", error);
      return {
        ok: false,
        error: "Your data was deleted, but we couldn't close your account. Please try again.",
      };
    }
  } else {
    // The proxy issues a fresh guest session on the next request.
    const cookieStore = await cookies();
    cookieStore.set("guest_id", "", { path: "/", maxAge: 0, httpOnly: true });
  }

  return { ok: true, signedIn };
}

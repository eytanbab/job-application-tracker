import { revalidatePath } from "next/cache";
import { applicationsTag, expireTag } from "@/app/actions/_utils/cache-tags";

/** Expires everything that shows a user's applications after a write. */
export function purgeApplicationCaches(userId: string) {
  try {
    expireTag(applicationsTag(userId));
    revalidatePath("/applications");
    revalidatePath("/analytics/overview");
  } catch {
    // Gracefully ignore when invoked outside Next.js request context (e.g. testing scripts)
  }
}

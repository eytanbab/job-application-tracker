import { revalidateTag, updateTag } from "next/cache";

export const CACHE_REVALIDATE_SECONDS = 300;

export const applicationsTag = (userId: string) => `applications:${userId}`;
export const documentsTag = (userId: string) => `documents:${userId}`;
export const preferencesTag = (userId: string) => `preferences:${userId}`;

/**
 * Expires a tag so the next read is fresh. In a server action this is
 * updateTag (the user sees their own write at once); elsewhere (route
 * handlers, after()) updateTag throws, so expire it immediately instead.
 * revalidateTag(tag, "max") would serve stale data on the next visit.
 */
export function expireTag(tag: string) {
  try {
    updateTag(tag);
  } catch {
    revalidateTag(tag, { expire: 0 });
  }
}

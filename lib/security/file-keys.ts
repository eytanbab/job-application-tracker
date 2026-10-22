import { isGuestOwnerId } from "@/lib/account-data";

// Rules for S3 keys stored on document rows. Keys reach the server from the
// client after an upload, so they are checked wherever one is stored or read.

/**
 * True when an S3 key lies in the user's own folder. Keys come from the
 * client after upload, so every action that stores or signs one checks it.
 */
export function isOwnFileKey(userId: string, fileKey: string): boolean {
  return fileKey.startsWith(`${userId}/`) && !fileKey.includes("..");
}

/**
 * Keys that may be signed or deleted for a document row the user owns: their
 * own folder, or a guest folder, because signing in moves a guest's rows to
 * the new account without moving the S3 objects (migrate-user-data.ts).
 */
export function isSignableFileKey(userId: string, fileKey: string): boolean {
  if (isOwnFileKey(userId, fileKey)) return true;
  const folder = fileKey.split("/")[0];
  return isGuestOwnerId(folder) && !fileKey.includes("..");
}

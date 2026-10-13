import { DeleteObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { count, eq, inArray, sql } from "drizzle-orm";

import { db, isMockDb } from "@/app/db";
import {
  applicationStatusHistory,
  documents,
  jobApplications,
} from "@/app/db/schema";
import { mockStore } from "@/lib/mock-data/mock-store";
import { s3Client } from "@/lib/s3-client";

// Server-only helpers behind data export, account deletion and guest
// retention. Callers are responsible for resolving which user they act on.

type ApplicationRow = typeof jobApplications.$inferSelect;
type StatusHistoryRow = typeof applicationStatusHistory.$inferSelect;
type DocumentRow = typeof documents.$inferSelect;

/** Document metadata included in exports (storage keys and URLs are internal). */
export type ExportedDocument = Pick<
  DocumentRow,
  "id" | "title" | "category" | "file_name" | "file_size" | "created_at"
>;

export interface UserDataExport {
  applications: ApplicationRow[];
  statusHistory: StatusHistoryRow[];
  documents: ExportedDocument[];
}

export interface DeletionSummary {
  applications: number;
  documents: number;
  s3Objects: number;
}

export const GUEST_RETENTION_DAYS = 90;

// Guest IDs are UUID v4 (see lib/security/guest-token.ts); Clerk IDs are `user_…`.
const GUEST_ID_PATTERN =
  "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$";
const GUEST_ID_REGEX = new RegExp(GUEST_ID_PATTERN, "i");

export function isGuestOwnerId(ownerId: string): boolean {
  return GUEST_ID_REGEX.test(ownerId);
}

function toExportedDocument(doc: DocumentRow): ExportedDocument {
  return {
    id: doc.id,
    title: doc.title,
    category: doc.category,
    file_name: doc.file_name,
    file_size: doc.file_size,
    created_at: doc.created_at,
  };
}

// --- Export ---

export async function collectUserData(userId: string): Promise<UserDataExport> {
  if (isMockDb) {
    const data = mockStore.exportUserData(userId);
    return {
      applications: data.applications.map((a) => ({
        ...a,
        resumeId: a.resumeId ?? null,
      })),
      statusHistory: data.statusHistory,
      documents: data.documents.map(toExportedDocument),
    };
  }

  const [applications, statusHistory, docs] = await Promise.all([
    db
      .select()
      .from(jobApplications)
      .where(eq(jobApplications.userId, userId))
      .orderBy(jobApplications.date_applied),
    db
      .select({
        id: applicationStatusHistory.id,
        applicationId: applicationStatusHistory.applicationId,
        status: applicationStatusHistory.status,
        statusCategory: applicationStatusHistory.statusCategory,
        createdAt: applicationStatusHistory.createdAt,
      })
      .from(applicationStatusHistory)
      .innerJoin(
        jobApplications,
        eq(applicationStatusHistory.applicationId, jobApplications.id),
      )
      .where(eq(jobApplications.userId, userId))
      .orderBy(applicationStatusHistory.createdAt),
    db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId))
      .orderBy(documents.created_at),
  ]);

  return {
    applications,
    statusHistory,
    documents: docs.map(toExportedDocument),
  };
}

const CSV_COLUMNS: { header: string; value: (a: ApplicationRow) => unknown }[] = [
  { header: "id", value: (a) => a.id },
  { header: "role", value: (a) => a.role_name },
  { header: "company", value: (a) => a.company_name },
  { header: "status", value: (a) => a.status },
  { header: "status_category", value: (a) => a.statusCategory },
  { header: "date_applied", value: (a) => a.date_applied },
  { header: "platform", value: (a) => a.platform },
  { header: "location", value: (a) => a.location },
  { header: "salary", value: (a) => a.salary },
  { header: "link", value: (a) => a.link },
  { header: "description", value: (a) => a.description },
  { header: "notes", value: (a) => a.notes },
  { header: "resume_id", value: (a) => a.resumeId },
  { header: "created_at", value: (a) => a.createdAt },
];

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = value instanceof Date ? value.toISOString() : String(value);
  // Stop spreadsheet apps from evaluating cells as formulas.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function applicationsToCsv(applications: ApplicationRow[]): string {
  const lines = [
    CSV_COLUMNS.map((c) => c.header).join(","),
    ...applications.map((a) =>
      CSV_COLUMNS.map((c) => csvCell(c.value(a))).join(","),
    ),
  ];
  return lines.join("\r\n") + "\r\n";
}

// --- Deletion ---

/**
 * Deletes every row and S3 object owned by userId in the real database.
 * S3 objects go first so a failure leaves the rows in place to retry.
 */
async function deleteStoredData(userId: string): Promise<DeletionSummary> {
  const ownedDocs = await db
    .select({ file_key: documents.file_key })
    .from(documents)
    .where(eq(documents.userId, userId));

  const s3Objects = await deleteUserFiles(
    userId,
    ownedDocs.map((d) => d.file_key),
  );

  // Status history rows are removed by the FK cascade on job_applications.
  const [deletedApps, deletedDocs] = await db.batch([
    db
      .delete(jobApplications)
      .where(eq(jobApplications.userId, userId))
      .returning({ id: jobApplications.id }),
    db
      .delete(documents)
      .where(eq(documents.userId, userId))
      .returning({ id: documents.id }),
  ]);

  return {
    applications: deletedApps.length,
    documents: deletedDocs.length,
    s3Objects,
  };
}

/**
 * Deletes the user's files from S3: every key recorded in their documents,
 * then anything left under their `<userId>/` prefix (uploads that were never
 * saved as a document). Returns the number of objects deleted.
 */
async function deleteUserFiles(
  userId: string,
  fileKeys: string[],
): Promise<number> {
  const bucket = process.env.NEXT_AWS_S3_BUCKET_NAME;
  if (!bucket) return 0;

  const prefix = `${userId}/`;
  const keys = new Set(fileKeys.filter((key) => key.startsWith(prefix)));

  for (const key of keys) {
    await s3Client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }

  let swept = 0;
  try {
    let continuationToken: string | undefined;
    do {
      const page = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        }),
      );
      for (const object of page.Contents ?? []) {
        if (!object.Key || keys.has(object.Key)) continue;
        await s3Client.send(
          new DeleteObjectCommand({ Bucket: bucket, Key: object.Key }),
        );
        swept++;
      }
      continuationToken = page.IsTruncated
        ? page.NextContinuationToken
        : undefined;
    } while (continuationToken);
  } catch (error) {
    // Listing needs s3:ListBucket; the recorded files above are already gone.
    console.error(
      `[account-data] Could not sweep S3 prefix ${prefix} for unrecorded uploads:`,
      error,
    );
  }

  return keys.size + swept;
}

/** Deletes everything the user owns: applications, status history, documents and files. */
export async function deleteUserData(userId: string): Promise<DeletionSummary> {
  if (isMockDb) {
    const result = mockStore.deleteUserData(userId);
    return {
      applications: result.applications,
      documents: result.documents,
      s3Objects: 0,
    };
  }
  return deleteStoredData(userId);
}

// --- Guest retention ---

export interface InactiveGuest {
  ownerId: string;
  lastActivity: Date;
}

/**
 * Guest owners whose latest activity is older than the retention window.
 * Activity is the latest of job_applications.created_at,
 * application_status_history.created_at and documents.created_at.
 */
async function findInactiveGuests(
  cutoff: Date,
  limit: number,
): Promise<InactiveGuest[]> {
  if (isMockDb) {
    return mockStore
      .getOwnerActivity()
      .filter((o) => isGuestOwnerId(o.ownerId) && o.lastActivity < cutoff)
      .sort((a, b) => a.lastActivity.getTime() - b.lastActivity.getTime())
      .slice(0, limit);
  }

  const result = await db.execute<{ owner_id: string; last_activity: string }>(sql`
    select owner_id, max(activity_at) as last_activity
    from (
      select user_id as owner_id, created_at as activity_at
        from job_applications
      union all
      select ja.user_id, h.created_at
        from application_status_history h
        join job_applications ja on ja.id = h.application_id
      union all
      select user_id, created_at
        from documents
    ) activity
    where owner_id ~* ${GUEST_ID_PATTERN}
    group by owner_id
    having max(activity_at) < ${cutoff.toISOString()}::timestamp
    order by last_activity asc
    limit ${limit}
  `);

  return result.rows
    .filter((row) => isGuestOwnerId(row.owner_id))
    .map((row) => ({
      ownerId: row.owner_id,
      lastActivity: new Date(row.last_activity),
    }));
}

async function countGuestRows(ownerIds: string[]) {
  if (ownerIds.length === 0) {
    return { applications: 0, statusHistory: 0, documents: 0 };
  }

  if (isMockDb) {
    const owners = new Set(ownerIds);
    const data = mockStore.exportUserData("");
    const appIds = new Set(
      data.applications.filter((a) => owners.has(a.userId)).map((a) => a.id),
    );
    return {
      applications: appIds.size,
      statusHistory: data.statusHistory.filter((h) => appIds.has(h.applicationId))
        .length,
      documents: data.documents.filter((d) => owners.has(d.userId)).length,
    };
  }

  const [[apps], [history], [docs]] = await Promise.all([
    db
      .select({ value: count() })
      .from(jobApplications)
      .where(inArray(jobApplications.userId, ownerIds)),
    db
      .select({ value: count() })
      .from(applicationStatusHistory)
      .innerJoin(
        jobApplications,
        eq(applicationStatusHistory.applicationId, jobApplications.id),
      )
      .where(inArray(jobApplications.userId, ownerIds)),
    db
      .select({ value: count() })
      .from(documents)
      .where(inArray(documents.userId, ownerIds)),
  ]);

  return {
    applications: apps.value,
    statusHistory: history.value,
    documents: docs.value,
  };
}

export interface GuestCleanupReport {
  dryRun: boolean;
  retentionDays: number;
  cutoff: string;
  limit: number;
  guests: number;
  applications: number;
  statusHistory: number;
  documents: number;
  s3Objects: number;
  failures: { ownerId: string; error: string }[];
}

/**
 * Deletes data owned by guest IDs with no activity in the retention window.
 * With dryRun, only counts what would be deleted.
 */
export async function cleanupInactiveGuests({
  dryRun,
  limit,
  now = new Date(),
}: {
  dryRun: boolean;
  limit: number;
  now?: Date;
}): Promise<GuestCleanupReport> {
  const cutoff = new Date(now.getTime() - GUEST_RETENTION_DAYS * 86_400_000);
  const guests = await findInactiveGuests(cutoff, limit);
  const counts = await countGuestRows(guests.map((g) => g.ownerId));

  const report: GuestCleanupReport = {
    dryRun,
    retentionDays: GUEST_RETENTION_DAYS,
    cutoff: cutoff.toISOString(),
    limit,
    guests: guests.length,
    ...counts,
    s3Objects: 0,
    failures: [],
  };

  if (dryRun) return report;

  for (const { ownerId } of guests) {
    try {
      if (isMockDb) {
        mockStore.deleteOwnerData(ownerId);
      } else {
        const summary = await deleteStoredData(ownerId);
        report.s3Objects += summary.s3Objects;
      }
    } catch (error) {
      console.error(`[Cron] Failed to delete guest ${ownerId}:`, error);
      report.failures.push({ ownerId, error: (error as Error).message });
    }
  }

  return report;
}

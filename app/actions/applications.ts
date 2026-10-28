"use server";

import { after } from "next/server";
import { unstable_cache } from "next/cache";

import { db, isMockDb } from "@/app/db";
import { mockStore } from "@/lib/mock-data/mock-store";
import {
  insertApplicationSchema,
  jobApplications,
  applicationStatusHistory,
  documents,
} from "@/app/db/schema";
import { z } from "zod";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import {
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  gte,
  ilike,
  inArray,
  lte,
  notInArray,
  or,
  sql,
} from "drizzle-orm";

import { format } from "date-fns";
import { purgeApplicationCaches } from "@/lib/applications/purge-caches";
import { syncGhostedApplications } from "@/lib/applications/ghost-sync";
import { getCurrentUserIdOrThrow } from "./_utils/user-context";
import { applicationsTag, CACHE_REVALIDATE_SECONDS } from "./_utils/cache-tags";
import {
  getStatusDisplay,
  getStatusKind,
  isStatusKind,
  resolveUpdatedStatus,
  safeFormatDate,
  statusLabels,
  statusOptions,
  type StatusKind,
  normalizeJobLink,
} from "@/lib/utils";
import {
  emptyStatusCounts,
  escapeLikePattern,
  KANBAN_PAGE_SIZE,
  normalizeListQuery,
  queryRows,
  type ApplicationListQuery,
  type ListFilters,
  type StatusCounts,
} from "@/lib/applications/list-query";
import {
  ghostsAt,
  INTERVIEW_KINDS,
  INTERVIEW_TEXT_REGEX,
  RESPONSE_KINDS,
} from "@/lib/analytics/definitions";
import { groupHistory } from "@/lib/analytics/facts";
import { dateAfterStatusChange } from "@/lib/applications/saved";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formSchema = insertApplicationSchema
  .omit({ userId: true })
  .partial({ month: true, year: true });

type FormValues = z.input<typeof formSchema>;

function normalizeApplicationStatus(values: FormValues): FormValues {
  const statusCategory = getStatusKind(values.status, values.statusCategory);
  const rawStatus = (values.status ?? "").trim();
  const status = rawStatus || statusLabels[statusCategory] || "Applied";

  return {
    ...values,
    status,
    statusCategory,
  };
}

/**
 * Server-side checks for create and update. The form validates too, but
 * inline edits in the detail sheet and direct action calls skip it.
 */
function assertValidApplication(
  values: FormValues,
  require: { role: boolean; company: boolean } = { role: true, company: true },
) {
  if (require.role && !(values.role_name ?? "").trim()) throw new Error("Enter the role title.");
  if (require.company && !(values.company_name ?? "").trim()) throw new Error("Enter the company name.");
  const date = values.date_applied as unknown;
  const parsed = date instanceof Date ? date : new Date(String(date ?? ""));
  if (!date || Number.isNaN(parsed.getTime())) throw new Error("Enter the date you applied.");
  // A link with another scheme (javascript:, mailto:) is refused. Other text
  // that is not a URL ("N/A", "Remote: see notes" in older rows) is kept as
  // typed, so saves that resend a stored row (board moves, bulk status) never
  // fail on it; it is never rendered as a link.
  const link = (values.link ?? "").trim();
  const dangerous = /^(javascript|data|vbscript|file|blob):/i.test(link);
  const otherScheme = !/\s/.test(link) && /^[a-z][a-z0-9+.-]*:/i.test(link);
  if (link && !normalizeJobLink(link) && (dangerous || otherScheme)) {
    throw new Error("Enter a job link that starts with http:// or https://.");
  }
  const email = (values.contactEmail ?? "").trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid contact email.");
  }
}

const optionalText = (value: string | null | undefined) => value?.trim() || null;

/** A `YYYY-MM-DD` day, or null for anything else. */
function optionalDay(value: unknown): string | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : format(value, "yyyy-MM-dd");
  }
  const text = String(value ?? "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function optionalInstant(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * Follow-up, interview and contact fields. Like description and notes, a
 * field the caller leaves out (undefined) keeps its stored value.
 */
function cleanPlanningFields(values: FormValues) {
  return {
    ...(values.followUpDate !== undefined && {
      followUpDate: optionalDay(values.followUpDate),
    }),
    ...(values.interviewAt !== undefined && {
      interviewAt: optionalInstant(values.interviewAt),
    }),
    ...(values.contactName !== undefined && {
      contactName: optionalText(values.contactName),
    }),
    ...(values.contactEmail !== undefined && {
      contactEmail: optionalText(values.contactEmail),
    }),
    ...(values.referredBy !== undefined && {
      referredBy: optionalText(values.referredBy),
    }),
  };
}

function extractCleanApplicationFields(
  values: FormValues,
  require?: { role: boolean; company: boolean },
) {
  assertValidApplication(values, require);
  const normalized = normalizeApplicationStatus(values);
  const formattedDate = safeFormatDate(normalized.date_applied, "yyyy-MM-dd");
  const parsedDate = new Date(`${formattedDate}T12:00:00`);
  const month = !isNaN(parsedDate.getTime()) ? format(parsedDate, "M") : format(new Date(), "M");
  const year = !isNaN(parsedDate.getTime()) ? format(parsedDate, "yyyy") : format(new Date(), "yyyy");

  return {
    role_name: (normalized.role_name || "").trim(),
    company_name: (normalized.company_name || "").trim(),
    date_applied: formattedDate,
    link: normalizeJobLink(normalized.link) ?? (normalized.link || "").trim(),
    // List rows omit description and notes, so saves built from a list row
    // (Kanban moves, bulk status changes) send them as undefined. Leave the
    // stored text alone instead of overwriting it with null.
    ...(normalized.description !== undefined && {
      description: normalized.description ?? null,
    }),
    ...(normalized.notes !== undefined && { notes: normalized.notes ?? null }),
    location: (normalized.location || "").trim(),
    platform: (normalized.platform || "").toLowerCase().trim(),
    status: normalized.status,
    statusCategory: normalized.statusCategory ?? "applied",
    salary: normalized.salary ? normalized.salary.trim() : null,
    resumeId: normalized.resumeId || null,
    ...cleanPlanningFields(normalized),
    month,
    year,
  };
}


// List rows carry every column except the long-text ones (job description
// and notes), which only the detail panel needs: getApplicationDetails.
const {
  description: _description,
  notes: _notes,
  ...listColumns
} = getTableColumns(jobApplications);

const listRowFields = {
  ...listColumns,
  resumeTitle: documents.title,
  resumeFileName: documents.file_name,
  resumeFileSize: documents.file_size,
};

/** The row's resume, only when it belongs to the same user. */
function resumeJoin(userId: string) {
  return and(eq(jobApplications.resumeId, documents.id), eq(documents.userId, userId));
}

function displayGhostedStatus<T extends { status: string; statusCategory: string | null }>(
  app: T,
): T {
  if (app.statusCategory === "ghosted") {
    const rawLower = (app.status || "").trim().toLowerCase();
    if (
      !rawLower ||
      rawLower === "applied" ||
      rawLower === "in review" ||
      rawLower === "review"
    ) {
      return { ...app, status: "Ghosted" };
    }
  }
  return app;
}

/**
 * The application, or any of its status history, is in one of `kinds` or has
 * interview wording. Mirrors reachedInterview / responded in
 * lib/analytics/definitions.ts so tracker counts match the analytics page.
 */
function everReached(kinds: readonly StatusKind[]) {
  const kindList = sql.join(kinds.map((kind) => sql`${kind}`), sql`, `);
  return or(
    inArray(jobApplications.statusCategory, [...kinds]),
    sql`${jobApplications.status} ~* ${INTERVIEW_TEXT_REGEX}`,
    sql`exists (
      select 1 from ${applicationStatusHistory}
      where ${applicationStatusHistory.applicationId} = ${jobApplications.id}
        and (${applicationStatusHistory.statusCategory} in (${kindList})
          or ${applicationStatusHistory.status} ~* ${INTERVIEW_TEXT_REGEX})
    )`,
  )!;
}

function listFilterConditions(userId: string, query: ListFilters) {
  const conditions = [eq(jobApplications.userId, userId)];
  if (query.statuses) {
    conditions.push(inArray(jobApplications.statusCategory, query.statuses));
  }
  if (query.from) conditions.push(gte(jobApplications.date_applied, query.from));
  if (query.to) conditions.push(lte(jobApplications.date_applied, query.to));
  if (query.stage) {
    conditions.push(
      everReached(query.stage === "interviewed" ? INTERVIEW_KINDS : RESPONSE_KINDS),
    );
  }
  if (query.platform) {
    conditions.push(
      sql`lower(trim(${jobApplications.platform})) = ${query.platform}`,
    );
  }
  if (query.search) {
    const pattern = `%${escapeLikePattern(query.search)}%`;
    conditions.push(
      or(
        ilike(jobApplications.company_name, pattern),
        ilike(jobApplications.role_name, pattern),
        ilike(jobApplications.location, pattern),
        ilike(jobApplications.platform, pattern),
        ilike(jobApplications.status, pattern),
        ilike(jobApplications.statusCategory, pattern),
        ilike(jobApplications.salary, pattern),
        ilike(jobApplications.description, pattern),
        ilike(jobApplications.notes, pattern),
        ilike(jobApplications.contactName, pattern),
        ilike(jobApplications.referredBy, pattern),
      )!,
    );
  }
  return and(...conditions);
}

function listOrderBy(query: Pick<ApplicationListQuery, "sort" | "desc">) {
  // The database collation (C.UTF-8) orders by byte, putting "CS" before
  // "Crm"; compare text case-insensitively. Empty text counts as missing,
  // and missing values go last either way.
  const text = (column: AnyPgColumn) => sql`nullif(lower(${column}), '')`;
  const sortColumns = {
    role_name: [
      text(jobApplications.role_name),
      text(jobApplications.company_name),
    ],
    date_applied: [sql`${jobApplications.date_applied}`],
    status: [sql`${jobApplications.statusCategory}`],
    location: [text(jobApplications.location)],
    platform: [text(jobApplications.platform)],
    salary: [text(jobApplications.salary)],
  };
  const direction = sql.raw(query.desc ? "desc" : "asc");
  const primary = query.sort
    ? sortColumns[query.sort].map(
        (expr) => sql`${expr} ${direction} nulls last`,
      )
    : [];
  // Stable tie-breakers so rows never shuffle between pages
  return [
    ...primary,
    desc(jobApplications.date_applied),
    desc(jobApplications.createdAt),
    asc(jobApplications.id),
  ];
}

async function queryListRows(userId: string, query: ApplicationListQuery) {
  const where = listFilterConditions(userId, query);
  // The total rides along on each row (count over the filtered rows, taken
  // before limit and offset), so a page is one query.
  const rows = await db
    .select({ ...listRowFields, total: sql<string>`count(*) over ()` })
    .from(jobApplications)
    .leftJoin(documents, resumeJoin(userId))
    .where(where)
    .orderBy(...listOrderBy(query))
    .limit(query.pageSize)
    .offset((query.page - 1) * query.pageSize);
  const pageRows = rows.map(({ total: _total, ...row }) => displayGhostedStatus(row));
  if (rows.length) return { rows: pageRows, total: Number(rows[0].total) };
  if (query.page === 1) return { rows: pageRows, total: 0 };
  // A page past the end has no rows to carry the total; count separately
  // so the caller can clamp to the real last page.
  const [{ total }] = await db.select({ total: count() }).from(jobApplications).where(where);
  return { rows: pageRows, total };
}

/** Status history per application, for the stage filters in mock mode. */
function mockHistoryByApp() {
  return groupHistory(mockStore.getAnalyticsDataset().history);
}

function mockListRows(userId: string) {
  return mockStore.getApplications(userId).map((app) => {
    const { description: _d, notes: _n, ...row } = app;
    return row;
  });
}

/** One page of the current user's applications, filtered and sorted. */
export async function getApplicationsPage(
  rawQuery: Parameters<typeof normalizeListQuery>[0],
) {
  const userId = await getCurrentUserIdOrThrow();
  const query = normalizeListQuery(rawQuery);

  const run = async () => {
    if (!isMockDb) return queryListRows(userId, query);
    const result = queryRows(mockStore.getApplications(userId), query, mockHistoryByApp());
    const listRows = new Map(mockListRows(userId).map((row) => [row.id, row]));
    return {
      rows: result.rows.map((row) => listRows.get(row.id)!),
      total: result.total,
    };
  };

  let result = await run();
  // A stale URL (e.g. page 9 after deleting rows) lands on the last page
  const lastPage = Math.max(1, Math.ceil(result.total / query.pageSize));
  if (query.page > lastPage) {
    query.page = lastPage;
    result = await run();
  }
  return { ...result, page: query.page, pageSize: query.pageSize };
}

export type ApplicationListRow = Awaited<
  ReturnType<typeof getApplicationsPage>
>["rows"][number];

/** Application count per status across the user's whole account. */
export async function getApplicationStatusCounts(): Promise<StatusCounts> {
  const userId = await getCurrentUserIdOrThrow();
  const counts = emptyStatusCounts();

  if (isMockDb) {
    for (const app of mockStore.getApplications(userId)) {
      counts[getStatusKind(app.status, app.statusCategory)]++;
      counts.all++;
    }
    return counts;
  }

  const rows = await db
    .select({ category: jobApplications.statusCategory, total: count() })
    .from(jobApplications)
    .where(eq(jobApplications.userId, userId))
    .groupBy(jobApplications.statusCategory);

  for (const { category, total } of rows) {
    const kind = category && isStatusKind(category) ? category : "other";
    counts[kind] += total;
    counts.all += total;
  }
  return counts;
}

/**
 * The first cards of every Kanban column, plus each column's full count.
 * Columns load more cards on demand through getApplicationsPage.
 */
export async function getKanbanColumns(
  rawQuery: Parameters<typeof normalizeListQuery>[0],
) {
  const userId = await getCurrentUserIdOrThrow();
  const query = normalizeListQuery(rawQuery);
  const kinds = query.statuses ?? statusOptions.map((option) => option.value);

  if (isMockDb) {
    const columnQuery = (kind: StatusKind): ApplicationListQuery => ({
      ...query,
      statuses: [kind],
      sort: null,
      page: 1,
      pageSize: KANBAN_PAGE_SIZE,
    });
    const all = mockStore.getApplications(userId);
    const historyByApp = mockHistoryByApp();
    const listRows = new Map(mockListRows(userId).map((row) => [row.id, row]));
    return Object.fromEntries(
      kinds.map((kind) => {
        const result = queryRows(all, columnQuery(kind), historyByApp);
        return [
          kind,
          {
            rows: result.rows.map((row) => listRows.get(row.id)!),
            total: result.total,
          },
        ];
      }),
    ) as Partial<Record<StatusKind, { rows: ApplicationListRow[]; total: number }>>;
  }

  // One query for every column: rank rows within their status, keep the
  // first page of each, and count each status with a window over the same
  // filtered rows.
  const order = sql.join(listOrderBy({ sort: null, desc: false }), sql`, `);
  const ranked = db
    .select({
      ...listRowFields,
      columnRank: sql<number>`row_number() over (partition by ${jobApplications.statusCategory} order by ${order})`.as("column_rank"),
      columnTotal: sql<string>`count(*) over (partition by ${jobApplications.statusCategory})`.as("column_total"),
    })
    .from(jobApplications)
    .leftJoin(documents, resumeJoin(userId))
    .where(listFilterConditions(userId, { ...query, statuses: kinds }))
    .as("ranked");
  const rows = await db
    .select()
    .from(ranked)
    .where(lte(ranked.columnRank, KANBAN_PAGE_SIZE))
    .orderBy(asc(ranked.columnRank));

  const columns: Partial<
    Record<StatusKind, { rows: ApplicationListRow[]; total: number }>
  > = Object.fromEntries(kinds.map((kind) => [kind, { rows: [], total: 0 }]));
  for (const { columnRank: _rank, columnTotal, ...row } of rows) {
    const column = columns[row.statusCategory as StatusKind];
    if (!column) continue;
    column.rows.push(displayGhostedStatus(row));
    column.total = Number(columnTotal);
  }
  return columns;
}

export type KanbanColumns = Awaited<ReturnType<typeof getKanbanColumns>>;

/** A single list row, for opening ?appId= links to rows on other pages. */
export async function getApplicationListItem(
  applicationId: string,
): Promise<ApplicationListRow | null> {
  const userId = await getCurrentUserIdOrThrow();

  if (isMockDb) {
    return mockListRows(userId).find((row) => row.id === applicationId) ?? null;
  }

  const [row] = await db
    .select(listRowFields)
    .from(jobApplications)
    .leftJoin(documents, resumeJoin(userId))
    .where(
      and(
        eq(jobApplications.userId, userId),
        eq(jobApplications.id, applicationId),
      ),
    )
    .limit(1);
  return row ? displayGhostedStatus(row) : null;
}

/** The long-text fields list rows leave out, loaded when a row is opened. */
export async function getApplicationDetails(
  applicationId: string,
): Promise<{ description: string | null; notes: string | null } | null> {
  const userId = await getCurrentUserIdOrThrow();

  if (isMockDb) {
    const app = mockStore
      .getApplications(userId)
      .find((row) => row.id === applicationId);
    return app
      ? { description: app.description ?? null, notes: app.notes ?? null }
      : null;
  }

  const [row] = await db
    .select({
      description: jobApplications.description,
      notes: jobApplications.notes,
    })
    .from(jobApplications)
    .where(
      and(
        eq(jobApplications.userId, userId),
        eq(jobApplications.id, applicationId),
      ),
    )
    .limit(1);
  return row ?? null;
}

/**
 * Distinct location and platform pairs, shared by the filter menu and the
 * form suggestions, cached until the user's applications change.
 */
function distinctLocationsAndPlatforms(userId: string) {
  return unstable_cache(
    () =>
      db
        .selectDistinct({
          location: jobApplications.location,
          platform: jobApplications.platform,
        })
        .from(jobApplications)
        .where(eq(jobApplications.userId, userId)),
    ["applications", "locations-platforms", userId],
    { revalidate: CACHE_REVALIDATE_SECONDS, tags: [applicationsTag(userId)] },
  )();
}

/** Distinct platforms the user has applied through, for the filter menu. */
export async function getUserPlatforms(): Promise<string[]> {
  const userId = await getCurrentUserIdOrThrow();

  const platforms = isMockDb
    ? mockStore.getApplications(userId).map((app) => app.platform)
    : (await distinctLocationsAndPlatforms(userId)).map((row) => row.platform);

  const unique = new Set(
    platforms.map((p) => (p ?? "").trim().toLowerCase()).filter(Boolean),
  );
  return Array.from(unique).sort((a, b) => a.localeCompare(b));
}

// Create a new application for the current user
export async function createApplication(values: FormValues) {
  const userId = await getCurrentUserIdOrThrow();
  const fields = extractCleanApplicationFields(values);

  // Validate resume ownership if resumeId is provided
  if (fields.resumeId) {
    if (isMockDb) {
      const isValid = mockStore
        .getDocuments(userId)
        .some((d) => d.id === fields.resumeId);
      if (!isValid) {
        fields.resumeId = null;
      }
    } else {
      const doc = await db
        .select({ id: documents.id })
        .from(documents)
        .where(
          and(
            eq(documents.id, fields.resumeId),
            eq(documents.userId, userId),
          ),
        )
        .limit(1);
      if (doc.length === 0) {
        fields.resumeId = null;
      }
    }
  }

  if (isMockDb) {
    const newApp = mockStore.createApplication(userId, fields as any);
    purgeApplicationCaches(userId);
    return [{ insertedId: newApp.id }];
  }

  const applicationId = crypto.randomUUID();

  // Atomically insert the application and its initial status history in a single batch
  await db.batch([
    db.insert(jobApplications).values({
      id: applicationId,
      ...fields,
      userId,
    }),
    db.insert(applicationStatusHistory).values({
      applicationId,
      status: fields.status,
      statusCategory: fields.statusCategory ?? "applied",
      createdAt: new Date(),
    }),
  ]);

  // Sync ghosted applications once the response is sent. after() keeps the
  // function alive for it on serverless; outside a request (scripts, tests)
  // there is no response to wait for, so run it directly.
  const sync = () => syncGhostedApplications(userId).catch(console.error);
  try {
    after(sync);
  } catch {
    void sync();
  }

  purgeApplicationCaches(userId);
  return [{ insertedId: applicationId }];
}

// Delete a single application with id for current user
export async function deleteApplication(id: string) {
  const userId = await getCurrentUserIdOrThrow();

  if (isMockDb) {
    mockStore.deleteApplication(userId, id);
    purgeApplicationCaches(userId);
    return;
  }

  await db
    .delete(jobApplications)
    .where(and(eq(jobApplications.userId, userId), eq(jobApplications.id, id)));

  purgeApplicationCaches(userId);
}

// Bulk actions take a list of ids so a multi-row change is one request:
// Next.js runs server actions one at a time per client, and each single-row
// action re-renders the page.
const MAX_BULK_IDS = 500;

function assertBulkIds(ids: unknown): asserts ids is string[] {
  if (!Array.isArray(ids) || ids.length > MAX_BULK_IDS || ids.some((id) => typeof id !== "string")) {
    throw new Error("Invalid selection");
  }
}

/** Deletes the caller's applications among `ids`; returns the ids it deleted. */
export async function deleteApplications(ids: string[]): Promise<{ deleted: string[] }> {
  assertBulkIds(ids);
  const userId = await getCurrentUserIdOrThrow();
  if (ids.length === 0) return { deleted: [] };

  let deleted: string[];
  if (isMockDb) {
    deleted = ids.filter((id) => mockStore.deleteApplication(userId, id));
  } else {
    const rows = await db
      .delete(jobApplications)
      .where(and(eq(jobApplications.userId, userId), inArray(jobApplications.id, ids)))
      .returning({ id: jobApplications.id });
    deleted = rows.map((r) => r.id);
  }

  purgeApplicationCaches(userId);
  return { deleted };
}

/**
 * Moves the caller's applications among `ids` to `category`, recording a
 * history row for each one that changed; returns the ids it updated.
 */
export async function updateApplicationsStatus(
  ids: string[],
  category: string,
): Promise<{ updated: string[] }> {
  assertBulkIds(ids);
  if (!isStatusKind(category)) throw new Error("Invalid status");
  const userId = await getCurrentUserIdOrThrow();
  if (ids.length === 0) return { updated: [] };

  const idSet = new Set(ids);
  const current = isMockDb
    ? mockStore.getApplications(userId).filter((a) => idSet.has(a.id))
    : await db
        .select({
          id: jobApplications.id,
          status: jobApplications.status,
          statusCategory: jobApplications.statusCategory,
        })
        .from(jobApplications)
        .where(and(eq(jobApplications.userId, userId), inArray(jobApplications.id, ids)));

  // Keep a custom stage label where it still fits, as single updates do.
  const changes = current
    .map((app) => ({ id: app.id, status: resolveUpdatedStatus(app.status, category).trim() }))
    .filter((c, i) => c.status !== current[i].status || category !== current[i].statusCategory);

  // Saved jobs moved to a sent status were applied to today.
  const sentToday =
    category === "saved"
      ? []
      : current
          .filter((app) => app.statusCategory === "saved")
          .map((app) => app.id);
  const today = new Date();
  const todayFields = {
    date_applied: format(today, "yyyy-MM-dd"),
    month: format(today, "M"),
    year: format(today, "yyyy"),
  };

  if (changes.length > 0) {
    if (isMockDb) {
      for (const c of changes) {
        mockStore.updateApplication(userId, c.id, {
          status: c.status,
          statusCategory: category,
          ...(sentToday.includes(c.id) && todayFields),
        });
      }
    } else {
      const now = new Date();
      const byStatus = new Map<string, string[]>();
      for (const c of changes) byStatus.set(c.status, [...(byStatus.get(c.status) ?? []), c.id]);
      const updates = [...byStatus].map(([status, groupIds]) =>
        db
          .update(jobApplications)
          .set({ status, statusCategory: category })
          .where(and(eq(jobApplications.userId, userId), inArray(jobApplications.id, groupIds))),
      );
      const history = db.insert(applicationStatusHistory).values(
        changes.map((c) => ({
          applicationId: c.id,
          status: c.status,
          statusCategory: category,
          createdAt: now,
        })),
      );
      const dates = sentToday.length
        ? [
            db
              .update(jobApplications)
              .set(todayFields)
              .where(and(eq(jobApplications.userId, userId), inArray(jobApplications.id, sentToday))),
          ]
        : [];
      await db.batch([history, ...updates, ...dates]);
    }
  }

  purgeApplicationCaches(userId);
  return { updated: current.map((a) => a.id) };
}

// Update an application of current user
export async function updateApplication(values: FormValues) {
  if (!values.id) {
    throw new Error("Application ID is required");
  }
  const userId = await getCurrentUserIdOrThrow();
  const applicationId = values.id;

  // Every write below, including the history row, must target the caller's
  // own application; the history table has no user column of its own.
  const currentApp = isMockDb
    ? mockStore.getApplications(userId).filter((a) => a.id === applicationId)
    : await db
        .select({
          role_name: jobApplications.role_name,
          company_name: jobApplications.company_name,
          status: jobApplications.status,
          statusCategory: jobApplications.statusCategory,
          date_applied: jobApplications.date_applied,
        })
        .from(jobApplications)
        .where(
          and(
            eq(jobApplications.userId, userId),
            eq(jobApplications.id, applicationId),
          ),
        )
        .limit(1);
  if (!currentApp[0]) {
    throw new Error("Application not found");
  }

  // Saves rebuilt from a stored row (board moves, bulk status) resend its
  // names as they are, so an older row with an empty one still moves; the
  // names are only required when this save changes them.
  const changed = (next: string | null | undefined, stored: string | null | undefined) =>
    (next ?? "").trim() !== (stored ?? "").trim();
  const fields = extractCleanApplicationFields(values, {
    role: changed(values.role_name, currentApp[0].role_name),
    company: changed(values.company_name, currentApp[0].company_name),
  });
  const date = dateAfterStatusChange({
    previousCategory: currentApp[0].statusCategory,
    nextCategory: fields.statusCategory,
    storedDate: currentApp[0].date_applied,
    nextDate: fields.date_applied,
  });
  if (date !== fields.date_applied) {
    const parsed = new Date(`${date}T12:00:00`);
    fields.date_applied = date;
    fields.month = format(parsed, "M");
    fields.year = format(parsed, "yyyy");
  }

  // Validate resume ownership if resumeId is provided
  if (fields.resumeId) {
    if (isMockDb) {
      const isValid = mockStore
        .getDocuments(userId)
        .some((d) => d.id === fields.resumeId);
      if (!isValid) {
        fields.resumeId = null;
      }
    } else {
      const doc = await db
        .select({ id: documents.id })
        .from(documents)
        .where(
          and(
            eq(documents.id, fields.resumeId),
            eq(documents.userId, userId),
          ),
        )
        .limit(1);
      if (doc.length === 0) {
        fields.resumeId = null;
      }
    }
  }

  if (isMockDb) {
    mockStore.updateApplication(userId, applicationId, fields as any);
    purgeApplicationCaches(userId);
    return;
  }

  const statusChanged =
    currentApp[0].status !== fields.status ||
    currentApp[0].statusCategory !== fields.statusCategory;

  if (statusChanged) {
    const latestHistory = await db
      .select({
        id: applicationStatusHistory.id,
        statusCategory: applicationStatusHistory.statusCategory,
        createdAt: applicationStatusHistory.createdAt,
      })
      .from(applicationStatusHistory)
      .where(eq(applicationStatusHistory.applicationId, applicationId))
      .orderBy(desc(applicationStatusHistory.createdAt))
      .limit(1);

    const now = new Date();
    const isRecentSameCategoryUpdate =
      latestHistory.length > 0 &&
      latestHistory[0].statusCategory === (fields.statusCategory ?? "applied") &&
      latestHistory[0].createdAt &&
      now.getTime() - new Date(latestHistory[0].createdAt).getTime() <
        15 * 60 * 1000;

    const historyOperation = isRecentSameCategoryUpdate
      ? db
          .update(applicationStatusHistory)
          .set({
            status: fields.status,
            createdAt: now,
          })
          .where(eq(applicationStatusHistory.id, latestHistory[0].id))
      : db.insert(applicationStatusHistory).values({
          applicationId,
          status: fields.status,
          statusCategory: fields.statusCategory ?? "applied",
          createdAt: now,
        });

    // Execute both the application update and the status history entry atomically in a single batch
    await db.batch([
      db
        .update(jobApplications)
        .set(fields)
        .where(
          and(
            eq(jobApplications.userId, userId),
            eq(jobApplications.id, applicationId),
          ),
        ),
      historyOperation as any,
    ]);
  } else {
    await db
      .update(jobApplications)
      .set(fields)
      .where(
        and(
          eq(jobApplications.userId, userId),
          eq(jobApplications.id, applicationId),
        ),
      );
  }

  purgeApplicationCaches(userId);
}

// Update only the attached resume of an application without altering other fields
export async function updateApplicationResume(
  applicationId: string,
  resumeId: string | null,
) {
  const userId = await getCurrentUserIdOrThrow();

  if (resumeId) {
    if (isMockDb) {
      const isValid = mockStore
        .getDocuments(userId)
        .some((d) => d.id === resumeId);
      if (!isValid) {
        throw new Error("Invalid or unauthorized resume ID");
      }
    } else {
      const doc = await db
        .select({ id: documents.id })
        .from(documents)
        .where(and(eq(documents.id, resumeId), eq(documents.userId, userId)))
        .limit(1);

      if (doc.length === 0) {
        throw new Error("Invalid or unauthorized resume ID");
      }
    }
  }

  if (isMockDb) {
    mockStore.updateApplication(userId, applicationId, { resumeId });
    purgeApplicationCaches(userId);
    return;
  }

  await db
    .update(jobApplications)
    .set({ resumeId })
    .where(
      and(
        eq(jobApplications.userId, userId),
        eq(jobApplications.id, applicationId),
      ),
    );

  purgeApplicationCaches(userId);
}

// Delete individual status history entry (Timeline correction)
export async function deleteStatusHistoryEntry(historyId: string) {
  const userId = await getCurrentUserIdOrThrow();

  if (isMockDb) {
    const res = mockStore.deleteStatusHistoryEntry(userId, historyId);
    purgeApplicationCaches(userId);
    return res;
  }

  const entry = await db
    .select({
      id: applicationStatusHistory.id,
      applicationId: applicationStatusHistory.applicationId,
    })
    .from(applicationStatusHistory)
    .innerJoin(
      jobApplications,
      eq(jobApplications.id, applicationStatusHistory.applicationId),
    )
    .where(
      and(
        eq(applicationStatusHistory.id, historyId),
        eq(jobApplications.userId, userId),
      ),
    )
    .limit(1);

  if (!entry.length) {
    throw new Error("Timeline entry not found or unauthorized");
  }

  const { applicationId } = entry[0];

  await db
    .delete(applicationStatusHistory)
    .where(eq(applicationStatusHistory.id, historyId));

  const remainingHistory = await db
    .select()
    .from(applicationStatusHistory)
    .where(eq(applicationStatusHistory.applicationId, applicationId))
    .orderBy(desc(applicationStatusHistory.createdAt))
    .limit(1);

  let newStatus = "Applied";
  let newCategory = "applied";

  if (remainingHistory.length > 0) {
    newStatus = remainingHistory[0].status;
    newCategory = remainingHistory[0].statusCategory;
  }

  await db
    .update(jobApplications)
    .set({
      status: newStatus,
      statusCategory: newCategory,
    })
    .where(eq(jobApplications.id, applicationId));

  purgeApplicationCaches(userId);

  return { status: newStatus, statusCategory: newCategory };
}

// Get status history for a single application
export async function getApplicationHistory(applicationId: string) {
  const userId = await getCurrentUserIdOrThrow();

  if (isMockDb) {
    return mockStore.getApplicationHistory(userId, applicationId);
  }

  const app = await db
    .select({
      id: jobApplications.id,
      date_applied: jobApplications.date_applied,
      status: jobApplications.status,
      statusCategory: jobApplications.statusCategory,
      createdAt: jobApplications.createdAt,
    })
    .from(jobApplications)
    .where(
      and(
        eq(jobApplications.userId, userId),
        eq(jobApplications.id, applicationId),
      ),
    )
    .limit(1);

  if (!app.length) {
    return [];
  }

  const history = await db
    .select()
    .from(applicationStatusHistory)
    .where(eq(applicationStatusHistory.applicationId, applicationId))
    .orderBy(desc(applicationStatusHistory.createdAt));

  const sanitizedHistory = [...history];

  const hasAppliedEntry = sanitizedHistory.some(
    (h) =>
      h.statusCategory === "applied" ||
      h.statusCategory === "saved" ||
      (h.status && h.status.toLowerCase().includes("applied")),
  );

  if (!hasAppliedEntry && app[0].date_applied && app[0].statusCategory !== "saved") {
    sanitizedHistory.push({
      id: "",
      applicationId,
      status: "Applied",
      statusCategory: "applied",
      createdAt: app[0].createdAt || new Date(),
    });
  }

  const hasGhostedEntry = sanitizedHistory.some(
    (h) =>
      h.statusCategory === "ghosted" ||
      (h.status && h.status.toLowerCase().includes("ghost")),
  );

  if (!hasGhostedEntry && app[0].statusCategory === "ghosted") {
    // When the sync would have ghosted it: 30 days after the last activity.
    const due = ghostsAt(
      { status: "Applied", statusCategory: "applied", dateApplied: app[0].date_applied },
      sanitizedHistory.map((h) => ({ createdAt: new Date(h.createdAt).getTime() })),
    );
    const ghostedDate =
      due !== null
        ? new Date(Math.min(due, Date.now()))
        : app[0].createdAt || new Date();

    sanitizedHistory.push({
      id: "",
      applicationId,
      status: "Ghosted",
      statusCategory: "ghosted",
      createdAt: ghostedDate,
    });
  }

  sanitizedHistory.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return sanitizedHistory;
}

// Get unique locations and platforms previously used by the user
export async function getDistinctLocationsAndPlatforms() {
  const userId = await getCurrentUserIdOrThrow();

  if (isMockDb) {
    return mockStore.getDistinctLocationsAndPlatforms(userId);
  }

  const apps = await distinctLocationsAndPlatforms(userId);

  const userLocations = Array.from(
    new Set(apps.map((a) => a.location?.trim()).filter((loc): loc is string => Boolean(loc))),
  );
  const userPlatforms = Array.from(
    new Set(apps.map((a) => a.platform?.trim()).filter((plat): plat is string => Boolean(plat))),
  );

  return { userLocations, userPlatforms };
}


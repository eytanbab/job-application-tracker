import {
  createLoader,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { getStatusKind, isStatusKind, type StatusKind } from "@/lib/utils";
import {
  ACTIVE_KINDS,
  reachedInterview,
  responded,
} from "@/lib/analytics/definitions";
import { isIsoDate } from "@/lib/analytics/range";

/** Rows-per-page choices offered by the table footer. */
export const PAGE_SIZES = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 10;

/** Cards loaded per Kanban column, and per "Show more" click. */
export const KANBAN_PAGE_SIZE = 20;

/** Page sizes the server accepts: the table's choices plus Kanban batches. */
const ALLOWED_PAGE_SIZES: readonly number[] = [...PAGE_SIZES, KANBAN_PAGE_SIZE];

export const SORT_FIELDS = [
  "role_name",
  "date_applied",
  "status",
  "location",
  "platform",
  "salary",
] as const;
export type SortField = (typeof SORT_FIELDS)[number];

const MAX_SEARCH_LENGTH = 200;

/** Named groups the `status` param accepts besides single statuses. */
export const STATUS_GROUPS: Record<"active" | "closed", readonly StatusKind[]> = {
  active: ACTIVE_KINDS,
  closed: ["accepted", "rejected", "ghosted"],
};

/** History-based filters used by links from the analytics page. */
export const STAGES = ["responded", "interviewed"] as const;
export type Stage = (typeof STAGES)[number];

/**
 * URL search params of /applications. The page reads them on the server to
 * query one page of rows; the client hook writes them with the same parsers.
 */
export const applicationsSearchParams = {
  q: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
  platform: parseAsString.withDefault(""),
  sort: parseAsStringLiteral(SORT_FIELDS),
  dir: parseAsStringLiteral(["asc", "desc"] as const),
  page: parseAsInteger.withDefault(1),
  size: parseAsInteger,
  view: parseAsStringLiteral(["table", "kanban"] as const).withDefault("table"),
  appId: parseAsString.withDefault(""),
  stage: parseAsStringLiteral(STAGES),
  from: parseAsString,
  to: parseAsString,
};

export const loadApplicationsSearchParams = createLoader(
  applicationsSearchParams,
);

export type ApplicationListQuery = {
  search: string;
  /** Statuses to include; null means all. */
  statuses: StatusKind[] | null;
  /** Ever reached this stage, according to status history. */
  stage: Stage | null;
  /** Inclusive `YYYY-MM-DD` bounds on the date applied. */
  from: string | null;
  to: string | null;
  platform: string | null;
  sort: SortField | null;
  desc: boolean;
  page: number;
  pageSize: number;
};

/**
 * Parses the `status` param: one status, a comma-separated list, or a group
 * name ("active", "closed"). Unknown values are dropped.
 */
export function parseStatuses(raw: string | null | undefined): StatusKind[] | null {
  const kinds = new Set<StatusKind>();
  for (const part of (raw ?? "").toLowerCase().split(",")) {
    const value = part.trim();
    if (value in STATUS_GROUPS) {
      STATUS_GROUPS[value as keyof typeof STATUS_GROUPS].forEach((k) => kinds.add(k));
    } else if (isStatusKind(value)) {
      kinds.add(value);
    }
  }
  return kinds.size ? [...kinds] : null;
}

/** Turns raw (untrusted) params into a bounded query. */
export function normalizeListQuery(input: {
  q?: string | null;
  status?: string | null;
  stage?: string | null;
  from?: string | null;
  to?: string | null;
  platform?: string | null;
  sort?: string | null;
  dir?: string | null;
  page?: number | null;
  size?: number | null;
}): ApplicationListQuery {
  const platform = input.platform?.trim().toLowerCase() ?? "";
  const sort = SORT_FIELDS.find((field) => field === input.sort) ?? null;
  const size = input.size ?? DEFAULT_PAGE_SIZE;
  const page = input.page ?? 1;

  return {
    search: (input.q ?? "").trim().slice(0, MAX_SEARCH_LENGTH),
    statuses: parseStatuses(input.status),
    stage: STAGES.find((stage) => stage === input.stage) ?? null,
    ...dateBounds(input.from, input.to),
    platform: platform && platform !== "all" ? platform : null,
    sort,
    desc: sort ? input.dir === "desc" : true,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: ALLOWED_PAGE_SIZES.includes(size)
      ? size
      : DEFAULT_PAGE_SIZE,
  };
}

function dateBounds(from?: string | null, to?: string | null) {
  const start = isIsoDate(from) ? from : null;
  const end = isIsoDate(to) ? to : null;
  return start && end && start > end ? { from: end, to: start } : { from: start, to: end };
}

/** Escapes LIKE wildcards so a search for "100%" matches literally. */
export function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export type StatusCounts = Record<StatusKind | "all", number>;

export function emptyStatusCounts(): StatusCounts {
  return {
    all: 0,
    applied: 0,
    review: 0,
    interview: 0,
    accepted: 0,
    rejected: 0,
    ghosted: 0,
    other: 0,
  };
}

type QueryableRow = {
  role_name: string;
  company_name: string;
  date_applied: string;
  location: string;
  platform: string;
  status: string;
  statusCategory?: string | null;
  salary?: string | null;
  description?: string | null;
  createdAt?: Date | string | null;
};

function searchableText(row: QueryableRow): string[] {
  return [
    row.company_name,
    row.role_name,
    row.location,
    row.platform,
    row.status,
    row.statusCategory ?? "",
    row.salary ?? "",
    row.description ?? "",
  ];
}

function sortValue(row: QueryableRow, field: SortField): string {
  switch (field) {
    case "role_name":
      return `${row.role_name} ${row.company_name}`.toLowerCase();
    case "status":
      return getStatusKind(row.status, row.statusCategory);
    default:
      return String(row[field] ?? "").toLowerCase();
  }
}

export type ListFilters = Pick<
  ApplicationListQuery,
  "search" | "statuses" | "stage" | "from" | "to" | "platform"
>;

type HistoryRow = { status: string; statusCategory: string };

/** Rows matching the filters (no paging). Stage filters need each row's history. */
export function filterRows<T extends QueryableRow & { id?: string }>(
  rows: T[],
  query: ListFilters,
  historyByApp: ReadonlyMap<string, readonly HistoryRow[]> = new Map(),
): T[] {
  const search = query.search.toLowerCase();
  return rows.filter((row) => {
    if (
      query.statuses &&
      !query.statuses.includes(getStatusKind(row.status, row.statusCategory))
    ) {
      return false;
    }
    if (query.from && row.date_applied < query.from) return false;
    if (query.to && row.date_applied > query.to) return false;
    if (query.stage) {
      const current = { status: row.status, statusCategory: row.statusCategory ?? "" };
      const history = (row.id && historyByApp.get(row.id)) || [];
      const matches =
        query.stage === "interviewed"
          ? reachedInterview(current, history)
          : responded(current, history);
      if (!matches) return false;
    }
    if (
      query.platform &&
      (row.platform ?? "").trim().toLowerCase() !== query.platform
    ) {
      return false;
    }
    return (
      !search ||
      searchableText(row).some((text) => text.toLowerCase().includes(search))
    );
  });
}

/**
 * In-memory version of the SQL list query, used by the mock store so demo
 * mode filters, sorts and pages exactly like the database path.
 */
export function queryRows<T extends QueryableRow & { id?: string }>(
  rows: T[],
  query: ApplicationListQuery,
  historyByApp?: ReadonlyMap<string, readonly HistoryRow[]>,
): { rows: T[]; total: number } {
  const filtered = filterRows(rows, query, historyByApp);
  const sorted = [...filtered].sort((a, b) => {
    if (query.sort) {
      const left = sortValue(a, query.sort);
      const right = sortValue(b, query.sort);
      // Empty values go last in both directions, as in the SQL query
      if (!left !== !right) return left ? -1 : 1;
      const order = left.localeCompare(right);
      if (order !== 0) return query.desc ? -order : order;
    }
    const byDate = b.date_applied.localeCompare(a.date_applied);
    if (byDate !== 0) return byDate;
    return (
      new Date(b.createdAt ?? 0).getTime() -
      new Date(a.createdAt ?? 0).getTime()
    );
  });
  const start = (query.page - 1) * query.pageSize;
  return {
    rows: sorted.slice(start, start + query.pageSize),
    total: filtered.length,
  };
}

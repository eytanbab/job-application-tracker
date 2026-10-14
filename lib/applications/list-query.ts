import {
  createLoader,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";
import { getStatusKind, isStatusKind, type StatusKind } from "@/lib/utils";

/** Rows-per-page choices offered by the table footer. */
export const PAGE_SIZES = [5, 10, 15, 20, 25] as const;
export const DEFAULT_PAGE_SIZE = 10;

/** Cards loaded per Kanban column, and per "Show more" click. */
export const KANBAN_PAGE_SIZE = 20;

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
};

export const loadApplicationsSearchParams = createLoader(
  applicationsSearchParams,
);

export type ApplicationListQuery = {
  search: string;
  status: StatusKind | null;
  platform: string | null;
  sort: SortField | null;
  desc: boolean;
  page: number;
  pageSize: number;
};

/** Turns raw (untrusted) params into a bounded query. */
export function normalizeListQuery(input: {
  q?: string | null;
  status?: string | null;
  platform?: string | null;
  sort?: string | null;
  dir?: string | null;
  page?: number | null;
  size?: number | null;
}): ApplicationListQuery {
  const status = input.status?.trim().toLowerCase() ?? "";
  const platform = input.platform?.trim().toLowerCase() ?? "";
  const sort = SORT_FIELDS.find((field) => field === input.sort) ?? null;
  const size = input.size ?? DEFAULT_PAGE_SIZE;
  const page = input.page ?? 1;

  return {
    search: (input.q ?? "").trim().slice(0, MAX_SEARCH_LENGTH),
    status: status && isStatusKind(status) ? status : null,
    platform: platform && platform !== "all" ? platform : null,
    sort,
    desc: sort ? input.dir === "desc" : true,
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: (PAGE_SIZES as readonly number[]).includes(size)
      ? size
      : DEFAULT_PAGE_SIZE,
  };
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

/** Rows matching the search, status and platform filters (no paging). */
export function filterRows<T extends QueryableRow>(
  rows: T[],
  query: Pick<ApplicationListQuery, "search" | "status" | "platform">,
): T[] {
  const search = query.search.toLowerCase();
  return rows.filter((row) => {
    if (
      query.status &&
      getStatusKind(row.status, row.statusCategory) !== query.status
    ) {
      return false;
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
export function queryRows<T extends QueryableRow>(
  rows: T[],
  query: ApplicationListQuery,
): { rows: T[]; total: number } {
  const filtered = filterRows(rows, query);
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

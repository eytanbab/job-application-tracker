import { normalizeJobLink } from "@/lib/utils";

// Query parameters that only track where a click came from. Others (such as
// Greenhouse's gh_jid) can name the job itself, so they are kept.
const TRACKING_PARAMS = /^(utm_.*|ref|refid|trackingid|trk|src|source|lipi|from|origin)$/i;

/**
 * A job link reduced to what identifies the posting: host without "www.",
 * path without a trailing slash, and only the query parameters that aren't
 * tracking. Empty when the text isn't a web link.
 */
export function jobLinkKey(raw: string | null | undefined): string {
  const normalized = normalizeJobLink(raw);
  if (!normalized) return "";
  const url = new URL(normalized);
  const params = [...url.searchParams.entries()]
    .filter(([name]) => !TRACKING_PARAMS.test(name))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}=${value}`)
    .join("&");
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const path = url.pathname.replace(/\/+$/, "").toLowerCase();
  return `${host}${path}${params ? `?${params}` : ""}`;
}

/** Host and path only, for finding candidate rows in the database. */
export function jobLinkPath(raw: string | null | undefined): string {
  return jobLinkKey(raw).split("?")[0];
}

/** Lowercase letters and digits only, so "Acme, Inc." matches "acme inc". */
export function nameKey(raw: string | null | undefined): string {
  return (raw ?? "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

export type DuplicateReason = "link" | "role";

export interface DuplicateCandidate {
  id: string;
  role_name: string;
  company_name: string;
  link: string;
}

/**
 * Why `candidate` looks like the application being entered: the same job
 * link, or the same role at the same company. Null when it doesn't.
 */
export function duplicateReason(
  entry: { link?: string | null; role_name?: string | null; company_name?: string | null },
  candidate: DuplicateCandidate,
): DuplicateReason | null {
  const link = jobLinkKey(entry.link);
  if (link && link === jobLinkKey(candidate.link)) return "link";
  const company = nameKey(entry.company_name);
  const role = nameKey(entry.role_name);
  if (
    company &&
    role &&
    company === nameKey(candidate.company_name) &&
    role === nameKey(candidate.role_name)
  ) {
    return "role";
  }
  return null;
}

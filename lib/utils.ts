import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format as dateFnsFormat } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const predefinedColors: Record<string, string> = {
  saved: "hsl(var(--status-saved))",
  ghosted: "hsl(var(--status-ghosted))",
  rejected: "hsl(var(--status-rejected))",
  applied: "hsl(var(--status-applied))",
  accepted: "hsl(var(--status-accepted))",
  review: "hsl(var(--status-review))",
  interview: "hsl(var(--status-interview))",
  other: "hsl(var(--status-other))",
};

export type StatusKind =
  | "saved"
  | "ghosted"
  | "rejected"
  | "accepted"
  | "interview"
  | "review"
  | "applied"
  | "other";

export const statusOptions: { value: StatusKind; label: string }[] = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "review", label: "In Review" },
  { value: "interview", label: "Interview" },
  { value: "accepted", label: "Accepted / Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "ghosted", label: "Ghosted" },
  { value: "other", label: "Other" },
];

export const statusLabels = statusOptions.reduce(
  (labels, option) => {
    labels[option.value] = option.label;
    return labels;
  },
  {} as Record<StatusKind, string>,
);

export const isStatusKind = (status: string): status is StatusKind =>
  statusOptions.some((option) => option.value === status);

const STANDARD_STATUS_STRINGS = new Set([
  "saved",
  "applied",
  "review",
  "in review",
  "interview",
  "accepted",
  "offer",
  "accepted / offer",
  "accepted/offer",
  "rejected",
  "rejection",
  "ghosted",
  "other",
]);

export const isStandardStatus = (
  status: string | null | undefined,
): boolean => {
  if (!status) return true;
  const normalized = status.trim().toLowerCase();
  if (!normalized) return true;
  if (STANDARD_STATUS_STRINGS.has(normalized)) return true;
  return Object.values(statusLabels).some(
    (label) => label.toLowerCase() === normalized,
  );
};

export const resolveUpdatedStatus = (
  currentStatus: string | null | undefined,
  newCategory: StatusKind,
  newStatusText?: string,
): string => {
  if (newStatusText !== undefined) {
    const trimmed = newStatusText.trim();
    if (!trimmed) {
      return statusLabels[newCategory] || newCategory;
    }
    return trimmed;
  }

  if (!currentStatus || isStandardStatus(currentStatus)) {
    return statusLabels[newCategory] || newCategory;
  }

  const currentCategory = getStatusKind(currentStatus);
  if (currentCategory !== newCategory) {
    return statusLabels[newCategory] || newCategory;
  }

  return currentStatus.trim();
};

export const getStatusKind = (
  status: string | null | undefined,
  statusCategory?: string | null,
): StatusKind => {
  if (statusCategory && isStatusKind(statusCategory)) {
    return statusCategory;
  }

  const normalizedStatus = (status ?? "").toLowerCase();

  if (normalizedStatus === "saved" || normalizedStatus.includes("wishlist")) {
    return "saved";
  } else if (normalizedStatus.includes("ghost")) {
    return "ghosted";
  } else if (normalizedStatus.includes("reject")) {
    return "rejected";
  } else if (
    normalizedStatus.includes("accept") ||
    normalizedStatus.includes("offer")
  ) {
    return "accepted";
  } else if (normalizedStatus.includes("interview")) {
    return "interview";
  } else if (normalizedStatus.includes("review")) {
    return "review";
  } else if (normalizedStatus.includes("applied")) {
    return "applied";
  } else {
    return "other";
  }
};

export const getStatusDisplay = (
  status: string | null | undefined,
  statusCategory?: string | null,
) => {
  const kind = getStatusKind(status, statusCategory);
  const trimmed = status?.trim();

  if (trimmed) {
    const lower = trimmed.toLowerCase();
    if (
      kind === "ghosted" &&
      (lower === "applied" || lower === "in review" || lower === "review")
    ) {
      return "Ghosted";
    }
    return trimmed;
  }

  return statusLabels[kind];
};

/**
 * Free-text status fragments that mean an interview happened, even when the
 * category says otherwise. The tracker's SQL stage filter builds its pattern
 * from this list, so keep the two in step.
 */
export const INTERVIEW_TEXT_PATTERNS = [
  "interview",
  "phone screen",
  "technical",
  "onsite",
  "screening",
] as const;

export const didReachInterviewStage = (
  status: string | null | undefined,
  statusCategory?: string | null,
): boolean => {
  const kind = getStatusKind(status, statusCategory);
  if (kind === "interview" || kind === "accepted") {
    return true;
  }

  const normalizedStatus = (status ?? "").toLowerCase();
  return INTERVIEW_TEXT_PATTERNS.some((pattern) =>
    normalizedStatus.includes(pattern),
  );
};

export const getColor = (status: string, statusCategory?: string | null) => {
  return predefinedColors[getStatusKind(status, statusCategory)];
};

/** The one colour for a status, shared by badges, bars and charts. */
export const statusColor = (kind: StatusKind): string => predefinedColors[kind];

/**
 * Extracts the root domain (e.g. "myworkdayjobs.com", "workable.com", "greenhouse.io") from a hostname.
 */
export function extractRootDomain(hostname: string): string {
  let domain = hostname.toLowerCase().trim();
  if (domain.startsWith("www.")) {
    domain = domain.substring(4);
  }

  const parts = domain.split(".");
  if (parts.length <= 2) {
    return domain;
  }

  const last = parts[parts.length - 1];
  const secondLast = parts[parts.length - 2];
  const common2ndLevel = new Set([
    "co",
    "com",
    "org",
    "net",
    "gov",
    "edu",
    "ac",
  ]);

  if (
    last.length === 2 &&
    common2ndLevel.has(secondLast) &&
    parts.length >= 3
  ) {
    return parts.slice(-3).join(".");
  }

  return parts.slice(-2).join(".");
}

/**
 * Safely extracts the root domain from a given URL string.
 */
export function extractDomainFromUrl(url: string): string | null {
  try {
    const trimmed = url.trim();
    if (!trimmed) return null;
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const parsed = new URL(withProtocol);
    return extractRootDomain(parsed.hostname);
  } catch {
    return null;
  }
}

/**
 * Infers a clean platform name from a URL or domain.
 */
export function detectPlatformFromUrl(url: string): string {
  const domain = extractDomainFromUrl(url)?.toLowerCase() || "";
  if (domain.includes("linkedin")) return "LinkedIn";
  if (domain.includes("indeed")) return "Indeed";
  if (domain.includes("greenhouse")) return "Greenhouse";
  if (domain.includes("lever")) return "Lever";
  if (domain.includes("ashby")) return "Ashby";
  if (domain.includes("comeet")) return "Comeet";
  if (domain.includes("smartrecruiters")) return "SmartRecruiters";
  if (domain.includes("workable")) return "Workable";
  if (domain.includes("workday")) return "Workday";
  if (domain.includes("glassdoor")) return "Glassdoor";
  if (domain.includes("wellfound") || domain.includes("angellist")) return "Wellfound";
  if (domain.includes("ziprecruiter")) return "ZipRecruiter";
  if (domain.includes("dice")) return "Dice";
  if (domain.includes("monster")) return "Monster";
  return domain ? domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1) : "Company Website";
}

/**
 * Safely formats dates (strings, Date objects, or numbers) without throwing RangeError: Invalid time value.
 */
export function safeFormatDate(
  dateVal: Date | string | number | null | undefined,
  formatStr: string = "yyyy-MM-dd",
): string {
  if (!dateVal) return dateFnsFormat(new Date(), formatStr);
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime())
      ? dateFnsFormat(new Date(), formatStr)
      : dateFnsFormat(dateVal, formatStr);
  }
  if (typeof dateVal === "number") {
    return isNaN(dateVal)
      ? dateFnsFormat(new Date(), formatStr)
      : dateFnsFormat(new Date(dateVal), formatStr);
  }
  if (typeof dateVal === "string") {
    const trimmed = dateVal.trim();
    if (!trimmed) return dateFnsFormat(new Date(), formatStr);
    if (formatStr === "yyyy-MM-dd" && /^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
    const isoDateStr = trimmed.includes("T") ? trimmed : `${trimmed}T12:00:00`;
    const parsed = new Date(isoDateStr);
    if (!isNaN(parsed.getTime())) {
      return dateFnsFormat(parsed, formatStr);
    }
  }
  return dateFnsFormat(new Date(), formatStr);
}

export const locationOptions = ["Remote", "Hybrid", "On-site"];

export const platformOptions = [
  "LinkedIn",
  "Indeed",
  "Glassdoor",
  "Company Website",
  "Other",
];

/**
 * Platforms are stored lowercased as a canonical key. Formats one for display:
 * known platforms get their proper casing ("linkedin" -> "LinkedIn"), other
 * all-lowercase values are title-cased, and mixed-case values are kept as is.
 */
export function formatPlatformLabel(platform: string | null | undefined): string {
  const trimmed = (platform ?? "").trim();
  if (!trimmed) return "";
  const known = platformOptions.find(
    (opt) => opt.toLowerCase() === trimmed.toLowerCase(),
  );
  if (known) return known;
  if (trimmed !== trimmed.toLowerCase()) return trimmed;
  return trimmed.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function mergeWithDefaultOptions(
  userOptions: string[] = [],
  defaultOptions: string[] = [],
): string[] {
  const merged: string[] = [];
  const seen = new Set<string>();

  for (const item of [...userOptions, ...defaultOptions]) {
    const trimmed = item?.trim();
    if (trimmed && !seen.has(trimmed.toLowerCase())) {
      seen.add(trimmed.toLowerCase());
      merged.push(trimmed);
    }
  }

  return merged;
}


/**
 * An ASCII-only version of a file name. Characters matched by `invalid`
 * become "_"; a name left with no letters or digits (e.g. all Hebrew)
 * becomes "document" with the original extension.
 */
export function asciiFileName(
  fileName: string,
  invalid: RegExp = /[^\x20-\x7e]|["\\]/g,
  maxLength = 150,
): string {
  const ext = /\.[A-Za-z0-9]{1,8}$/.exec(fileName)?.[0] ?? "";
  const base = fileName
    .slice(0, fileName.length - ext.length)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(invalid, "_")
    // One "_" for each run of replaced characters, including spaces between them
    .replace(/_[\s_]*_/g, "_")
    .trim();
  const safeBase = /[A-Za-z0-9]/.test(base) ? base : "document";
  return safeBase.slice(0, Math.max(1, maxLength - ext.length)) + ext;
}

/**
 * A Content-Disposition header value that survives any file name. HTTP
 * headers must be ISO-8859-1, so the name goes in twice (RFC 6266): an ASCII
 * fallback in `filename` and the UTF-8 original, percent-encoded, in
 * `filename*`, which browsers prefer.
 */
export function contentDisposition(
  type: "inline" | "attachment",
  fileName: string,
): string {
  const name = fileName.replace(/[\r\n]+/g, " ").trim() || "document.pdf";
  const encoded = encodeURIComponent(name).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return `${type}; filename="${asciiFileName(name)}"; filename*=UTF-8''${encoded}`;
}

/**
 * A job link as an absolute http(s) URL ("company.com/job" gets https://),
 * or null when it is empty or not a web link.
 */
export function normalizeJobLink(raw: string | null | undefined): string | null {
  const text = (raw ?? "").trim();
  if (!text) return null;
  // "scheme:" means a scheme was given; "host:8080" is a port, not a scheme.
  const hasScheme = /^[a-z][a-z0-9+.-]*:(?!\d)/i.test(text);
  const withScheme = hasScheme ? text : `https://${text}`;
  try {
    const url = new URL(withScheme);
    const web = url.protocol === "http:" || url.protocol === "https:";
    return web && !url.username && !url.password ? url.toString() : null;
  } catch {
    return null;
  }
}

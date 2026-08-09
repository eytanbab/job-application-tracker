import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ChartData, Data, RawData } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const navItems = [
  {
    url: "/applications",
    name: "applications",
  },
  {
    url: "/analytics/overview",
    name: "analytics",
  },
  {
    url: "/documents",
    name: "documents",
  },
];

const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

type MonthName = (typeof MONTH_NAMES)[number];

/**
 * Formats application data per year, ensuring all months are present with a count of 0 if no data exists for that month.
 *
 * @param data An array of data entries with year, month (as string), and numOfApplications.
 * @returns An array of objects, each representing a month in a year with the number of applications.
 */
export function formatApplicationsPerYear(
  data: Data[]
): { year: string; month: MonthName; numOfApplications: number }[] {
  // Group data by year
  const groupedByYear = data.reduce(
    (acc, { year, month, numOfApplications }) => {
      acc.set(year, acc.get(year) || new Map());
      // Ensure month is treated as a number for consistent indexing
      const monthNumber = parseInt(month, 10);
      acc.get(year)!.set(monthNumber, numOfApplications);
      return acc;
    },
    new Map<string, Map<number, number>>()
  );

  // Generate the final structured result
  return Array.from(groupedByYear.entries()).flatMap(([year, applications]) =>
    Array.from({ length: 12 }, (_, index) => {
      const monthNumber = index + 1;
      return {
        year,
        month: MONTH_NAMES[index],
        numOfApplications: applications.get(monthNumber) || 0,
      };
    })
  );
}

/**
 * Transforms raw application data for a specific year into a chart-ready format,
 * ensuring all months are present and missing statuses have a count of 0.
 *
 * @param rawData An array of raw data entries with year, month (as string), status, and statusCount.
 * @param selectedYear The year for which to transform the data.
 * @returns An array of objects, each representing a month with counts for different statuses.
 */
export function transformApplicationsData(
  rawData: RawData[],
  selectedYear: string
): ChartData[] {
  // Filter data for the selected year
  const filteredData = rawData.filter((entry) => entry.year === selectedYear);

  // Group data by month
  const groupedData: Partial<Record<MonthName, ChartData>> = {};

  filteredData.forEach(({ month, status, statusCount }) => {
    const monthNumber = parseInt(month, 10);
    const monthName = MONTH_NAMES[monthNumber - 1];

    if (!groupedData[monthName]) {
      groupedData[monthName] = { month: monthName };
    }
    groupedData[monthName]![status] = statusCount;
  });

  // Ensure all months exist and missing statuses are filled with 0
  const uniqueStatuses = [...new Set(rawData.map(({ status }) => status))];

  return MONTH_NAMES.map((month) => {
    const data: ChartData = groupedData[month] || { month };
    uniqueStatuses.forEach((status) => {
      if (!(status in data)) {
        data[status] = 0;
      }
    });
    return data;
  });
}

const predefinedColors: Record<string, string> = {
  ghosted: "hsl(var(--status-ghosted))",
  rejected: "hsl(var(--status-rejected))",
  applied: "hsl(var(--status-applied))",
  accepted: "hsl(var(--status-accepted))",
  review: "hsl(var(--status-review))",
  interview: "hsl(var(--status-interview))",
  other: "hsl(var(--status-other))",
};

export type StatusKind =
  | "ghosted"
  | "rejected"
  | "accepted"
  | "interview"
  | "review"
  | "applied"
  | "other";

export const statusOptions: { value: StatusKind; label: string }[] = [
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
  {} as Record<StatusKind, string>
);

export const isStatusKind = (status: string): status is StatusKind =>
  statusOptions.some((option) => option.value === status);

export const getStatusKind = (
  status: string | null | undefined,
  statusCategory?: string | null
): StatusKind => {
  if (statusCategory && isStatusKind(statusCategory)) {
    return statusCategory;
  }

  const normalizedStatus = (status ?? "").toLowerCase();

  if (normalizedStatus.includes("ghost")) {
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
  statusCategory?: string | null
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

export const didReachInterviewStage = (
  status: string | null | undefined,
  statusCategory?: string | null
): boolean => {
  const kind = getStatusKind(status, statusCategory);
  if (kind === "interview" || kind === "accepted") {
    return true;
  }
  
  const normalizedStatus = (status ?? "").toLowerCase();
  return (
    normalizedStatus.includes("interview") ||
    normalizedStatus.includes("phone screen") ||
    normalizedStatus.includes("technical") ||
    normalizedStatus.includes("onsite") ||
    normalizedStatus.includes("screening")
  );
};

export const getColor = (status: string, statusCategory?: string | null) => {
  return predefinedColors[getStatusKind(status, statusCategory)];
};

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
  const common2ndLevel = new Set(["co", "com", "org", "net", "gov", "edu", "ac"]);

  if (last.length === 2 && common2ndLevel.has(secondLast) && parts.length >= 3) {
    return parts.slice(-3).join(".");
  }

  return parts.slice(-2).join(".");
}


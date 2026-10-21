import type { StatusKind } from "@/lib/utils";

// Timestamps are epoch milliseconds: the dataset goes through unstable_cache,
// which serializes to JSON and would turn Date objects into strings.

/** One application, with only the columns analytics needs. */
export interface AnalyticsApp {
  id: string;
  role: string;
  company: string;
  platform: string;
  status: string;
  statusCategory: string;
  location: string;
  /** `YYYY-MM-DD`, as stored in `date_applied`. */
  dateApplied: string;
  createdAt: number;
  salary: string | null;
  resumeId: string | null;
  resumeTitle: string | null;
}

export interface AnalyticsHistory {
  applicationId: string;
  status: string;
  statusCategory: string;
  createdAt: number;
}

/** Every application and status change for one user, unfiltered. */
export interface AnalyticsDataset {
  apps: AnalyticsApp[];
  history: AnalyticsHistory[];
}

/** Inclusive `YYYY-MM-DD` bounds on `date_applied`; null means open-ended. */
export interface DateRange {
  from: string | null;
  to: string | null;
}

export type WorkMode = "remote" | "hybrid" | "onsite" | "unknown";

/** A proportion with its 95% Wilson interval. */
export interface Rate {
  k: number;
  n: number;
  /** k / n as a fraction (0-1); 0 when n is 0. */
  pct: number;
  low: number;
  high: number;
  /** True when n is large enough to show the rate as a number. */
  enough: boolean;
}

/** Everything analytics needs to know about one application, computed once. */
export interface AppFacts {
  app: AnalyticsApp;
  kind: StatusKind;
  reachedInterview: boolean;
  responded: boolean;
  isOffer: boolean;
  isRejected: boolean;
  isGhosted: boolean;
  isActive: boolean;
  workMode: WorkMode;
  /** Normalized platform key (trimmed, lowercase); "" when not set. */
  platformKey: string;
  /** First history row that counts as a reply from the employer. */
  firstUpdateAt: number | null;
  /** First history row that reached an interview. */
  firstInterviewAt: number | null;
  /** Latest history row, or createdAt when there is none. */
  lastActivityAt: number;
  /** When the ghost sync will mark it ghosted; null when it never will. */
  ghostsAt: number | null;
}

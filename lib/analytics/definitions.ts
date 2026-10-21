import { addDays, parseISO } from "date-fns";
import {
  didReachInterviewStage,
  getStatusKind,
  INTERVIEW_TEXT_PATTERNS,
  type StatusKind,
} from "@/lib/utils";
import type { AnalyticsApp, AnalyticsHistory, WorkMode } from "./types";

// The single place where analytics metrics are defined. The overview page,
// the tracker's drill-down filters and the ghost sync all use these, so a
// number on the page always matches the list it links to.

/** Applied or in-review applications with no activity for this long are ghosted. */
export const GHOST_AFTER_DAYS = 30;

/** Current statuses that are still open. */
export const ACTIVE_KINDS: readonly StatusKind[] = [
  "applied",
  "review",
  "interview",
  "other",
];

/** Statuses that mean the employer replied (an interview also counts). */
export const RESPONSE_KINDS: readonly StatusKind[] = [
  "review",
  "interview",
  "accepted",
  "rejected",
];

/**
 * Case-insensitive Postgres regex (`~*`) matching the same interview wording
 * as didReachInterviewStage. The patterns are plain words, so no escaping.
 */
export const INTERVIEW_TEXT_REGEX = INTERVIEW_TEXT_PATTERNS.join("|");

/** Categories that count as reaching an interview. */
export const INTERVIEW_KINDS: readonly StatusKind[] = ["interview", "accepted"];

type StatusLike = { status: string; statusCategory: string };

function kindOf(row: StatusLike): StatusKind {
  return getStatusKind(row.status, row.statusCategory);
}

function rowReachedInterview(row: StatusLike): boolean {
  return didReachInterviewStage(row.status, row.statusCategory);
}

function rowResponded(row: StatusLike): boolean {
  return rowReachedInterview(row) || RESPONSE_KINDS.includes(kindOf(row));
}

/** The app is, or ever was, at the interview stage. */
export function reachedInterview(
  app: StatusLike,
  history: readonly StatusLike[],
): boolean {
  return rowReachedInterview(app) || history.some(rowReachedInterview);
}

/** The employer replied at some point: review, interview, offer or rejection. */
export function responded(
  app: StatusLike,
  history: readonly StatusLike[],
): boolean {
  return rowResponded(app) || history.some(rowResponded);
}

const REMOTE_WORDS = ["remote", "wfh", "virtual", "anywhere"];
const HYBRID_WORDS = ["hybrid", "flexible"];
const UNKNOWN_VALUES = new Set(["", "n/a", "na", "tbd", "unknown", "-"]);

export function workMode(location: string | null | undefined): WorkMode {
  const loc = (location ?? "").trim().toLowerCase();
  if (UNKNOWN_VALUES.has(loc)) return "unknown";
  if (REMOTE_WORDS.some((w) => loc.includes(w))) return "remote";
  if (HYBRID_WORDS.some((w) => loc.includes(w))) return "hybrid";
  return "onsite";
}

/** Same normalization as the tracker's `?platform=` filter. */
export function platformKey(platform: string | null | undefined): string {
  return (platform ?? "").trim().toLowerCase();
}

/** History sorted oldest first; the input is not modified. */
export function sortHistory<T extends { createdAt: number }>(
  history: readonly T[],
): T[] {
  return [...history].sort((a, b) => a.createdAt - b.createdAt);
}

/** When the first reply was logged, or null. Expects history sorted oldest first. */
export function firstUpdateAt(sortedHistory: readonly AnalyticsHistory[]): number | null {
  return sortedHistory.find(rowResponded)?.createdAt ?? null;
}

/** When the first interview was logged, or null. Expects history sorted oldest first. */
export function firstInterviewAt(
  sortedHistory: readonly AnalyticsHistory[],
): number | null {
  return sortedHistory.find(rowReachedInterview)?.createdAt ?? null;
}

/**
 * When the ghost sync will mark this application ghosted: 30 days after it was
 * applied for or last changed, whichever is later. Null when it is not in a
 * status the sync touches.
 */
export function ghostsAt(
  app: Pick<AnalyticsApp, "status" | "statusCategory" | "dateApplied">,
  history: readonly Pick<AnalyticsHistory, "createdAt">[],
): number | null {
  const kind = kindOf(app);
  if (kind !== "applied" && kind !== "review") return null;
  const applied = parseISO(app.dateApplied);
  if (Number.isNaN(applied.getTime())) return null;
  const lastChange = history.reduce(
    (latest, h) => Math.max(latest, h.createdAt),
    applied.getTime(),
  );
  return addDays(new Date(lastChange), GHOST_AFTER_DAYS).getTime();
}

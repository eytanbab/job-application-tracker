import { getStatusKind } from "@/lib/utils";
import {
  ACTIVE_KINDS,
  firstInterviewAt,
  firstUpdateAt,
  ghostsAt,
  platformKey,
  reachedInterview,
  responded,
  sortHistory,
  workMode,
} from "./definitions";
import type { AnalyticsDataset, AnalyticsHistory, AppFacts } from "./types";

export function groupHistory(
  history: readonly AnalyticsHistory[],
): Map<string, AnalyticsHistory[]> {
  const byApp = new Map<string, AnalyticsHistory[]>();
  for (const h of history) {
    const rows = byApp.get(h.applicationId);
    if (rows) rows.push(h);
    else byApp.set(h.applicationId, [h]);
  }
  for (const [id, rows] of byApp) byApp.set(id, sortHistory(rows));
  return byApp;
}

/**
 * Computes every per-application flag once. All aggregates are built from
 * these facts, so counts in different sections of the page add up.
 */
export function buildFacts(dataset: AnalyticsDataset): AppFacts[] {
  const historyByApp = groupHistory(dataset.history);
  return dataset.apps.map((app) => {
    const history = historyByApp.get(app.id) ?? [];
    const kind = getStatusKind(app.status, app.statusCategory);
    const interviewed = reachedInterview(app, history);
    return {
      app,
      kind,
      reachedInterview: interviewed,
      responded: interviewed || responded(app, history),
      isOffer: kind === "accepted",
      isRejected: kind === "rejected",
      isGhosted: kind === "ghosted",
      isActive: ACTIVE_KINDS.includes(kind),
      workMode: workMode(app.location),
      platformKey: platformKey(app.platform),
      firstUpdateAt: firstUpdateAt(history),
      firstInterviewAt: firstInterviewAt(history),
      lastActivityAt: history.length
        ? history[history.length - 1].createdAt
        : app.createdAt,
      ghostsAt: ghostsAt(app, history),
    };
  });
}

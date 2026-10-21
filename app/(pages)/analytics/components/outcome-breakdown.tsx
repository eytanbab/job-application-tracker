import { formatPct } from "@/lib/analytics/format";
import type { Rate } from "@/lib/analytics/types";
import { cn } from "@/lib/utils";

export interface BreakdownRow {
  key: string;
  label: string;
  total: number;
  interviewed: Rate;
}

/**
 * Rows of "how many reached an interview" for one grouping (work model,
 * resume). Bars share one scale: the share of applications in the period.
 */
export function OutcomeBreakdown({ rows, totalApplications }: { rows: BreakdownRow[]; totalApplications: number }) {
  return (
    <ul className="mt-3 flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.key}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-sm text-foreground">{row.label}</span>
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
              {row.total} {row.total === 1 ? "application" : "applications"}
            </span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-muted overflow-hidden" aria-hidden>
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${totalApplications ? (row.total / totalApplications) * 100 : 0}%` }}
            />
          </div>
          <p className={cn("mt-1 text-xs", row.interviewed.enough ? "text-foreground" : "text-muted-foreground")}>
            {row.interviewed.k} of {row.total} reached an interview
            {row.total > 0 && (row.interviewed.enough ? ` (${formatPct(row.interviewed.pct)})` : " (too few to compare)")}
          </p>
        </li>
      ))}
    </ul>
  );
}

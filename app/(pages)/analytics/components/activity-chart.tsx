"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { format, parseISO } from "date-fns";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Button } from "@/components/ui/button";
import { statusLabel } from "@/lib/analytics/format";
import type { Activity } from "@/lib/analytics/summarize";
import { cn, statusColor, statusOptions } from "@/lib/utils";

const ActivityChartPlot = dynamic(() => import("./activity-chart-plot"), {
  ssr: false,
  loading: () => <div className="h-[240px] rounded-lg bg-muted/40 animate-pulse" />,
});

const VIEWS = ["status", "total"] as const;
const viewParam = parseAsStringLiteral(VIEWS)
  .withDefault("status")
  .withOptions({ history: "replace", scroll: false });

/** Axis label: "Oct 26" for months, "12 Oct" for weeks. */
function shortLabel(start: string, granularity: Activity["granularity"]) {
  return format(parseISO(start), granularity === "month" ? "MMM yy" : "d MMM");
}

/** Table and summary label: "October 2026", or the week's Monday "12 October 2026". */
function longLabel(start: string, granularity: Activity["granularity"]) {
  return format(parseISO(start), granularity === "month" ? "MMMM yyyy" : "d MMMM yyyy");
}

/** Applications per week or month, stacked by current status, with a table twin. */
export function ActivityChart({ activity }: { activity: Activity }) {
  const [view, setView] = useQueryState("view", viewParam);
  const [showTable, setShowTable] = useState(false);
  const { buckets, granularity } = activity;

  // Only statuses that occur, in pipeline order (stack bottom to top)
  const kinds = statusOptions
    .map(({ value }) => value)
    .filter((kind) => buckets.some((b) => b.byKind[kind] > 0));
  const total = buckets.reduce((sum, b) => sum + b.total, 0);
  const busiest = buckets.reduce((best, b) => (b.total > (best?.total ?? -1) ? b : best), buckets[0]);
  const unit = granularity === "week" ? "week" : "month";
  const summary = busiest
    ? `${total} applications over ${buckets.length} ${unit}s; most in ${granularity === "week" ? "the week of " : ""}${longLabel(busiest.start, granularity)} (${busiest.total}).`
    : "No applications in this period.";

  const table = (
    <table className="w-full text-sm">
      <caption className={showTable ? "sr-only" : undefined}>Applications per {unit} by status</caption>
      <thead>
        <tr className="border-b border-border/40 text-left text-muted-foreground">
          <th scope="col" className="py-1.5 pr-3 font-medium">{granularity === "week" ? "Week of" : "Month"}</th>
          <th scope="col" className="py-1.5 pr-3 font-medium text-right">Total</th>
          {kinds.map((kind) => (
            <th key={kind} scope="col" className="py-1.5 pr-3 font-medium text-right">
              {statusLabel(kind)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {buckets.map((b) => (
          <tr key={b.start} className="border-b border-border/20">
            <th scope="row" className="py-1.5 pr-3 text-left font-normal">
              {longLabel(b.start, granularity)}
            </th>
            <td className="py-1.5 pr-3 text-right tabular-nums">{b.total}</td>
            {kinds.map((kind) => (
              <td key={kind} className="py-1.5 pr-3 text-right tabular-nums">{b.byKind[kind]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="rounded-xl border border-border/40 bg-card shadow-2xs p-4 sm:p-5 flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="radiogroup" aria-label="Chart view" className="flex items-center gap-1 rounded-lg border border-border/40 bg-muted/40 p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={view === v}
              onClick={() => setView(v)}
              className={cn(
                "h-8 px-3 rounded-md text-xs font-medium cursor-pointer",
                view === v ? "bg-background text-foreground font-semibold shadow-2xs" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v === "status" ? "By status" : "Total"}
            </button>
          ))}
        </div>
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setShowTable((s) => !s)} aria-expanded={showTable}>
          {showTable ? "Show as chart" : "Show as table"}
        </Button>
      </div>

      {showTable ? (
        <div className="overflow-x-auto">{table}</div>
      ) : (
        <>
          <div role="img" aria-label={summary}>
            <ActivityChartPlot
              buckets={buckets}
              labels={buckets.map((b) => shortLabel(b.start, granularity))}
              view={view}
              kinds={kinds}
            />
          </div>
          {view === "status" && (
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground" aria-label="Legend">
              {kinds.map((kind) => (
                <li key={kind} className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: statusColor(kind) }} aria-hidden />
                  {statusLabel(kind)}
                </li>
              ))}
            </ul>
          )}
          <div className="sr-only">{table}</div>
        </>
      )}
    </div>
  );
}

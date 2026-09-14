"use client";

import { useSearchParams } from "next/navigation";

export default function Tabs() {
  const searchParams = useSearchParams();
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const isFiltered = Boolean(
    (month && month !== "all") || (year && year !== "all"),
  );

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/20">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Analytics & Pipeline Intelligence
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Comprehensive performance metrics, follow-up queue, and channel conversion analysis.
        </p>
      </div>
      {isFiltered && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono font-medium self-start sm:self-auto shrink-0 border border-primary/20">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Filtered View
        </span>
      )}
    </div>
  );
}

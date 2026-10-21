import { Suspense } from "react";
import { PeriodPicker } from "./period-picker";

export function AnalyticsHeader() {
  return (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 pb-3 border-b border-border/20 w-full min-w-0">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          Analytics
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Track your job search progress, interview rates, and platform performance.
        </p>
      </div>
      <Suspense fallback={<div className="h-9 w-80 max-w-full bg-muted/40 rounded-lg animate-pulse" />}>
        <PeriodPicker />
      </Suspense>
    </div>
  );
}

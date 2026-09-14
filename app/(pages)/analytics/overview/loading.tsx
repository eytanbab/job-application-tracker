import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsOverviewLoading({
  hideFilter = false,
}: {
  hideFilter?: boolean;
} = {}) {
  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-12 min-w-0 animate-in fade-in duration-300">
      {/* 1. Timeframe Filter Toolbar Skeleton */}
      {!hideFilter && (
        <div className="h-14 w-full bg-card/40 rounded-xl border border-border/30 animate-pulse" />
      )}

      {/* 2. Executive Pulse Strip Skeleton */}
      <div className="w-full min-w-0 rounded-xl border border-border/40 overflow-hidden shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-border/30 w-full min-w-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="bg-card/70 p-4 sm:p-5 flex flex-col justify-between gap-3 min-w-0"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-8" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-3 w-36" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Action Center Tray Skeleton */}
      <div className="w-full rounded-xl border border-border/40 bg-card/60 shadow-2xs p-4 sm:p-5 flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/20">
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-3 rounded-lg border border-border/30 bg-card/40 space-y-2"
            >
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Stepped Pipeline Conversion Ribbon Skeleton */}
      <div className="w-full rounded-xl border border-border/40 bg-card/60 shadow-2xs p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/20 pb-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="p-3 rounded-lg border border-border/30 bg-card/40 flex flex-col gap-2"
            >
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-12" />
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* 5. Channel & Market Intelligence Tabs Skeleton */}
      <div className="w-full space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/20 pb-2">
          <div className="space-y-1">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-72" />
          </div>
          <Skeleton className="h-8 w-44 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-72 rounded-xl border border-border/30 bg-card/40 p-4 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
          <div className="h-72 rounded-xl border border-border/30 bg-card/40 p-4 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-full w-full rounded-lg" />
          </div>
        </div>
      </div>

      {/* 6. Historical Volume Trends Skeleton */}
      <div className="space-y-3 pt-1">
        <div className="border-b border-border/20 pb-2 space-y-1">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-3 w-80" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
          <div className="min-h-[320px] bg-card/40 rounded-xl border border-border/30 p-5 space-y-4">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-56 w-56 rounded-full mx-auto" />
          </div>
          <div className="min-h-[320px] bg-card/40 rounded-xl border border-border/30 p-5 space-y-4">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-56 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsOverviewLoading({
  hideFilter = false,
}: {
  hideFilter?: boolean;
} = {}) {
  return (
    <div className="flex flex-col gap-5 w-full max-w-7xl mx-auto pb-12 min-w-0 animate-in fade-in duration-300">
      {/* 1. Timeframe Filter Toolbar Skeleton */}
      {!hideFilter && (
        <div className="h-14 w-full bg-card/40 rounded-xl border border-border/30 animate-pulse" />
      )}

      {/* 2. Action Pulse Bar Skeleton */}
      <div className="h-12 w-full rounded-xl border border-border/30 bg-card/40 animate-pulse flex items-center justify-between px-4" />

      {/* 3. Pipeline Health Hero Skeleton */}
      <div className="w-full min-w-0 rounded-2xl border border-border/40 bg-card/60 shadow-2xs p-4 sm:p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-border/20 pb-2">
          <div className="space-y-1">
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-3 w-80" />
          </div>
          <Skeleton className="h-4 w-28" />
        </div>

        {/* 4 Pulse Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full min-w-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-4 rounded-xl border border-border/30 bg-background/50 space-y-3"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
              <Skeleton className="h-7 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>

        {/* Stepped Conversion Flow Skeleton */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full min-w-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl border border-border/30 bg-background/40 space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-7 w-12" />
                <Skeleton className="h-1.5 w-full rounded-full" />
                <Skeleton className="h-2.5 w-32" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="p-3 rounded-lg border border-border/25 bg-background/30 space-y-2"
              >
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-2.5 w-36" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Strategic Intelligence Tabs Skeleton */}
      <div className="w-full space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/20 pb-3">
          <div className="space-y-1">
            <Skeleton className="h-4 w-52" />
            <Skeleton className="h-3 w-72" />
          </div>
          <Skeleton className="h-8 w-64 rounded-lg" />
        </div>

        <div className="h-72 rounded-xl border border-border/30 bg-card/40 p-4 space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-full w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

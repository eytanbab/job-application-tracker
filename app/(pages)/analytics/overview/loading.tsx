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

      {/* 2. 5 KPI Cards Strip Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full min-w-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`p-3.5 sm:p-4 rounded-xl border border-border/30 bg-card/40 space-y-3 ${
              i === 4 ? "col-span-2 sm:col-span-1" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3.5 w-3.5 rounded-full" />
            </div>
            <Skeleton className="h-7 w-12" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        ))}
      </div>

      {/* 3. Application Funnel & Outcomes Skeleton */}
      <div className="w-full min-w-0 rounded-xl border border-border/40 bg-card/60 shadow-2xs p-4 sm:p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-border/20 pb-2">
          <div className="space-y-1">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-3 w-20" />
        </div>

        {/* 4 Stepped Funnel Milestones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full min-w-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl border border-border/30 bg-background/40 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-8" />
              </div>
              <Skeleton className="h-7 w-10" />
              <Skeleton className="h-1.5 w-full rounded-full" />
              <Skeleton className="h-2.5 w-28" />
            </div>
          ))}
        </div>

        {/* 3 Outcomes Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-3 rounded-lg border border-border/25 bg-background/30 space-y-2"
            >
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-5 w-14" />
              <Skeleton className="h-2.5 w-32" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Platforms Table Skeleton */}
      <div className="w-full rounded-xl border border-border/40 bg-card/60 shadow-2xs p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-border/20 pb-2">
          <div className="space-y-1">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-5 w-20 rounded-md" />
        </div>
        <div className="h-48 rounded-lg bg-background/40 border border-border/20 animate-pulse" />
      </div>

      {/* 5. Work Model & Salary Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
        <div className="rounded-xl border border-border/40 bg-card/60 p-4 sm:p-5 space-y-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-56" />
          <div className="space-y-2 pt-2">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-12 w-full rounded-lg" />
          </div>
        </div>
        <div className="rounded-xl border border-border/40 bg-card/60 p-4 sm:p-5 space-y-3">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-56" />
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

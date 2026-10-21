import { Skeleton } from "@/components/ui/skeleton";

function SectionHeading() {
  return (
    <div className="space-y-1.5">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-4 w-72 max-w-full" />
    </div>
  );
}

function PanelSkeleton({ className = "h-40" }: { className?: string }) {
  return <div className={`rounded-xl border border-border/40 bg-card/60 ${className}`} />;
}

/** Same sections and heights as the loaded page, so nothing jumps. */
export default function AnalyticsOverviewLoading() {
  return (
    <div className="flex flex-col gap-8 w-full min-w-0 animate-pulse" aria-busy="true" aria-label="Loading analytics">
      <div className="flex flex-col gap-3">
        <SectionHeading />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <PanelSkeleton key={i} className="h-28" />
          ))}
        </div>
        {/* Insights, then weekly pace */}
        <PanelSkeleton className="h-40" />
        <PanelSkeleton className="h-60" />
      </div>
      <div className="flex flex-col gap-3">
        <SectionHeading />
        <PanelSkeleton className="h-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <PanelSkeleton className="h-56 lg:col-span-2" />
          <PanelSkeleton className="h-56" />
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <SectionHeading />
        <PanelSkeleton className="h-72" />
      </div>
    </div>
  );
}

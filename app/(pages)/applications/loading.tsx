import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export default function ApplicationsLoading() {
  return (
    <div className="w-full space-y-6 opacity-100 transition-opacity duration-300">
      {/* 1. KPI Top Summary Bar Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 space-y-2 border border-border/30">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-16" />
          </Card>
        ))}
      </div>

      {/* 2. Controls Toolbar Skeleton */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-card border border-border/30 rounded-md p-3.5 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 w-full">
          <Skeleton className="h-9 w-full max-w-sm rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-36 rounded-md" />
        </div>
      </div>

      {/* 3. Table View Skeleton */}
      <div className="rounded-md border border-border/40 bg-card overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-border/30 bg-muted/20 flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="divide-y divide-border/30">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-20 rounded-md" />
              <Skeleton className="h-4 w-24 hidden sm:block" />
              <Skeleton className="h-4 w-20 hidden md:block" />
              <div className="flex gap-1">
                <Skeleton className="h-8 w-8 rounded-md" />
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

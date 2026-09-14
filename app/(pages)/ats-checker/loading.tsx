import { Skeleton } from "@/components/ui/skeleton";

export default function AtsCheckerLoading() {
  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>

      {/* Input Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Resume Input Card Skeleton */}
        <div className="p-5 rounded-xl border border-border/40 bg-card/60 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/20 pb-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-48 rounded-lg" />
          </div>
          <div className="space-y-3 pt-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
        </div>

        {/* Right: Job Description Card Skeleton */}
        <div className="p-5 rounded-xl border border-border/40 bg-card/60 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-border/20 pb-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="pt-2">
            <Skeleton className="h-52 w-full rounded-lg" />
          </div>
        </div>
      </div>

      {/* Bottom CTA Button Skeleton */}
      <div className="flex justify-end pt-2">
        <Skeleton className="h-11 w-56 rounded-lg" />
      </div>
    </div>
  );
}

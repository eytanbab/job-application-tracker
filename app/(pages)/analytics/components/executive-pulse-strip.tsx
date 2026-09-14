"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface ExecutivePulseStripProps {
  totalApplications: number;
  activeCount: number;
  activeStages: {
    applied: number;
    review: number;
    interview: number;
  };
  interviewRate: number;
  interviewConversionRate: number;
  averageResponseDays: number | null;
}

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

export function ExecutivePulseStrip({
  activeCount,
  activeStages,
  interviewRate,
  interviewConversionRate,
  averageResponseDays,
}: ExecutivePulseStripProps) {
  return (
    <div className="w-full rounded-xl border border-border/40 bg-card/60 shadow-2xs backdrop-blur-sm overflow-hidden">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/30">
        {/* 1. Active Pipeline */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Active Pipeline
            </span>
            <Link
              href="/applications"
              className="text-[11px] font-medium text-primary hover:underline inline-flex items-center gap-0.5 cursor-pointer"
            >
              View
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-foreground tracking-tight">
              {activeCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeCount > 0
                ? `${activeStages.applied} submitted · ${activeStages.review} in review · ${activeStages.interview} interview`
                : "No active applications"}
            </p>
          </div>
        </div>

        {/* 2. Screening Yield */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Screening Yield
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              Pass Rate
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-foreground tracking-tight">
              {formatPercent(interviewRate)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Applications reaching initial interview
            </p>
          </div>
        </div>

        {/* 3. Interview-to-Offer */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Interview to Offer
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              Final Stage
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-foreground tracking-tight">
              {formatPercent(interviewConversionRate)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Interviewed candidates receiving offers
            </p>
          </div>
        </div>

        {/* 4. Response Velocity */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Response Velocity
            </span>
            <span className="text-[11px] text-muted-foreground font-mono">
              Median
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-foreground tracking-tight">
              {averageResponseDays !== null
                ? `${averageResponseDays} ${averageResponseDays === 1 ? "Day" : "Days"}`
                : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {averageResponseDays !== null
                ? "Average days to first recruiter contact"
                : "Awaiting status milestone data"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

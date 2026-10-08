"use client";

import Link from "next/link";
import { Send, Briefcase, Users, Trophy, Clock, ArrowUpRight } from "lucide-react";

interface KpiSummaryStripProps {
  total: number;
  activeCount: number;
  activeStages: {
    applied: number;
    review: number;
    interview: number;
  };
  interviewCount: number;
  offerCount: number;
  interviewRate: number;
  interviewConversionRate: number;
  averageResponseDays: number | null;
}

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

export function KpiSummaryStrip({
  total,
  activeCount,
  activeStages,
  interviewCount,
  offerCount,
  interviewRate,
  interviewConversionRate,
  averageResponseDays,
}: KpiSummaryStripProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 w-full min-w-0">
      {/* 1. Total Applied */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-border/30 bg-card/60 shadow-2xs backdrop-blur-sm flex flex-col justify-between gap-2 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Total Applied
          </span>
          <Send className="h-3.5 w-3.5 text-muted-foreground/70" />
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-foreground tracking-tight">
            {total}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 truncate">
            {total === 1 ? "Application logged" : "Applications logged"}
          </p>
        </div>
      </div>

      {/* 2. In Progress (Active) */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-border/30 bg-card/60 shadow-2xs backdrop-blur-sm flex flex-col justify-between gap-2 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            In Progress
          </span>
          <Link
            href="/applications"
            className="text-[11px] font-medium text-primary hover:underline inline-flex items-center gap-0.5 cursor-pointer"
            title="View active applications"
          >
            View
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-foreground tracking-tight">
            {activeCount}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 truncate">
            {activeCount > 0
              ? `${activeStages.applied} applied · ${activeStages.review} review · ${activeStages.interview} interview`
              : "No applications in progress"}
          </p>
        </div>
      </div>

      {/* 3. Interview Rate */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-border/30 bg-card/60 shadow-2xl backdrop-blur-sm flex flex-col justify-between gap-2 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Interview Rate
          </span>
          <Users className="h-3.5 w-3.5 text-muted-foreground/70" />
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-foreground tracking-tight">
            {formatPercent(interviewRate)}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 truncate">
            {interviewCount} of {total} led to interviews
          </p>
        </div>
      </div>

      {/* 4. Offers */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-border/30 bg-card/60 shadow-2xs backdrop-blur-sm flex flex-col justify-between gap-2 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Offers
          </span>
          <Trophy className="h-3.5 w-3.5 text-muted-foreground/70" />
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-foreground tracking-tight">
            {offerCount}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 truncate">
            {interviewCount > 0
              ? `${formatPercent(interviewConversionRate)} of interviews converted`
              : "Awaiting interview conversions"}
          </p>
        </div>
      </div>

      {/* 5. Avg. Response Time */}
      <div className="col-span-2 sm:col-span-1 p-3.5 sm:p-4 rounded-xl border border-border/30 bg-card/60 shadow-2xs backdrop-blur-sm flex flex-col justify-between gap-2 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Avg. Response Time
          </span>
          <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-foreground tracking-tight">
            {averageResponseDays !== null
              ? `${averageResponseDays} ${averageResponseDays === 1 ? "day" : "days"}`
              : "—"}
          </div>
          <p className="text-[11px] text-muted-foreground mt-1 truncate">
            {averageResponseDays !== null
              ? "From applied to recruiter response"
              : "Awaiting response timestamps"}
          </p>
        </div>
      </div>
    </div>
  );
}

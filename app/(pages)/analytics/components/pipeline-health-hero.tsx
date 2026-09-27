"use client";

import Link from "next/link";
import {
  Send,
  Users,
  Trophy,
  ArrowUpRight,
  Clock,
  Activity,
  Briefcase,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PipelineHealthHeroProps {
  total: number;
  activeCount: number;
  activeStages: {
    applied: number;
    review: number;
    interview: number;
  };
  interviewCount: number;
  offerCount: number;
  ghostedCount: number;
  rejectedCount: number;
  interviewRate: number;
  interviewConversionRate: number;
  averageResponseDays: number | null;
}

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

export function PipelineHealthHero({
  total,
  activeCount,
  activeStages,
  interviewCount,
  offerCount,
  ghostedCount,
  rejectedCount,
  interviewRate,
  interviewConversionRate,
  averageResponseDays,
}: PipelineHealthHeroProps) {
  if (total === 0) {
    return (
      <div className="w-full rounded-2xl border border-border/40 bg-card/60 shadow-2xs backdrop-blur-sm p-8 text-center flex flex-col items-center justify-center gap-3">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Briefcase className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground">
            No Application Data in This Timeframe
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Log your job submissions to unlock automated stage conversions, recruiter velocity tracking, and pipeline yield intelligence.
          </p>
        </div>
        <Link
          href="/applications/new"
          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-2xs cursor-pointer"
        >
          Add Your First Application
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  const activePct = total > 0 ? (activeCount / total) * 100 : 0;
  const interviewPct = total > 0 ? (interviewCount / total) * 100 : 0;
  const offerPct = total > 0 ? (offerCount / total) * 100 : 0;
  const unansweredRate = total > 0 ? (ghostedCount / total) * 100 : 0;

  const stages = [
    {
      id: "applied",
      label: "1. Total Submitted",
      count: total,
      pct: 100,
      icon: Send,
      color: "bg-primary",
      detail: "All submissions logged",
    },
    {
      id: "active",
      label: "2. Active Pipeline",
      count: activeCount,
      pct: activePct,
      icon: Activity,
      color: "bg-blue-600 dark:bg-blue-500",
      detail: `${activeStages.applied} submitted · ${activeStages.review} in review · ${activeStages.interview} interview`,
    },
    {
      id: "interview",
      label: "3. Interview Stage",
      count: interviewCount,
      pct: interviewPct,
      icon: Users,
      color: "bg-amber-600 dark:bg-amber-500",
      detail: `${interviewCount} reached recruiter or team rounds`,
    },
    {
      id: "offer",
      label: "4. Accepted Offers",
      count: offerCount,
      pct: offerPct,
      icon: Trophy,
      color: "bg-emerald-600 dark:bg-emerald-500",
      detail: `${offerCount} converted to offer`,
    },
  ];

  return (
    <div className="w-full min-w-0 rounded-2xl border border-border/40 bg-card/60 shadow-2xs backdrop-blur-sm p-4 sm:p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/20">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold tracking-tight text-foreground">
              Pipeline Health & Conversion Velocity
            </h2>
            <Badge
              variant="outline"
              className="text-[10px] font-mono border-border/40 text-muted-foreground"
            >
              {total} Total Applications
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            End-to-end progression from submission to offer, calibrated to 2026 search velocity.
          </p>
        </div>

        <Link
          href="/applications"
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer"
        >
          View all in tracker
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* 4 Core Pulse Vital Signs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full min-w-0">
        {/* 1. Total Volume */}
        <div className="p-4 rounded-xl border border-border/30 bg-background/50 flex flex-col justify-between gap-2 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Volume
            </span>
            <Send className="h-4 w-4 text-muted-foreground/70" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-foreground tracking-tight">
              {total}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              Applications logged in timeframe
            </p>
          </div>
        </div>

        {/* 2. Active Pipeline */}
        <div className="p-4 rounded-xl border border-border/30 bg-background/50 flex flex-col justify-between gap-2 min-w-0">
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
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {activeCount > 0
                ? `${activeStages.applied} applied · ${activeStages.review} review · ${activeStages.interview} interview`
                : "No active applications"}
            </p>
          </div>
        </div>

        {/* 3. Screening Yield */}
        <div className="p-4 rounded-xl border border-border/30 bg-background/50 flex flex-col justify-between gap-2 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Screening Yield
            </span>
            <span className="text-[11px] font-mono text-muted-foreground">
              Pass Rate
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-foreground tracking-tight">
              {formatPercent(interviewRate)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {interviewCount} of {total} advanced to screen
            </p>
          </div>
        </div>

        {/* 4. Response Velocity */}
        <div className="p-4 rounded-xl border border-border/30 bg-background/50 flex flex-col justify-between gap-2 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Response Velocity
            </span>
            <Clock className="h-4 w-4 text-muted-foreground/70" />
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-foreground tracking-tight">
              {averageResponseDays !== null
                ? `${averageResponseDays} ${averageResponseDays === 1 ? "Day" : "Days"}`
                : "—"}
            </div>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {averageResponseDays !== null
                ? "Average days to first recruiter response"
                : "Awaiting recruiter status timestamps"}
            </p>
          </div>
        </div>
      </div>

      {/* Stepped Conversion Flow Visualization */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold uppercase tracking-wider">Stage Progression Funnel</span>
          <span className="font-mono text-[11px]">Cumulative Pipeline Flow</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full min-w-0">
          {stages.map((stage) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.id}
                className="p-3.5 rounded-xl border border-border/30 bg-background/40 flex flex-col justify-between gap-2.5 min-w-0"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    {stage.label}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground font-semibold">
                    {stage.pct.toFixed(0)}%
                  </span>
                </div>

                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-foreground tracking-tight">
                    {stage.count}
                  </div>
                  <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden mt-1.5">
                    <div
                      className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(stage.pct, stage.count > 0 ? 5 : 0)}%` }}
                    />
                  </div>
                </div>

                <span className="text-[11px] text-muted-foreground truncate">
                  {stage.detail}
                </span>
              </div>
            );
          })}
        </div>

        {/* Outcome Reality Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs w-full min-w-0">
          <div className="p-3 rounded-lg bg-background/30 border border-border/25 flex flex-col justify-between gap-1 min-w-0">
            <span className="text-muted-foreground font-medium text-[11px] uppercase tracking-wider">
              Interview-to-Offer Conversion
            </span>
            <div className="flex items-baseline justify-between gap-1 flex-wrap">
              <span className="text-lg font-bold font-mono text-foreground">
                {formatPercent(interviewConversionRate)}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {offerCount} of {interviewCount || 0} converted
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/80 mt-0.5">
              Benchmark: 20%–35% typical interview conversion
            </p>
          </div>

          <div className="p-3 rounded-lg bg-background/30 border border-border/25 flex flex-col justify-between gap-1 min-w-0">
            <span className="text-muted-foreground font-medium text-[11px] uppercase tracking-wider">
              Unanswered Silence (&gt;30d)
            </span>
            <div className="flex items-baseline justify-between gap-1 flex-wrap">
              <span className="text-lg font-bold font-mono text-foreground">
                {unansweredRate.toFixed(1)}%
              </span>
              <span className="text-[11px] text-muted-foreground">
                {ghostedCount} unresponsive
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/80 mt-0.5">
              Reflects recruiter silence without official status update
            </p>
          </div>

          <div className="p-3 rounded-lg bg-background/30 border border-border/25 flex flex-col justify-between gap-1 min-w-0">
            <span className="text-muted-foreground font-medium text-[11px] uppercase tracking-wider">
              Official Rejections
            </span>
            <div className="flex items-baseline justify-between gap-1 flex-wrap">
              <span className="text-lg font-bold font-mono text-foreground">
                {rejectedCount}
              </span>
              <span className="text-[11px] text-muted-foreground">
                {total > 0 ? ((rejectedCount / total) * 100).toFixed(1) : 0}% of all submissions
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground/80 mt-0.5">
              Explicit rejections received across resume & interview rounds
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import {
  Send,
  Users,
  Trophy,
  ArrowUpRight,
  Briefcase,
  FileSearch,
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
  rejectedResumeCount?: number;
  rejectedInterviewCount?: number;
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
  rejectedResumeCount = 0,
  rejectedInterviewCount = 0,
  interviewRate,
  interviewConversionRate,
}: PipelineHealthHeroProps) {
  if (total === 0) {
    return (
      <div className="w-full rounded-xl border border-border/40 bg-card/60 shadow-2xs backdrop-blur-sm p-8 text-center flex flex-col items-center justify-center gap-3">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Briefcase className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            No Application Data for This Timeframe
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Log your job submissions to track your application funnel, interview conversion rates, and response times.
          </p>
        </div>
        <Link
          href="/applications/new"
          className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-2xs cursor-pointer"
        >
          Add Your First Application
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  // Calculate funnel counts for sequential milestones
  // Stage 1: Applied (100%)
  // Stage 2: Under Review (applications that advanced past initial submission into review, interview, offer, or were reviewed & rejected)
  const reviewedCount = Math.min(
    total,
    activeStages.review + interviewCount + offerCount + rejectedResumeCount,
  );
  const reviewedPct = total > 0 ? (reviewedCount / total) * 100 : 0;
  const interviewPct = total > 0 ? (interviewCount / total) * 100 : 0;
  const offerPct = total > 0 ? (offerCount / total) * 100 : 0;

  const activePct = total > 0 ? (activeCount / total) * 100 : 0;
  const rejectedPct = total > 0 ? (rejectedCount / total) * 100 : 0;
  const unansweredRate = total > 0 ? (ghostedCount / total) * 100 : 0;

  const funnelStages = [
    {
      id: "applied",
      label: "1. Applied",
      count: total,
      pct: 100,
      icon: Send,
      color: "bg-primary",
      detail: "Total applications submitted",
    },
    {
      id: "review",
      label: "2. Under Review",
      count: reviewedCount,
      pct: reviewedPct,
      icon: FileSearch,
      color: "bg-blue-600 dark:bg-blue-500",
      detail: `${activeStages.review} currently under review`,
    },
    {
      id: "interview",
      label: "3. Interview",
      count: interviewCount,
      pct: interviewPct,
      icon: Users,
      color: "bg-amber-600 dark:bg-amber-500",
      detail: `${interviewCount} reached recruiter or team rounds`,
    },
    {
      id: "offer",
      label: "4. Offer",
      count: offerCount,
      pct: offerPct,
      icon: Trophy,
      color: "bg-emerald-600 dark:bg-emerald-500",
      detail: `${offerCount} converted to offer`,
    },
  ];

  return (
    <div className="w-full min-w-0 rounded-xl border border-border/40 bg-card/60 shadow-2xs backdrop-blur-sm p-4 sm:p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/20">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-semibold tracking-tight text-foreground">
              Application Funnel
            </h2>
            <Badge
              variant="outline"
              className="text-[10px] font-mono border-border/40 text-muted-foreground"
            >
              {total} Total Applications
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            How your applications convert through screening, interviews, and offers.
          </p>
        </div>

        <Link
          href="/applications"
          className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1 self-start sm:self-auto cursor-pointer"
        >
          View in tracker
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Stepped Conversion Flow Visualization */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full min-w-0">
        {funnelStages.map((stage) => {
          const Icon = stage.icon;
          return (
            <div
              key={stage.id}
              className="p-3.5 rounded-xl border border-border/30 bg-background/50 flex flex-col justify-between gap-2.5 min-w-0"
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
                    style={{
                      width: `${Math.max(stage.pct, stage.count > 0 ? 5 : 0)}%`,
                    }}
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

      {/* Step Conversion Rates & Outcomes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs w-full min-w-0">
        {/* 1. Interview to Offer Conversion */}
        <div className="p-3 rounded-lg bg-background/40 border border-border/25 flex flex-col justify-between gap-1.5 min-w-0">
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
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {interviewRate > 0
              ? `${formatPercent(interviewRate)} of total applications reached interview`
              : "No interviews in this timeframe"}
          </p>
        </div>

        {/* 2. Unresponsive / No Response */}
        <div className="p-3 rounded-lg bg-background/40 border border-border/25 flex flex-col justify-between gap-1.5 min-w-0">
          <span className="text-muted-foreground font-medium text-[11px] uppercase tracking-wider">
            No Response (30+ Days)
          </span>
          <div className="flex items-baseline justify-between gap-1 flex-wrap">
            <span className="text-lg font-bold font-mono text-foreground">
              {ghostedCount}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {unansweredRate.toFixed(1)}% of applications
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Applications with no status update after 30+ days
          </p>
        </div>

        {/* 3. Rejections */}
        <div className="p-3 rounded-lg bg-background/40 border border-border/25 flex flex-col justify-between gap-1.5 min-w-0">
          <span className="text-muted-foreground font-medium text-[11px] uppercase tracking-wider">
            Rejections
          </span>
          <div className="flex items-baseline justify-between gap-1 flex-wrap">
            <span className="text-lg font-bold font-mono text-foreground">
              {rejectedCount}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {rejectedPct.toFixed(1)}% of applications
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {rejectedResumeCount > 0 || rejectedInterviewCount > 0
              ? `${rejectedResumeCount} before interview · ${rejectedInterviewCount} after interview`
              : "Explicit rejections received"}
          </p>
        </div>
      </div>
    </div>
  );
}

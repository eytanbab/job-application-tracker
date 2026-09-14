"use client";

import { Send, Search, Users, Trophy } from "lucide-react";

interface PipelineFlowRibbonProps {
  total: number;
  activeCount: number;
  interviewCount: number;
  offerCount: number;
  ghostedCount: number;
  rejectedCount: number;
}

export function PipelineFlowRibbon({
  total,
  activeCount,
  interviewCount,
  offerCount,
  ghostedCount,
  rejectedCount,
}: PipelineFlowRibbonProps) {
  if (total === 0) {
    return (
      <div className="w-full rounded-xl border border-border/40 bg-card/60 shadow-2xs backdrop-blur-sm p-6 text-center text-xs text-muted-foreground">
        No application data recorded for this timeframe. Add applications to initiate pipeline flow tracking.
      </div>
    );
  }

  const stages = [
    {
      id: "applied",
      label: "1. Total Submitted",
      count: total,
      pct: 100,
      icon: Send,
      color: "bg-primary",
      detail: "Initial submissions logged",
    },
    {
      id: "active",
      label: "2. Active Pipeline",
      count: activeCount,
      pct: total > 0 ? (activeCount / total) * 100 : 0,
      icon: Search,
      color: "bg-blue-600 dark:bg-blue-500",
      detail: "Currently under review or in interview stage",
    },
    {
      id: "interview",
      label: "3. Interview Stage",
      count: interviewCount,
      pct: total > 0 ? (interviewCount / total) * 100 : 0,
      icon: Users,
      color: "bg-amber-600 dark:bg-amber-500",
      detail: "Advanced to recruiter or team rounds",
    },
    {
      id: "offer",
      label: "4. Accepted Offers",
      count: offerCount,
      pct: total > 0 ? (offerCount / total) * 100 : 0,
      icon: Trophy,
      color: "bg-emerald-600 dark:bg-emerald-500",
      detail: "Completed conversion cycle",
    },
  ];

  const screeningRate = total > 0 ? (interviewCount / total) * 100 : 0;
  const offerRate = interviewCount > 0 ? (offerCount / interviewCount) * 100 : 0;
  const unansweredRate = total > 0 ? (ghostedCount / total) * 100 : 0;

  return (
    <div className="w-full rounded-xl border border-border/40 bg-card/60 shadow-2xs backdrop-blur-sm p-4 sm:p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1 border-b border-border/20">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-foreground">
            Pipeline Progression & Outcomes
          </h2>
          <p className="text-xs text-muted-foreground">
            Stage conversion rates from initial submission to final offer, with explicit outcome tracking.
          </p>
        </div>
        <span className="text-xs font-mono text-muted-foreground">
          {total} Total Applications
        </span>
      </div>

      {/* Stepped Conversion Flow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stages.map((stage) => {
          const Icon = stage.icon;
          return (
            <div
              key={stage.id}
              className="p-3.5 rounded-lg border border-border/30 bg-background/50 flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  {stage.label}
                </span>
                <span className="text-xs font-mono text-muted-foreground font-medium">
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

              <span className="text-[11px] text-muted-foreground">
                {stage.detail}
              </span>
            </div>
          );
        })}
      </div>

      {/* Outcome Analysis & Conversion Metrics Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 border-t border-border/20 text-xs">
        <div className="p-3 rounded-lg bg-background/40 border border-border/30 flex flex-col justify-between gap-1">
          <span className="text-muted-foreground font-medium">Screening Yield</span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-foreground">{screeningRate.toFixed(1)}%</span>
            <span className="text-[11px] text-muted-foreground">{interviewCount} of {total} reached screen</span>
          </div>
          <p className="text-[10px] text-muted-foreground/80 mt-0.5">
            Benchmark: 3%–8% cold ATS · 15%–25% warm referral
          </p>
        </div>

        <div className="p-3 rounded-lg bg-background/40 border border-border/30 flex flex-col justify-between gap-1">
          <span className="text-muted-foreground font-medium">Interview-to-Offer</span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-foreground">{offerRate.toFixed(1)}%</span>
            <span className="text-[11px] text-muted-foreground">{offerCount} of {interviewCount || 0} converted</span>
          </div>
          <p className="text-[10px] text-muted-foreground/80 mt-0.5">
            Benchmark: 20%–35% typical interview conversion
          </p>
        </div>

        <div className="p-3 rounded-lg bg-background/40 border border-border/30 flex flex-col justify-between gap-1">
          <span className="text-muted-foreground font-medium">Unanswered Rate (&gt;30d)</span>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-bold font-mono text-foreground">{unansweredRate.toFixed(1)}%</span>
            <span className="text-[11px] text-muted-foreground">{ghostedCount} silent · {rejectedCount} rejected</span>
          </div>
          <p className="text-[10px] text-muted-foreground/80 mt-0.5">
            Reflects recruiter silence without official status update
          </p>
        </div>
      </div>
    </div>
  );
}

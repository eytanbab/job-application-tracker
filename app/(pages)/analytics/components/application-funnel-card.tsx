"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Search, Users, Trophy, TrendingDown, Ghost } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ApplicationFunnelCardProps {
  total: number;
  activeCount: number;
  interviewCount: number;
  offerCount: number;
  ghostedCount: number;
  rejectedCount: number;
}

export function ApplicationFunnelCard({
  total,
  activeCount,
  interviewCount,
  offerCount,
  ghostedCount,
  rejectedCount: _rejectedCount,
}: ApplicationFunnelCardProps) {
  if (total === 0) {
    return (
      <Card className="bg-card shadow-2xs border border-border/30 rounded-xl h-full flex flex-col justify-between">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">
            Application Conversion Funnel
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            End-to-end stage progression and conversion efficiency
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8 text-center gap-2 flex-1">
          <p className="text-sm text-muted-foreground max-w-sm">
            No application data available yet. Track job applications to visualize your hiring pipeline funnel.
          </p>
          <Button asChild size="sm" className="mt-2 text-xs font-semibold cursor-pointer">
            <Link href="/applications">+ Add Your First Application</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const stages = [
    {
      id: "applied",
      label: "1. Total Applied",
      count: total,
      pctOfTotal: 100,
      color: "bg-blue-500",
      textColor: "text-blue-600 dark:text-blue-400",
      bgLight: "bg-blue-500/10",
      icon: Send,
      dropOff: null,
    },
    {
      id: "active",
      label: "2. Active Pipeline",
      count: activeCount,
      pctOfTotal: total > 0 ? (activeCount / total) * 100 : 0,
      color: "bg-purple-500",
      textColor: "text-purple-600 dark:text-purple-400",
      bgLight: "bg-purple-500/10",
      icon: Search,
      dropOff: total > activeCount ? `${Math.round(((total - activeCount) / total) * 100)}% closed` : null,
    },
    {
      id: "interview",
      label: "3. Interview Stage",
      count: interviewCount,
      pctOfTotal: total > 0 ? (interviewCount / total) * 100 : 0,
      color: "bg-amber-500",
      textColor: "text-amber-600 dark:text-amber-400",
      bgLight: "bg-amber-500/10",
      icon: Users,
      dropOff: null,
    },
    {
      id: "offer",
      label: "4. Accepted / Offer",
      count: offerCount,
      pctOfTotal: total > 0 ? (offerCount / total) * 100 : 0,
      color: "bg-emerald-500",
      textColor: "text-emerald-600 dark:text-emerald-400",
      bgLight: "bg-emerald-500/10",
      icon: Trophy,
      dropOff: interviewCount > offerCount ? `${Math.round(((interviewCount - offerCount) / Math.max(interviewCount, 1)) * 100)}% drop` : null,
    },
  ];

  return (
    <Card className="bg-card shadow-2xs border border-border/30 rounded-xl h-full flex flex-col justify-between">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-foreground">
              Application Conversion Funnel
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Pipeline progression from initial application to offer & outcomes
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs font-semibold px-2 py-0.5">
            {total} Total Apps
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3.5 pt-1">
        {stages.map((stage) => {
          const Icon = stage.icon;
          const barWidth = Math.max(stage.pctOfTotal, stage.count > 0 ? 4 : 0);

          return (
            <div key={stage.id} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className={`p-1 rounded-md ${stage.bgLight} ${stage.textColor}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-semibold text-foreground">{stage.label}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  {stage.dropOff && (
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 font-medium">
                      <TrendingDown className="h-3 w-3 text-rose-500/70" />
                      {stage.dropOff}
                    </span>
                  )}
                  <span className="font-bold text-foreground min-w-[28px] text-right">
                    {stage.count}
                  </span>
                  <span className="text-[11px] text-muted-foreground min-w-[38px] text-right font-medium">
                    {stage.pctOfTotal.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 w-full bg-muted/60 rounded-full overflow-hidden flex">
                <div
                  className={`h-full ${stage.color} rounded-full transition-all duration-500`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}

        {/* Funnel conversion takeaways */}
        <div className="pt-2 border-t border-border/30 grid grid-cols-3 gap-2 text-xs">
          <div className="p-2 rounded-lg bg-muted/30 border border-border/20">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground block truncate">
              Resume Pass Rate
            </span>
            <span className="text-sm font-bold text-foreground mt-0.5 block">
              {total > 0 ? ((interviewCount / total) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div className="p-2 rounded-lg bg-muted/30 border border-border/20">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground block truncate">
              Interview to Offer
            </span>
            <span className="text-sm font-bold text-foreground mt-0.5 block">
              {interviewCount > 0 ? ((offerCount / interviewCount) * 100).toFixed(1) : 0}%
            </span>
          </div>
          <div className="p-2 rounded-lg bg-muted/30 border border-border/20">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground flex items-center gap-1 truncate">
              <Ghost className="h-3 w-3 text-slate-400" />
              Ghosting Rate
            </span>
            <span className="text-sm font-bold text-foreground mt-0.5 block">
              {total > 0 ? ((ghostedCount / total) * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

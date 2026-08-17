"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Trophy, AlertCircle, CheckCircle2 } from "lucide-react";

interface AtsScoreCardProps {
  score: number;
  grade: "Exceptional" | "Strong" | "Moderate" | "Low";
  executiveSummary: string;
}

export function AtsScoreCard({
  score,
  grade,
  executiveSummary,
}: AtsScoreCardProps) {
  const getGradeBadge = () => {
    switch (grade) {
      case "Exceptional":
        return {
          label: "Exceptional Match",
          className:
            "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
          icon: Trophy,
        };
      case "Strong":
        return {
          label: "Strong Match",
          className:
            "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
          icon: CheckCircle2,
        };
      case "Moderate":
        return {
          label: "Moderate Match",
          className:
            "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
          icon: AlertCircle,
        };
      default:
        return {
          label: "Low Match",
          className:
            "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30",
          icon: AlertCircle,
        };
    }
  };

  const badgeInfo = getGradeBadge();
  const GradeIcon = badgeInfo.icon;

  return (
    <Card className="bg-card shadow-2xs border border-border/30 rounded-xl overflow-hidden">
      <CardHeader className="pb-3 border-b border-border/30 bg-muted/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">
              Overall ATS Compatibility Score
            </CardTitle>
          </div>
          <Badge
            variant="outline"
            className={`gap-1 px-2.5 py-0.5 text-xs font-bold ${badgeInfo.className}`}
          >
            <GradeIcon className="h-3.5 w-3.5" />
            {badgeInfo.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-5 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        {/* Score Metric Container */}
        <div
          role="region"
          aria-label={`Overall compatibility score: ${score} out of 100`}
          className="flex flex-col items-center justify-center p-4 rounded-2xl bg-muted/40 border border-border/40 shrink-0 w-36 text-center"
        >
          <span className="text-5xl font-black tracking-tight text-foreground">
            {score}
          </span>
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
            Out of 100
          </span>
        </div>

        {/* Executive Summary */}
        <div className="flex-1 space-y-2 text-center sm:text-left">
          <h3 className="text-base font-bold text-foreground">
            Executive Fit Evaluation
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {executiveSummary}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

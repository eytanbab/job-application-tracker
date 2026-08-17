"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

interface FormattingWarning {
  severity: "warning" | "caution" | "good";
  title: string;
  description: string;
}

interface AtsFormattingChecklistProps {
  warnings: FormattingWarning[];
}

export function AtsFormattingChecklist({
  warnings,
}: AtsFormattingChecklistProps) {
  const getSeverityBadge = (severity: FormattingWarning["severity"]) => {
    switch (severity) {
      case "good":
        return {
          icon: CheckCircle2,
          className:
            "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
          label: "Passed",
        };
      case "caution":
        return {
          icon: AlertTriangle,
          className:
            "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
          label: "Caution",
        };
      default:
        return {
          icon: AlertCircle,
          className:
            "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30",
          label: "Warning",
        };
    }
  };

  return (
    <Card className="bg-card shadow-2xs border border-border/30 rounded-xl">
      <CardHeader className="pb-3 border-b border-border/30">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">
            ATS Parseability & Formatting Checks
          </CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground mt-0.5">
          Readability verification across major ATS scanners (Workday, Greenhouse, Lever)
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {warnings.map((item, idx) => {
            const badge = getSeverityBadge(item.severity);
            const Icon = badge.icon;

            return (
              <div
                key={`warning-${idx}`}
                className="p-3.5 rounded-xl bg-muted/30 border border-border/30 flex flex-col justify-between gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-xs text-foreground">
                    {item.title}
                  </span>
                  <Badge
                    variant="outline"
                    className={`shrink-0 gap-1 text-[10px] font-semibold px-2 py-0.5 ${badge.className}`}
                  >
                    <Icon className="h-3 w-3" />
                    {badge.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

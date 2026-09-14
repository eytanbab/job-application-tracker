"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, ArrowUpRight } from "lucide-react";
import type { SalaryInsightsData } from "../insights/actions";

interface SalaryInsightsCardProps {
  salary: SalaryInsightsData;
}

const formatCurrency = (val: number | null) => {
  if (val === null || isNaN(val)) return "N/A";
  if (val >= 1000) {
    return `$${Math.round(val / 1000)}k`;
  }
  return `$${val.toLocaleString()}`;
};

export function SalaryInsightsCard({ salary }: SalaryInsightsCardProps) {
  if (salary.statedCount === 0) {
    return (
      <Card className="bg-card shadow-2xs border border-border/30 rounded-xl h-full flex flex-col justify-between">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">
            Compensation & Target Salary
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Stated compensation ranges and target salary benchmarks
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6 text-center text-xs text-muted-foreground">
          No salary numbers recorded on applications yet. Add salary ranges when tracking jobs to unlock compensation benchmarks.
        </CardContent>
      </Card>
    );
  }

  const coveragePct =
    salary.totalCount > 0
      ? Math.round((salary.statedCount / salary.totalCount) * 100)
      : 0;

  return (
    <Card className="bg-card shadow-2xs border border-border/30 rounded-xl h-full flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold">
              Compensation & Salary
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Target compensation benchmarks and stated salary coverage
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[10px] font-semibold px-2 py-0.5">
            {salary.statedCount} of {salary.totalCount} stated ({coveragePct}%)
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        {/* Metric stats row */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-3 rounded-lg bg-background border border-border/40">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Average Target
            </span>
            <span className="text-xl font-extrabold text-foreground mt-1 block">
              {formatCurrency(salary.avgSalary)}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-background border border-border/40">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground block">
              Stated Range
            </span>
            <span className="text-xl font-extrabold text-foreground mt-1 block">
              {formatCurrency(salary.minSalary)} – {formatCurrency(salary.maxSalary)}
            </span>
          </div>
        </div>

        {/* Top compensation callout */}
        {salary.topSalaryFormatted && (
          <div className="p-2.5 rounded-lg bg-muted/40 border border-border/30 flex items-center justify-between text-xs">
            <div className="flex flex-col gap-0.5 min-w-0 pr-2">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Highest Stated Compensation
              </span>
              <span className="font-semibold text-foreground truncate">
                {salary.topRole || "Position"}{" "}
                {salary.topCompany ? `· ${salary.topCompany}` : ""}
              </span>
            </div>
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-bold shrink-0 text-xs gap-0.5"
            >
              {salary.topSalaryFormatted}
              <ArrowUpRight className="h-3 w-3" />
            </Badge>
          </div>
        )}

        {coveragePct < 40 && salary.totalCount > 3 && (
          <p className="text-[10px] text-muted-foreground/80 italic text-center pt-0.5">
            Early benchmark ({coveragePct}% coverage). Add salary to more applications for higher accuracy.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

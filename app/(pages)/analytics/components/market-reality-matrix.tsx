"use client";

import { Building, Compass, DollarSign, Laptop } from "lucide-react";
import type { WorkModeData, SalaryInsightsData } from "../insights/actions";

interface MarketRealityMatrixProps {
  modes: WorkModeData[];
  salary: SalaryInsightsData;
}

const formatCurrency = (val: number | null) => {
  if (val === null || isNaN(val)) return "—";
  if (val >= 1000) {
    return `$${Math.round(val / 1000)}k`;
  }
  return `$${val.toLocaleString()}`;
};

export function MarketRealityMatrix({
  modes,
  salary,
}: MarketRealityMatrixProps) {
  const getIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "remote":
        return Laptop;
      case "hybrid":
        return Compass;
      default:
        return Building;
    }
  };

  const coveragePct =
    salary.totalCount > 0
      ? Math.round((salary.statedCount / salary.totalCount) * 100)
      : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
      {/* 1. Workplace Setup Yield */}
      <div className="rounded-xl border border-border/40 bg-card/60 shadow-2xs backdrop-blur-sm p-4 sm:p-5 flex flex-col justify-between gap-3">
        <div className="border-b border-border/20 pb-2">
          <h3 className="text-sm font-bold tracking-tight text-foreground">
            Workplace Setup & Yield
          </h3>
          <p className="text-xs text-muted-foreground">
            Distribution and interview conversion across Remote, Hybrid, and On-Site roles.
          </p>
        </div>

        {modes.length === 0 || modes.every((m) => m.total === 0) ? (
          <p className="text-xs text-muted-foreground py-6 text-center">
            No workplace location data recorded for this timeframe.
          </p>
        ) : (
          <div className="space-y-2.5">
            {modes.map((mode) => {
              const Icon = getIcon(mode.name);
              return (
                <div
                  key={mode.name}
                  className="p-3 rounded-lg border border-border/30 bg-background/50 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="p-1.5 rounded-md bg-muted/60 text-muted-foreground shrink-0">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground truncate">{mode.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {mode.total} {mode.total === 1 ? "application" : "applications"} ({mode.sharePct.toFixed(0)}%)
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-bold text-foreground">
                      {mode.yieldRate.toFixed(1)}% yield
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {mode.interviews} interviewed
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Compensation Data */}
      <div className="rounded-xl border border-border/40 bg-card/60 shadow-2xs backdrop-blur-sm p-4 sm:p-5 flex flex-col justify-between gap-3">
        <div className="border-b border-border/20 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h3 className="text-sm font-bold tracking-tight text-foreground">
              Compensation Data
            </h3>
            <p className="text-xs text-muted-foreground">
              Stated compensation benchmarks and pipeline salary coverage.
            </p>
          </div>
          {salary.statedCount > 0 && (
            <span className="text-[11px] font-mono text-muted-foreground self-start sm:self-auto">
              {salary.statedCount}/{salary.totalCount} stated ({coveragePct}%)
            </span>
          )}
        </div>

        {salary.statedCount === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">
            No compensation numbers recorded on applications for this timeframe.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
              <div className="p-3 sm:p-3.5 rounded-lg border border-border/30 bg-background/50">
                <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  Average Target
                </span>
                <span className="text-lg sm:text-2xl font-bold font-mono text-foreground mt-1 block tabular-nums truncate">
                  {formatCurrency(salary.avgSalary)}
                </span>
              </div>

              <div className="p-3 sm:p-3.5 rounded-lg border border-border/30 bg-background/50">
                <span className="text-[11px] font-medium text-muted-foreground block">
                  Stated Range
                </span>
                <span className="text-lg sm:text-2xl font-bold font-mono text-foreground mt-1 block tabular-nums truncate">
                  {formatCurrency(salary.minSalary)} – {formatCurrency(salary.maxSalary)}
                </span>
              </div>
            </div>

            {salary.topSalaryFormatted && (
              <div className="p-3 rounded-lg border border-border/30 bg-background/40 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] text-muted-foreground">Highest Stated Compensation</div>
                  <div className="font-semibold text-foreground truncate max-w-full sm:max-w-[240px]">
                    {salary.topRole || "Position"} {salary.topCompany ? `· ${salary.topCompany}` : ""}
                  </div>
                </div>
                <span className="font-mono font-bold text-foreground text-sm self-start sm:self-auto">
                  {salary.topSalaryFormatted}
                </span>
              </div>
            )}

            {coveragePct < 40 && salary.totalCount > 3 && (
              <p className="text-[10px] text-muted-foreground/80 italic text-center pt-0.5">
                Preliminary benchmark based on {coveragePct}% stated salary coverage.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

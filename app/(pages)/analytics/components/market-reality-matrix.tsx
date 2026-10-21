"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building, Compass, DollarSign, Laptop, HelpCircle, ArrowUpRight } from "lucide-react";
import { formatSalary, type SalarySummary } from "@/lib/analytics/salary";
import type { WorkModeSummary } from "@/lib/analytics/summarize";
import type { WorkMode } from "@/lib/analytics/types";

interface MarketRealityMatrixProps {
  modes: WorkModeSummary[];
  salary: SalarySummary;
}

const MODE_LABELS: Record<WorkMode, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
  unknown: "Location not set",
};

const MODE_ICONS: Record<WorkMode, typeof Laptop> = {
  remote: Laptop,
  hybrid: Compass,
  onsite: Building,
  unknown: HelpCircle,
};

export function MarketRealityMatrix({
  modes,
  salary,
}: MarketRealityMatrixProps) {
  const coveragePct =
    salary.totalCount > 0
      ? Math.round((salary.statedCount / salary.totalCount) * 100)
      : 0;
  const leftOut = salary.excludedCount + salary.otherCurrencyCount;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
      {/* 1. Work Model Distribution */}
      <div className="rounded-xl border border-border/40 bg-card/60 shadow-2xs backdrop-blur-sm p-4 sm:p-5 flex flex-col justify-between gap-3">
        <div className="border-b border-border/20 pb-2">
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Work Model Breakdown
          </h3>
          <p className="text-xs text-muted-foreground">
            How many applications reached an interview, by Remote, Hybrid and On-site.
          </p>
        </div>

        {modes.every((m) => m.total === 0) ? (
          <p className="text-xs text-muted-foreground py-6 text-center">
            No work model data recorded for this timeframe.
          </p>
        ) : (
          <div className="space-y-2.5">
            {modes.map((mode) => {
              const Icon = MODE_ICONS[mode.mode];
              return (
                <div
                  key={mode.mode}
                  className="p-3 rounded-lg border border-border/30 bg-background/50 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="p-1.5 rounded-md bg-muted/60 text-muted-foreground shrink-0">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground">{MODE_LABELS[mode.mode]}</div>
                      <div className="text-xs text-muted-foreground">
                        {mode.total} {mode.total === 1 ? "application" : "applications"} ({Math.round(mode.share * 100)}%)
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-semibold text-foreground">
                      {mode.interviewed.k} of {mode.total} reached interview
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {mode.total === 0
                        ? "No applications"
                        : mode.interviewed.enough
                          ? `${Math.round(mode.interviewed.pct * 100)}% interview rate`
                          : "Too few to compare (early)"}
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
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              Salary & Compensation
            </h3>
            <p className="text-xs text-muted-foreground">
              Base pay stated on your applications, converted to a yearly figure.
            </p>
          </div>
          {salary.statedCount > 0 && (
            <span className="text-xs text-muted-foreground self-start sm:self-auto">
              {salary.statedCount} of {salary.totalCount} stated ({coveragePct}%)
            </span>
          )}
        </div>

        {salary.statedCount === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">
            {salary.withTextCount > 0
              ? "Salary text on these applications could not be read as a yearly amount."
              : "No salary figures recorded on applications for this timeframe."}
          </p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs">
              <div className="p-3 sm:p-3.5 rounded-lg border border-border/30 bg-background/50">
                <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                  Median stated salary
                </span>
                <span className="text-lg sm:text-2xl font-bold font-mono text-foreground mt-1 block tabular-nums truncate">
                  {formatSalary(salary.median, salary.currency)}
                </span>
              </div>

              <div className="p-3 sm:p-3.5 rounded-lg border border-border/30 bg-background/50">
                <span className="text-xs font-medium text-muted-foreground block">
                  Middle half of salaries
                </span>
                <span className="text-lg sm:text-2xl font-bold font-mono text-foreground mt-1 block tabular-nums truncate">
                  {formatSalary(salary.p25, salary.currency)} - {formatSalary(salary.p75, salary.currency)}
                </span>
              </div>
            </div>

            {salary.highest && (
              <div className="p-3 rounded-lg border border-border/30 bg-background/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-muted-foreground">Highest stated salary</div>
                  <div className="font-semibold text-foreground truncate max-w-full sm:max-w-[240px]">
                    {salary.highest.role} · {salary.highest.company}
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                  <span className="font-mono font-bold text-foreground text-sm">
                    {formatSalary(salary.highest.annualMid, salary.currency)}
                  </span>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    <Link
                      href={`/applications?q=${encodeURIComponent(salary.highest.company)}`}
                      title="View in tracker"
                      aria-label={`View ${salary.highest.company} applications in tracker`}
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {leftOut > 0 && (
              <p className="text-xs text-muted-foreground text-center pt-0.5">
                Left out: {salary.otherCurrencyCount > 0 && `${salary.otherCurrencyCount} in another currency`}
                {salary.otherCurrencyCount > 0 && salary.excludedCount > 0 && ", "}
                {salary.excludedCount > 0 && `${salary.excludedCount} that could not be read`}.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

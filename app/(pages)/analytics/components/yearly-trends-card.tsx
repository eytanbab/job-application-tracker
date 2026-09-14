"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import dynamicImport from "next/dynamic";
import { cn } from "@/lib/utils";
import { BarChart3, Layers } from "lucide-react";

const StatusesPerYearBarChart = dynamicImport(
  () =>
    import("./statuses-per-year-bar-chart").then(
      (m) => m.StatusesPerYearBarChart,
    ),
  {
    loading: () => (
      <div className="h-64 bg-card rounded-xl border border-border/30 animate-pulse" />
    ),
  },
);

const TotalApplicationsPerYearBarChart = dynamicImport(
  () =>
    import("./total-applications-per-year-bar-chart").then(
      (m) => m.TotalApplicationsPerYearBarChart,
    ),
  {
    loading: () => (
      <div className="h-64 bg-card rounded-xl border border-border/30 animate-pulse" />
    ),
  },
);

interface YearlyTrendsCardProps {
  years: string[];
  statusesPerYear: any[];
  applicationsPerYear: any[];
  globalYear?: string;
}

export function YearlyTrendsCard({
  years,
  statusesPerYear,
  applicationsPerYear,
  globalYear,
}: YearlyTrendsCardProps) {
  const [activeTab, setActiveTab] = useState<"status" | "volume">("volume");
  const currentYear = new Date().getFullYear().toString();
  const effectiveGlobalYear =
    globalYear && globalYear !== "all" ? globalYear : undefined;
  const [internalYear, setInternalYear] = useState<string | null>(null);
  const selectedYear =
    effectiveGlobalYear || internalYear || years[0] || currentYear;

  const statusTabRef = useRef<HTMLButtonElement>(null);
  const volumeTabRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      if (activeTab === "status") {
        setActiveTab("volume");
        volumeTabRef.current?.focus();
      } else {
        setActiveTab("status");
        statusTabRef.current?.focus();
      }
    }
  };

  return (
    <Card className="w-full min-w-0 bg-card shadow-2xs border border-border/30 rounded-xl overflow-hidden flex flex-col justify-between p-0">
      <CardHeader className="w-full p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border/30">
        <div>
          <CardTitle className="text-base font-bold text-foreground">
            Yearly Application Trends
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Interactive breakdown of volume and status progression over time
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          {!effectiveGlobalYear && years.length > 1 && (
            <Select value={selectedYear} onValueChange={setInternalYear}>
              <SelectTrigger
                className="w-full sm:w-28 h-8 sm:h-7 text-xs"
                aria-label="Select year for trends chart"
              >
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {years.map((y) => (
                    <SelectItem key={y} value={y} className="text-xs">
                      {y}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}

          {/* Tab Switcher */}
          <div
            role="tablist"
            aria-label="Yearly trends view options"
            onKeyDown={handleKeyDown}
            className="grid grid-cols-2 sm:inline-flex items-center rounded-md bg-muted/60 p-1 gap-1 border border-border/20 w-full sm:w-auto"
          >
            <button
              ref={statusTabRef}
              type="button"
              role="tab"
              aria-selected={activeTab === "status"}
              aria-controls="yearly-trends-tabpanel"
              tabIndex={activeTab === "status" ? 0 : -1}
              onClick={() => setActiveTab("status")}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 text-center",
                activeTab === "status"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Layers className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Status Breakdown</span>
            </button>

            <button
              ref={volumeTabRef}
              type="button"
              role="tab"
              aria-selected={activeTab === "volume"}
              aria-controls="yearly-trends-tabpanel"
              tabIndex={activeTab === "volume" ? 0 : -1}
              onClick={() => setActiveTab("volume")}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 text-center",
                activeTab === "volume"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <BarChart3 className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Total Volume</span>
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent
        id="yearly-trends-tabpanel"
        role="tabpanel"
        className="p-3 sm:p-4 pt-4 sm:pt-6 flex-1 min-w-0 w-full overflow-hidden"
      >
        {activeTab === "status" ? (
          <StatusesPerYearBarChart
            years={years}
            rawData={statusesPerYear}
            globalYear={selectedYear}
            hideCardWrapper
          />
        ) : (
          <TotalApplicationsPerYearBarChart
            years={years}
            data={applicationsPerYear}
            globalYear={selectedYear}
            hideCardWrapper
          />
        )}
      </CardContent>
    </Card>
  );
}

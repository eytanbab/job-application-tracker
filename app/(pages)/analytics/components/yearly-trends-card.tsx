"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dynamicImport from "next/dynamic";

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
  statusesPerYear?: any[];
  applicationsPerYear: any[];
  globalYear?: string;
}

export function YearlyTrendsCard({
  years,
  applicationsPerYear,
  globalYear,
}: YearlyTrendsCardProps) {
  return (
    <Card className="w-full min-w-0 bg-card shadow-2xs border border-border/30 rounded-xl overflow-hidden flex flex-col justify-between p-0">
      <CardHeader className="w-full p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-border/30">
        <div>
          <CardTitle className="text-sm sm:text-base font-semibold tracking-tight text-foreground">
            Application Activity
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monthly application submission volume over time.
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 flex-1 min-w-0">
        <TotalApplicationsPerYearBarChart
          years={years}
          data={applicationsPerYear}
          globalYear={globalYear}
          hideCardWrapper
        />
      </CardContent>
    </Card>
  );
}

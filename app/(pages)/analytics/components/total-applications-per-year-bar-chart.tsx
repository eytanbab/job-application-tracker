"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";

const BarChart = dynamic(() => import("recharts").then((m) => m.BarChart), {
  ssr: false,
});
const Bar = dynamic(() => import("recharts").then((m) => m.Bar), {
  ssr: false,
});
const CartesianGrid = dynamic(
  () => import("recharts").then((m) => m.CartesianGrid),
  { ssr: false },
);
const XAxis = dynamic(() => import("recharts").then((m) => m.XAxis), {
  ssr: false,
});
const YAxis = dynamic(() => import("recharts").then((m) => m.YAxis), {
  ssr: false,
});

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { transformApplicationsData, cn } from "@/lib/utils";

const statusCategories = [
  { key: "Accepted / Offer", label: "Offer", color: "#10b981" },
  { key: "Interview", label: "Interview", color: "#f59e0b" },
  { key: "In Review", label: "In Review", color: "#3b82f6" },
  { key: "Applied", label: "Applied", color: "#64748b" },
  { key: "Rejected", label: "Rejected", color: "#f43f5e" },
  { key: "Ghosted", label: "Ghosted", color: "#94a3b8" },
] as const;

const chartConfig: ChartConfig = {
  numOfApplications: {
    label: "Applications",
    color: "hsl(var(--primary))",
  },
  "Accepted / Offer": {
    label: "Offer",
    color: "#10b981",
  },
  Interview: {
    label: "Interview",
    color: "#f59e0b",
  },
  "In Review": {
    label: "In Review",
    color: "#3b82f6",
  },
  Applied: {
    label: "Applied",
    color: "#64748b",
  },
  Rejected: {
    label: "Rejected",
    color: "#f43f5e",
  },
  Ghosted: {
    label: "Ghosted",
    color: "#94a3b8",
  },
};

type Data = {
  year: string;
  month: string;
  numOfApplications: number;
};

type RawStatusData = {
  year: string;
  month: string;
  status: string;
  statusCount: number;
};

type Props = {
  years: string[] | [];
  data: Data[];
  statusesPerYear?: RawStatusData[];
  globalYear?: string;
  hideCardWrapper?: boolean;
};

export function TotalApplicationsPerYearBarChart({
  years,
  data,
  statusesPerYear = [],
  globalYear,
  hideCardWrapper,
}: Props) {
  const [userSelectedYear, setUserSelectedYear] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"status" | "total">("status");
  const currentYear = new Date().getFullYear().toString();

  const effectiveGlobalYear =
    globalYear && globalYear !== "all" ? globalYear : undefined;
  const selectedYear =
    userSelectedYear || effectiveGlobalYear || years[0] || currentYear;

  const hasStatusData = statusesPerYear && statusesPerYear.length > 0;

  // Status breakdown data for the selected year
  const statusChartData = useMemo(() => {
    if (!hasStatusData) return [];
    return transformApplicationsData(statusesPerYear, selectedYear);
  }, [hasStatusData, statusesPerYear, selectedYear]);

  // Total count data for the selected year
  const totalChartData = useMemo(() => {
    return data.filter((application) => application.year === selectedYear);
  }, [data, selectedYear]);

  const activeData =
    viewMode === "status" && hasStatusData ? statusChartData : totalChartData;

  const content = (
    <div className="w-full min-w-0 overflow-hidden space-y-3">
      {/* Controls toolbar: View mode toggle & Multi-year selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
        <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/30 w-fit">
          <button
            type="button"
            onClick={() => setViewMode("status")}
            disabled={!hasStatusData}
            className={cn(
              "px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer",
              viewMode === "status" && hasStatusData
                ? "bg-background text-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground",
              !hasStatusData && "opacity-50 cursor-not-allowed",
            )}
          >
            By Status
          </button>
          <button
            type="button"
            onClick={() => setViewMode("total")}
            className={cn(
              "px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer",
              viewMode === "total" || !hasStatusData
                ? "bg-background text-foreground font-semibold shadow-2xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Total Volume
          </button>
        </div>

        {years && years.length > 1 && (
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] text-muted-foreground">Year:</span>
            <Select value={selectedYear} onValueChange={setUserSelectedYear}>
              <SelectTrigger className="w-28 h-7 text-xs font-mono font-semibold bg-background">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {years.map((y) => (
                    <SelectItem key={y} value={y} className="text-xs font-mono">
                      {y}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <ChartContainer
        config={chartConfig}
        className="h-[240px] w-full aspect-auto min-w-0 max-w-full"
      >
        <BarChart
          accessibilityLayer
          data={activeData}
          margin={{ left: -15, right: 8, top: 10, bottom: 0 }}
        >
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="hsl(var(--border) / 0.4)"
          />
          <XAxis
            dataKey="month"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) =>
              typeof value === "string" ? value.slice(0, 3) : value
            }
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          />
          <YAxis
            allowDecimals={false}
            width={30}
            tickLine={false}
            tickMargin={6}
            axisLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />

          {viewMode === "status" && hasStatusData ? (
            <>
              {statusCategories.map((cat, idx) => (
                <Bar
                  key={cat.key}
                  dataKey={cat.key}
                  stackId="statusStack"
                  fill={cat.color}
                  radius={idx === 0 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </>
          ) : (
            <Bar
              dataKey="numOfApplications"
              fill="hsl(var(--primary))"
              radius={[6, 6, 0, 0]}
            />
          )}
        </BarChart>
      </ChartContainer>

      {/* Status Legend (when viewing by status) */}
      {viewMode === "status" && hasStatusData && (
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-1 text-[11px] text-muted-foreground">
          {statusCategories.map((cat) => (
            <span key={cat.key} className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="font-medium text-foreground">{cat.label}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );

  if (hideCardWrapper) {
    return content;
  }

  return (
    <Card className="bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow w-full">
      <CardHeader className="w-full flex-row justify-between items-center pb-2">
        <CardTitle className="text-base font-bold text-foreground">
          Application Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="w-full pt-2">{content}</CardContent>
    </Card>
  );
}

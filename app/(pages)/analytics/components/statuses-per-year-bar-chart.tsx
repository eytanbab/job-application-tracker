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
import { getColor, transformApplicationsData } from "@/lib/utils";
import { ChartData, RawData as Data } from "@/lib/types";

const chartConfig = {
  numOfApplications: {
    label: "Applications",
  },
} satisfies ChartConfig;

type Props = {
  years: string[];
  rawData: Data[];
  globalYear?: string;
  hideCardWrapper?: boolean;
};

export function StatusesPerYearBarChart({
  years,
  rawData,
  globalYear,
  hideCardWrapper,
}: Props) {
  const [userSelectedYear, setUserSelectedYear] = useState<string | null>(null);

  const effectiveGlobalYear =
    globalYear && globalYear !== "all" ? globalYear : undefined;
  const selectedYear =
    effectiveGlobalYear || userSelectedYear || years[0] || "2025";

  const chartData = useMemo(() => {
    return transformApplicationsData(rawData, selectedYear);
  }, [rawData, selectedYear]);

  const content = (
    <div className="w-full">
      {!effectiveGlobalYear && years.length > 1 && (
        <div className="flex justify-end pb-2">
          <Select value={selectedYear} onValueChange={setUserSelectedYear}>
            <SelectTrigger className="w-32 h-7 text-xs">
              <SelectValue placeholder="Select year" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {years?.map((year) => (
                  <SelectItem key={year} value={year} className="text-xs">
                    {year}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      )}
      <ChartContainer config={chartConfig} className="h-[230px] w-full">
        <BarChart accessibilityLayer data={chartData}>
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
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          {Object.keys(chartData[0] || {}).map((status) =>
            status !== "month" ? (
              <Bar
                key={status}
                dataKey={status}
                fill={getColor(status)}
                radius={[4, 4, 0, 0]}
                stackId="ab"
              />
            ) : null,
          )}
        </BarChart>
      </ChartContainer>
    </div>
  );

  if (hideCardWrapper) {
    return content;
  }

  return (
    <Card className="bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow w-full">
      <CardHeader className="w-full flex-row justify-between items-center pb-2">
        <CardTitle className="text-base font-bold text-foreground">
          Statuses Per Year
        </CardTitle>
      </CardHeader>
      <CardContent className="w-full pt-2">{content}</CardContent>
    </Card>
  );
}

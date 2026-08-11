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

const chartConfig = {
  numOfApplications: {
    label: "Applications",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

type Data = {
  year: string;
  month: string;
  numOfApplications: number;
};

type Props = {
  years: string[] | [];
  data: Data[];
  globalYear?: string;
  hideCardWrapper?: boolean;
};

export function TotalApplicationsPerYearBarChart({
  years,
  data,
  globalYear,
  hideCardWrapper,
}: Props) {
  const [userSelectedYear, setUserSelectedYear] = useState<string | null>(null);

  const effectiveGlobalYear =
    globalYear && globalYear !== "all" ? globalYear : undefined;
  const selectedYear =
    effectiveGlobalYear || userSelectedYear || years[0] || "2025";

  const filteredData = useMemo(() => {
    return data.filter((application) => application.year === selectedYear);
  }, [data, selectedYear]);

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
        <BarChart accessibilityLayer data={filteredData}>
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
          <Bar
            dataKey="numOfApplications"
            fill="hsl(var(--primary))"
            radius={[6, 6, 0, 0]}
          />
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
          Total Applications Per Year
        </CardTitle>
      </CardHeader>
      <CardContent className="w-full pt-2">{content}</CardContent>
    </Card>
  );
}

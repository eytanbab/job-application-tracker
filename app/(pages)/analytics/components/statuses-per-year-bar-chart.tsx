'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect, useState } from 'react';
import { getColor, transformApplicationsData } from '@/lib/utils';
import { ChartData, RawData as Data } from '@/lib/types';

const chartConfig = {
  numOfApplications: {
    label: 'Applications',
  },
} satisfies ChartConfig;

type Props = {
  years: string[];
  rawData: Data[];
  globalYear?: string;
};

export function StatusesPerYearBarChart({ years, rawData, globalYear }: Props) {
  const [selectedYear, setSelectedYear] = useState(globalYear || years[0]);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    if (globalYear) {
      setSelectedYear(globalYear);
    } else {
      setSelectedYear(years[0]);
    }
  }, [globalYear, years]);

  useEffect(() => {
    setChartData(transformApplicationsData(rawData, selectedYear));
  }, [rawData, selectedYear]);

  return (
    <Card className="bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow w-full">
      <CardHeader className="w-full flex-row justify-between items-center pb-2">
        <CardTitle className="text-base font-bold text-foreground">Statuses Per Year</CardTitle>
        {!globalYear && (
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-36 h-8 text-xs bg-background">
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
        )}
      </CardHeader>
      <CardContent className="w-full pt-2">
        <ChartContainer config={chartConfig} className="h-[230px] w-full">
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border) / 0.4)" />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            {Object.keys(chartData[0] || {}).map((status) =>
              status !== 'month' ? (
                <Bar
                  key={status}
                  dataKey={status}
                  fill={getColor(status)}
                  radius={[4, 4, 0, 0]}
                  stackId="ab"
                />
              ) : null
            )}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

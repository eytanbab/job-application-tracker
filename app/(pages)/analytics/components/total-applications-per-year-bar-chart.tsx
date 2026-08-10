'use client';

import { useState, useMemo } from 'react';
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


const chartConfig = {
  numOfApplications: {
    label: 'Applications',
    color: 'hsl(var(--primary))',
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
};

export function TotalApplicationsPerYearBarChart({
  years,
  data,
  globalYear,
}: Props) {
  const [userSelectedYear, setUserSelectedYear] = useState<string | null>(null);

  const selectedYear = globalYear || userSelectedYear || years[0];

  const filteredData = useMemo(() => {
    return data.filter((application) => application.year === selectedYear);
  }, [data, selectedYear]);

  return (
    <Card className="bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow w-full">
      <CardHeader className="w-full flex-row justify-between items-center pb-2">
        <CardTitle className="text-base font-bold text-foreground">Total Applications Per Year</CardTitle>
        {!globalYear && (
          <Select value={selectedYear} onValueChange={setUserSelectedYear}>
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
          <BarChart accessibilityLayer data={filteredData}>
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
            <Bar
              dataKey="numOfApplications"
              fill="hsl(var(--primary))"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

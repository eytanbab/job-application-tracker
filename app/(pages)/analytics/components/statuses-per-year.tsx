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
import { transformApplicationsData } from '@/lib/utils';

const chartConfig = {
  numOfApplications: {
    label: 'Applications',
  },
} satisfies ChartConfig;

type Data = {
  year: string;
  month: string;
  status: string;
  statusCount: number;
};

type Props = {
  years: string[];
  rawData: Data[];
};

type ChartData = {
  month: string;
  [status: string]: number | string; // Dynamic keys for different statuses
};

const predefinedColors: Record<string, string> = {
  ghosted: 'hsl(var(--status-ghosted))',
  rejected: 'hsl(var(--status-rejected))',
  applied: 'hsl(var(--status-applied))',
  accepted: 'hsl(var(--status-accepted))',
};

const getColor = (status: string) => {
  if (status.includes('applied')) {
    return predefinedColors['applied'];
  }
  if (status.includes('reject')) {
    return predefinedColors['rejected'];
  }
  if (status.includes('ghost')) {
    return predefinedColors['ghosted'];
  }

  if (status.includes('accept')) {
    return predefinedColors['accepted'];
  }
};

export function StatusesPerYearBarChart({ years, rawData }: Props) {
  const [selectedYear, setSelectedYear] = useState(years[0]);
  const [chartData, setChartData] = useState<ChartData[]>([]);

  console.log(chartData);

  useEffect(() => {
    setChartData(transformApplicationsData(rawData, selectedYear));
  }, [rawData, selectedYear]);

  return (
    <Card className='w-1/2'>
      <CardHeader className='w-full flex-row justify-between items-center'>
        <CardTitle>Applications per year</CardTitle>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className='w-40 h-10'>
            <SelectValue placeholder='Select a year' />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {years?.map((year) => {
                return (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className='w-full'>
        <ChartContainer
          config={chartConfig}
          className='min-h-[320px] w-full space-y-4'
        >
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='month'
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            {Object.keys(chartData[0] || {}).map((status) =>
              status !== 'month' ? (
                <Bar
                  key={status}
                  dataKey={status}
                  fill={getColor(status)}
                  radius={0}
                  stackId='ab'
                />
              ) : null
            )}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

'use client';

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface ApplicationVelocityChartProps {
  data: {
    month: string;
    [key: string]: string | number;
  }[];
  years: string[];
}

const chartColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

export function ApplicationVelocityChart({
  data,
  years,
}: ApplicationVelocityChartProps) {
  if (data.length === 0) {
    return <p>No application velocity data available.</p>;
  }

  const chartConfig = years.reduce((acc, year) => {
    acc[year] = {
      label: year,
      color: chartColors[Object.keys(acc).length % chartColors.length],
    };
    return acc;
  }, {} as ChartConfig);

  return (
    <ChartContainer config={chartConfig} className='h-72 w-full'>
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey='month'
          tickLine={false}
          tickMargin={8}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator='dashed' />}
        />
        {years.map((year) => (
          <Bar key={year} dataKey={year} fill={`var(--color-${year})`} radius={4} />
        ))}
      </BarChart>
    </ChartContainer>
  );
}

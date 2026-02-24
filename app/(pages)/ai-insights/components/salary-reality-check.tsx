'use client';

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

interface SalaryRealityCheckProps {
  data: {
    name: string;
    value: number;
  }[];
}

const chartConfig = {
  value: {
    label: 'Salary',
    color: '#2563eb',
  },
} satisfies ChartConfig;

export function SalaryRealityCheck({ data }: SalaryRealityCheckProps) {
  if (data.length === 0) {
    return <p>No salary data available.</p>;
  }

  return (
    <ChartContainer config={chartConfig} className='h-72 w-full'>
      <BarChart accessibilityLayer data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey='name'
          tickLine={false}
          tickMargin={8}
          axisLine={false}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator='dashed' />}
        />
        <Bar dataKey='value' fill='var(--color-value)' radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

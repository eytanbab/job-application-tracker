'use client';

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartConfig = {
  status: {
    label: 'status',
  },
} satisfies ChartConfig;

type Data = {
  month: string; // Month name
  [status: string]: string | number; // Dynamic keys for statuses
};

type Props = {
  title: string;
  data: Data[];
};

export function BarChartComponent({ title, data }: Props) {
  const statuses = Object.keys(data[0] || {}).filter((key) => key !== 'month');

  return (
    <Card className='w-full'>
      <CardHeader className='flex-row justify-between items-start'>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className='w-full'>
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
            {statuses.map((status) => (
              <Bar key={status} dataKey={status} radius={4} />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

'use client';

import { Pie, PieChart } from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartConfig = {
  companies: {
    label: 'freq',
  },
  chrome: {
    color: 'hsl(var(--chart-1))',
  },
  safari: {
    color: 'hsl(var(--chart-2))',
  },
  firefox: {
    color: 'hsl(var(--chart-3))',
  },
  edge: {
    color: 'hsl(var(--chart-4))',
  },
  other: {
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig;

type Data = {
  name: string;
  freq: number;
  fill?: string;
};

export function CompaniesPieChart({ data }: { data: Data[] }) {
  data.map((item, i) => {
    item['fill'] = `hsl(var(--chart-${i + 1}))`;
  });

  return (
    <Card className='flex flex-col w-fit h-min'>
      <CardHeader className='items-center'>
        <CardTitle>Companies applied to</CardTitle>
      </CardHeader>
      <CardContent className='flex-1'>
        <ChartContainer
          config={chartConfig}
          className='mx-auto aspect-square max-h-[250px] pb-0 [&_.recharts-pie-label-text]:fill-foreground'
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={data} dataKey='freq' label nameKey='name' />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

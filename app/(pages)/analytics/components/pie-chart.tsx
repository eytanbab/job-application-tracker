'use client';

import { Pie, PieChart } from 'recharts';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';

const chartConfig = {
  companies: {
    label: 'comapanies',
  },
  label1: {
    label: 'label test',
    color: 'hsl(var(--chart-1))',
  },
  label2: {
    color: 'hsl(var(--chart-2))',
  },
  label3: {
    color: 'hsl(var(--chart-3))',
  },
  label4: {
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

type Props = {
  title: string;
  data: Data[];
};

export function PieChartComponent({ title, data }: Props) {
  data.map((item, i) => {
    item['fill'] = `hsl(var(--chart-${i + 1}))`;
  });

  return (
    <Card>
      <CardHeader className='items-center mt-2'>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className='flex-1'>
        <ChartContainer
          config={chartConfig}
          className='mx-auto aspect-square max-h-[250px] pb-0 [&_.recharts-pie-label-text]:fill-foreground'
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={data} dataKey='freq' label />
          </PieChart>
        </ChartContainer>
        <CardFooter>
          <ul className='flex flex-col text-sm'>
            {data.map((item) => {
              return (
                <li key={item.name}>
                  {item.name}: {item.freq}
                </li>
              );
            })}
          </ul>
        </CardFooter>
      </CardContent>
    </Card>
  );
}

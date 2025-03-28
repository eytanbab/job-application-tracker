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
import { getColor } from '@/lib/utils';

const chartConfig = {
  companies: {
    label: 'comapanies',
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
  if (title === 'Top 5 Applications status') {
    data.map((item) => {
      item['fill'] = getColor(item.name);
    });
  } else {
    data.map((item, i) => {
      item['fill'] = `hsl(var(--chart-${i + 1}))`;
    });
  }

  const totalFreq = data.reduce((sum, item) => sum + item.freq, 0);

  return (
    <Card>
      <CardHeader className='items-center mt-2'>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className='flex-1 w-full'>
        <ChartContainer
          config={chartConfig}
          className='mx-auto aspect-square pb-0 [&_.recharts-pie-label-text]:fill-foreground'
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie data={data} dataKey='freq' label />
          </PieChart>
        </ChartContainer>
        <CardFooter className='w-full'>
          <ul className='flex flex-col text-sm w-full text-left'>
            {data.map((item) => {
              const percentage =
                Math.floor(((item.freq * 100) / totalFreq) * 100) / 100;
              return (
                <li key={item.name} className='capitalize'>
                  {item.name}: {item.freq} ({percentage}
                  %)
                </li>
              );
            })}
          </ul>
        </CardFooter>
      </CardContent>
    </Card>
  );
}

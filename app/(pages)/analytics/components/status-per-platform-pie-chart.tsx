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
  status: {
    label: 'status',
  },
} satisfies ChartConfig;

type Status = {
  status: string;
  value: number;
  fill: string;
};

type Data = {
  platformName: string;
  statuses: Status[];
};

type Props = {
  data: Data;
};

export function StatusPerPlatformPieChart({ data }: Props) {
  data.statuses.map((item, i) => {
    item['fill'] = `hsl(var(--chart-${i + 1}))`;
  });
  return (
    <Card>
      <CardHeader className='items-center mt-2'>
        <CardTitle>{data.platformName}</CardTitle>
      </CardHeader>
      <CardContent className='flex-1'>
        <ChartContainer
          config={chartConfig}
          className='mx-auto aspect-square pb-0 [&_.recharts-pie-label-text]:fill-foreground'
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <Pie
              // paddingAngle={data.statuses.length === 1 ? 0 : 4}
              data={data.statuses}
              dataKey='value'
              nameKey='status'
              label
              fill='hsl(var(--chart-1))'
            />
          </PieChart>
        </ChartContainer>
        <CardFooter>
          <ul className='flex flex-col text-sm'>
            {data.statuses.map((item) => {
              return (
                <li key={item.status}>
                  {item.status}: {item.value}
                </li>
              );
            })}
          </ul>
        </CardFooter>
      </CardContent>
    </Card>
  );
}

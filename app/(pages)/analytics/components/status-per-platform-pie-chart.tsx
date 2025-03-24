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
  data.statuses.map((item) => {
    item['fill'] = getColor(item.status);
  });

  const totalFreq = data.statuses.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader className='items-center mt-2'>
        <CardTitle className='capitalize'>{data.platformName}</CardTitle>
      </CardHeader>
      <CardContent className='flex-1 w-full'>
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
              fill=''
            />
          </PieChart>
        </ChartContainer>
        <CardFooter>
          <ul className='flex flex-col text-sm'>
            {data.statuses.map((item) => {
              const percentage =
                Math.floor(((item.value * 100) / totalFreq) * 100) / 100;
              return (
                <li key={item.status} className='capitalize'>
                  {item.status}: {item.value} ({percentage}
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

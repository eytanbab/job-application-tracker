'use client';

import { Pie, PieChart, Cell } from 'recharts';

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
import { Badge } from '@/components/ui/badge';

const chartConfig = {
  companies: {
    label: 'companies',
  },
} satisfies ChartConfig;

const PIE_COLORS = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#8b5cf6', // Purple
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
];

type Data = {
  name: string;
  freq: number;
  fill?: string;
};

type Props = {
  title: string;
  data: Data[];
  total?: number;
};

export function PieChartComponent({ title, data, total }: Props) {
  const topSum = data.reduce((sum, item) => sum + item.freq, 0);
  const grandTotal = total && total > topSum ? total : topSum;

  const baseData = [...data];
  if (total && total > topSum) {
    const remainder = total - topSum;
    baseData.push({
      name: 'Other',
      freq: remainder,
    });
  }

  const chartData = baseData.map((item, i) => ({
    ...item,
    fill:
      title === 'Top 5 Applications status' || title === 'Status Breakdown'
        ? getColor(item.name)
        : item.name === 'Other'
        ? 'hsl(var(--muted-foreground) / 0.4)'
        : PIE_COLORS[i % PIE_COLORS.length],
  }));

  return (
    <Card className="w-full bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow flex flex-col justify-between">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold text-foreground">{title}</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 w-full flex flex-col items-center justify-center p-3">
        <div className="relative w-full aspect-square max-h-[190px] flex items-center justify-center">
          <ChartContainer
            config={chartConfig}
            className="w-full h-full aspect-square mx-auto"
          >
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Pie
                data={chartData}
                dataKey="freq"
                nameKey="name"
                innerRadius={52}
                outerRadius={76}
                paddingAngle={3}
                strokeWidth={0}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} className="hover:opacity-80 transition-opacity" />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>

          {/* Centered Donut Total Indicator */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-2xl font-extrabold text-foreground leading-none">{grandTotal}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-wider mt-0.5">Total</span>
          </div>
        </div>

        <CardFooter className="w-full pt-3 px-1 pb-1">
          <ul className="flex flex-col gap-2 text-xs w-full">
            {chartData.map((item) => {
              const percentage =
                grandTotal > 0
                  ? Math.round(((item.freq * 100) / grandTotal) * 10) / 10
                  : 0;
              return (
                <li key={item.name} className="flex items-center justify-between capitalize text-muted-foreground">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="font-medium text-foreground truncate max-w-[150px]">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-semibold text-foreground text-xs">{item.freq}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-semibold">
                      {percentage}%
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardFooter>
      </CardContent>
    </Card>
  );
}

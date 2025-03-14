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

const chartConfig = {
  numOfApplications: {
    label: 'Applications',
  },
} satisfies ChartConfig;

type Data = {
  year: string;
  month: string;
  numOfApplications: number;
};

type Props = {
  years: string[] | [];
  data: Data[];
};

export function TotalApplicationsPerYearBarChart({ years, data }: Props) {
  const [selectedYear, setSelectedYear] = useState(years[0]);
  const [filteredData, setFilteredData] = useState(data);

  useEffect(() => {
    setFilteredData(
      data.filter((application) => application.year === selectedYear)
    );
  }, [data, selectedYear]);

  return (
    <Card>
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
          <BarChart accessibilityLayer data={filteredData}>
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
            <Bar
              dataKey='numOfApplications'
              fill='hsl(var(--chart-1))'
              radius={0}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

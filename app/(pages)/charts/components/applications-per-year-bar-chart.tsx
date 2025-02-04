'use client';

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

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
  month: {
    label: 'Applications',
  },
} satisfies ChartConfig;

type Data = {
  year: number;
  month: string;
  numOfApplications: number;
};

type Props = {
  years: number[] | [];
  data: Data[];
};

export function ApplicationsPerYearBarChart({ years, data }: Props) {
  const [selectedYear, setSelectedYear] = useState(years[0]);
  const [filteredData, setFilteredData] = useState(data);

  useEffect(() => {
    setFilteredData(
      data.filter((application) => application.year === selectedYear)
    );
  }, [data, selectedYear]);

  return (
    <Card className='w-full'>
      <CardHeader className='flex-row justify-between items-center'>
        <CardTitle>Applications per year</CardTitle>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className='w-40'>
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
      <CardContent>
        <ChartContainer config={chartConfig} className='min-h-[200px] w-full'>
          <BarChart accessibilityLayer data={filteredData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='month'
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey='month' fill='var(--color-desktop)' radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

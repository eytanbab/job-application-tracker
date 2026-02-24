'use client';

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

interface DayOfWeekPerformanceData {
  day: string;
  total: number;
  interviews: number;
  successRate: number;
}

interface DayOfWeekPerformanceProps {
  data: DayOfWeekPerformanceData[];
}

export function DayOfWeekPerformance({ data }: DayOfWeekPerformanceProps) {
  if (data.length === 0) {
    return <p>No data available.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Day</TableHead>
          <TableHead className='text-right'>Applications</TableHead>
          <TableHead className='text-right'>Interviews</TableHead>
          <TableHead className='text-right'>Success Rate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item.day}>
            <TableCell className='font-medium'>{item.day}</TableCell>
            <TableCell className='text-right'>{item.total}</TableCell>
            <TableCell className='text-right'>{item.interviews}</TableCell>
            <TableCell className='text-right'>
              {item.successRate.toFixed(2)}%
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

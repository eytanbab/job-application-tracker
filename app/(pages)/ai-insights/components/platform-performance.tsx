'use client';

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

interface PlatformPerformanceData {
  platform: string;
  total: number;
  interviews: number;
}

interface PlatformPerformanceProps {
  performanceData: PlatformPerformanceData[];
}

export function PlatformPerformance({
  performanceData,
}: PlatformPerformanceProps) {
  if (performanceData.length === 0) {
    return <p>No platform performance data available.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Platform</TableHead>
          <TableHead className='text-right'>Applications</TableHead>
          <TableHead className='text-right'>Interviews</TableHead>
          <TableHead className='text-right'>Success Rate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {performanceData.map((data) => (
          <TableRow key={data.platform}>
            <TableCell className='font-medium'>{data.platform}</TableCell>
            <TableCell className='text-right'>{data.total}</TableCell>
            <TableCell className='text-right'>{data.interviews}</TableCell>
            <TableCell className='text-right'>
              {data.total > 0
                ? ((data.interviews / data.total) * 100).toFixed(2)
                : '0.00'}
              %
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

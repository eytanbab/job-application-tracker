'use client';

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

interface KeywordPerformanceData {
  keyword: string;
  total: number;
  interviews: number;
  interviewRate: number;
}

interface KeywordPerformanceProps {
  data: KeywordPerformanceData[];
}

export function KeywordPerformance({ data }: KeywordPerformanceProps) {
  if (data.length === 0) {
    return <p>No keyword performance data available.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Keyword</TableHead>
          <TableHead className='text-right'>Applications</TableHead>
          <TableHead className='text-right'>Interviews</TableHead>
          <TableHead className='text-right'>Interview Rate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item.keyword}>
            <TableCell className='font-medium'>{item.keyword}</TableCell>
            <TableCell className='text-right'>{item.total}</TableCell>
            <TableCell className='text-right'>{item.interviews}</TableCell>
            <TableCell className='text-right'>
              {item.interviewRate.toFixed(2)}%
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

'use client';

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

interface DomainLeaderboardData {
  domain: string;
  total: number;
  interviews: number;
  successRate: number;
}

interface DomainLeaderboardProps {
  data: DomainLeaderboardData[];
}

export function DomainLeaderboard({ data }: DomainLeaderboardProps) {
  if (data.length === 0) {
    return <p>No domain leaderboard data available.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Domain</TableHead>
          <TableHead className='text-right'>Applications</TableHead>
          <TableHead className='text-right'>Interviews</TableHead>
          <TableHead className='text-right'>Success Rate</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item) => (
          <TableRow key={item.domain}>
            <TableCell className='font-medium'>{item.domain}</TableCell>
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

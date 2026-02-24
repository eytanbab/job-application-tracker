'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface FunnelChartProps {
  data: {
    name: string;
    value: number;
  }[];
}

export function FunnelChart({ data }: FunnelChartProps) {
  if (data.length === 0) {
    return <p>No funnel data available.</p>;
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
      {data.map((item) => (
        <Card key={item.name}>
          <CardHeader>
            <CardTitle>{item.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>{item.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

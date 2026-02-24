'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface KpiSummaryProps {
  kpiData: {
    totalApplications: number;
    interviewRate: number;
    offerRate: number;
    activePipeline: number;
  };
}

export function KpiSummary({ kpiData }: KpiSummaryProps) {
  const { totalApplications, interviewRate, offerRate, activePipeline } =
    kpiData;

  const kpis = [
    { title: 'Total Applications', value: totalApplications, format: 'number' },
    { title: 'Interview Rate', value: interviewRate, format: 'percent' },
    { title: 'Offer Rate', value: offerRate, format: 'percent' },
    { title: 'Active Pipeline', value: activePipeline, format: 'number' },
  ];

  const formatValue = (value: number, format: string) => {
    if (format === 'percent') {
      return `${value.toFixed(2)}%`;
    }
    return value;
  };

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
      {kpis.map((kpi) => (
        <Card key={kpi.title}>
          <CardHeader>
            <CardTitle>{kpi.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-2xl font-bold'>
              {formatValue(kpi.value, kpi.format)}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

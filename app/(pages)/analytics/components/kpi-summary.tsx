import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Props = {
  totalApplications: number;
  interviewRate: number;
  rejectionRate: number;
  responseRate: number;
};

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export function KpiSummary({
  totalApplications,
  interviewRate,
  rejectionRate,
  responseRate,
}: Props) {
  return (
    <div className='col-span-full grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4'>
      <Card>
        <CardHeader>
          <CardTitle className='text-sm text-muted-foreground'>
            Total Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-3xl font-bold'>{totalApplications}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className='text-sm text-muted-foreground'>
            Interview Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-3xl font-bold'>{formatPercent(interviewRate)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className='text-sm text-muted-foreground'>
            Rejection Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-3xl font-bold'>{formatPercent(rejectionRate)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className='text-sm text-muted-foreground'>
            Response Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-3xl font-bold'>{formatPercent(responseRate)}</p>
        </CardContent>
      </Card>
    </div>
  );
}

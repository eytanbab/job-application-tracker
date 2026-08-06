import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Users, Award, Clock } from 'lucide-react';

type Props = {
  totalApplications: number;
  interviewRate: number;
  rejectionRate: number;
  responseRate: number;
};

const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

export function KpiSummary({
  interviewRate,
  rejectionRate,
  responseRate,
}: Props) {
  return (
    <div className="col-span-full grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Resume Pass Rate
          </CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground/70" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-extrabold text-foreground">{formatPercent(interviewRate)}</p>
          <p className="text-xs text-muted-foreground mt-1">Applications reaching interview stage</p>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Interview Conversion
          </CardTitle>
          <Users className="h-4 w-4 text-muted-foreground/70" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-extrabold text-foreground">{formatPercent(responseRate)}</p>
          <p className="text-xs text-muted-foreground mt-1">Interviews converted to offer leads</p>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Total Rejection Rate
          </CardTitle>
          <Award className="h-4 w-4 text-muted-foreground/70" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-extrabold text-foreground">{formatPercent(rejectionRate)}</p>
          <p className="text-xs text-muted-foreground mt-1">Rejections across resume & interview</p>
        </CardContent>
      </Card>

      <Card className="bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Response Velocity
          </CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground/70" />
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-extrabold text-foreground">7 Days</p>
          <p className="text-xs text-muted-foreground mt-1">Average time to recruiter response</p>
        </CardContent>
      </Card>
    </div>
  );
}

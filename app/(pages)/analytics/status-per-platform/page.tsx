import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getStatusPerPlatform, getYears } from '@/app/actions/analytics';
import { PlatformRoiDashboard } from '../components/platform-roi-dashboard';
import { AnalyticsFilter } from '../components/analytics-filter';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  return {
    title: 'JAT | Status Per Platform',
  };
}

export default async function StatusPerPlatformPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const month =
    typeof searchParams.month === 'string' ? searchParams.month : undefined;
  const year =
    typeof searchParams.year === 'string' ? searchParams.year : undefined;

  const [statusPerPlatform, years] = await Promise.all([
    getStatusPerPlatform(month, year),
    getYears(),
  ]);

  if (statusPerPlatform.length === 0 && !month && !year)
    return (
      <div className='flex flex-col gap-3 h-60 items-center justify-center rounded-xl border border-dashed border-border/50 p-8 text-center bg-card/30'>
        <p className='text-muted-foreground text-sm max-w-sm'>
          No applications found. Add your job applications to unlock platform ROI analytics.
        </p>
        <Button asChild size="sm" className="gap-1.5 font-semibold">
          <Link href="/applications">+ Add Application</Link>
        </Button>
      </div>
    );

  return (
    <div className='flex flex-col gap-4 w-full'>
      <Suspense fallback={<div className="h-14 w-full bg-card rounded-xl animate-pulse" />}>
        <AnalyticsFilter years={years} />
      </Suspense>
      <PlatformRoiDashboard data={statusPerPlatform} />
    </div>
  );
}

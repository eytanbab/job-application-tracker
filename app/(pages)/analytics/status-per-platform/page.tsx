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
      <div className='flex h-60 items-center justify-center rounded-lg border border-dashed p-8 text-center'>
        <p className='text-muted-foreground'>
          No applications found. Add an application to see platform performance analytics.
        </p>
      </div>
    );

  return (
    <div className='flex flex-col gap-4 w-full'>
      <AnalyticsFilter years={years} />
      <PlatformRoiDashboard data={statusPerPlatform} />
    </div>
  );
}

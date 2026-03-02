import { getStatusPerPlatform, getYears } from '@/app/actions/analytics';
import { StatusPerPlatformPieChart } from '../components/status-per-platform-pie-chart';
import { AnalyticsFilter } from '../components/analytics-filter';

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
      <p>No applications found. Add an application to see the analytics.</p>
    );

  return (
    <div className='flex flex-col gap-4'>
      <AnalyticsFilter years={years} />
      {statusPerPlatform.length === 0 ? (
        <div className='flex h-60 items-center justify-center rounded-lg border border-dashed'>
          <p className='text-muted-foreground'>
            No data found for the selected period.
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 3xl:grid-cols-6 gap-4'>
          {statusPerPlatform.map((platform) => {
            return (
              <StatusPerPlatformPieChart
                key={platform.platformName}
                data={platform}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

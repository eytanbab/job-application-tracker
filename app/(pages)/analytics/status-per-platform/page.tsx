import { getStatusPerPlatform } from '@/app/actions/analytics';
import { StatusPerPlatformPieChart } from '../components/status-per-platform-pie-chart';

export async function generateMetadata() {
  return {
    title: 'JAT | Status Per Platform',
  };
}

export default async function Overview() {
  const statusPerPlatform = await getStatusPerPlatform();

  if (statusPerPlatform.length === 0)
    return (
      <p>No applications found. Add an application to see the analytics.</p>
    );

  return (
    <div className='col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 3xl:grid-cols-6 gap-4'>
      {statusPerPlatform.map((platform) => {
        return (
          <StatusPerPlatformPieChart
            key={platform.platformName}
            data={platform}
          />
        );
      })}
    </div>
  );
}

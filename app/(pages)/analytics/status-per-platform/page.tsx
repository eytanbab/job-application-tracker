import { getStatusPerPlatform } from '@/app/actions';
import { Section } from '../components/Section';
import { StatusPerPlatformPieChart } from '../components/status-per-platform-pie-chart';

export default async function Overview() {
  const statusPerPlatform = await getStatusPerPlatform();

  console.log(statusPerPlatform);
  if (statusPerPlatform.length === 0)
    return (
      <p>No applications found. Add an application to see the analytics.</p>
    );

  return (
    <Section>
      <div className='grid grid-cols-6 gap-4'>
        {statusPerPlatform.map((platform) => {
          return (
            <StatusPerPlatformPieChart
              key={platform.platformName}
              data={platform}
            />
          );
        })}
      </div>
    </Section>
  );
}

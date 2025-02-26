import {
  getApplicationsPerYear,
  getTop5Statuses,
  getTop5Companies,
  getTop5Platforms,
  getYears,
  getStatusPerPlatform,
} from '@/app/actions';
import { PieChartComponent } from './components/pie-chart';
import { ApplicationsPerYearBarChart } from './components/applications-per-year-bar-chart';
import { StatusPerPlatformPieChart } from './components/status-per-platform-pie-chart';
import { Section } from './components/Section';

export default async function Charts() {
  const top5Companies = await getTop5Companies();
  const top5Statuses = await getTop5Statuses();
  const top5Platforms = await getTop5Platforms();

  const applicationsPerYear = await getApplicationsPerYear();
  const years = await getYears();

  const statusPerPlatform = await getStatusPerPlatform();

  return (
    <div className='w-full flex flex-col h-full gap-8'>
      {/* Overview charts */}
      <Section title='Overview'>
        <PieChartComponent title='Top 5 companies' data={top5Companies} />
        <PieChartComponent title='Top 5 platforms' data={top5Platforms} />
        <PieChartComponent
          title='Top 5 Applications status'
          data={top5Statuses}
        />
        <ApplicationsPerYearBarChart years={years} data={applicationsPerYear} />
      </Section>
      {/* Status per platform charts */}
      <Section title='Status per Platform'>
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
    </div>
  );
}

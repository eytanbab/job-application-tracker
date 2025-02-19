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
      <div>
        <h1 className='text-2xl'>Overview</h1>
        <div className='w-full h-px bg-slate-300' />
      </div>
      <div className='w-full flex gap-4'>
        <PieChartComponent title='Top 5 companies' data={top5Companies} />
        <PieChartComponent title='Top 5 platforms' data={top5Platforms} />
        <PieChartComponent title='Applications status' data={top5Statuses} />
        <ApplicationsPerYearBarChart years={years} data={applicationsPerYear} />
      </div>
      <div>
        <h1 className='text-2xl'>Status per platform</h1>
        <div className='w-full h-px bg-slate-300' />
      </div>
      {/* Status per platform charts */}
      <div className='w-full flex gap-4 overflow-x-scroll py-2'>
        {statusPerPlatform.map((platform) => {
          return (
            <StatusPerPlatformPieChart
              key={platform.platformName}
              data={platform}
            />
          );
        })}
      </div>
    </div>
  );
}

import {
  getApplicationsPerMonth,
  getTop5Statuses,
  getTop5Companies,
  getTop5Platforms,
  getYears,
} from '@/app/actions';
import { PieChartComponent } from './components/pie-chart';
import { BarChartComponent } from './components/bar-chart';

export default async function Charts() {
  const top5Companies = await getTop5Companies();
  const top5Statuses = await getTop5Statuses();
  const top5Platforms = await getTop5Platforms();
  const years = await getYears();
  const applicationsPerMonth = await getApplicationsPerMonth();

  // applicationsPerMonth.map((app) => {
  //   app['date_applied'] = getNameOfMonth(app['date_applied']);
  // });

  console.log(years);
  return (
    <div className='w-full flex flex-col h-full gap-2'>
      {/* Overview Row */}
      <div>
        <h1 className='text-2xl'>Overview</h1>
        <div className='w-full h-0.5 bg-slate-200' />
      </div>
      {/* Overview charts */}
      <div className='w-full flex gap-4 bg-red-500'>
        <PieChartComponent title='Top 5 companies' data={top5Companies} />
        <PieChartComponent title='Top 5 platforms' data={top5Platforms} />
        <PieChartComponent title='Applications status' data={top5Statuses} />
        <BarChartComponent
          title='Applications status per month'
          data={applicationsPerMonth}
        />
      </div>
    </div>
  );
}

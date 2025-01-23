import { getStatuses, getTop5Companies } from '@/app/actions';
import { PieChartComponent } from './components/pie-chart';
import { BarChartComponent } from './components/bar-chart';

export default async function Charts() {
  const top5Companies = await getTop5Companies();
  const statuses = await getStatuses();

  return (
    <div className='w-full grid grid-cols-4 h-full gap-4'>
      <PieChartComponent title='Top 5 companies' data={top5Companies} />
      <PieChartComponent title='Statuses' data={statuses} />
      <BarChartComponent />
    </div>
  );
}

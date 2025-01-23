import { getTop5Companies } from '@/app/actions';
import { CompaniesPieChart } from './components/companies-pie-chart';

export default async function Charts() {
  const companies = await getTop5Companies();

  return (
    <div className='w-full grid grid-cols-4 h-full'>
      <CompaniesPieChart data={companies} />
    </div>
  );
}

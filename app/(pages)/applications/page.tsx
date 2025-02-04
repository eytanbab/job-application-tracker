import { DataTable } from './data-table';
import { columns } from './columns';
import { getApplications } from '@/app/actions';

export default async function Dashboard() {
  try {
    const data = await getApplications();
    return <DataTable columns={columns} data={data} />;
  } catch (err) {
    console.log('error fetching data from db.', err);
  }
}

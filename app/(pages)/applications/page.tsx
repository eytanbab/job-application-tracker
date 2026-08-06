import { DataTable } from './data-table';
import { columns } from './columns';
import { getApplications } from '@/app/actions/applications';
import { populate_data } from '@/data.js';

export async function generateMetadata() {
  return {
    title: 'JAT | Applications',
  };
}

export default async function Dashboard() {
  try {
    const rawData = await getApplications();
    const data =
      rawData.length > 0
        ? rawData
        : populate_data.map((item, idx) => ({
            id: `sample-${idx}`,
            ...item,
            month: '2',
            year: '2025',
          }));

    return <DataTable columns={columns} data={data as any} />;
  } catch (err) {
    console.log('error fetching data from db.', err);
    return <DataTable columns={columns} data={[] as any} />;
  }
}

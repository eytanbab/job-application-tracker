import { DataTable } from './data-table';
import { columns } from './columns';
import { getApplications } from '@/app/actions/applications';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export async function generateMetadata() {
  return {
    title: 'JAT | Applications',
  };
}

export default async function Dashboard() {
  try {
    const data = await getApplications();

    if (data.length === 0) {
      return (
        <div className='mx-auto flex w-full max-w-2xl flex-col items-center gap-3 rounded-xl border bg-card p-10 text-center shadow-sm'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            Start tracking your job hunt
          </h1>
          <p className='text-muted-foreground'>
            Add your first application to unlock analytics and keep everything
            in one place.
          </p>
          <Link href='/applications/new'>
            <Button className='mt-2'>Add your first application</Button>
          </Link>
        </div>
      );
    }

    return <DataTable columns={columns} data={data} />;
  } catch (err) {
    console.log('error fetching data from db.', err);
  }
}

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { DataTable } from './data-table';
import { columns } from './columns';
import { data } from '@/data';

export default function Home() {
  return (
    <div className='p-6 flex flex-col items-center justify-center w-full'>
      <h1>Dashboard</h1>
      <Link href='/new'>
        <Button variant='outline'>Add new</Button>
      </Link>
      <DataTable columns={columns} data={data} />
    </div>
  );
}

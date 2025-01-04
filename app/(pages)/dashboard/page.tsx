import { DataTable } from '../../data-table';
import { columns } from '../../columns';
import { data } from '@/data';

export default function Dashboard() {
  return <DataTable columns={columns} data={data} />;
}

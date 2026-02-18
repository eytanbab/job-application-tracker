'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { cn } from '@/lib/utils';
import {
  flexRender,
  useReactTable,
  getCoreRowModel,
} from '@tanstack/react-table';
import { columns } from './columns';

const rowCount = 10;

// Create skeleton data that matches your column structure
const createSkeletonData = (count: number) => {
  return Array.from({ length: count }, (_, index) => ({
    // Required properties
    role_name: '',
    link: '',
    company_name: '',
    date_applied: '',
    platform: '',
    status: 'applied',
    month: '',
    year: '',
    location: '',
    salary: '',
    // Optional properties
    id: `skeleton-${index}`,
    description: '',
    createdAt: new Date(),
  }));
};

export default function DataTableSkeleton() {
  const skeletonData = createSkeletonData(rowCount);

  const table = useReactTable({
    data: skeletonData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className='w-full'>
      {/* Search and New Application Button */}
      <div className='flex items-center py-4 justify-between'>
        <div className='relative w-96 max-w-xl'>
          <div className='h-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse max-w-sm' />
        </div>

        <div className='hidden md:block'>
          <div className='h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse' />
        </div>
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className='border-b border-border'>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    className='p-0 font-bold text-foreground'
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>

        {/* Table Body Skeleton */}
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              className='capitalize border-b border-border text-foreground hover:bg-accent hover:text-accent-foreground'
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={cn(
                    'truncate max-w-60 p-3.5',
                    cell.column.id === 'link' && 'lowercase'
                  )}
                >
                  {cell.column.id === 'status' ? (
                    <div className='inline-flex'>
                      <div className='h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse' />
                    </div>
                  ) : (
                    <div
                      className={cn(
                        'h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse',
                        // Vary widths based on actual column IDs
                        cell.column.id === 'role_name' && 'w-full max-w-48',
                        cell.column.id === 'company_name' && 'w-full max-w-32',
                        cell.column.id === 'location' && 'w-full max-w-24',
                        cell.column.id === 'salary' && 'w-full max-w-24',
                        cell.column.id === 'platform' && 'w-full max-w-20',
                        cell.column.id === 'date_applied' && 'w-full max-w-24',
                        cell.column.id === 'month' && 'w-full max-w-16',
                        cell.column.id === 'year' && 'w-full max-w-12',
                        cell.column.id === 'link' && 'w-full max-w-36',
                        cell.column.id === 'description' && 'w-full max-w-40',
                        // Default width for any other columns
                        ![
                          'role_name',
                          'company_name',
                          'location',
                          'salary',
                          'platform',
                          'date_applied',
                          'month',
                          'year',
                          'link',
                          'description',
                          'status',
                        ].includes(cell.column.id) && 'w-full max-w-28'
                      )}
                    />
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Pagination Skeleton */}
      <div className='flex items-center justify-between py-4'>
        <div className='h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse' />
        <div className='flex gap-2 justify-end'>
          <div className='h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse' />
          <div className='h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse' />
        </div>
      </div>

      {/* Rows per page selector skeleton */}
      <div className='flex items-center space-x-2'>
        <p className='text-sm font-medium'>Rows per page</p>
        <div className='h-8 w-[70px] bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse' />
      </div>

      {/* Mobile floating action button */}
      <div className='md:hidden fixed bottom-4 right-4'>
        <div className='size-10 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse' />
      </div>
    </div>
  );
}

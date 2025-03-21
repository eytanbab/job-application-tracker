'use client';

import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface DataTableProps<TData extends { status: string }, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

const TABLE_ROWS = [5, 10, 15, 20, 25];

export function DataTable<TData extends { status: string }, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'date_applied', desc: true },
  ]);
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString', // built-in filter function
    onGlobalFilterChange: setGlobalFilter,

    state: {
      sorting,
      globalFilter,
    },
  });

  return (
    <div className='w-full'>
      <div className='flex items-center py-4 justify-between'>
        <div className='relative w-96 max-w-xl'>
          <Input
            placeholder='Search...'
            value={globalFilter}
            onChange={(e) => table.setGlobalFilter(String(e.target.value))}
            className='max-w-sm'
          />
          {globalFilter.length > 0 && (
            <X
              className='absolute top-1/2 -translate-y-1/2 right-2 size-6 cursor-pointer hover:bg-indigo-200 dark:hover:bg-indigo-900 p-1 rounded-full transition-colors'
              onClick={() => table.setGlobalFilter('')}
            />
          )}
        </div>
        <Link href='/applications/new' className='hidden md:inline-block'>
          <Button variant='outline'>New application</Button>
        </Link>
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow
              key={headerGroup.id}
              className='border-b border-indigo-600'
            >
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    className=' text-indigo-600 font-bold p-0 dark:text-indigo-100'
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
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
                className='text-indigo-500  hover:text-slate-100 hover:bg-indigo-600 dark:hover:bg-indigo-800 border-b border-indigo-200 dark:text-indigo-100 dark:border-indigo-800 capitalize'
              >
                {row.getVisibleCells().map((cell) =>
                  cell.column.id === 'status' ? (
                    <TableCell
                      key={cell.id}
                      className={cn('truncate max-w-60 ')}
                    >
                      <Badge
                        className={cn(
                          (cell.getValue() as string)
                            .toLowerCase()
                            .includes('applied') &&
                            'bg-indigo-200 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
                          (cell.getValue() as string)
                            .toLowerCase()
                            .includes('accept') &&
                            'bg-emerald-200 text-emerald-950 dark:bg-emerald-950 dark:text-emerald-300',
                          (cell.getValue() as string)
                            .toLowerCase()
                            .includes('ghost') &&
                            'bg-slate-200 text-slate-900 dark:bg-slate-800 dark:text-slate-300',
                          (cell.getValue() as string)
                            .toLowerCase()
                            .includes('review') &&
                            'bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-300',
                          (cell.getValue() as string)
                            .toLowerCase()
                            .includes('interview') &&
                            'bg-cyan-200 text-cyan-900 dark:bg-cyan-800 dark:text-cyan-300',
                          (cell.getValue() as string)
                            .toLowerCase()
                            .includes('reject') &&
                            'bg-red-200 text-red-950 dark:bg-red-950/75 dark:text-red-500'
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </Badge>
                    </TableCell>
                  ) : (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'truncate max-w-60 ',
                        cell.column.id === 'link' && 'lowercase'
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  )
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className='h-24 text-center'>
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination buttons */}
      <div className='flex items-center justify-between py-4'>
        <p>
          Showing {table.getRowModel().rows.length} of{' '}
          {table.getFilteredRowModel().rows.length} row(s).
        </p>
        <div className='flex gap-2 justify-end'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
      <div className='flex items-center space-x-2'>
        <p className='text-sm font-medium'>Rows per page</p>
        <Select
          value={`${table.getState().pagination.pageSize}`}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
        >
          <SelectTrigger className='h-8 w-[70px]'>
            <SelectValue placeholder={table.getState().pagination.pageSize} />
          </SelectTrigger>
          <SelectContent side='top'>
            {TABLE_ROWS.map((pageSize) => (
              <SelectItem key={pageSize} value={`${pageSize}`}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Link
        href='/applications/new'
        className='md:hidden fixed bottom-4 right-4'
      >
        <Button className='size-10'>
          <Plus />
        </Button>
      </Link>
    </div>
  );
}

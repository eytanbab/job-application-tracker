'use client';

import { ColumnDef } from '@tanstack/react-table';

import { MoreHorizontal, Pencil, Trash2, ArrowUpDown } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { parseUrl } from 'next/dist/shared/lib/router/utils/parse-url';
import { deleteApplication } from '@/app/actions';
import { formatDate } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import { redirect } from 'next/navigation';

export type Application = {
  id: string;
  role_name: string;
  company: string;
  date_applied: string;
  link: URL;
  platform: string;
  status: string;
};

const handleApplicationDelete = async (id: string) => {
  try {
    await deleteApplication(id);
    toast({ description: 'successfully deleted application!' });
  } catch (err) {
    console.log(err);
  }
};

export const columns: ColumnDef<Application>[] = [
  {
    accessorKey: 'role_name',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          className='font-semibold'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Role
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
  },
  {
    accessorKey: 'company',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          className='font-semibold'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Company
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
  },
  {
    accessorKey: 'date_applied',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          className='font-semibold'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Date Applied
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      const formattedDate = formatDate(
        new Date(row.getValue('date_applied')),
        'dd/MM/yyyy'
      );
      return <div>{formattedDate}</div>;
    },
  },
  {
    accessorKey: 'link',
    header: 'Link',
    cell: ({ row }) => {
      const url = parseUrl(row.getValue('link'));
      return <Link href={url}>{row.getValue('link')}</Link>;
    },
  },
  {
    accessorKey: 'platform',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          className='font-semibold'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Platform
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          className='font-semibold'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Status
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='flex items-center justify-center w-fit bg-slate-100 text-indigo-600'>
            <DropdownMenuItem className='flex gap-1 focus:text-indigo-400'>
              {/* Implement edit functionality */}
              <button
                onClick={() =>
                  redirect(`/dashboard/application/${row.original.id}`)
                }
              >
                <Pencil className='size-6' />
              </button>
            </DropdownMenuItem>
            <DropdownMenuItem className='flex gap-1 focus:text-[#F16366]'>
              {/* Implement delete functionality */}
              <button onClick={() => handleApplicationDelete(row.original.id)}>
                <Trash2 className='size-6' />
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

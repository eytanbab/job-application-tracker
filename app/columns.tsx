'use client';

import { ColumnDef } from '@tanstack/react-table';

import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type Application = {
  role_name: string;
  company: string;
  date_applied: string;
  link: string;
  platform: string;
  status: string;
};

export const columns: ColumnDef<Application>[] = [
  {
    accessorKey: 'role_name',
    header: 'Role',
  },
  {
    accessorKey: 'company',
    header: 'Company',
  },
  {
    accessorKey: 'date_applied',
    header: 'Date Applied',
  },
  {
    accessorKey: 'link',
    header: 'Link',
  },
  {
    accessorKey: 'platform',
    header: 'Platform',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const application = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' className='h-8 w-8 p-0'>
              <span className='sr-only'>Open menu</span>
              <MoreHorizontal className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className='flex items-center justify-center w-fit'>
            <DropdownMenuItem className='flex gap-1'>
              {/* Implement edit functionality */}
              <button>
                <Pencil className='size-6' />
              </button>
            </DropdownMenuItem>
            <DropdownMenuItem className='flex gap-1'>
              {/* Implement delete functionality */}
              <button>
                <Trash2 className='size-6' />
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

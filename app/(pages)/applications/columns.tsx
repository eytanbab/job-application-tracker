'use client';

import { ColumnDef } from '@tanstack/react-table';

import { Trash2, ArrowUpDown } from 'lucide-react';

import Link from 'next/link';
import { parseUrl } from 'next/dist/shared/lib/router/utils/parse-url';

import { EditApplicationSheet } from '@/app/_components/edit-application-sheet';

import { deleteApplication, updateApplication } from '@/app/actions';
import { formatDate } from 'date-fns';
import { toast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { z } from 'zod';
import { insertApplicationSchema } from '@/app/db/schema';

const handleApplicationDelete = async (id: string) => {
  try {
    await deleteApplication(id);
    toast({ description: 'successfully deleted application!' });
  } catch (err) {
    console.log(err);
  }
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const columnsSchema = insertApplicationSchema.omit({ userId: true });

type FormValues = z.input<typeof columnsSchema>;

export const columns: ColumnDef<FormValues>[] = [
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
    accessorKey: 'company_name',
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
    header: () => {
      return <p className='font-semibold px-4 py-2'>Link</p>;
    },
    cell: ({ row }) => {
      let url;
      if (row.getValue('link')) {
        url = parseUrl(row.getValue('link'));
      } else {
        url = '';
      }
      return <Link href={url}>{row.getValue('link')}</Link>;
    },
  },
  {
    accessorKey: 'description',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          className='font-semibold'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Description
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
  },
  {
    accessorKey: 'location',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          className='font-semibold'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Location
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
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
      //Convert date string to Date object
      const date = new Date(row.original.date_applied);
      row.original.date_applied = date as unknown as string;
      // console.log('row:', row.original);
      const onSubmit = async (values: FormValues) => {
        try {
          await updateApplication(values);
          toast({
            description: 'Application updated successfully!',
            variant: 'default',
          });

          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (err) {
          toast({
            description: 'Failed to update application.',
            variant: 'destructive',
          });
        }
      };
      return (
        <div className='flex gap-2 items-center'>
          {/* Implement edit functionality */}
          <EditApplicationSheet row={row} onSubmit={onSubmit} />
          {/* Delete button */}
          <Dialog>
            <DialogTrigger>
              <Trash2 className='size-4 hover:text-[#CA3876]' />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete
                  your application and remove your data from our servers.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button
                    onClick={() => handleApplicationDelete(row.original.id!)}
                  >
                    Delete
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button type='button' variant='ghost'>
                    Cancel
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      );
    },
  },
];

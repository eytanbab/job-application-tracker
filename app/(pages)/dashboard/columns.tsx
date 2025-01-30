'use client';

import { ColumnDef } from '@tanstack/react-table';

import { Pencil, Trash2, ArrowUpDown } from 'lucide-react';

import Link from 'next/link';
import { parseUrl } from 'next/dist/shared/lib/router/utils/parse-url';

import { deleteApplication, updateApplication } from '@/app/actions';
import { formatDate } from 'date-fns';
import { toast } from '@/hooks/use-toast';

import {
  ApplicationForm,
  FormValues,
} from '@/app/_components/application-form';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
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

const handleApplicationDelete = async (id: string) => {
  try {
    await deleteApplication(id);
    toast({ description: 'successfully deleted application!' });
  } catch (err) {
    console.log(err);
  }
};

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
      //Convert date string to Date object
      const date = new Date(row.original.date_applied);
      row.original.date_applied = date;
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
            description: 'Failed to submit application.',
            variant: 'destructive',
          });
        }
      };
      return (
        <div className='flex gap-2 items-center'>
          {/* Implement edit functionality */}
          <Sheet>
            <SheetTrigger asChild>
              <button className='hover:text-[#38CA8C]'>
                <Pencil className='size-4' />
              </button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle className='font-normal text-indigo-600'>
                  Edit profile
                </SheetTitle>
              </SheetHeader>
              {/* Edit */}
              <ApplicationForm
                defaultValues={row.original}
                onSubmit={onSubmit}
              />
            </SheetContent>
          </Sheet>
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
                    onClick={() => handleApplicationDelete(row.original.id)}
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

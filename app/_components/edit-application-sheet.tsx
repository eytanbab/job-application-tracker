'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Pencil } from 'lucide-react';
import { ApplicationForm } from './application-form';

import { useState } from 'react';
import { insertApplicationSchema } from '../db/schema';
import { z } from 'zod';

type Row = {
  row: {
    original: FormValues;
  };
  onSubmit: (values: FormValues) => Promise<void>;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const editApplicationSchema = insertApplicationSchema.omit({ userId: true });

type FormValues = z.input<typeof editApplicationSchema>;

export const EditApplicationSheet = ({ row, onSubmit }: Row) => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className='hover:text-[#38CA8C]' onClick={() => setOpen(true)}>
          <Pencil className='size-4' />
        </button>
      </SheetTrigger>
      <SheetContent className='w-full space-y-4 overflow-y-auto flex flex-col items-center sm:items-start'>
        <SheetHeader>
          <SheetTitle className='font-normal text-indigo-600 dark:text-indigo-100 '>
            Edit application
          </SheetTitle>
        </SheetHeader>
        {/* Edit */}
        <ApplicationForm
          defaultValues={row.original}
          onSubmit={onSubmit}
          onClose={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
};

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

import { FormValues } from '@/app/_components/application-form';
import { useState } from 'react';

type Row = {
  row: {
    original: FormValues;
  };
  onSubmit: (values: FormValues) => Promise<void>;
};

export const EditApplicationSheet = ({ row, onSubmit }: Row) => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className='hover:text-[#38CA8C]' onClick={() => setOpen(true)}>
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
          onClose={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
};

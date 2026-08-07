'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          title="Edit application"
          onClick={() => setOpen(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className='w-full space-y-4 overflow-y-auto flex flex-col items-center sm:items-start'>
        <SheetHeader>
          <SheetTitle className='font-normal'>
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

'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ApplicationForm } from './application-form';

import { useState } from 'react';
import { insertApplicationSchema } from '../db/schema';
import { z } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const editApplicationSchema = insertApplicationSchema.omit({ userId: true });

type FormValues = z.input<typeof editApplicationSchema>;

type Row = {
  row: {
    original: FormValues;
  };
  onSubmit: (values: FormValues) => Promise<void>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  showTrigger?: boolean;
};

export const EditApplicationSheet = ({
  row,
  onSubmit,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  showTrigger = true,
}: Row) => {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = (newOpen: boolean) => {
    if (controlledOnOpenChange) {
      controlledOnOpenChange(newOpen);
    }
    if (!isControlled) {
      setInternalOpen(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            title="Edit application"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
            }}
          >
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="w-full sm:max-w-md md:max-w-lg overflow-y-auto max-h-[90vh] p-6">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-xl font-bold">
            Edit Job Application
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <ApplicationForm
            defaultValues={row.original}
            onSubmit={onSubmit}
            onClose={() => setOpen(false)}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};


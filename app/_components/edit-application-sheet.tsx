"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApplicationForm } from "./application-form";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { insertApplicationSchema } from "../db/schema";
import { z } from "zod";

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
  triggerClassName?: string;
};

export const EditApplicationSheet = ({
  row,
  onSubmit,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  showTrigger = true,
  triggerClassName,
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
            data-testid="edit-application-button"
            className={cn(
              "h-7 w-7 xl:h-8 xl:w-8 text-muted-foreground hover:text-foreground",
              triggerClassName,
            )}
            title="Edit application"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(true);
            }}
            onKeyDown={(e) => {
              e.stopPropagation();
            }}
          >
            <Pencil className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="w-full max-w-[calc(100vw-1.5rem)] sm:max-w-md md:max-w-lg p-0 overflow-hidden flex flex-col max-h-[85dvh] sm:max-h-[90vh] rounded-2xl border border-border/40 bg-card shadow-2xl">
        <DialogHeader className="px-4 sm:px-6 pt-5 pb-3 border-b border-border/30 shrink-0">
          <DialogTitle className="text-xl font-bold">
            Edit Job Application
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5">
            Update role details, notes, and application status.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
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

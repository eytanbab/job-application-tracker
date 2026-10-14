"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ApplicationForm, type ApplicationFormHandle } from "./application-form";

import { useRef, useState } from "react";
import {
  updateCachedApplicationDetails,
  useApplicationDetails,
} from "@/hooks/use-application-details";
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
  /** Where focus goes on close when the dialog was opened from a menu. */
  returnFocusRef?: React.RefObject<HTMLElement | null>;
};

export const EditApplicationSheet = ({
  row,
  onSubmit,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  showTrigger = true,
  triggerClassName,
  returnFocusRef,
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

  const formRef = useRef<ApplicationFormHandle>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // The row comes from the list, which leaves out the description and notes.
  // Render the form only once they're loaded, so saving can't blank them.
  const { details, error, retry } = useApplicationDetails(
    open ? row.original.id : null,
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        // Esc, outside click and the close button go through the form's
        // unsaved-changes guard instead of closing immediately.
        if (!nextOpen && formRef.current) {
          formRef.current.requestClose();
        } else {
          setOpen(nextOpen);
        }
      }}
    >
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
      <DialogContent
        className="w-full max-w-[calc(100vw-1.5rem)] sm:max-w-md md:max-w-lg p-0 overflow-hidden flex flex-col max-h-[85dvh] sm:max-h-[90vh] rounded-2xl border border-border/40 bg-card shadow-2xl"
        // Focus the title instead of the first input: Radix would select the
        // whole role title, so the first keystroke would replace it.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          titleRef.current?.focus();
        }}
        onCloseAutoFocus={(e) => {
          if (returnFocusRef?.current) {
            e.preventDefault();
            returnFocusRef.current.focus();
          }
        }}
      >
        <DialogHeader className="text-left px-4 sm:px-6 pt-5 pb-3 border-b border-border/30 shrink-0">
          <DialogTitle
            ref={titleRef}
            tabIndex={-1}
            className="text-xl font-bold focus:outline-none"
          >
            Edit Job Application
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5 truncate">
            {[row.original.company_name, row.original.role_name]
              .filter(Boolean)
              .join(" · ")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {details ? (
            <ApplicationForm
              ref={formRef}
              defaultValues={{ ...row.original, ...details }}
              onSubmit={async (values) => {
                await onSubmit(values);
                if (row.original.id) {
                  updateCachedApplicationDetails(row.original.id, {
                    description: values.description ?? null,
                    notes: values.notes ?? null,
                  });
                }
              }}
              onClose={() => setOpen(false)}
            />
          ) : error ? (
            <div className="flex flex-col items-center gap-3 px-6 py-10 text-center text-sm text-muted-foreground">
              <p>Couldn&apos;t load this application.</p>
              <Button variant="outline" size="sm" onClick={retry}>
                Try again
              </Button>
            </div>
          ) : (
            <div
              role="status"
              className="flex items-center justify-center gap-2 px-6 py-10 text-sm text-muted-foreground"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading application...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

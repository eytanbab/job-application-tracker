"use client";

import { useRef, useState, useTransition } from "react";
import { Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deleteApplication,
  updateApplication,
} from "@/app/actions/applications";
import { toast } from "@/hooks/use-toast";
import { useAddOptimisticChange } from "../hooks/optimistic-changes";
import { cn, resolveUpdatedStatus, type StatusKind } from "@/lib/utils";
import { stageLabels } from "./status-badge-classes";
import type { FormValues } from "../columns";

import { useLazyModule } from "../hooks/use-lazy-module";

// Loaded the first time a row's Edit is chosen (the table preloads it)
const loadEditSheet = () => import("@/app/_components/edit-application-sheet");

const STAGES: StatusKind[] = [
  "saved",
  "applied",
  "review",
  "interview",
  "accepted",
  "rejected",
  "ghosted",
];

/**
 * The ⋯ menu on a table row, matching the Kanban card's menu: view, edit,
 * change stage and delete. Edit and delete open the same dialogs as before.
 */
export function RowActions({
  application,
  onView,
}: {
  application: FormValues & { id?: string };
  onView?: () => void;
}) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  // Stays mounted once loaded, so closing animates
  const EditApplicationSheet = useLazyModule(loadEditSheet, {
    needed: isEditOpen,
    onFailed: () => setIsEditOpen(false),
  })?.EditApplicationSheet;
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [, startTransition] = useTransition();
  const addOptimisticChange = useAddOptimisticChange();
  // Dialogs open from a menu item that unmounts, so send focus back to
  // the ⋯ button when they close
  const triggerRef = useRef<HTMLButtonElement>(null);
  const label = `${application.role_name} at ${application.company_name}`;

  const moveTo = (stage: StatusKind) => {
    const status = resolveUpdatedStatus(application.status, stage);
    startTransition(async () => {
      if (application.id) addOptimisticChange({ kind: "move", id: application.id, statusCategory: stage, status });
      try {
        await updateApplication({
          ...application,
          statusCategory: stage,
          status,
        });
        toast({ description: `Moved to ${stageLabels[stage]}` });
      } catch (err) {
        console.error(err);
        toast({
          description: "Failed to update status",
          variant: "destructive",
        });
      }
    });
  };

  const remove = () => {
    const id = application.id;
    if (!id) return;
    startTransition(async () => {
      addOptimisticChange({ kind: "delete", id });
      try {
        await deleteApplication(id);
        toast({ description: "Application deleted." });
      } catch (err) {
        console.error(err);
        toast({
          description: "Failed to delete application",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div
      className="flex items-center justify-end"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={triggerRef}
            variant="ghost"
            size="icon"
            data-testid="row-actions-button"
            aria-label={`Actions for ${label}`}
            title="Actions"
            className={cn(
              "h-8 w-8 text-muted-foreground hover:text-foreground cursor-pointer",
              // Quiet at rest so the row reads as data, full on hover/focus
              "opacity-60 group-hover/row:opacity-100 focus-visible:opacity-100 data-[state=open]:opacity-100",
            )}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {onView && (
            <DropdownMenuItem onClick={onView}>
              <Eye className="h-4 w-4 mr-2" /> View details
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            data-testid="edit-application-button"
            onClick={() => setIsEditOpen(true)}
          >
            <Pencil className="h-4 w-4 mr-2" /> Edit
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Change status</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-40">
              {STAGES.map((stage) => (
                <DropdownMenuItem key={stage} onClick={() => moveTo(stage)}>
                  {stageLabels[stage]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            data-testid="delete-application-button"
            onClick={() => setIsDeleteOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {EditApplicationSheet && (
        <EditApplicationSheet
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          showTrigger={false}
          returnFocusRef={triggerRef}
          row={{ original: application }}
          onSubmit={async (values) => {
            try {
              await updateApplication(values);
              toast({ description: "Application updated successfully!" });
            } catch (err) {
              toast({
                description: "Failed to update application.",
                variant: "destructive",
              });
              throw err;
            }
          }}
        />
      )}

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            triggerRef.current?.focus();
          }}
        >
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your
              application for{" "}
              <strong className="text-foreground">
                {application.role_name}
              </strong>{" "}
              at{" "}
              <strong className="text-foreground">
                {application.company_name}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
              >
                Cancel
              </Button>
            </DialogClose>
            <DialogClose asChild>
              <Button
                variant="destructive"
                className="cursor-pointer"
                onClick={remove}
              >
                Delete Application
              </Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

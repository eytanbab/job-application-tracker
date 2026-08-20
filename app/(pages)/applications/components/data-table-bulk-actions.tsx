"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, Trash2, X, ChevronDown } from "lucide-react";
import { statusOptions, statusLabels, StatusKind } from "@/lib/utils";

interface DataTableBulkActionsProps {
  selectedCount: number;
  onDeselectAll: () => void;
  onBulkStatusChange: (category: string) => void;
  onBulkDelete: () => void;
}

export function DataTableBulkActions({
  selectedCount,
  onDeselectAll,
  onBulkStatusChange,
  onBulkDelete,
}: DataTableBulkActionsProps) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingStatusCategory, setPendingStatusCategory] = useState<string | null>(null);

  if (selectedCount === 0) return null;

  const targetStatusLabel = pendingStatusCategory
    ? statusLabels[pendingStatusCategory as StatusKind] || pendingStatusCategory
    : "";

  return (
    <>
      <div className="fixed bottom-0 md:bottom-6 left-0 right-0 md:left-1/2 md:-translate-x-1/2 z-50 bg-card/95 text-card-foreground backdrop-blur-md shadow-2xl md:shadow-lg md:rounded-xl rounded-t-2xl px-4 pt-3 pb-[calc(0.85rem+env(safe-area-inset-bottom))] md:py-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-t md:border border-border/60 transition-[transform,opacity] duration-200 md:max-w-xl">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold flex items-center gap-2 text-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>{selectedCount} application{selectedCount > 1 ? "s" : ""} selected</span>
          </span>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDeselectAll}
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 cursor-pointer"
            title="Deselect all"
          >
            <span>Cancel</span>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="hidden md:block h-4 w-px bg-border/60" />

        <div className="flex items-center gap-2 w-full md:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 md:h-8 text-xs flex-1 md:w-[140px] justify-between font-medium cursor-pointer"
              >
                <span>Mark Status</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-50 ml-1 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-[150px]">
              <DropdownMenuRadioGroup onValueChange={(val) => setPendingStatusCategory(val)}>
                {statusOptions.map((opt) => (
                  <DropdownMenuRadioItem
                    key={opt.value}
                    value={opt.value}
                    className="capitalize text-xs cursor-pointer"
                  >
                    {opt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            data-testid="bulk-delete-button"
            variant="destructive"
            size="sm"
            onClick={() => setIsConfirmOpen(true)}
            className="h-9 md:h-8 text-xs gap-1.5 font-semibold shrink-0 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent
          data-testid="bulk-delete-confirm-dialog"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>Delete {selectedCount} Applications?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete all{" "}
              <strong className="text-foreground">{selectedCount}</strong>{" "}
              selected job applications from your tracker.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              data-testid="bulk-delete-cancel-button"
              type="button"
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              data-testid="bulk-delete-confirm-button"
              variant="destructive"
              onClick={() => {
                onBulkDelete();
                setIsConfirmOpen(false);
              }}
              className="cursor-pointer"
            >
              Delete {selectedCount} Applications
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Status Change Confirmation Dialog */}
      <Dialog
        open={Boolean(pendingStatusCategory)}
        onOpenChange={(open) => !open && setPendingStatusCategory(null)}
      >
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>
              Update {selectedCount} Application{selectedCount > 1 ? "s" : ""} to {targetStatusLabel}?
            </DialogTitle>
            <DialogDescription>
              This will update the pipeline status and add a timeline event for all{" "}
              <strong className="text-foreground">{selectedCount}</strong>{" "}
              selected job applications.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingStatusCategory(null)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (pendingStatusCategory) {
                  onBulkStatusChange(pendingStatusCategory);
                  setPendingStatusCategory(null);
                }
              }}
              className="cursor-pointer"
            >
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

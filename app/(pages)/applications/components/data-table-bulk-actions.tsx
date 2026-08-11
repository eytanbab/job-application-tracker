"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Trash2, X } from "lucide-react";
import { statusOptions } from "@/lib/utils";

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
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-0 md:bottom-6 left-0 right-0 md:left-1/2 md:-translate-x-1/2 z-50 bg-foreground text-background shadow-2xl md:shadow-lg md:rounded-md rounded-t-xl px-4 py-3 md:py-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-t md:border border-border transition-[transform,opacity] duration-200">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          {selectedCount} selected
        </span>

        <button
          type="button"
          onClick={onDeselectAll}
          className="p-1 text-background/70 hover:text-background rounded-sm flex items-center gap-1 text-xs"
          title="Deselect all"
        >
          <span>Cancel</span>
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="hidden md:block h-4 w-px bg-background/30" />

      <div className="flex items-center gap-2 w-full md:w-auto">
        <Select onValueChange={onBulkStatusChange}>
          <SelectTrigger className="h-9 md:h-8 text-xs bg-background text-foreground flex-1 md:w-[150px] font-medium border-none">
            <SelectValue placeholder="Mark Status..." />
          </SelectTrigger>
          <SelectContent side="top">
            {statusOptions.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                className="capitalize text-xs"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="destructive"
          size="sm"
          onClick={onBulkDelete}
          className="h-9 md:h-8 text-xs gap-1.5 font-semibold shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>Bulk Delete</span>
        </Button>
      </div>
    </div>
  );
}

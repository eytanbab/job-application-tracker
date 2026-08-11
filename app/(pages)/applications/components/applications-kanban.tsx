"use client";

import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import {
  getStatusDisplay,
  getStatusKind,
  statusLabels,
  StatusKind,
} from "@/lib/utils";
import { updateApplication } from "@/app/actions/applications";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { KanbanCard, KanbanItem } from "./kanban-card";

export type { KanbanItem };

interface ApplicationsKanbanProps {
  data: KanbanItem[];
  searchFilter: string;
  statusFilter: string;
  onSelectApplication: (app: KanbanItem) => void;
  onEditApplication: (app: KanbanItem) => void;
  onDeleteApplication: (id: string) => void;
}

const KANBAN_COLUMNS: { id: StatusKind; label: string; headerBg: string }[] = [
  {
    id: "applied",
    label: "Applied",
    headerBg: "bg-primary/10 text-primary border-primary/25",
  },
  {
    id: "review",
    label: "In Review",
    headerBg:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25",
  },
  {
    id: "interview",
    label: "Interviewing",
    headerBg:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25",
  },
  {
    id: "accepted",
    label: "Offer / Accepted",
    headerBg:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25",
  },
  {
    id: "rejected",
    label: "Rejected",
    headerBg:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25",
  },
  {
    id: "ghosted",
    label: "Ghosted",
    headerBg: "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
  },
];

export function ApplicationsKanban({
  data,
  searchFilter,
  statusFilter,
  onSelectApplication,
  onEditApplication,
  onDeleteApplication,
}: ApplicationsKanbanProps) {
  const [, startTransition] = useTransition();
  const [dragOverCol, setDragOverCol] = useState<StatusKind | null>(null);
  const [activeMobileCol, setActiveMobileCol] = useState<StatusKind>("applied");

  const filteredData = useMemo(() => {
    const query = searchFilter.toLowerCase().trim();
    return data.filter((item) => {
      if (statusFilter && statusFilter !== "all") {
        const itemKind = getStatusKind(item.status, item.statusCategory);
        if (itemKind !== statusFilter) return false;
      }

      if (!query) return true;
      return (
        item.role_name.toLowerCase().includes(query) ||
        item.company_name.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.platform.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.notes && item.notes.toLowerCase().includes(query))
      );
    });
  }, [data, searchFilter, statusFilter]);

  const groupedData = useMemo(() => {
    const map: Record<StatusKind, KanbanItem[]> = {
      applied: [],
      review: [],
      interview: [],
      accepted: [],
      rejected: [],
      ghosted: [],
      other: [],
    };

    filteredData.forEach((item) => {
      const kind = getStatusKind(item.status, item.statusCategory);
      if (map[kind]) {
        map[kind].push(item);
      } else {
        map.other.push(item);
      }
    });

    return map;
  }, [filteredData]);

  const handleQuickStatusMove = (item: KanbanItem, newCategory: string) => {
    if (!item.id) return;
    const previousCategory = item.statusCategory || getStatusKind(item.status);
    startTransition(async () => {
      try {
        await updateApplication({
          ...item,
          id: item.id,
          statusCategory: newCategory,
          status: getStatusDisplay(item.status, newCategory),
        });
        toast({
          description: `Moved "${item.role_name}" to ${
            statusLabels[newCategory as StatusKind] || newCategory
          }`,
          action: (
            <ToastAction
              altText="Undo status change"
              onClick={() => handleQuickStatusMove(item, previousCategory)}
            >
              Undo
            </ToastAction>
          ),
        });
      } catch (err) {
        console.error(err);
        toast({
          description: "Failed to move application",
          variant: "destructive",
        });
      }
    });
  };

  const handleDropOnColumn = (targetColId: StatusKind, itemJson: string) => {
    try {
      const item: KanbanItem = JSON.parse(itemJson);
      const currentKind = getStatusKind(item.status, item.statusCategory);
      if (currentKind !== targetColId) {
        handleQuickStatusMove(item, targetColId);
      }
    } catch (err) {
      console.error("Failed to parse drag item:", err);
    }
  };

  const renderColumnContent = (
    col: (typeof KANBAN_COLUMNS)[0],
    colIdx: number,
  ) => {
    const items = groupedData[col.id] || [];
    const prevCol = colIdx > 0 ? KANBAN_COLUMNS[colIdx - 1] : null;
    const nextCol =
      colIdx < KANBAN_COLUMNS.length - 1 ? KANBAN_COLUMNS[colIdx + 1] : null;

    const isDropTarget = dragOverCol === col.id;

    return (
      <div
        key={col.id}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverCol(col.id);
        }}
        onDragLeave={() => setDragOverCol(null)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOverCol(null);
          const dataStr = e.dataTransfer.getData("application/json");
          if (dataStr) {
            handleDropOnColumn(col.id, dataStr);
          }
        }}
        className={cn(
          "w-full md:w-[280px] md:shrink-0 flex flex-col rounded-xl border p-3.5 shadow-2xs transition-all duration-200",
          isDropTarget
            ? "border-2 border-primary bg-primary/10 ring-2 ring-primary/20 scale-[1.01]"
            : "bg-card/40 border-border/40",
        )}
      >
        {/* Column Header */}
        <div
          className={`flex items-center justify-between px-3 py-2 rounded-md border font-semibold text-xs mb-3 ${col.headerBg}`}
        >
          <span className="truncate">{col.label}</span>
          <Badge
            variant="secondary"
            className="h-5 rounded-md px-2 text-[11px] shrink-0 font-bold"
          >
            {items.length}
          </Badge>
        </div>

        {/* Cards List */}
        <div className="flex flex-col gap-2.5 min-h-[260px] max-h-[68vh] overflow-y-auto pr-1 pb-4">
          {items.length === 0 ? (
            <div
              className={cn(
                "flex flex-col items-center justify-center p-8 text-center rounded-md border border-dashed text-xs text-muted-foreground transition-colors",
                isDropTarget
                  ? "border-primary text-primary font-medium bg-primary/5"
                  : "border-border/40",
              )}
            >
              {isDropTarget
                ? "Drop item here"
                : "No applications in this stage"}
            </div>
          ) : (
            items.map((item) => (
              <KanbanCard
                key={item.id}
                item={item}
                prevCol={prevCol}
                nextCol={nextCol}
                onSelectApplication={onSelectApplication}
                onEditApplication={onEditApplication}
                onDeleteApplication={onDeleteApplication}
                onQuickStatusMove={handleQuickStatusMove}
              />
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* Mobile Column Switcher */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none">
        {KANBAN_COLUMNS.map((col) => {
          const count = (groupedData[col.id] || []).length;
          const isActive = activeMobileCol === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setActiveMobileCol(col.id)}
              className={cn(
                "flex items-center gap-1.5 min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                  : "bg-card text-muted-foreground border-border/40 hover:text-foreground",
              )}
            >
              <span>{col.label}</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile View */}
      <div className="md:hidden">
        {(() => {
          const colIdx = KANBAN_COLUMNS.findIndex(
            (c) => c.id === activeMobileCol,
          );
          const col = KANBAN_COLUMNS[colIdx];
          return col ? renderColumnContent(col, colIdx) : null;
        })()}
      </div>

      {/* Desktop View */}
      <div className="hidden md:block w-full overflow-x-auto pb-4 pt-1 scrollbar-thin">
        <div className="flex gap-4 min-w-max w-full items-start">
          {KANBAN_COLUMNS.map((col, colIdx) =>
            renderColumnContent(col, colIdx),
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import {
  getStatusDisplay,
  getStatusKind,
  statusLabels,
  StatusKind,
  resolveUpdatedStatus,
  isStatusKind,
} from "@/lib/utils";
import {
  getApplicationsPage,
  updateApplication,
  type KanbanColumns,
} from "@/app/actions/applications";
import { KANBAN_PAGE_SIZE } from "@/lib/applications/list-query";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { KanbanCard, KanbanItem } from "./kanban-card";

export type { KanbanItem };

interface ApplicationsKanbanProps {
  /** The first cards of each column and each column's total, from the server. */
  columns: KanbanColumns;
  /** The active filters, reused when a column loads more cards. */
  searchFilter: string;
  statusFilter: string;
  platformFilter?: string | null;
  /** True while the server loads a new filter result. */
  isPending?: boolean;
  onSelectApplication: (app: KanbanItem) => void;
  onEditApplication: (app: KanbanItem) => void;
  onDeleteApplication: (id: string) => void;
}

const BASE_KANBAN_COLUMNS: {
  id: StatusKind;
  label: string;
  headerBg: string;
}[] = [
  {
    id: "applied",
    label: "Applied",
    headerBg: "bg-primary/10 text-primary border-primary/25",
  },
  {
    id: "review",
    label: "In Review",
    headerBg:
      "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/25",
  },
  {
    id: "interview",
    label: "Interviewing",
    headerBg:
      "bg-amber-500/10 text-amber-800 dark:text-amber-400 border-amber-500/25",
  },
  {
    id: "accepted",
    label: "Offer / Accepted",
    headerBg:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  },
  {
    id: "rejected",
    label: "Rejected",
    headerBg:
      "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25",
  },
  {
    id: "ghosted",
    label: "Ghosted",
    headerBg:
      "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30",
  },
];

export function ApplicationsKanban({
  columns,
  searchFilter,
  statusFilter,
  platformFilter,
  isPending = false,
  onSelectApplication,
  onEditApplication,
  onDeleteApplication,
}: ApplicationsKanbanProps) {
  const [, startTransition] = useTransition();
  const [dragOverCol, setDragOverCol] = useState<StatusKind | null>(null);
  const [activeMobileCol, setActiveMobileCol] = useState<StatusKind>("applied");
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // Six columns don't fit beside the sidebar on most laptops, so the board
  // scrolls sideways. Show fading edges and arrow buttons while there's
  // more to see, so the Rejected and Ghosted columns aren't missed.
  const boardRef = useRef<HTMLDivElement>(null);
  const [scrollEdges, setScrollEdges] = useState({ left: false, right: false });
  const updateScrollEdges = useCallback(() => {
    const el = boardRef.current;
    if (!el) return;
    const left = el.scrollLeft > 4;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 4;
    setScrollEdges((prev) =>
      prev.left === left && prev.right === right ? prev : { left, right },
    );
  }, []);
  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateScrollEdges);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    updateScrollEdges();
    return () => observer.disconnect();
  }, [updateScrollEdges]);
  const scrollBoard = (direction: 1 | -1) => {
    const el = boardRef.current;
    el?.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  };

  // Cards loaded with "Show more", per column, tagged with the server result
  // they extend. A new result (a filter change or a status move) starts
  // every column over.
  const [extraRows, setExtraRows] = useState<{
    source: KanbanColumns;
    rows: Partial<Record<StatusKind, KanbanItem[]>>;
  }>({ source: columns, rows: {} });
  const [loadingColumn, setLoadingColumn] = useState<StatusKind | null>(null);

  const groupedData = useMemo(() => {
    const moreRows = extraRows.source === columns ? extraRows.rows : {};
    const map = {} as Record<StatusKind, KanbanItem[]>;
    for (const option of [...BASE_KANBAN_COLUMNS, { id: "other" as const }]) {
      map[option.id] = [
        ...(columns[option.id]?.rows ?? []),
        ...(moreRows[option.id] ?? []),
      ];
    }
    return map;
  }, [columns, extraRows]);

  const columnTotal = (kind: StatusKind) => columns[kind]?.total ?? 0;

  const loadMore = async (kind: StatusKind) => {
    const source = columns;
    const loaded = groupedData[kind].length;
    setLoadingColumn(kind);
    try {
      const { rows } = await getApplicationsPage({
        q: searchFilter,
        status: kind,
        platform: platformFilter,
        page: Math.floor(loaded / KANBAN_PAGE_SIZE) + 1,
        size: KANBAN_PAGE_SIZE,
      });
      setExtraRows((prev) => {
        const current = prev.source === source ? prev.rows : {};
        const seen = new Set(groupedData[kind].map((item) => item.id));
        return {
          source,
          rows: {
            ...current,
            [kind]: [
              ...(current[kind] ?? []),
              ...rows.filter((row) => !seen.has(row.id)),
            ],
          },
        };
      });
    } catch (err) {
      console.error(err);
      toast({
        description: "Couldn't load more applications. Try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingColumn(null);
    }
  };

  const kanbanColumns = useMemo(() => {
    if (columnTotal("other") > 0) {
      return [
        ...BASE_KANBAN_COLUMNS,
        {
          id: "other" as StatusKind,
          label: "Other / Custom",
          headerBg:
            "bg-secondary text-secondary-foreground border-border/60",
        },
      ];
    }
    return BASE_KANBAN_COLUMNS;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    const threshold = 50;

    const currentIndex = kanbanColumns.findIndex(
      (c) => c.id === activeMobileCol,
    );
    if (diff > threshold && currentIndex < kanbanColumns.length - 1) {
      setActiveMobileCol(kanbanColumns[currentIndex + 1].id);
    } else if (diff < -threshold && currentIndex > 0) {
      setActiveMobileCol(kanbanColumns[currentIndex - 1].id);
    }
    setTouchStartX(null);
  };

  const handleQuickStatusMove = (item: KanbanItem, newCategory: string) => {
    if (!item.id) return;
    const cat = (isStatusKind(newCategory) ? newCategory : "other") as StatusKind;
    const previousCategory = item.statusCategory || getStatusKind(item.status);
    const updatedStatus = resolveUpdatedStatus(item.status, cat);
    startTransition(async () => {
      try {
        await updateApplication({
          ...item,
          id: item.id,
          statusCategory: cat,
          status: updatedStatus,
        });
        toast({
          description: `Moved "${item.role_name}" to ${
            statusLabels[cat] || cat
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
    col: { id: StatusKind; label: string; headerBg: string },
    colIdx: number,
  ) => {
    const items: KanbanItem[] = groupedData[col.id] || [];
    const prevCol = colIdx > 0 ? kanbanColumns[colIdx - 1] : null;
    const nextCol =
      colIdx < kanbanColumns.length - 1 ? kanbanColumns[colIdx + 1] : null;

    const isDropTarget = dragOverCol === col.id;

    return (
      <div
        key={col.id}
        data-testid={`kanban-column-${col.id}`}
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
          <h2 className="truncate">{col.label}</h2>
          <Badge
            variant="secondary"
            className="h-5 rounded-md px-2 text-[11px] shrink-0 font-bold"
          >
            {columnTotal(col.id)}
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
          {items.length < columnTotal(col.id) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => loadMore(col.id)}
              disabled={loadingColumn === col.id}
              className="h-8 shrink-0 text-xs font-semibold text-primary hover:bg-primary/10 cursor-pointer"
            >
              {loadingColumn === col.id ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Loading...
                </>
              ) : (
                `Show more (${columnTotal(col.id) - items.length})`
              )}
            </Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      aria-busy={isPending}
      className={cn(
        "w-full space-y-4 transition-opacity",
        isPending && "opacity-60 delay-150",
      )}
    >
      {/* Mobile Column Switcher (ARIA Tablist) */}
      <div
        role="tablist"
        aria-label="Kanban pipeline stages"
        className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {kanbanColumns.map((col) => {
          const count = columnTotal(col.id);
          const isActive = activeMobileCol === col.id;
          return (
            <button
              key={col.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`kanban-panel-${col.id}`}
              id={`kanban-tab-${col.id}`}
              type="button"
              onClick={() => setActiveMobileCol(col.id)}
              className={cn(
                "flex items-center gap-1.5 min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer shrink-0 select-none",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                  : "bg-card text-muted-foreground border-border/40 hover:text-foreground",
              )}
            >
              <span>{col.label}</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums",
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

      {/* Mobile View with Touch Swipe */}
      <div
        role="tabpanel"
        id={`kanban-panel-${activeMobileCol}`}
        aria-labelledby={`kanban-tab-${activeMobileCol}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="md:hidden touch-pan-y select-none"
      >
        {(() => {
          const colIdx = kanbanColumns.findIndex(
            (c) => c.id === activeMobileCol,
          );
          const col = kanbanColumns[colIdx];
          return col ? renderColumnContent(col, colIdx) : null;
        })()}
      </div>

      {/* Desktop View */}
      <div className="relative hidden md:block">
        <div
          ref={boardRef}
          onScroll={updateScrollEdges}
          className="w-full overflow-x-auto pb-4 pt-1"
        >
          <div className="flex gap-4 min-w-max w-full items-start">
            {kanbanColumns.map((col, colIdx) =>
              renderColumnContent(col, colIdx),
            )}
          </div>
        </div>
        {[
          { side: "left" as const, show: scrollEdges.left, dir: -1 as const, Icon: ChevronLeft },
          { side: "right" as const, show: scrollEdges.right, dir: 1 as const, Icon: ChevronRight },
        ].map(
          ({ side, show, dir, Icon }) =>
            show && (
              <div
                key={side}
                className={cn(
                  "pointer-events-none absolute top-0 bottom-4 w-20 from-background to-transparent",
                  side === "left" ? "left-0 bg-gradient-to-r" : "right-0 bg-gradient-to-l",
                )}
              >
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => scrollBoard(dir)}
                  aria-label={side === "left" ? "Scroll board left" : "Scroll board right"}
                  title={side === "left" ? "Scroll board left" : "Scroll board right"}
                  className={cn(
                    "pointer-events-auto absolute top-2.5 h-9 w-9 rounded-full shadow-md bg-card cursor-pointer",
                    side === "left" ? "left-1" : "right-1",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              </div>
            ),
        )}
      </div>
    </div>
  );
}

"use client";

import type { StatusCounts } from "@/lib/applications/list-query";
import { StatusKind } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface StatusFilterPillsProps {
  /** Application count per status across the whole account. */
  counts: StatusCounts;
  statusFilter?: string | null;
  onStatusFilterChange?: (filter: string | null) => void;
}

const PILL_OPTIONS: { id: StatusKind | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "applied", label: "Applied" },
  { id: "review", label: "In Review" },
  { id: "interview", label: "Interviewing" },
  { id: "accepted", label: "Offers" },
  { id: "rejected", label: "Rejected" },
  { id: "ghosted", label: "Ghosted" },
];

export function StatusFilterPills({
  counts,
  statusFilter,
  onStatusFilterChange,
}: StatusFilterPillsProps) {
  return (
    <div className="relative w-full">
      <div className="w-full flex items-center gap-1.5 overflow-x-auto pb-1 pr-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {PILL_OPTIONS.map((pill) => {
        const isActive =
          pill.id === "all"
            ? !statusFilter || statusFilter === "all"
            : statusFilter === pill.id;
        const count = counts[pill.id] ?? 0;

        return (
          <button
            key={pill.id}
            type="button"
            aria-pressed={isActive}
            onClick={() => {
              if (onStatusFilterChange) {
                if (pill.id === "all") {
                  onStatusFilterChange(null);
                } else {
                  onStatusFilterChange(isActive ? null : pill.id);
                }
              }
            }}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer select-none shrink-0 border",
              isActive
                ? "bg-primary text-primary-foreground border-primary shadow-xs"
                : "bg-card text-muted-foreground border-border/50 hover:border-primary/40 hover:text-foreground hover:bg-accent/50",
            )}
          >
            <span>{pill.label}</span>
            <span
              className={cn(
                "inline-flex items-center justify-center px-1.5 py-0.5 rounded-full text-xs font-semibold tabular-nums leading-none",
                isActive
                  ? "bg-primary-foreground text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
      </div>
      <div className="absolute right-0 top-0 bottom-1 w-10 bg-gradient-to-l from-background to-transparent pointer-events-none xl:hidden" />
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { getStatusKind, StatusKind } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ApplicationItem {
  id?: string;
  status: string;
  statusCategory?: string | null;
  [key: string]: unknown;
}

interface StatusFilterPillsProps {
  data: ApplicationItem[];
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
  data,
  statusFilter,
  onStatusFilterChange,
}: StatusFilterPillsProps) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {
      all: data.length,
      applied: 0,
      review: 0,
      interview: 0,
      accepted: 0,
      rejected: 0,
      ghosted: 0,
      other: 0,
    };

    data.forEach((item) => {
      const kind = getStatusKind(item.status, item.statusCategory);
      if (map[kind] !== undefined) {
        map[kind]++;
      } else {
        map.other++;
      }
    });

    return map;
  }, [data]);

  return (
    <div className="w-full flex items-center gap-1.5 overflow-x-auto pb-1 pr-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
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
  );
}

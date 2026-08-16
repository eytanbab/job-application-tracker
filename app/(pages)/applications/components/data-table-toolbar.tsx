"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NewApplicationButton } from "@/app/_components/new-application-button";
import {
  Search,
  X,
  RotateCcw,
  LayoutList,
  LayoutGrid,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableToolbarProps {
  globalFilter: string;
  setGlobalFilter: (val: string) => void;
  statusFilter: string | null;
  setStatusFilter: (val: string | null) => void;
  platformFilter: string | null;
  setPlatformFilter: (val: string | null) => void;
  uniquePlatforms: string[];
  hasActiveFilters: boolean;
  clearFilters: () => void;
  isMobileFilterOpen: boolean;
  setIsMobileFilterOpen: (val: boolean) => void;
  viewMode: string;
  setViewMode: (val: string) => void;
  onOpenCreate: () => void;
}

export function DataTableToolbar({
  globalFilter,
  setGlobalFilter,
  statusFilter,
  setStatusFilter,
  platformFilter,
  setPlatformFilter,
  uniquePlatforms,
  hasActiveFilters,
  clearFilters,
  isMobileFilterOpen,
  setIsMobileFilterOpen,
  viewMode,
  setViewMode,
  onOpenCreate,
}: DataTableToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-card border border-border/40 rounded-xl p-2.5 sm:p-3 shadow-2xs">
      {/* 1. Search Bar (Full-width on mobile) */}
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search applications..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(String(e.target.value))}
          className="pl-9 pr-8 w-full h-9 text-xs bg-background/60"
        />
        {globalFilter.length > 0 && (
          <button
            type="button"
            aria-label="Clear search filter"
            onClick={() => setGlobalFilter("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* 2. Controls Row: Platform Filter + View Mode Switcher */}
      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
        {/* Platform Dropdown & Reset */}
        <div className="flex items-center gap-1.5">
          {uniquePlatforms.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-9 text-xs capitalize justify-between bg-background/60 px-2.5 sm:px-3 font-medium cursor-pointer border-border/50 shrink-0",
                    platformFilter && "border-primary/40 bg-primary/5 text-primary",
                  )}
                >
                  <span className="truncate max-w-[100px] sm:max-w-[120px]">
                    {platformFilter ? platformFilter : "Platform"}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[150px]">
                <DropdownMenuRadioGroup
                  value={platformFilter || "all"}
                  onValueChange={(value) =>
                    setPlatformFilter(value === "all" ? null : value)
                  }
                >
                  <DropdownMenuRadioItem
                    value="all"
                    className="text-xs capitalize cursor-pointer"
                  >
                    All Platforms
                  </DropdownMenuRadioItem>
                  {uniquePlatforms.map((plat) => (
                    <DropdownMenuRadioItem
                      key={plat}
                      value={plat}
                      className="text-xs capitalize cursor-pointer"
                    >
                      {plat}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearFilters}
              title="Reset all filters"
              aria-label="Reset all filters"
              className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0 cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* View Mode Switcher: Cards/Table vs Board/Kanban */}
        <div className="flex items-center gap-2">
          <div
            role="radiogroup"
            aria-label="View mode"
            className="inline-flex items-center rounded-lg bg-muted/60 p-0.5 gap-0.5 border border-border/30"
          >
            <button
              type="button"
              role="radio"
              aria-checked={viewMode === "table"}
              onClick={() => setViewMode("table")}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                viewMode === "table"
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutList className="h-3.5 w-3.5" />
              <span className="sm:hidden">Cards</span>
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={viewMode === "kanban"}
              onClick={() => setViewMode("kanban")}
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer",
                viewMode === "kanban"
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="sm:hidden">Board</span>
              <span className="hidden sm:inline">Kanban</span>
            </button>
          </div>

          <NewApplicationButton
            onClick={onOpenCreate}
            label="Add Application"
            className="hidden md:inline-flex px-3.5 font-semibold h-9"
          />
        </div>
      </div>
    </div>
  );
}

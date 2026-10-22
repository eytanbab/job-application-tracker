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
import { cn, formatPlatformLabel } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

/** Wait for a pause in typing before querying the server. */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * The search box keeps what is typed in local state and passes it on after a
 * pause, so a keystroke re-renders only this input, not the table and cards.
 */
function SearchInput({
  value,
  onSearch,
}: {
  value: string;
  onSearch: (value: string) => void;
}) {
  const [text, setText] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // What this input last sent, so its own search arriving back (while the
  // user may have typed more) never replaces the text
  const sent = useRef(value);

  // A change from outside (back navigation, a link) replaces the text and
  // drops any search still waiting to be sent
  useEffect(() => {
    if (value === sent.current) return;
    clearTimeout(timer.current);
    sent.current = value;
    setText(value);
  }, [value]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const send = (next: string) => {
    sent.current = next;
    onSearch(next);
  };

  const update = (next: string) => {
    setText(next);
    clearTimeout(timer.current);
    if (!next) send("");
    else timer.current = setTimeout(() => send(next), SEARCH_DEBOUNCE_MS);
  };

  return (
    <>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        placeholder="Search applications..."
        value={text}
        onChange={(e) => update(e.target.value)}
        className="pl-9 pr-8 w-full h-9 text-xs bg-background/60"
      />
      {text.length > 0 && (
        <button
          type="button"
          aria-label="Clear search filter"
          onClick={() => update("")}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </>
  );
}

interface DataTableToolbarProps {
  globalFilter: string;
  setGlobalFilter: (val: string) => void;
  /** Changes when filters are reset, to clear the box. */
  searchResetKey: number;
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
  /** Optional first row inside the toolbar card (the status pills). */
  topRow?: React.ReactNode;
}

export function DataTableToolbar({
  globalFilter,
  setGlobalFilter,
  searchResetKey,
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
  topRow,
}: DataTableToolbarProps) {
  return (
    <div className="flex flex-col gap-2.5 bg-card border border-border/40 rounded-xl p-2.5 sm:p-3 shadow-2xs">
      {topRow}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* 1. Search Bar (Full-width on mobile) */}
        <div className="relative flex-1">
          <SearchInput
            key={searchResetKey}
            value={globalFilter}
            onSearch={setGlobalFilter}
          />
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
                      "h-9 text-xs justify-between bg-background/60 px-2.5 sm:px-3 font-medium cursor-pointer border-border/50 shrink-0",
                      platformFilter && "border-primary/40 bg-primary/5 text-primary",
                    )}
                  >
                    <span className="truncate max-w-[100px] sm:max-w-[120px]">
                      {platformFilter ? formatPlatformLabel(platformFilter) : "Platform"}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  collisionPadding={8}
                  className="w-48 max-h-64 sm:max-h-72 overflow-y-auto overflow-x-hidden"
                >
                  <DropdownMenuRadioGroup
                    value={platformFilter || "all"}
                    onValueChange={(value) =>
                      setPlatformFilter(value === "all" ? null : value)
                    }
                  >
                    <DropdownMenuRadioItem
                      value="all"
                      className="text-xs cursor-pointer"
                    >
                      <span className="truncate">All Platforms</span>
                    </DropdownMenuRadioItem>
                    {uniquePlatforms.map((plat) => (
                      <DropdownMenuRadioItem
                        key={plat}
                        value={plat}
                        title={formatPlatformLabel(plat)}
                        className="text-xs cursor-pointer"
                      >
                        <span className="truncate">{formatPlatformLabel(plat)}</span>
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

          {/* View Mode Switcher: List vs Board */}
          <div className="flex items-center gap-2">
            <div
              role="radiogroup"
              aria-label="View mode"
              className="inline-flex items-center rounded-lg bg-muted/40 p-0.5 gap-0.5 border border-border/30"
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
                List
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
                Board
              </button>
            </div>

            <NewApplicationButton
              onClick={onOpenCreate}
              label="Add Application"
              className="hidden lg:inline-flex px-3.5 font-semibold h-9"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

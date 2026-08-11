'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NewApplicationButton } from '@/app/_components/new-application-button';
import { Search, X, Filter, RotateCcw, LayoutList, LayoutGrid, Plus } from 'lucide-react';
import { statusOptions } from '@/lib/utils';
import { cn } from '@/lib/utils';

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
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card border border-border/30 rounded-xl p-3 sm:p-3.5 shadow-2xs">
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 flex-1">
        <div className="flex items-center gap-2 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-full sm:max-w-xs lg:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search role, company, location..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(String(e.target.value))}
              className="pl-9 pr-8 w-full h-9 text-xs bg-background"
            />
            {globalFilter.length > 0 && (
              <button
                type="button"
                aria-label="Clear search filter"
                onClick={() => setGlobalFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="h-9 px-3 text-xs gap-1.5 md:hidden shrink-0 bg-background"
          >
            <Filter className="h-3.5 w-3.5" />
            <span>Filters</span>
            {hasActiveFilters && (
              <Badge variant="default" className="h-4 px-1.5 text-[10px] font-bold rounded-full">
                •
              </Badge>
            )}
          </Button>
        </div>

        <div className={cn(
          "flex-col md:flex-row items-stretch md:items-center gap-2 flex-wrap transition-all",
          isMobileFilterOpen ? "flex" : "hidden md:flex"
        )}>
          <Select
            value={statusFilter || 'all'}
            onValueChange={(value) => setStatusFilter(value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-full md:w-[140px] h-9 text-xs capitalize bg-background">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statusOptions.map((status) => (
                <SelectItem key={status.value} value={status.value} className="capitalize text-xs">
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {uniquePlatforms.length > 0 && (
            <Select
              value={platformFilter || 'all'}
              onValueChange={(value) => setPlatformFilter(value === 'all' ? null : value)}
            >
              <SelectTrigger className="w-full md:w-[140px] h-9 text-xs capitalize bg-background">
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {uniquePlatforms.map((plat) => (
                  <SelectItem key={plat} value={plat} className="capitalize text-xs">
                    {plat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-9 px-2.5 justify-center"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between lg:justify-end gap-2.5 border-t lg:border-t-0 pt-2.5 lg:pt-0">
        <div className="inline-flex items-center rounded-md bg-muted/60 p-1 gap-1 border border-border/20">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer',
              viewMode === 'table'
                ? 'bg-background text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <LayoutList className="h-3.5 w-3.5" />
            <span>Table</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('kanban')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer',
              viewMode === 'kanban'
                ? 'bg-background text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Kanban</span>
          </button>
        </div>

        <NewApplicationButton
          onClick={onOpenCreate}
          label="Add Application"
          className="hidden md:inline-flex px-3.5 font-semibold"
        />
      </div>
    </div>
  );
}

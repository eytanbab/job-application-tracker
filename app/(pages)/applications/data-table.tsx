'use client';

import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useEffect, useMemo, useState, useTransition } from 'react';
import {
  getStatusDisplay,
  getStatusKind,
  statusOptions,
  statusLabels,
  type StatusKind,
} from '@/lib/utils';
import {
  Plus,
  X,
  LayoutList,
  LayoutGrid,
  Search,
  Building2,
  Calendar,
  ExternalLink,
  MapPin,
  RotateCcw,
  Trash2,
  CheckCircle2,
  Filter,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useQueryState,
  parseAsString,
  parseAsInteger,
  useQueryStates,
} from 'nuqs';

import { ApplicationsKpiSummary } from './components/applications-kpi-summary';
import { ApplicationsKanban } from './components/applications-kanban';
import { ApplicationDetailSheet } from './components/application-detail-sheet';
import { EditApplicationSheet } from '@/app/_components/edit-application-sheet';
import { ApplicationForm } from '@/app/_components/application-form';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { type FormValues } from './columns';
import { createApplication, deleteApplication, updateApplication } from '@/app/actions/applications';
import { toast } from '@/hooks/use-toast';
import { formatDate, parseISO, format } from 'date-fns';

interface ApplicationRow {
  id?: string;
  role_name: string;
  company_name: string;
  date_applied: string;
  link: string;
  platform: string;
  status: string;
  statusCategory?: string | null;
  month: string;
  year: string;
  description?: string | null;
  location: string;
  salary?: string | null;
  [key: string]: unknown;
}

interface DataTableProps<TData extends ApplicationRow, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

const TABLE_ROWS = [5, 10, 15, 20, 25];

const statusBadgeClasses: Record<StatusKind, string> = {
  applied: 'bg-primary/15 text-primary border border-primary/25 rounded-md font-semibold',
  accepted:
    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 rounded-md font-semibold',
  ghosted: 'bg-muted/80 text-muted-foreground border border-border/50 rounded-md font-medium',
  review: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25 rounded-md font-semibold',
  interview:
    'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 rounded-md font-semibold',
  rejected: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/25 rounded-md font-semibold',
  other: 'bg-secondary text-secondary-foreground border border-border rounded-md font-medium',
};

export function DataTable<TData extends ApplicationRow, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  // View mode: 'table' or 'kanban'
  const [viewMode, setViewMode] = useQueryState(
    'view',
    parseAsString.withDefault('table').withOptions({ shallow: false })
  );

  // Selected application for detail sheet
  const [selectedApp, setSelectedApp] = useState<TData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Quick slide-over create sheet
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // App to edit via EditApplicationSheet
  const [editingApp, setEditingApp] = useState<TData | null>(null);

  // Mobile filter collapsible state
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Row selection state
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [, startBulkTransition] = useTransition();

  // URL-bound filter & page state
  const [globalFilter, setGlobalFilter] = useQueryState(
    'q',
    parseAsString
      .withDefault('')
      .withOptions({ shallow: false, throttleMs: 300 })
  );

  const [statusFilter, setStatusFilter] = useQueryState(
    'status',
    parseAsString.withDefault('').withOptions({ shallow: false })
  );

  const [platformFilter, setPlatformFilter] = useQueryState(
    'platform',
    parseAsString.withDefault('').withOptions({ shallow: false })
  );

  const [sortingState, setSortingState] = useQueryStates(
    {
      sort: parseAsString,
      dir: parseAsString,
    },
    { shallow: false }
  );

  const [page, setPage] = useQueryState(
    'page',
    parseAsInteger.withDefault(1).withOptions({ shallow: false })
  );

  const [pageSizeParam, setPageSizeParam] = useQueryState(
    'size',
    parseAsInteger.withOptions({
      shallow: false,
    })
  );

  // Derive initial sorting from URL parameters
  const sorting: SortingState = useMemo(() => {
    if (sortingState.sort) {
      return [
        {
          id: sortingState.sort,
          desc: sortingState.dir === 'desc',
        },
      ];
    }
    return [];
  }, [sortingState.sort, sortingState.dir]);

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  // Sync status and platform filters from query params to column filters
  useEffect(() => {
    const nextFilters: ColumnFiltersState = [];
    if (statusFilter && statusFilter !== 'all') {
      nextFilters.push({ id: 'status', value: statusFilter });
    }
    if (platformFilter && platformFilter !== 'all') {
      nextFilters.push({ id: 'platform', value: platformFilter });
    }
    setColumnFilters(nextFilters);
  }, [statusFilter, platformFilter]);

  const [{ pageIndex, pageSize }, setPagination] = useState<PaginationState>({
    pageIndex: page - 1,
    pageSize: pageSizeParam ?? 10,
  });

  // Sync pagination state with query params
  useEffect(() => {
    setPagination({
      pageIndex: page - 1,
      pageSize: pageSizeParam ?? 10,
    });
  }, [page, pageSizeParam]);

  const handleSelectRow = (app: TData) => {
    setSelectedApp(app);
    setIsDetailOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteApplication(id);
      toast({ description: 'Application deleted successfully.' });
      if (selectedApp?.id === id) {
        setIsDetailOpen(false);
      }
    } catch {
      toast({
        description: 'Failed to delete application.',
        variant: 'destructive',
      });
    }
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: (updaterOrValue) => {
      const nextSorting =
        typeof updaterOrValue === 'function'
          ? updaterOrValue(sorting)
          : updaterOrValue;
      if (nextSorting.length > 0) {
        setSortingState({
          sort: nextSorting[0].id,
          dir: nextSorting[0].desc ? 'desc' : 'asc',
        });
      } else {
        setSortingState({ sort: null, dir: null });
      }
    },
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      const next = typeof updater === 'function' ? updater({ pageIndex, pageSize }) : updater;
      if (next.pageIndex !== pageIndex) {
        setPage(next.pageIndex + 1);
      }
      if (next.pageSize !== pageSize) {
        setPageSizeParam(next.pageSize);
      }
    },
    autoResetPageIndex: false,
    meta: {
      onSelectApplication: handleSelectRow,
    },
    state: {
      sorting,
      globalFilter,
      pagination: { pageIndex, pageSize },
      columnFilters,
      rowSelection,
    },
  });

  const uniquePlatforms = useMemo(() => {
    const set = new Set(data.map((item) => item.platform?.toLowerCase().trim()).filter(Boolean));
    return Array.from(set);
  }, [data]);

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  const handleBulkDelete = () => {
    if (selectedCount === 0) return;
    startBulkTransition(async () => {
      try {
        await Promise.all(
          selectedRows.map((row) => {
            if (row.original.id) {
              return deleteApplication(row.original.id);
            }
            return Promise.resolve();
          })
        );
        toast({ description: `Successfully deleted ${selectedCount} application(s).` });
        setRowSelection({});
      } catch {
        toast({ description: 'Failed to delete applications.', variant: 'destructive' });
      }
    });
  };

  const handleBulkStatusChange = (newCategory: string) => {
    if (selectedCount === 0) return;
    startBulkTransition(async () => {
      try {
        await Promise.all(
          selectedRows.map((row) => {
            if (row.original.id) {
              const updatedStatusText = getStatusDisplay('', newCategory);
              return updateApplication({
                ...row.original,
                id: row.original.id,
                statusCategory: newCategory,
                status: updatedStatusText.trim(),
              } as unknown as FormValues);
            }
            return Promise.resolve();
          })
        );
        toast({ description: `Updated status for ${selectedCount} application(s) to ${statusLabels[newCategory as StatusKind] || newCategory}.` });
        setRowSelection({});
      } catch {
        toast({ description: 'Failed to update application statuses.', variant: 'destructive' });
      }
    });
  };

  const hasActiveFilters = Boolean(
    globalFilter ||
    (statusFilter && statusFilter !== 'all') ||
    (platformFilter && platformFilter !== 'all')
  );

  const clearFilters = () => {
    setGlobalFilter('');
    setStatusFilter(null);
    setPlatformFilter(null);
  };

  const defaultCreateValues = {
    role_name: '',
    company_name: '',
    date_applied: format(Date.now(), 'yyyy-MM-dd'),
    link: '',
    description: '',
    location: '',
    status: 'Applied',
    statusCategory: 'applied',
    platform: '',
    month: '',
    year: '',
    salary: '',
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. KPI Top Summary Bar */}
      <ApplicationsKpiSummary data={data} />

      {/* 2. Controls Toolbar: Search, Multi-Filters, View Switcher & Quick Add CTA */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card border border-border/30 rounded-xl p-3 sm:p-3.5 shadow-2xs">
        {/* Top/Left: Search & Filter Toggle */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 flex-1">
          <div className="flex items-center gap-2 w-full md:w-auto flex-1">
            <div className="relative flex-1 max-w-full md:max-w-xs">
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

            {/* Mobile Filter Toggle Button */}
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

          {/* Status & Platform Filters (Always visible on desktop, toggleable on mobile) */}
          <div className={cn(
            "flex-col md:flex-row items-stretch md:items-center gap-2 flex-wrap transition-all",
            isMobileFilterOpen ? "flex" : "hidden md:flex"
          )}>
            {/* Status Filter */}
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

            {/* Platform Filter */}
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

        {/* Right: View Switcher & Desktop Add Button */}
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

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="hidden md:inline-flex gap-2 h-9 text-xs font-semibold shadow-2xs px-3.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add Application</span>
          </Button>
        </div>
      </div>

      {/* 3. Main View Section: Table vs Kanban */}
      {viewMode === 'kanban' ? (
        <ApplicationsKanban
          data={data}
          searchFilter={globalFilter}
          statusFilter={statusFilter}
          onSelectApplication={(app) => handleSelectRow(app as TData)}
          onEditApplication={(app) => setEditingApp(app as TData)}
          onDeleteApplication={handleDelete}
        />
      ) : (
        <div className="space-y-4">
          {/* Desktop Table Layout */}
          <div className="hidden md:block rounded-md border border-border/40 bg-card overflow-hidden shadow-2xs">
            <Table>
              <TableHeader className="bg-muted/30">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="border-b border-border/30">
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead
                          key={header.id}
                          className="px-4 py-3 font-bold text-foreground text-xs uppercase tracking-wider"
                        >
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && 'selected'}
                      onClick={() => handleSelectRow(row.original)}
                      className="cursor-pointer border-b border-border/30 transition-colors hover:bg-accent/40"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="px-4 py-3 text-sm">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-44 text-center text-muted-foreground"
                    >
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Filter className="h-8 w-8 text-muted-foreground/50" />
                        <p className="font-semibold text-foreground">No applications found</p>
                        <p className="text-xs text-muted-foreground max-w-xs">
                          {hasActiveFilters
                            ? 'No job applications match your current filters. Try resetting your search.'
                            : 'You have not added any job applications yet. Click "Add Application" to get started.'}
                        </p>
                        {hasActiveFilters && (
                          <Button variant="outline" size="sm" onClick={clearFilters} className="mt-2 text-xs h-8">
                            Reset Filters
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card Layout (< 768px) */}
          <div className="md:hidden space-y-3">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const item = row.original;
                const isSelected = row.getIsSelected();
                const kind = getStatusKind(item.status, item.statusCategory);
                const displayLabel = getStatusDisplay(
                  item.status,
                  item.statusCategory
                );
                const formattedDate = item.date_applied
                  ? formatDate(parseISO(item.date_applied), 'MMM d, yyyy')
                  : '';

                return (
                  <Card
                    key={row.id}
                    onClick={() => handleSelectRow(item)}
                    className={cn(
                      "cursor-pointer p-4 space-y-3 transition-all",
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm"
                        : "border bg-card hover:border-primary/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Selection Checkbox */}
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary shrink-0"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          row.toggleSelected(!!e.target.checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Select application"
                      />

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-sm sm:text-base text-foreground line-clamp-2 leading-tight">
                            {item.role_name}
                          </h3>

                          <Badge
                            variant="outline"
                            className={`capitalize shrink-0 text-[11px] py-0.5 px-2 ${statusBadgeClasses[kind]}`}
                          >
                            {displayLabel}
                          </Badge>
                        </div>

                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 truncate">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                          <span className="truncate">{item.company_name}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40 gap-2">
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        {formattedDate}
                      </span>

                      <div className="flex items-center gap-2 text-[11px]">
                        {item.location && (
                          <span className="flex items-center gap-1 max-w-[130px] truncate">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </span>
                        )}
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 -mr-1 text-muted-foreground hover:text-foreground inline-flex items-center justify-center min-h-[32px] min-w-[32px]"
                            title="Open Link"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <div className="text-center p-8 border rounded-md bg-card text-muted-foreground text-sm space-y-2">
                <p className="font-semibold text-foreground">No applications found</p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="text-xs">
                    Reset Filters
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2 px-1 text-xs text-muted-foreground">
            <p>
              Showing {table.getRowModel().rows.length} of{' '}
              {table.getFilteredRowModel().rows.length} application(s)
            </p>

            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Rows per page</span>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value));
                  }}
                >
                  <SelectTrigger className="h-8 w-[65px] bg-background">
                    <SelectValue placeholder={table.getState().pagination.pageSize} />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {TABLE_ROWS.map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="h-8 text-xs px-3"
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="h-8 text-xs px-3"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Floating Bulk Actions Bar (Responsive Desktop Pill vs Mobile Dock) */}
      {selectedCount > 0 && (
        <div className="fixed bottom-0 md:bottom-6 left-0 right-0 md:left-1/2 md:-translate-x-1/2 z-50 bg-foreground text-background shadow-2xl md:shadow-lg md:rounded-md rounded-t-xl px-4 py-3 md:py-2.5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-t md:border border-border animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              {selectedCount} selected
            </span>

            <button
              onClick={() => setRowSelection({})}
              className="p-1 text-background/70 hover:text-background rounded-sm flex items-center gap-1 text-xs"
              title="Deselect all"
            >
              <span>Cancel</span>
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="hidden md:block h-4 w-px bg-background/30" />

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Select onValueChange={handleBulkStatusChange}>
              <SelectTrigger className="h-9 md:h-8 text-xs bg-background text-foreground flex-1 md:w-[150px] font-medium border-none">
                <SelectValue placeholder="Mark Status..." />
              </SelectTrigger>
              <SelectContent side="top">
                {statusOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="capitalize text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="h-9 md:h-8 text-xs gap-1.5 font-semibold shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Bulk Delete</span>
            </Button>
          </div>
        </div>
      )}

      {/* Mobile Floating Action Button (FAB) */}
      <button
        type="button"
        onClick={() => setIsCreateOpen(true)}
        className={cn(
          "fixed right-5 z-40 md:hidden h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer ring-4 ring-background/50",
          selectedCount > 0 ? "bottom-24" : "bottom-6"
        )}
        aria-label="Add Application"
        title="Add Application"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* 5. Slide-over Creation Sheet */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-y-auto p-6">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="text-xl font-bold">New Job Application</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <ApplicationForm
              defaultValues={defaultCreateValues}
              onClose={() => setIsCreateOpen(false)}
              onSubmit={async (values) => {
                try {
                  await createApplication(values);
                  toast({ description: 'Application created successfully!' });
                  setIsCreateOpen(false);
                } catch {
                  toast({ description: 'Failed to create application', variant: 'destructive' });
                }
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* 6. Slide-over Detail Sheet */}
      <ApplicationDetailSheet
        application={selectedApp}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onEditClick={(app) => setEditingApp(app as TData)}
        onDeleteClick={handleDelete}
      />

      {/* Hidden Edit Sheet fallback */}
      {editingApp && (
        <EditApplicationSheet
          row={{ original: editingApp as unknown as FormValues }}
          onSubmit={async (values) => {
            try {
              await updateApplication(values);
              toast({ description: 'Application updated successfully!' });
              setEditingApp(null);
            } catch {
              toast({ description: 'Failed to update application', variant: 'destructive' });
            }
          }}
        />
      )}
    </div>
  );
}

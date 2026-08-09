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
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-card border border-border/30 rounded-xl p-3.5 shadow-2xs">
        {/* Left: Search & Filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search role, company, location..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(String(e.target.value))}
              className="pl-9 pr-8 w-full h-9 text-xs bg-background"
            />
            {globalFilter.length > 0 && (
              <button
                onClick={() => setGlobalFilter('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <Select
            value={statusFilter || 'all'}
            onValueChange={(value) => setStatusFilter(value === 'all' ? null : value)}
          >
            <SelectTrigger className="w-[140px] h-9 text-xs capitalize bg-background">
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
              <SelectTrigger className="w-[140px] h-9 text-xs capitalize bg-background">
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
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-9 px-2.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Filters
            </Button>
          )}
        </div>

        {/* Right: View Switcher & Quick Create Action */}
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
              <span className="hidden sm:inline">Table</span>
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
              <span className="hidden sm:inline">Kanban</span>
            </button>
          </div>

          <Button
            onClick={() => setIsCreateOpen(true)}
            className="gap-2 h-9 text-xs font-semibold shadow-2xs px-3.5"
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
                    className="cursor-pointer border bg-card p-4 space-y-3 hover:border-primary/50 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 overflow-hidden">
                        <h3 className="font-bold text-base text-foreground truncate">
                          {item.role_name}
                        </h3>
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 truncate">
                          <Building2 className="h-3.5 w-3.5 shrink-0" />
                          {item.company_name}
                        </p>
                      </div>

                      <Badge
                        variant="outline"
                        className={`capitalize shrink-0 ${statusBadgeClasses[kind]}`}
                      >
                        {displayLabel}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-1 border-t">
                      <span className="flex items-center gap-1 pt-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formattedDate}
                      </span>

                      <div className="flex items-center gap-2 pt-1">
                        {item.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {item.location}
                          </span>
                        )}
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-muted-foreground hover:text-foreground"
                          >
                            <ExternalLink className="h-4 w-4" />
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

      {/* 4. Floating Bulk Actions Bar */}
      {selectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background shadow-lg rounded-md px-4 py-2.5 flex items-center gap-3 border border-border animate-in slide-in-from-bottom duration-200">
          <span className="text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            {selectedCount} selected
          </span>

          <div className="h-4 w-px bg-background/30" />

          <Select onValueChange={handleBulkStatusChange}>
            <SelectTrigger className="h-8 text-xs bg-background text-foreground w-[150px] font-medium border-none">
              <SelectValue placeholder="Mark Status..." />
            </SelectTrigger>
            <SelectContent>
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
            className="h-8 text-xs gap-1.5 font-semibold"
          >
            <Trash2 className="h-3.5 w-3.5" /> Bulk Delete
          </Button>

          <button
            onClick={() => setRowSelection({})}
            className="p-1 text-background/70 hover:text-background rounded-sm"
            title="Deselect all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

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

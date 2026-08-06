'use client';

import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
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
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  getStatusDisplay,
  getStatusKind,
  statusOptions,
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
import { OnChangeFn } from '@tanstack/react-table';

import { ApplicationsKpiSummary } from './components/applications-kpi-summary';
import { ApplicationsKanban } from './components/applications-kanban';
import { ApplicationDetailSheet } from './components/application-detail-sheet';
import { EditApplicationSheet } from '@/app/_components/edit-application-sheet';
import { type FormValues } from './columns';
import { deleteApplication, updateApplication } from '@/app/actions/applications';
import { toast } from '@/hooks/use-toast';
import { formatDate, parseISO } from 'date-fns';

interface ApplicationRow {
  id?: string;
  role_name: string;
  company_name: string;
  date_applied: string;
  link: string;
  platform: string;
  status: string;
  statusCategory?: string | null;
  statusLabel?: string | null;
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
const MOBILE_DEFAULT_PAGE_SIZE = 5;
const DESKTOP_DEFAULT_PAGE_SIZE = 10;

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

  // App to edit via EditApplicationSheet
  const [editingApp, setEditingApp] = useState<TData | null>(null);

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

  // Sync status filter from query param to column filter
  useEffect(() => {
    if (statusFilter) {
      setColumnFilters([{ id: 'status', value: statusFilter }]);
    } else {
      setColumnFilters([]);
    }
  }, [statusFilter]);

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
    },
  });

  const statuses = useMemo(() => {
    const uniqueStatuses = new Set(
      data.map((item) => getStatusKind(item.status, item.statusCategory))
    );
    return statusOptions.filter((status) => uniqueStatuses.has(status.value));
  }, [data]);

  const hasActiveFilters = Boolean(globalFilter || statusFilter);

  const clearFilters = () => {
    setGlobalFilter('');
    setStatusFilter(null);
  };

  return (
    <div className="w-full space-y-6">
      {/* 1. KPI Top Summary Bar */}
      <ApplicationsKpiSummary data={data} />

      {/* 2. Controls Toolbar: Search, Filters, View Switcher & Primary Action */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Search & Filter */}
        <div className="flex flex-wrap items-center gap-2 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by role, company, location..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(String(e.target.value))}
              className="pl-9 pr-8 w-full bg-background"
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

          <Select
            value={
              (table.getColumn('status')?.getFilterValue() as string) ?? 'all'
            }
            onValueChange={(value) => {
              table
                .getColumn('status')
                ?.setFilterValue(value === 'all' ? '' : value);
            }}
          >
            <SelectTrigger className="w-[160px] sm:w-[180px] capitalize bg-background">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map((status) => (
                <SelectItem
                  key={status.value}
                  value={status.value}
                  className="capitalize"
                >
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-xs text-muted-foreground hover:text-foreground gap-1.5 h-9"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Filters
            </Button>
          )}
        </div>

        {/* Right: View Switcher & New Application CTA */}
        <div className="flex items-center justify-between md:justify-end gap-2 border-t md:border-t-0 pt-2 md:pt-0">
          {/* View Toggle Segmented Buttons */}
          <div className="inline-flex items-center rounded-xl bg-muted/60 p-1 gap-1">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
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
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer',
                viewMode === 'kanban'
                  ? 'bg-background text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
          </div>

          <Link href="/applications/new">
            <Button className="gap-2 min-h-[38px] font-medium shadow-2xs">
              <Plus className="h-4 w-4" />
              <span>Add Application</span>
            </Button>
          </Link>
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
          {/* Desktop Table Layout (>= 768px) */}
          <div className="hidden md:block rounded-xl border border-border/30 bg-card overflow-hidden shadow-2xs">
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
                      className="h-32 text-center text-muted-foreground"
                    >
                      No applications found. Try adjusting your filters.
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
                  item.statusCategory,
                  item.statusLabel
                );
                const formattedDate = item.date_applied
                  ? formatDate(parseISO(item.date_applied), 'MMM d, yyyy')
                  : '';

                return (
                  <Card
                    key={row.id}
                    onClick={() => handleSelectRow(item)}
                    className="cursor-pointer border bg-card p-4 space-y-3 hover:border-primary/50 transition-all active:scale-[0.99]"
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
              <div className="text-center p-8 border rounded-xl bg-card text-muted-foreground text-sm">
                No applications found.
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

      {/* 4. Slide-over Detail Sheet */}
      <ApplicationDetailSheet
        application={selectedApp}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onEditClick={(app) => setEditingApp(app as TData)}
        onDeleteClick={handleDelete}
      />

      {/* Hidden Edit Sheet for Kanban/Detail trigger */}
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

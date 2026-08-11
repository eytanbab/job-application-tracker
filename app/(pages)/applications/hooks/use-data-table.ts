'use client';

import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  SortingState,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useEffect, useMemo, useState, useTransition } from 'react';
import { getStatusDisplay, statusLabels, type StatusKind } from '@/lib/utils';
import {
  useQueryState,
  parseAsString,
  parseAsInteger,
  useQueryStates,
} from 'nuqs';
import { deleteApplication, updateApplication } from '@/app/actions/applications';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { type FormValues } from '../columns';

export interface ApplicationRow {
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

export function useDataTable<TData extends ApplicationRow, TValue>({
  columns,
  data,
}: {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}) {
  const [viewMode, setViewMode] = useQueryState(
    'view',
    parseAsString.withDefault('table').withOptions({ shallow: false })
  );

  const [selectedApp, setSelectedApp] = useState<TData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<TData | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  useEffect(() => {
    const handleOpen = () => setIsCreateOpen(true);
    window.addEventListener('open-create-application', handleOpen);

    if (typeof window !== 'undefined' && sessionStorage.getItem('auto_open_create_app') === 'true') {
      sessionStorage.removeItem('auto_open_create_app');
      setIsCreateOpen(true);
    }

    return () => {
      window.removeEventListener('open-create-application', handleOpen);
    };
  }, []);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [, startBulkTransition] = useTransition();

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
    parseAsInteger.withOptions({ shallow: false })
  );

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
    const set = new Set<string>();
    for (const item of data) {
      if (item.platform) {
        const p = item.platform.toLowerCase().trim();
        if (p) set.add(p);
      }
    }
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

  return {
    viewMode,
    setViewMode,
    selectedApp,
    isDetailOpen,
    setIsDetailOpen,
    isCreateOpen,
    setIsCreateOpen,
    editingApp,
    setEditingApp,
    isMobileFilterOpen,
    setIsMobileFilterOpen,
    globalFilter,
    setGlobalFilter,
    statusFilter,
    setStatusFilter,
    platformFilter,
    setPlatformFilter,
    table,
    uniquePlatforms,
    selectedCount,
    handleBulkDelete,
    handleBulkStatusChange,
    hasActiveFilters,
    clearFilters,
    defaultCreateValues,
    handleSelectRow,
    handleDelete,
    setRowSelection,
  };
}

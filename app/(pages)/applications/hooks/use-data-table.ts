"use client";

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
} from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import {
  getStatusDisplay,
  statusLabels,
  type StatusKind,
  resolveUpdatedStatus,
  isStatusKind,
} from "@/lib/utils";
import {
  useQueryState,
  parseAsString,
  parseAsInteger,
  parseAsBoolean,
  useQueryStates,
} from "nuqs";
import {
  deleteApplication,
  updateApplication,
} from "@/app/actions/applications";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { type FormValues } from "../columns";

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
    "view",
    parseAsString.withDefault("table").withOptions({ shallow: true }),
  );

  const [selectedApp, setSelectedApp] = useState<TData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<TData | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [appIdParam, setAppIdParam] = useQueryState(
    "appId",
    parseAsString.withDefault("").withOptions({ shallow: true }),
  );

  // Synchronize appIdParam with selectedApp
  useEffect(() => {
    if (appIdParam) {
      const match = data.find((item) => item.id === appIdParam);
      if (match) {
        setSelectedApp(match);
        setIsDetailOpen(true);
      } else {
        setSelectedApp(null);
        setIsDetailOpen(false);
      }
    } else {
      setSelectedApp(null);
      setIsDetailOpen(false);
    }
  }, [appIdParam, data]);

  const [createParam, setCreateParam] = useQueryState(
    "create",
    parseAsBoolean.withDefault(false).withOptions({ shallow: false }),
  );

  useEffect(() => {
    const handleOpen = () => setIsCreateOpen(true);
    window.addEventListener("open-create-application", handleOpen);

    if (
      typeof window !== "undefined" &&
      sessionStorage.getItem("auto_open_create_app") === "true"
    ) {
      sessionStorage.removeItem("auto_open_create_app");
      setIsCreateOpen(true);
    }

    if (createParam) {
      setIsCreateOpen(true);
      setCreateParam(null);
    }

    return () => {
      window.removeEventListener("open-create-application", handleOpen);
    };
  }, [createParam, setCreateParam]);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [isBulkPending, startBulkTransition] = useTransition();

  const [globalFilter, setGlobalFilter] = useQueryState(
    "q",
    parseAsString
      .withDefault("")
      .withOptions({ shallow: true, throttleMs: 200 }),
  );

  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsString.withDefault("").withOptions({ shallow: true }),
  );

  const [platformFilter, setPlatformFilter] = useQueryState(
    "platform",
    parseAsString.withDefault("").withOptions({ shallow: true }),
  );

  const [sortingState, setSortingState] = useQueryStates(
    {
      sort: parseAsString,
      dir: parseAsString,
    },
    { shallow: true },
  );

  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({ shallow: true }),
  );

  const [pageSizeParam, setPageSizeParam] = useQueryState(
    "size",
    parseAsInteger.withOptions({ shallow: true }),
  );

  const sorting: SortingState = useMemo(() => {
    if (sortingState.sort) {
      return [
        {
          id: sortingState.sort,
          desc: sortingState.dir === "desc",
        },
      ];
    }
    return [];
  }, [sortingState.sort, sortingState.dir]);

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  useEffect(() => {
    const nextFilters: ColumnFiltersState = [];
    if (statusFilter && statusFilter !== "all") {
      nextFilters.push({ id: "status", value: statusFilter });
    }
    if (platformFilter && platformFilter !== "all") {
      nextFilters.push({ id: "platform", value: platformFilter });
    }
    setColumnFilters(nextFilters);
  }, [statusFilter, platformFilter]);

  // Reset pagination to first page whenever search or filters change
  useEffect(() => {
    setPage(1);
    setPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }));
  }, [globalFilter, statusFilter, platformFilter, setPage]);

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

  const handleSelectRow = useCallback(
    (app: TData) => {
      setSelectedApp(app);
      setIsDetailOpen(true);
      if (app.id) {
        setAppIdParam(app.id);
      }
    },
    [setAppIdParam],
  );

  const handleCloseDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedApp(null);
    setAppIdParam("");
  }, [setAppIdParam]);

  const handleDelete = async (id: string) => {
    try {
      await deleteApplication(id);
      toast({ description: "Application deleted successfully." });
      if (selectedApp?.id === id || appIdParam === id) {
        handleCloseDetail();
      }
    } catch {
      toast({
        description: "Failed to delete application.",
        variant: "destructive",
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
        typeof updaterOrValue === "function"
          ? updaterOrValue(sorting)
          : updaterOrValue;
      if (nextSorting.length > 0) {
        setSortingState({
          sort: nextSorting[0].id,
          dir: nextSorting[0].desc ? "desc" : "asc",
        });
      } else {
        setSortingState({ sort: null, dir: null });
      }
    },
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const search = String(filterValue ?? "").toLowerCase().trim();
      if (!search) return true;
      const app = row.original;
      const company = String(app.company_name ?? "").toLowerCase();
      const role = String(app.role_name ?? "").toLowerCase();
      const location = String(app.location ?? "").toLowerCase();
      const platform = String(app.platform ?? "").toLowerCase();
      const status = String(app.status ?? "").toLowerCase();
      const category = String(app.statusCategory ?? "").toLowerCase();
      const salary = String(app.salary ?? "").toLowerCase();
      const description = String(app.description ?? "").toLowerCase();

      return (
        company.includes(search) ||
        role.includes(search) ||
        location.includes(search) ||
        platform.includes(search) ||
        status.includes(search) ||
        category.includes(search) ||
        salary.includes(search) ||
        description.includes(search)
      );
    },
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex, pageSize })
          : updater;
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
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const selectedRows = table.getSelectedRowModel().rows;
  const selectedCount = selectedRows.length;

  const handleBulkDelete = () => {
    if (selectedCount === 0) return;
    startBulkTransition(async () => {
      const results = await Promise.allSettled(
        selectedRows.map(async (row) => {
          if (row.original.id) {
            await deleteApplication(row.original.id);
            return row.id;
          }
          return row.id;
        }),
      );
      const successfulIds = new Set(
        results
          .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
          .map((r) => r.value),
      );
      const succeededCount = successfulIds.size;
      const failedCount = selectedCount - succeededCount;

      if (failedCount === 0) {
        toast({
          description: `Successfully deleted ${succeededCount} application(s).`,
        });
        setRowSelection({});
      } else if (succeededCount === 0) {
        toast({
          description: "Failed to delete applications.",
          variant: "destructive",
        });
      } else {
        toast({
          description: `Deleted ${succeededCount} of ${selectedCount} application(s). ${failedCount} failed.`,
          variant: "destructive",
        });
        setRowSelection((prev) => {
          const next: RowSelectionState = {};
          Object.keys(prev).forEach((rowKey) => {
            if (!successfulIds.has(rowKey)) {
              next[rowKey] = true;
            }
          });
          return next;
        });
      }
    });
  };

  const handleBulkStatusChange = (newCategory: string) => {
    if (selectedCount === 0) return;
    const cat = (isStatusKind(newCategory) ? newCategory : "other") as StatusKind;
    startBulkTransition(async () => {
      const results = await Promise.allSettled(
        selectedRows.map(async (row) => {
          if (row.original.id) {
            const updatedStatusText = resolveUpdatedStatus(
              row.original.status,
              cat,
            );
            await updateApplication({
              ...row.original,
              id: row.original.id,
              statusCategory: cat,
              status: updatedStatusText.trim(),
            } as unknown as FormValues);
            return row.id;
          }
          return row.id;
        }),
      );
      const successfulIds = new Set(
        results
          .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
          .map((r) => r.value),
      );
      const succeededCount = successfulIds.size;
      const failedCount = selectedCount - succeededCount;

      if (failedCount === 0) {
        toast({
          description: `Updated status for ${succeededCount} application(s) to ${statusLabels[cat] || cat}.`,
        });
        setRowSelection({});
      } else if (succeededCount === 0) {
        toast({
          description: "Failed to update application statuses.",
          variant: "destructive",
        });
      } else {
        toast({
          description: `Updated ${succeededCount} of ${selectedCount} application(s). ${failedCount} failed.`,
          variant: "destructive",
        });
        setRowSelection((prev) => {
          const next: RowSelectionState = {};
          Object.keys(prev).forEach((rowKey) => {
            if (!successfulIds.has(rowKey)) {
              next[rowKey] = true;
            }
          });
          return next;
        });
      }
    });
  };

  const hasActiveFilters = Boolean(
    globalFilter ||
    (statusFilter && statusFilter !== "all") ||
    (platformFilter && platformFilter !== "all"),
  );

  const clearFilters = () => {
    setGlobalFilter("");
    setStatusFilter(null);
    setPlatformFilter(null);
  };

  const defaultCreateValues = {
    role_name: "",
    company_name: "",
    date_applied: format(Date.now(), "yyyy-MM-dd"),
    link: "",
    description: "",
    location: "",
    status: "Applied",
    statusCategory: "applied",
    platform: "",
    month: "",
    year: "",
    salary: "",
  };

  const filteredApps = useMemo(() => {
    const rows = table.getFilteredRowModel().rows;
    return rows.map((r) => r.original);
  }, [table]);

  const activeAppIndex = useMemo(() => {
    if (!selectedApp?.id) return -1;
    const idx = filteredApps.findIndex((item) => item.id === selectedApp.id);
    if (idx !== -1) return idx;
    return data.findIndex((item) => item.id === selectedApp.id);
  }, [selectedApp?.id, filteredApps, data]);

  const currentList = useMemo(() => {
    const inFiltered = filteredApps.some((item) => item.id === selectedApp?.id);
    return inFiltered ? filteredApps : data;
  }, [filteredApps, data, selectedApp?.id]);

  const hasPreviousApp = activeAppIndex > 0;
  const hasNextApp =
    activeAppIndex >= 0 && activeAppIndex < currentList.length - 1;

  const goToPreviousApp = useCallback(() => {
    if (activeAppIndex > 0) {
      const prev = currentList[activeAppIndex - 1];
      if (prev?.id) {
        setSelectedApp(prev);
        setAppIdParam(prev.id);
      }
    }
  }, [activeAppIndex, currentList, setAppIdParam]);

  const goToNextApp = useCallback(() => {
    if (activeAppIndex >= 0 && activeAppIndex < currentList.length - 1) {
      const next = currentList[activeAppIndex + 1];
      if (next?.id) {
        setSelectedApp(next);
        setAppIdParam(next.id);
      }
    }
  }, [activeAppIndex, currentList, setAppIdParam]);

  return {
    viewMode,
    setViewMode,
    selectedApp,
    isDetailOpen,
    setIsDetailOpen,
    handleCloseDetail,
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
    isBulkPending,
    handleBulkDelete,
    handleBulkStatusChange,
    hasActiveFilters,
    clearFilters,
    defaultCreateValues,
    handleSelectRow,
    handleDelete,
    setRowSelection,
    hasPreviousApp,
    hasNextApp,
    goToPreviousApp,
    goToNextApp,
    currentIndex: activeAppIndex >= 0 ? activeAppIndex + 1 : 0,
    totalApps: currentList.length,
  };
}

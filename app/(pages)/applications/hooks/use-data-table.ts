"use client";

import {
  ColumnDef,
  RowSelectionState,
  SortingState,
  Updater,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  statusLabels,
  type StatusKind,
  resolveUpdatedStatus,
  isStatusKind,
} from "@/lib/utils";
import {
  useQueryState,
  useQueryStates,
  parseAsString,
  parseAsBoolean,
  debounce,
} from "nuqs";
import {
  deleteApplication,
  updateApplication,
} from "@/app/actions/applications";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { type FormValues } from "../columns";
import {
  applicationsSearchParams,
  DEFAULT_PAGE_SIZE,
} from "@/lib/applications/list-query";

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
  totalRows,
  platforms,
  linkedApp,
}: {
  columns: ColumnDef<TData, TValue>[];
  /** The rows of the current page, already filtered and sorted on the server. */
  data: TData[];
  /** Rows matching the current filters across all pages. */
  totalRows: number;
  platforms: string[];
  /** The ?appId= row when it isn't on the current page. */
  linkedApp: TData | null;
}) {
  // Filters, sorting and paging live in the URL and are applied by the
  // server, so changing them re-renders the page with a new slice of rows.
  // The transition keeps the current rows on screen while that loads.
  const [isPending, startTransition] = useTransition();

  const [
    {
      q: globalFilter,
      status: statusFilter,
      platform: platformFilter,
      sort,
      dir,
      page,
      size,
      view: viewMode,
    },
    setParams,
  ] = useQueryStates(applicationsSearchParams, {
    shallow: false,
    startTransition,
  });

  const setViewMode = useCallback(
    (view: string) =>
      setParams({ view: view === "kanban" ? "kanban" : "table", page: null }),
    [setParams],
  );
  // Every filter change starts again from page 1
  const setGlobalFilter = useCallback(
    (value: string) =>
      setParams(
        { q: value || null, page: null },
        // Wait for a pause in typing before querying the server
        value ? { limitUrlUpdates: debounce(300) } : undefined,
      ),
    [setParams],
  );
  const setStatusFilter = useCallback(
    (value: string | null) =>
      setParams({
        status: value && value !== "all" ? value : null,
        page: null,
      }),
    [setParams],
  );
  const setPlatformFilter = useCallback(
    (value: string | null) =>
      setParams({
        platform: value && value !== "all" ? value : null,
        page: null,
      }),
    [setParams],
  );

  const [selectedApp, setSelectedApp] = useState<TData | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<TData | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const selectedAppRef = useRef<TData | null>(null);
  useEffect(() => {
    selectedAppRef.current = selectedApp;
  }, [selectedApp]);

  const [appIdParam, setAppIdParam] = useQueryState(
    "appId",
    parseAsString.withDefault("").withOptions({ shallow: true }),
  );

  // Synchronize appIdParam with selectedApp
  useEffect(() => {
    if (appIdParam) {
      const match =
        data.find((item) => item.id === appIdParam) ??
        (linkedApp?.id === appIdParam ? linkedApp : null);
      if (match) {
        setSelectedApp(match);
        setIsDetailOpen(true);
      } else if (selectedAppRef.current?.id !== appIdParam) {
        // Rows opened from a Kanban "Show more" batch aren't in `data`, so
        // only close the panel when it shows a different row.
        setSelectedApp(null);
        setIsDetailOpen(false);
      }
    } else {
      setSelectedApp(null);
      setIsDetailOpen(false);
    }
  }, [appIdParam, data, linkedApp]);

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

  // The selection belongs to the rows it was made on: a new page of rows
  // (paging, filtering or a refresh after a save) starts with none.
  const [selection, setSelection] = useState<{
    rows: TData[];
    value: RowSelectionState;
  }>({ rows: data, value: {} });
  const rowSelection = selection.rows === data ? selection.value : {};
  const setRowSelection = useCallback(
    (updater: Updater<RowSelectionState>) =>
      setSelection((prev) => {
        const current = prev.rows === data ? prev.value : {};
        return {
          rows: data,
          value: typeof updater === "function" ? updater(current) : updater,
        };
      }),
    [data],
  );
  const [isBulkPending, startBulkTransition] = useTransition();

  const sorting: SortingState = useMemo(
    () => (sort ? [{ id: sort, desc: dir === "desc" }] : []),
    [sort, dir],
  );
  const pageSize = size ?? DEFAULT_PAGE_SIZE;
  const pageIndex = Math.max(0, page - 1);

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
    getRowId: (row, index) => row.id ?? String(index),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    rowCount: totalRows,
    onSortingChange: (updaterOrValue) => {
      const nextSorting =
        typeof updaterOrValue === "function"
          ? updaterOrValue(sorting)
          : updaterOrValue;
      const next = nextSorting[0];
      setParams({
        sort: (next?.id as typeof sort) ?? null,
        dir: next ? (next.desc ? "desc" : "asc") : null,
        page: null,
      });
    },
    onRowSelectionChange: setRowSelection,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === "function"
          ? updater({ pageIndex, pageSize })
          : updater;
      // A new page size starts again from page 1
      setParams(
        next.pageSize !== pageSize
          ? { page: null, size: next.pageSize }
          : { page: next.pageIndex + 1 },
      );
    },
    meta: {
      onSelectApplication: handleSelectRow,
    },
    state: {
      sorting,
      pagination: { pageIndex, pageSize },
      rowSelection,
    },
  });

  const uniquePlatforms = platforms;

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
    setParams({ q: null, status: null, platform: null, page: null });
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

  // J/K move through the rows of the current page
  const currentList = data;
  const activeAppIndex = useMemo(
    () =>
      selectedApp?.id
        ? currentList.findIndex((item) => item.id === selectedApp.id)
        : -1,
    [selectedApp?.id, currentList],
  );

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
    isPending,
  };
}

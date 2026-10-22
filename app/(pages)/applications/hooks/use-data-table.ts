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
  useOptimistic,
  useTransition,
} from "react";
import {
  statusLabels,
  type StatusKind,
  isStatusKind,
} from "@/lib/utils";
import {
  useQueryState,
  useQueryStates,
  parseAsString,
  parseAsBoolean,
  parseAsStringLiteral,
  debounce,
} from "nuqs";
import {
  deleteApplication,
  deleteApplications,
  updateApplicationsStatus,
} from "@/app/actions/applications";
import { toast } from "@/hooks/use-toast";
import {
  applyOptimisticChanges,
  type OptimisticChange,
} from "./optimistic-changes";
import { format } from "date-fns";
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
  currentPage,
  platforms,
  linkedApp,
}: {
  columns: ColumnDef<TData, TValue>[];
  /** The rows of the current page, already filtered and sorted on the server. */
  data: TData[];
  /** Rows matching the current filters across all pages. */
  totalRows: number;
  /** The page `data` belongs to, which may differ from a stale ?page=. */
  currentPage: number;
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
      size,
      view: viewMode,
      stage: stageFilter,
      from: fromFilter,
      to: toFilter,
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
  // Picking a status replaces any filter that came from an analytics link
  const setStatusFilter = useCallback(
    (value: string | null) =>
      setParams({
        status: value && value !== "all" ? value : null,
        stage: null,
        from: null,
        to: null,
        page: null,
      }),
    [setParams],
  );
  const clearAnalyticsFilter = useCallback(
    () =>
      setParams({
        status: statusFilter && isStatusKind(statusFilter) ? statusFilter : null,
        stage: null,
        from: null,
        to: null,
        page: null,
      }),
    [setParams, statusFilter],
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

  // A display preference, so it stays client-side (shallow)
  const [density, setDensity] = useQueryState(
    "density",
    parseAsStringLiteral(["comfortable", "compact"] as const)
      .withDefault("comfortable")
      .withOptions({ shallow: true, clearOnDefault: true }),
  );

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

  // Moves and deletes show at once; see optimistic-changes.ts.
  const [optimisticChanges, addOptimisticChange] = useOptimistic<
    OptimisticChange[],
    OptimisticChange
  >([], (changes, change) => [...changes, change]);
  const displayedData = useMemo(
    () => applyOptimisticChanges(data, optimisticChanges),
    [data, optimisticChanges],
  );
  const [, startDeleteTransition] = useTransition();

  const sorting: SortingState = useMemo(
    () => (sort ? [{ id: sort, desc: dir === "desc" }] : []),
    [sort, dir],
  );
  const pageSize = size ?? DEFAULT_PAGE_SIZE;
  const pageIndex = currentPage - 1;

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

  const handleDelete = (id: string) => {
    if (selectedApp?.id === id || appIdParam === id) {
      handleCloseDetail();
    }
    startDeleteTransition(async () => {
      addOptimisticChange({ kind: "delete", id });
      try {
        await deleteApplication(id);
        toast({ description: "Application deleted successfully." });
      } catch {
        toast({
          description: "Failed to delete application.",
          variant: "destructive",
        });
      }
    });
  };

  const table = useReactTable({
    data: displayedData,
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
      density,
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

  /**
   * Toasts the outcome of a bulk action and keeps only the rows that failed
   * selected, so the user can retry them.
   */
  const finishBulkAction = (
    succeededRowIds: Set<string>,
    messages: { all: string; none: string; some: (done: number, failed: number) => string },
  ) => {
    const succeededCount = succeededRowIds.size;
    const failedCount = selectedCount - succeededCount;
    if (failedCount === 0) {
      toast({ description: messages.all });
      setRowSelection({});
    } else if (succeededCount === 0) {
      toast({ description: messages.none, variant: "destructive" });
    } else {
      toast({ description: messages.some(succeededCount, failedCount), variant: "destructive" });
      setRowSelection((prev) => {
        const next: RowSelectionState = {};
        Object.keys(prev).forEach((rowKey) => {
          if (!succeededRowIds.has(rowKey)) next[rowKey] = true;
        });
        return next;
      });
    }
  };

  /** Selected rows by application id, for mapping a bulk action's result back to rows. */
  const selectedRowIdsByAppId = () =>
    new Map(
      selectedRows
        .filter((row) => row.original.id)
        .map((row) => [row.original.id as string, row.id] as const),
    );

  // One request for the whole selection (see deleteApplications).
  const handleBulkDelete = () => {
    if (selectedCount === 0) return;
    const rowIds = selectedRowIdsByAppId();
    startBulkTransition(async () => {
      let succeeded = new Set<string>();
      try {
        const { deleted } = await deleteApplications([...rowIds.keys()]);
        succeeded = new Set(deleted.flatMap((id) => rowIds.get(id) ?? []));
      } catch (err) {
        console.error("Bulk delete failed:", err);
      }
      finishBulkAction(succeeded, {
        all: `Successfully deleted ${succeeded.size} application(s).`,
        none: "Failed to delete applications.",
        some: (done, failed) => `Deleted ${done} of ${selectedCount} application(s). ${failed} failed.`,
      });
    });
  };

  const handleBulkStatusChange = (newCategory: string) => {
    if (selectedCount === 0) return;
    const cat = (isStatusKind(newCategory) ? newCategory : "other") as StatusKind;
    const rowIds = selectedRowIdsByAppId();
    startBulkTransition(async () => {
      let succeeded = new Set<string>();
      try {
        const { updated } = await updateApplicationsStatus([...rowIds.keys()], cat);
        succeeded = new Set(updated.flatMap((id) => rowIds.get(id) ?? []));
      } catch (err) {
        console.error("Bulk status change failed:", err);
      }
      finishBulkAction(succeeded, {
        all: `Updated status for ${succeeded.size} application(s) to ${statusLabels[cat] || cat}.`,
        none: "Failed to update application statuses.",
        some: (done, failed) => `Updated ${done} of ${selectedCount} application(s). ${failed} failed.`,
      });
    });
  };

  const analyticsFilter = {
    stage: stageFilter,
    from: fromFilter,
    to: toFilter,
    // Groups and lists ("active", "rejected,ghosted") have no status pill
    statusGroup: statusFilter && !isStatusKind(statusFilter) ? statusFilter : null,
  };
  const hasAnalyticsFilter = Boolean(
    stageFilter || fromFilter || toFilter || analyticsFilter.statusGroup,
  );

  const hasActiveFilters = Boolean(
    globalFilter ||
    (statusFilter && statusFilter !== "all") ||
    (platformFilter && platformFilter !== "all") ||
    hasAnalyticsFilter,
  );

  const clearFilters = () => {
    setParams({
      q: null,
      status: null,
      platform: null,
      stage: null,
      from: null,
      to: null,
      page: null,
    });
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
  const currentList = displayedData;
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
    analyticsFilter,
    hasAnalyticsFilter,
    clearAnalyticsFilter,
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
    optimisticChanges,
    addOptimisticChange,
    setRowSelection,
    hasPreviousApp,
    hasNextApp,
    goToPreviousApp,
    goToNextApp,
    currentIndex: activeAppIndex >= 0 ? activeAppIndex + 1 : 0,
    totalApps: currentList.length,
    isPending,
    density,
    setDensity,
  };
}

"use client";

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
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useQueryState,
  parseAsString,
  parseAsInteger,
  useQueryStates,
} from "nuqs";
import { OnChangeFn } from "@tanstack/react-table";

interface DataTableProps<TData extends { status: string }, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

const TABLE_ROWS = [5, 10, 15, 20, 25];
const MOBILE_DEFAULT_PAGE_SIZE = 5;
const DESKTOP_DEFAULT_PAGE_SIZE = 10;

export function DataTable<TData extends { status: string }, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  // URL-bound state with nuqs
  const [globalFilter, setGlobalFilter] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({ shallow: false, throttleMs: 300 })
  );

  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsString.withDefault("").withOptions({ shallow: false })
  );

  const [sortingState, setSortingState] = useQueryStates(
    {
      sort: parseAsString,
      dir: parseAsString,
    },
    { shallow: false }
  );

  const [page, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({ shallow: false })
  );

  const [pageSizeParam, setPageSizeParam] = useQueryState(
    "size",
    parseAsInteger.withOptions({
      shallow: false,
    })
  );

  // Client-side device detection for default page size
  const [devicePageSize, setDevicePageSize] = useState<number>(MOBILE_DEFAULT_PAGE_SIZE);

  useEffect(() => {
    const isDesktop = window.matchMedia("(min-width: 768px)").matches;
    setDevicePageSize(isDesktop ? DESKTOP_DEFAULT_PAGE_SIZE : MOBILE_DEFAULT_PAGE_SIZE);
  }, []);

  const pageSize = pageSizeParam ?? devicePageSize;

  const sorting = useMemo<SortingState>(
    () =>
      sortingState.sort
        ? [{ id: sortingState.sort, desc: sortingState.dir === "desc" }]
        : [],
    [sortingState]
  );

  const columnFilters = useMemo<ColumnFiltersState>(
    () => (statusFilter ? [{ id: "status", value: statusFilter }] : []),
    [statusFilter]
  );

  const pagination = useMemo<PaginationState>(
    () => ({
      pageIndex: page - 1,
      pageSize: pageSize,
    }),
    [page, pageSize]
  );

  const setSorting: OnChangeFn<SortingState> = (updater) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    const sort = next[0];
    if (sort) {
      setSortingState({ sort: sort.id, dir: sort.desc ? "desc" : "asc" });
    } else {
      setSortingState({ sort: null, dir: null });
    }
  };

  const setPagination: OnChangeFn<PaginationState> = (updater) => {
    const next =
      typeof updater === "function" ? updater(pagination) : updater;
    
    if (next.pageIndex !== pagination.pageIndex) {
      setPage(next.pageIndex + 1);
    }
    
    if (next.pageSize !== pagination.pageSize) {
      setPageSizeParam(next.pageSize);
    }
  };

  const setColumnFilters: OnChangeFn<ColumnFiltersState> = (updater) => {
    const next =
      typeof updater === "function" ? updater(columnFilters) : updater;
    const status = next.find((f) => f.id === "status")?.value;
    setStatusFilter((status as string) || null);
  };

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: "includesString",
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
    autoResetPageIndex: false,

    state: {
      sorting,
      globalFilter,
      pagination,
      columnFilters,
    },
  });

  const statuses = useMemo(() => {
    const uniqueStatuses = new Set(data.map((item) => item.status));
    return Array.from(uniqueStatuses).sort();
  }, [data]);

  return (
    <div className="w-full">
      <div className="flex items-center py-4 justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative w-full max-w-sm">
            <Input
              placeholder="Search..."
              value={globalFilter}
              onChange={(e) => setGlobalFilter(String(e.target.value))}
              className="w-full"
            />
            {globalFilter.length > 0 && (
              <X
                className="absolute right-2 top-1/2 size-6 -translate-y-1/2 cursor-pointer rounded-full p-1 transition-colors hover:bg-accent"
                onClick={() => table.setGlobalFilter("")}
              />
            )}
          </div>
          <Select
            value={
              (table.getColumn("status")?.getFilterValue() as string) ?? "all"
            }
            onValueChange={(value) => {
              table
                .getColumn("status")
                ?.setFilterValue(value === "all" ? "" : value);
            }}
          >
            <SelectTrigger className="w-[180px] capitalize">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status} className="capitalize">
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Link href="/applications/new" className="hidden md:inline-block">
          <Button variant="outline">New application</Button>
        </Link>
      </div>

      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="border-b border-border">
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    key={header.id}
                    className="p-0 font-bold text-foreground"
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
                data-state={row.getIsSelected() && "selected"}
                className="capitalize border-b border-border text-foreground hover:bg-accent hover:text-accent-foreground"
              >
                {row.getVisibleCells().map((cell) =>
                  cell.column.id === "status" ? (
                    <TableCell
                      key={cell.id}
                      className={cn("truncate max-w-60 ")}
                    >
                      <Badge
                        className={cn(
                          (cell.getValue() as string)
                            .toLowerCase()
                            .includes("applied") &&
                            "bg-primary/15 text-primary",
                          (cell.getValue() as string)
                            .toLowerCase()
                            .includes("accept") &&
                            "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-300",
                          (cell.getValue() as string)
                            .toLowerCase()
                            .includes("ghost") &&
                            "bg-muted text-muted-foreground",
                          (cell.getValue() as string)
                            .toLowerCase()
                            .includes("review") &&
                            "bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300",
                          (cell.getValue() as string)
                            .toLowerCase()
                            .includes("interview") &&
                            "bg-cyan-100 text-cyan-900 dark:bg-cyan-900/30 dark:text-cyan-300",
                          (cell.getValue() as string)
                            .toLowerCase()
                            .includes("reject") &&
                            "bg-destructive/15 text-destructive"
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </Badge>
                    </TableCell>
                  ) : (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        "truncate max-w-60 ",
                        cell.column.id === "link" && "lowercase"
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  )
                )}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination buttons */}
      <div className="flex items-center justify-between py-4">
        <p>
          Showing {table.getRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s).
        </p>
        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <p className="text-sm font-medium">Rows per page</p>
        <Select
          value={`${table.getState().pagination.pageSize}`}
          onValueChange={(value) => {
            table.setPageSize(Number(value));
          }}
        >
          <SelectTrigger className="h-8 w-[70px]">
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
      <Link
        href="/applications/new"
        className="md:hidden fixed bottom-4 right-4"
      >
        <Button className="size-10">
          <Plus />
        </Button>
      </Link>
    </div>
  );
}

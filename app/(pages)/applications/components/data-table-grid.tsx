"use client";

import { Table as TanstackTable, flexRender } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";
import { DataTableMobileCard } from "./data-table-mobile-card";

const TABLE_ROWS = [5, 10, 15, 20, 25];

interface DataTableGridProps<TData> {
  table: TanstackTable<TData>;
  columnsCount: number;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  onSelectRow: (item: TData) => void;
}

export function DataTableGrid<
  TData extends {
    id?: string;
    role_name: string;
    company_name: string;
    date_applied: string;
    link: string;
    status: string;
    statusCategory?: string | null;
    location: string;
  },
>({
  table,
  columnsCount,
  hasActiveFilters,
  clearFilters,
  onSelectRow,
}: DataTableGridProps<TData>) {
  return (
    <div className="space-y-4 pb-24 lg:pb-4">
      {/* Desktop Table View */}
      <div className="hidden lg:block rounded-xl border border-border/40 bg-card overflow-x-auto shadow-2xs [scrollbar-width:thin]">
        <Table>
          <TableHeader className="bg-muted/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-border/30"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="px-4 py-3 font-bold text-foreground text-xs uppercase tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-testid="table-row"
                  tabIndex={0}
                  role="button"
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onSelectRow(row.original)}
                  onKeyDown={(e) => {
                    const target = e.target as HTMLElement;
                    if (
                      target !== e.currentTarget &&
                      (target.tagName === "BUTTON" ||
                        target.tagName === "INPUT" ||
                        target.tagName === "A" ||
                        !!target.closest('button, input, a, [role="button"]'))
                    ) {
                      return;
                    }
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelectRow(row.original);
                    }
                  }}
                  className="cursor-pointer border-b border-border/30 transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3 text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columnsCount}
                  className="h-44 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Filter className="h-8 w-8 text-muted-foreground/50" />
                    <p className="font-semibold text-foreground">
                      No applications found
                    </p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                      {hasActiveFilters
                        ? "No job applications match your current filters. Try resetting your search."
                        : 'You have not added any job applications yet. Click "Add Application" to get started.'}
                    </p>
                    {hasActiveFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearFilters}
                        className="mt-2 text-xs h-8"
                      >
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

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {table.getRowModel().rows?.length ? (
          table
            .getRowModel()
            .rows.map((row) => (
              <DataTableMobileCard
                key={row.id}
                item={row.original}
                isSelected={row.getIsSelected()}
                onSelectRow={(item) => onSelectRow(item as TData)}
                onToggleSelected={(val) => row.toggleSelected(val)}
              />
            ))
        ) : (
          <div className="text-center p-6 sm:p-8 border border-border/40 rounded-xl bg-card text-muted-foreground text-xs sm:text-sm space-y-3 shadow-2xs">
            <Filter className="h-7 w-7 mx-auto text-muted-foreground/50" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground text-sm">
                No applications found
              </p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                {hasActiveFilters
                  ? "No job applications match your current filters. Try resetting your search."
                  : 'You have not added any job applications yet. Click the "+" button below to get started.'}
              </p>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-xs h-8"
              >
                Reset Filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 pb-1 px-1 text-xs text-muted-foreground border-t border-border/30">
        {/* Top/Left Row: Application count & Page size */}
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <p className="font-medium text-xs">
            Showing {table.getRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} application(s)
          </p>

          <div className="flex items-center space-x-1.5 shrink-0">
            <span className="font-medium text-xs hidden xs:inline">Rows:</span>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger className="h-8 w-[68px] text-xs bg-background/60">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top">
                {TABLE_ROWS.map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`} className="text-xs cursor-pointer">
                    {pageSize} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bottom/Right Row: Page Index & Navigation Buttons */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-xs font-semibold text-foreground whitespace-nowrap">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {Math.max(1, table.getPageCount())}
          </span>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 text-xs px-3 cursor-pointer"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 text-xs px-3 cursor-pointer"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

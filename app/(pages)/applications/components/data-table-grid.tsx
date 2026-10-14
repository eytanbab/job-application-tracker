"use client";

import { Table as TanstackTable, flexRender } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
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
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
} from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { DataTableMobileCard } from "./data-table-mobile-card";
import { PAGE_SIZES } from "@/lib/applications/list-query";

/**
 * Editable page number. Keyed by the current page, so a new page resets
 * the draft without an effect.
 */
function PageJump({
  pageIndex,
  pageCount,
  onJump,
}: {
  pageIndex: number;
  pageCount: number;
  onJump: (pageIndex: number) => void;
}) {
  const [draft, setDraft] = useState(String(pageIndex + 1));
  const commit = () => {
    const page = Number.parseInt(draft, 10);
    if (!Number.isFinite(page)) {
      setDraft(String(pageIndex + 1));
      return;
    }
    const clamped = Math.min(Math.max(page, 1), pageCount);
    setDraft(String(clamped));
    if (clamped !== pageIndex + 1) onJump(clamped - 1);
  };

  return (
    <label className="flex items-center gap-1.5 text-xs font-medium text-foreground whitespace-nowrap">
      Page
      <Input
        type="text"
        inputMode="numeric"
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, ""))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
        }}
        aria-label={`Page number, 1 to ${pageCount}`}
        className="h-8 w-12 px-1.5 text-center text-xs tabular-nums"
      />
      <span className="text-muted-foreground">of {pageCount.toLocaleString()}</span>
    </label>
  );
}

interface DataTableGridProps<TData> {
  table: TanstackTable<TData>;
  columnsCount: number;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  onSelectRow: (item: TData) => void;
  /** True while the server loads a new page, sort or filter result. */
  isPending?: boolean;
  density?: "comfortable" | "compact";
  onDensityChange?: (density: "comfortable" | "compact") => void;
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
    platform?: string;
  },
>({
  table,
  columnsCount,
  hasActiveFilters,
  clearFilters,
  onSelectRow,
  isPending = false,
  density = "comfortable",
  onDensityChange,
}: DataTableGridProps<TData>) {
  return (
    <div
      aria-busy={isPending}
      className={cn(
        "space-y-4 pb-24 lg:pb-4 transition-opacity",
        isPending && "opacity-60 delay-150",
      )}
    >
      {/* Desktop Table View */}
      <div className="hidden lg:block rounded-xl border border-border/40 bg-card overflow-hidden shadow-2xs">
        {/* Capped to the viewport so long pages scroll inside the table
            and the header row stays visible (sticky within this box). */}
        <Table
          className="w-full"
          containerClassName="max-h-[calc(100dvh-9rem)]"
        >
          <TableHeader className="sticky top-0 z-20 bg-[color-mix(in_srgb,var(--color-muted)_30%,var(--color-card))]">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-border/30"
              >
                {headerGroup.headers.map((header) => {
                  const isActions = header.column.id === "actions";
                  const isSelect = header.column.id === "select";
                  const isDate = header.column.id === "date_applied";
                  const isSalary = header.column.id === "salary";

                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        "px-2.5 xl:px-3 py-3 font-bold text-foreground text-xs uppercase tracking-wider",
                        isSelect && "w-10 px-2 text-center",
                        header.column.id === "role_name" && "w-full max-w-0 min-w-[180px]",
                        isDate && "w-[110px] whitespace-nowrap",
                        header.column.id === "status" && "w-[130px] xl:w-[150px] xl:min-w-[150px]",
                        header.column.id === "location" && "w-[120px] xl:w-[180px]",
                        header.column.id === "platform" && "hidden xl:table-cell w-[110px]",
                        isSalary && "hidden xl:table-cell w-[130px] whitespace-nowrap",
                        isActions &&
                          "w-[76px] sticky right-0 z-20 bg-[color-mix(in_srgb,var(--color-muted)_30%,var(--color-card))] text-right pr-3 border-l border-border/30 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.3)]",
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
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
                  data-testid="table-row"
                  tabIndex={0}
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
                  className="group/row cursor-pointer border-b border-border/30 transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                >
                  {row.getVisibleCells().map((cell) => {
                    const isActions = cell.column.id === "actions";
                    const isSelect = cell.column.id === "select";
                    const isDate = cell.column.id === "date_applied";
                    const isSalary = cell.column.id === "salary";

                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          "px-2.5 xl:px-3 text-sm",
                          density === "compact" ? "py-1.5" : "py-3",
                          isSelect && "w-10 px-2 text-center",
                          cell.column.id === "role_name" && "w-full max-w-0 min-w-[180px]",
                          isDate && "w-[110px] whitespace-nowrap",
                          cell.column.id === "status" && "w-[130px] xl:w-[150px] xl:min-w-[150px]",
                          cell.column.id === "location" && "w-[120px] xl:w-[180px]",
                          cell.column.id === "platform" && "hidden xl:table-cell w-[110px]",
                          isSalary && "hidden xl:table-cell w-[130px] whitespace-nowrap",
                          isActions &&
                            "w-[76px] sticky right-0 z-10 bg-card group-hover/row:bg-accent/40 group-data-[state=selected]/row:bg-muted text-right pr-3 border-l border-border/30 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.06)] dark:shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.3)]",
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    );
                  })}
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
          <>
            <div className="flex items-center justify-between px-3 py-2 bg-muted/40 border border-border/50 rounded-xl text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none font-medium text-foreground">
                <Checkbox
                  checked={
                    table.getIsAllPageRowsSelected()
                      ? true
                      : table.getIsSomePageRowsSelected()
                      ? "indeterminate"
                      : false
                  }
                  onCheckedChange={(checked) =>
                    table.toggleAllPageRowsSelected(!!checked)
                  }
                  aria-label="Select all applications"
                />
                <span>Select all ({table.getRowModel().rows.length})</span>
              </label>
              {table.getSelectedRowModel().rows.length > 0 && (
                <span className="text-muted-foreground font-normal">
                  {table.getSelectedRowModel().rows.length} selected
                </span>
              )}
            </div>

            {table.getRowModel().rows.map((row) => (
              <DataTableMobileCard
                key={row.id}
                item={row.original}
                isSelected={row.getIsSelected()}
                onSelectRow={(item) => onSelectRow(item as TData)}
                onToggleSelected={(val) => row.toggleSelected(val)}
              />
            ))}
          </>
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
                  : "You have not added any job applications yet. Tap the + button to get started."}
              </p>
            </div>
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-xs h-8 cursor-pointer"
              >
                Reset Filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 pb-1 px-1 text-xs text-muted-foreground border-t border-border/30">
        {/* Top/Left Row: Application count & Page size */}
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <p className="font-medium text-xs tabular-nums">
            {table.getRowCount() === 0
              ? "0 applications"
              : `${(
                  table.getState().pagination.pageIndex *
                    table.getState().pagination.pageSize +
                  1
                ).toLocaleString()}–${(
                  table.getState().pagination.pageIndex *
                    table.getState().pagination.pageSize +
                  table.getRowModel().rows.length
                ).toLocaleString()} of ${table.getRowCount().toLocaleString()}`}
          </p>

          <div className="flex items-center space-x-1.5 shrink-0">
            {onDensityChange && (
              <div
                role="radiogroup"
                aria-label="Row density"
                className="hidden lg:inline-flex items-center rounded-md border border-border/40 p-0.5 mr-2"
              >
                {(["comfortable", "compact"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="radio"
                    aria-checked={density === option}
                    onClick={() => onDensityChange(option)}
                    className={cn(
                      "h-7 px-2.5 rounded text-xs font-medium capitalize cursor-pointer transition-colors",
                      density === option
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
            <span className="font-medium text-xs hidden sm:inline">Rows per page:</span>
            <span className="font-medium text-xs sm:hidden">Rows:</span>
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(value) => {
                table.setPageSize(Number(value));
              }}
            >
              <SelectTrigger
                aria-label="Rows per page"
                className="h-8 w-[64px] text-xs bg-background/60 px-2.5 font-medium cursor-pointer">
                <SelectValue
                  placeholder={table.getState().pagination.pageSize}
                />
              </SelectTrigger>
              <SelectContent side="top" className="min-w-[70px]">
                {PAGE_SIZES.map((pageSize) => (
                  <SelectItem
                    key={pageSize}
                    value={`${pageSize}`}
                    className="text-xs cursor-pointer"
                  >
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Bottom/Right Row: Page Index & Navigation Buttons */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <PageJump
            key={table.getState().pagination.pageIndex}
            pageIndex={table.getState().pagination.pageIndex}
            pageCount={Math.max(1, table.getPageCount())}
            onJump={(index) => table.setPageIndex(index)}
          />

          <nav aria-label="Pagination" className="flex gap-1">
            {[
              { label: "First page", icon: ChevronsLeft, onClick: () => table.setPageIndex(0), disabled: !table.getCanPreviousPage() },
              { label: "Previous page", icon: ChevronLeft, onClick: () => table.previousPage(), disabled: !table.getCanPreviousPage() },
              { label: "Next page", icon: ChevronRight, onClick: () => table.nextPage(), disabled: !table.getCanNextPage() },
              { label: "Last page", icon: ChevronsRight, onClick: () => table.setPageIndex(table.getPageCount() - 1), disabled: !table.getCanNextPage() },
            ].map(({ label, icon: Icon, onClick, disabled }) => (
              <Button
                key={label}
                variant="outline"
                size="icon"
                onClick={onClick}
                disabled={disabled}
                aria-label={label}
                title={label}
                className="h-8 w-8 cursor-pointer"
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}

"use client";

import { parseAsString, useQueryStates } from "nuqs";
import { useTransition } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar, Filter, Loader2, RotateCcw } from "lucide-react";

const months = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export function AnalyticsFilter({ years }: { years: string[] }) {
  const [isPending, startTransition] = useTransition();

  const [filters, setFilters] = useQueryStates(
    {
      month: parseAsString.withDefault("all"),
      year: parseAsString.withDefault("all"),
    },
    {
      shallow: false,
      startTransition,
    },
  );

  const selectedMonth = filters.month;
  const selectedYear = filters.year;

  const updateFilter = (key: "month" | "year", value: string) => {
    setFilters({
      [key]: value === "all" ? null : value,
    });
  };

  const clearFilters = () => {
    setFilters({
      month: null,
      year: null,
    });
  };

  const isFiltered = selectedMonth !== "all" || selectedYear !== "all";

  return (
    <div className="w-full min-w-0 bg-card border border-border/30 rounded-xl p-3 sm:p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
      <div className="flex items-center justify-between w-full sm:w-auto">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {isPending ? (
            <Loader2 className="h-4 w-4 text-primary animate-spin" />
          ) : (
            <Filter className="h-4 w-4 text-primary" />
          )}
          <span>Filter Analytics</span>
        </div>

        {/* Reset Action on mobile */}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="sm:hidden h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5 px-2 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto min-w-0">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3 w-full sm:w-auto min-w-0">
          {/* Month Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 min-w-0">
            <span className="text-[11px] sm:text-xs text-muted-foreground font-medium flex items-center gap-1 shrink-0">
              <Calendar className="h-3.5 w-3.5 hidden sm:inline" /> Month:
            </span>
            <Select
              value={selectedMonth}
              onValueChange={(value) => updateFilter("month", value)}
            >
              <SelectTrigger className="w-full sm:w-[140px] h-9 sm:h-8 text-xs min-w-0">
                <SelectValue placeholder="All Months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Year Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-1.5 min-w-0">
            <span className="text-[11px] sm:text-xs text-muted-foreground font-medium shrink-0">
              Year:
            </span>
            <Select
              value={selectedYear}
              onValueChange={(value) => updateFilter("year", value)}
            >
              <SelectTrigger className="w-full sm:w-[110px] h-9 sm:h-8 text-xs min-w-0">
                <SelectValue placeholder="All Years" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Reset Action on desktop */}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="hidden sm:inline-flex h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5 px-2.5 cursor-pointer shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}

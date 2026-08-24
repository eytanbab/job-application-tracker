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
    <div className="w-full bg-card border border-border/30 rounded-xl p-3 sm:p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 mb-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        {isPending ? (
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
        ) : (
          <Filter className="h-4 w-4 text-primary" />
        )}
        <span>Filter Analytics</span>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" /> Month:
          </span>
          <Select
            value={selectedMonth}
            onValueChange={(value) => updateFilter("month", value)}
          >
            <SelectTrigger className="w-[140px] h-8 text-xs">
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
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            Year:
          </span>
          <Select
            value={selectedYear}
            onValueChange={(value) => updateFilter("year", value)}
          >
            <SelectTrigger className="w-[110px] h-8 text-xs">
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

        {/* Reset Action */}
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="min-h-[44px] sm:min-h-0 sm:h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5 px-2.5 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}

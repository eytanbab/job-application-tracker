import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_PILL_WIDTHS = [
  "w-16", // All
  "w-24", // Applied
  "w-24", // In Review
  "w-28", // Interviewing
  "w-20", // Offers
  "w-22", // Rejected
  "w-22", // Ghosted
];

export default function ApplicationsLoading() {
  return (
    <div className="w-full space-y-4 min-w-0 opacity-100 transition-opacity duration-300">
      {/* 1. Status Filter Pills Skeleton */}
      <div className="w-full flex items-center gap-1.5 overflow-x-auto pb-1 pr-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {STATUS_PILL_WIDTHS.map((width, i) => (
          <Skeleton
            key={i}
            className={`h-8 ${width} rounded-full shrink-0 border border-border/40`}
          />
        ))}
      </div>

      {/* 2. Controls Toolbar Skeleton */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-card border border-border/40 rounded-xl p-2.5 sm:p-3 shadow-2xs">
        {/* Search Input Skeleton */}
        <div className="relative flex-1">
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>

        {/* Action Controls Skeleton */}
        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <Skeleton className="h-9 w-[100px] sm:w-[120px] rounded-lg" />
          <Skeleton className="h-9 w-[140px] sm:w-[160px] rounded-lg" />
          <Skeleton className="hidden lg:inline-flex h-9 w-36 rounded-lg" />
        </div>
      </div>

      {/* 3. Data View Skeleton */}
      <div className="space-y-4 pb-24 lg:pb-4">
        {/* Desktop Table View (>= lg) */}
        <div className="hidden lg:block rounded-xl border border-border/40 bg-card overflow-x-auto shadow-2xs [scrollbar-width:thin]">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-b border-border/30">
                <TableHead className="w-12 px-4 py-3">
                  <Skeleton className="h-4 w-4 rounded" />
                </TableHead>
                <TableHead className="px-4 py-3">
                  <Skeleton className="h-4 w-28" />
                </TableHead>
                <TableHead className="px-4 py-3">
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                <TableHead className="px-4 py-3">
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead className="px-4 py-3">
                  <Skeleton className="h-4 w-20" />
                </TableHead>
                <TableHead className="px-4 py-3">
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead className="px-4 py-3">
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead className="w-12 px-4 py-3 text-center">
                  <Skeleton className="h-4 w-8 mx-auto" />
                </TableHead>
                <TableHead className="w-28 px-4 py-3 text-right">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 10 }).map((_, i) => (
                <TableRow
                  key={i}
                  className="border-b border-border/30"
                >
                  {/* Select Checkbox */}
                  <TableCell className="w-12 px-4 py-3">
                    <Skeleton className="h-4 w-4 rounded" />
                  </TableCell>

                  {/* Role & Company */}
                  <TableCell className="px-4 py-3">
                    <div className="space-y-1.5 max-w-[220px]">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </TableCell>

                  {/* Date Applied */}
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-6 w-20 rounded-md" />
                  </TableCell>

                  {/* Location */}
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-24" />
                  </TableCell>

                  {/* Platform Badge */}
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-5 w-16 rounded-md" />
                  </TableCell>

                  {/* Salary */}
                  <TableCell className="px-4 py-3">
                    <Skeleton className="h-4 w-20" />
                  </TableCell>

                  {/* External Link */}
                  <TableCell className="w-12 px-4 py-3 text-center">
                    <Skeleton className="h-7 w-7 rounded-lg mx-auto" />
                  </TableCell>

                  {/* Row Actions */}
                  <TableCell className="w-28 px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile & Tablet Card View (< lg) */}
        <div className="lg:hidden space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="p-3.5 sm:p-4 rounded-xl border border-border/40 bg-card shadow-2xs"
            >
              <div className="flex items-start gap-3">
                {/* Selection Checkbox & Company Avatar */}
                <div className="flex items-center gap-2.5 shrink-0">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-10 w-10 rounded-xl" />
                </div>

                {/* Content & Metadata */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <Skeleton className="h-4 w-36 sm:w-48" />
                    <Skeleton className="h-5 w-16 rounded-md shrink-0" />
                  </div>

                  <Skeleton className="h-3 w-32" />

                  <div className="flex items-center justify-between pt-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-4 rounded" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 4. Pagination Controls Skeleton */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 pb-1 px-1 text-xs border-t border-border/30">
          <div className="flex items-center justify-between sm:justify-start gap-4">
            <Skeleton className="h-4 w-36" />
            <div className="flex items-center space-x-1.5 shrink-0">
              <Skeleton className="h-4 w-16 hidden sm:inline-block" />
              <Skeleton className="h-8 w-[64px] rounded-lg" />
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20 rounded-md" />
              <Skeleton className="h-8 w-16 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

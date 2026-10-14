import type { StatusKind } from "@/lib/utils";

/** Badge colours per pipeline stage, shared by the table, cards and panel. */
export const statusBadgeClasses: Record<StatusKind, string> = {
  applied:
    "bg-primary/10 text-primary border-primary/25 rounded-md font-semibold",
  accepted:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 rounded-md font-semibold",
  ghosted:
    "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30 rounded-md font-semibold",
  review:
    "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/25 rounded-md font-semibold",
  interview:
    "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25 rounded-md font-semibold",
  rejected:
    "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/25 rounded-md font-semibold",
  other:
    "bg-secondary text-secondary-foreground border-border rounded-md font-medium",
};

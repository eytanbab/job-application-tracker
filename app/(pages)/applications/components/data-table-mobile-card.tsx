"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Calendar, ExternalLink, MapPin } from "lucide-react";
import { getStatusDisplay, getStatusKind, StatusKind } from "@/lib/utils";
import { formatDate, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const statusBadgeClasses: Record<StatusKind, string> = {
  applied:
    "bg-primary/15 text-primary border border-primary/25 rounded-md font-semibold",
  accepted:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 rounded-md font-semibold",
  ghosted:
    "bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30 rounded-md font-semibold",
  review:
    "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25 rounded-md font-semibold",
  interview:
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 rounded-md font-semibold",
  rejected:
    "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/25 rounded-md font-semibold",
  other:
    "bg-secondary text-secondary-foreground border border-border rounded-md font-medium",
};

interface MobileCardItem {
  id?: string;
  role_name: string;
  company_name: string;
  date_applied: string;
  link: string;
  status: string;
  statusCategory?: string | null;
  location: string;
}

interface DataTableMobileCardProps {
  item: MobileCardItem;
  isSelected: boolean;
  onSelectRow: (item: MobileCardItem) => void;
  onToggleSelected: (selected: boolean) => void;
}

export function DataTableMobileCard({
  item,
  isSelected,
  onSelectRow,
  onToggleSelected,
}: DataTableMobileCardProps) {
  const kind = getStatusKind(item.status, item.statusCategory);
  const displayLabel = getStatusDisplay(item.status, item.statusCategory);
  const formattedDate = item.date_applied
    ? formatDate(parseISO(item.date_applied), "MMM d, yyyy")
    : "";

  const companyInitial = (item.company_name || "?")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <Card
      tabIndex={0}
      role="button"
      aria-label={`Application for ${item.role_name} at ${item.company_name}`}
      onClick={() => onSelectRow(item)}
      onKeyDown={(e) => {
        const target = e.target as HTMLElement;
        if (
          target !== e.currentTarget &&
          (target.tagName === "INPUT" ||
            target.tagName === "A" ||
            target.tagName === "BUTTON")
        ) {
          return;
        }
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectRow(item);
        }
      }}
      className={cn(
        "cursor-pointer p-3.5 sm:p-4 rounded-xl border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary select-none active:scale-[0.99]",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs"
          : "border-border/40 bg-card hover:border-primary/40 hover:shadow-xs",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Selection Checkbox & Company Avatar */}
        <div className="flex items-center gap-2.5 shrink-0">
          <label
            className="flex items-center justify-center p-1 -m-1 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary shrink-0"
              checked={isSelected}
              onChange={(e) => onToggleSelected(!!e.target.checked)}
              aria-label="Select application"
            />
          </label>

          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-base select-none shadow-2xs">
            {companyInitial}
          </div>
        </div>

        {/* Content & Metadata */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-sm sm:text-base text-foreground line-clamp-1 leading-snug">
              {item.role_name}
            </h3>

            <Badge
              variant="outline"
              className={`capitalize shrink-0 text-[11px] py-0.5 px-2 rounded-md ${statusBadgeClasses[kind]}`}
            >
              {displayLabel}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 truncate">
            <span className="font-semibold text-foreground/90 truncate">
              {item.company_name}
            </span>
            {item.location && (
              <>
                <span className="text-muted-foreground/40 font-normal">·</span>
                <span className="truncate">{item.location}</span>
              </>
            )}
          </p>

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span className="flex items-center gap-1 font-normal">
              <Calendar className="h-3 w-3 text-muted-foreground/70" />
              {formattedDate}
            </span>

            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1 -mr-1 text-muted-foreground hover:text-foreground inline-flex items-center justify-center rounded-md hover:bg-accent/60 transition-colors"
                title="Open job posting"
                aria-label="Open original job posting (opens in new tab)"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

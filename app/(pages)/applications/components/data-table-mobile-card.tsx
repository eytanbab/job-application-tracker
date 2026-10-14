"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Building2, Calendar, ExternalLink, MapPin } from "lucide-react";
import { getStatusDisplay, getStatusKind, StatusKind } from "@/lib/utils";
import { formatDate, parseISO } from "date-fns";
import { cn, formatPlatformLabel } from "@/lib/utils";
import { statusBadgeClasses } from "./status-badge-classes";


interface MobileCardItem {
  id?: string;
  role_name: string;
  company_name: string;
  date_applied: string;
  link: string;
  status: string;
  statusCategory?: string | null;
  location: string;
  platform?: string;
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
    // The card is an article, not a button: the role title is the "open"
    // control, stretched over the card with an ::after overlay, so the
    // checkbox and job link stay separate controls above it.
    <Card
      aria-labelledby={`application-card-${item.id}`}
      className={cn(
        "relative p-3.5 sm:p-4 rounded-xl border transition-all duration-150 select-none active:scale-[0.99] has-[[data-open-application]:focus-visible]:ring-2 has-[[data-open-application]:focus-visible]:ring-primary",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs"
          : "border-border/40 bg-card hover:border-primary/40 hover:shadow-xs",
      )}
    >
      <div className="flex items-start gap-3">
        {/* Selection Checkbox & Company Avatar */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* The ::before extends the checkbox's own label to a 44px target */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onToggleSelected(!!checked)}
            aria-label={`Select ${item.role_name} at ${item.company_name}`}
            className="z-10 before:absolute before:-inset-3.5 before:content-['']"
          />
          <div
            aria-hidden="true"
            className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-base select-none shadow-2xs"
          >
            {companyInitial}
          </div>
        </div>

        {/* Content & Metadata */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3
              id={`application-card-${item.id}`}
              className="font-bold text-sm sm:text-base text-foreground line-clamp-1 leading-snug"
            >
              <button
                type="button"
                data-open-application={item.id}
                onClick={() => onSelectRow(item)}
                className="text-left cursor-pointer focus-visible:outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']"
              >
                {item.role_name}
              </button>
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
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex items-center gap-1 font-normal shrink-0">
                <Calendar className="h-3 w-3 text-muted-foreground/70" />
                {formattedDate}
              </span>
              {item.platform && (
                <Badge
                  variant="secondary"
                  className="text-[10px] py-0 px-1.5 h-4 font-normal truncate max-w-[110px]"
                >
                  {formatPlatformLabel(item.platform)}
                </Badge>
              )}
            </div>

            {item.link && (
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="relative z-10 h-11 w-11 -m-3 text-muted-foreground hover:text-foreground inline-flex items-center justify-center rounded-md hover:bg-accent/60 transition-colors"
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

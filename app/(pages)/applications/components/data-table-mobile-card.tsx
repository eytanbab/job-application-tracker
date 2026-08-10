'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Calendar, ExternalLink, MapPin } from 'lucide-react';
import { getStatusDisplay, getStatusKind, StatusKind } from '@/lib/utils';
import { formatDate, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const statusBadgeClasses: Record<StatusKind, string> = {
  applied: 'bg-primary/15 text-primary border border-primary/25 rounded-md font-semibold',
  accepted:
    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 rounded-md font-semibold',
  ghosted: 'bg-muted/80 text-muted-foreground border border-border/50 rounded-md font-medium',
  review: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25 rounded-md font-semibold',
  interview:
    'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 rounded-md font-semibold',
  rejected: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/25 rounded-md font-semibold',
  other: 'bg-secondary text-secondary-foreground border border-border rounded-md font-medium',
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
    ? formatDate(parseISO(item.date_applied), 'MMM d, yyyy')
    : '';

  return (
    <Card
      onClick={() => onSelectRow(item)}
      className={cn(
        "cursor-pointer p-4 space-y-3 transition-all",
        isSelected
          ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-sm"
          : "border bg-card hover:border-primary/50"
      )}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer accent-primary shrink-0"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onToggleSelected(!!e.target.checked);
          }}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select application"
        />

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-sm sm:text-base text-foreground line-clamp-2 leading-tight">
              {item.role_name}
            </h3>

            <Badge
              variant="outline"
              className={`capitalize shrink-0 text-[11px] py-0.5 px-2 ${statusBadgeClasses[kind]}`}
            >
              {displayLabel}
            </Badge>
          </div>

          <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 truncate">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
            <span className="truncate">{item.company_name}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/40 gap-2">
        <span className="flex items-center gap-1.5 text-[11px]">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          {formattedDate}
        </span>

        <div className="flex items-center gap-2 text-[11px]">
          {item.location && (
            <span className="flex items-center gap-1 max-w-[130px] truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{item.location}</span>
            </span>
          )}
          {item.link && (
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1 -mr-1 text-muted-foreground hover:text-foreground inline-flex items-center justify-center min-h-[32px] min-w-[32px]"
              title="Open Link"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}

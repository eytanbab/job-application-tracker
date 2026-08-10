'use client';

import { History, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate } from 'date-fns';
import { getStatusDisplay, getStatusKind, statusLabels } from '@/lib/utils';

export interface TimelineEntry {
  id: string;
  status: string;
  statusCategory: string;
  createdAt: Date;
}

interface ApplicationTimelineProps {
  history: TimelineEntry[];
  isLoadingHistory: boolean;
  onDeleteEntry: (id: string) => void;
}

export function ApplicationTimeline({
  history,
  isLoadingHistory,
  onDeleteEntry,
}: ApplicationTimelineProps) {
  return (
    <div className="space-y-3 pt-2">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <History className="h-4 w-4" /> Application Timeline
      </h4>

      {isLoadingHistory ? (
        <p className="text-xs text-muted-foreground italic">Loading timeline...</p>
      ) : history.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No status history recorded yet.</p>
      ) : (
        <div className="relative pl-4 border-l border-border space-y-3 my-2">
          {history.map((item) => {
            const itemKind = getStatusKind(item.status, item.statusCategory);
            const displayTitle = getStatusDisplay(item.status, item.statusCategory);
            const categoryLabel = statusLabels[itemKind];
            const showCategoryTag =
              Boolean(categoryLabel) &&
              displayTitle.toLowerCase() !== categoryLabel.toLowerCase();
            const formattedTime = item.createdAt
              ? formatDate(new Date(item.createdAt), 'MMM d, yyyy · h:mm a')
              : '';
            return (
              <div key={item.id || `${item.status}-${item.createdAt}`} className="relative space-y-0.5 group">
                <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold capitalize text-foreground">
                      {displayTitle}
                    </span>
                    {showCategoryTag && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 font-normal text-muted-foreground">
                        {categoryLabel}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-[11px]">{formattedTime}</span>
                    {item.id && (
                      <button
                        type="button"
                        onClick={() => onDeleteEntry(item.id)}
                        className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                        title="Delete this timeline entry"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

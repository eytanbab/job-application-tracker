"use client";

import { format, parseISO } from "date-fns";
import { X } from "lucide-react";
import { parseStatuses, type Stage } from "@/lib/applications/list-query";
import { statusLabels } from "@/lib/utils";

const STAGE_LABELS: Record<Stage, string> = {
  interviewed: "Reached interview",
  responded: "Got a reply",
};

const GROUP_LABELS: Record<string, string> = {
  active: "Still open",
  closed: "Closed",
  submitted: "Excluding saved",
};

interface AnalyticsFilterChipProps {
  stage: Stage | null;
  from: string | null;
  to: string | null;
  statusGroup: string | null;
  onClear: () => void;
}

function describeDates(from: string | null, to: string | null): string | null {
  const day = (iso: string) => format(parseISO(iso), "d MMM yyyy");
  if (from && to) return from === to ? day(from) : `${day(from)} - ${day(to)}`;
  if (from) return `From ${day(from)}`;
  if (to) return `Until ${day(to)}`;
  return null;
}

/** Names the filter an analytics link applied, with one control to remove it. */
export function AnalyticsFilterChip({ stage, from, to, statusGroup, onClear }: AnalyticsFilterChipProps) {
  const statuses = statusGroup
    ? GROUP_LABELS[statusGroup.toLowerCase()] ??
      parseStatuses(statusGroup)?.map((kind) => statusLabels[kind]).join(", ")
    : null;
  const parts = [stage ? STAGE_LABELS[stage] : null, statuses, describeDates(from, to)].filter(
    (part): part is string => Boolean(part),
  );
  if (parts.length === 0) return null;
  const label = parts.join(" · ");

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground">Filtered from Analytics:</span>
      <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 pl-3 pr-1 py-0.5 font-medium text-foreground">
        {label}
        <button
          type="button"
          onClick={onClear}
          aria-label={`Remove filter: ${label}`}
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-primary/10 hover:text-foreground cursor-pointer"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </span>
    </div>
  );
}

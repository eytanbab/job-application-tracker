"use client";

import { useRef, useState, useTransition, type KeyboardEvent } from "react";
import { useQueryStates } from "nuqs";
import { endOfDay, format, parseISO } from "date-fns";
import type { DateRange as DayRange } from "react-day-picker";
import { CalendarRange, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PRESET_LABELS, resolveRange, type RangePreset } from "@/lib/analytics/range";
import { analyticsSearchParams } from "@/lib/analytics/search-params";
import { cn } from "@/lib/utils";

const PRESETS: Exclude<RangePreset, "custom">[] = ["7d", "30d", "90d", "ytd", "all"];

const SHORT_LABELS: Record<(typeof PRESETS)[number], string> = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days",
  ytd: "This year",
  all: "All time",
};

export function PeriodPicker() {
  const [isPending, startTransition] = useTransition();
  const [params, setParams] = useQueryStates(analyticsSearchParams, {
    shallow: false,
    startTransition,
  });
  const [customOpen, setCustomOpen] = useState(false);
  const [draft, setDraft] = useState<DayRange | undefined>();
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const resolved = resolveRange(params, new Date());
  const selected = resolved.preset;

  const choosePreset = (preset: (typeof PRESETS)[number]) =>
    setParams({ range: preset, from: null, to: null });

  // Arrow keys move between presets, as in a native radio group.
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (index + step + PRESETS.length) % PRESETS.length;
    buttonRefs.current[next]?.focus();
    choosePreset(PRESETS[next]);
  };

  const applyCustom = () => {
    if (!draft?.from) return;
    const from = format(draft.from, "yyyy-MM-dd");
    const to = format(draft.to ?? draft.from, "yyyy-MM-dd");
    setParams({ range: "custom", from, to });
    setCustomOpen(false);
  };

  const focusIndex = Math.max(0, PRESETS.indexOf(selected as (typeof PRESETS)[number]));

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
      <div
        role="radiogroup"
        aria-label="Period"
        className="flex flex-wrap items-center gap-1 rounded-lg border border-border/60 bg-card p-0.5"
      >
        {PRESETS.map((preset, index) => {
          const checked = selected === preset;
          return (
            <button
              key={preset}
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              aria-label={PRESET_LABELS[preset]}
              tabIndex={index === focusIndex ? 0 : -1}
              onClick={() => choosePreset(preset)}
              onKeyDown={(e) => onKeyDown(e, index)}
              className={cn(
                "h-8 px-3 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer",
                checked
                  ? "bg-muted text-foreground font-semibold shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {SHORT_LABELS[preset]}
            </button>
          );
        })}
      </div>

      <Popover
        open={customOpen}
        onOpenChange={(open) => {
          setCustomOpen(open);
          if (open) {
            setDraft(
              resolved.current.from && resolved.current.to
                ? { from: parseISO(resolved.current.from), to: parseISO(resolved.current.to) }
                : undefined,
            );
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant={selected === "custom" ? "secondary" : "outline"}
            size="sm"
            className="h-9 text-xs gap-1.5 cursor-pointer justify-start"
            aria-label={selected === "custom" ? `Custom range: ${resolved.label}` : "Custom range"}
          >
            <CalendarRange className="h-3.5 w-3.5" />
            {selected === "custom" ? resolved.label : "Custom"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-auto p-3">
          <Calendar
            mode="range"
            selected={draft}
            onSelect={setDraft}
            numberOfMonths={1}
            showYearSwitcher={false}
            disabled={(date: Date) => date > endOfDay(new Date())}
          />
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/30">
            <span className="text-xs text-muted-foreground">
              {draft?.from
                ? `${format(draft.from, "d MMM yyyy")} - ${format(draft.to ?? draft.from, "d MMM yyyy")}`
                : "Pick a start and end date"}
            </span>
            <Button size="sm" className="h-8 text-xs cursor-pointer" disabled={!draft?.from} onClick={applyCustom}>
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <span className="sr-only" aria-live="polite">
        {isPending ? "Updating analytics" : `Showing ${resolved.label}`}
      </span>
      {isPending && <Loader2 aria-hidden className="h-4 w-4 animate-spin text-primary shrink-0" />}
    </div>
  );
}

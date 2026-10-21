"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { updateWeeklyGoal } from "@/app/actions/preferences";
import type { WeekBucket } from "@/lib/analytics/summarize";
import { cn } from "@/lib/utils";
import { Panel, PanelTitle } from "./analytics-section";

function GoalForm({ goal, onDone }: { goal: number | null; onDone: () => void }) {
  const router = useRouter();
  const [value, setValue] = useState(goal ? String(goal) : "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const save = (next: number | null) =>
    startTransition(async () => {
      const result = await updateWeeklyGoal(next);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
      onDone();
    });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = value.trim();
    save(trimmed === "" ? null : Number(trimmed));
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <label htmlFor="weekly-goal" className="text-sm font-medium text-foreground">
        Applications per week
      </label>
      <Input
        id="weekly-goal"
        type="number"
        inputMode="numeric"
        min={1}
        max={200}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "weekly-goal-error" : undefined}
        className="h-9"
        autoFocus
      />
      {error && (
        <p id="weekly-goal-error" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <div className="flex justify-between gap-2">
        {goal !== null ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => save(null)} disabled={isPending}>
            Remove goal
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Saving…" : "Save goal"}
        </Button>
      </div>
    </form>
  );
}

/** Applications per week for the last 12 weeks, against the user's weekly goal. */
export function WeeklyActivity({ weeks, goal }: { weeks: WeekBucket[]; goal: number | null }) {
  const [open, setOpen] = useState(false);
  const thisWeek = weeks.at(-1)?.total ?? 0;
  const max = Math.max(1, goal ?? 0, ...weeks.map((w) => w.total));
  const weeksMet = goal ? weeks.slice(0, -1).filter((w) => w.total >= goal).length : 0;

  return (
    <Panel>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <PanelTitle>Weekly pace</PanelTitle>
          <p className="text-sm text-foreground mt-1">
            This week: <strong className="font-semibold">{thisWeek}</strong>
            {goal ? ` of ${goal}` : ""} {(goal ?? thisWeek) === 1 ? "application" : "applications"}
          </p>
          {goal && (
            <p className="text-xs text-muted-foreground">
              Goal met in {weeksMet} of the previous {weeks.length - 1} weeks
            </p>
          )}
        </div>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
              <Target className="h-3.5 w-3.5" aria-hidden />
              {goal ? "Change goal" : "Set a weekly goal"}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64">
            <GoalForm goal={goal} onDone={() => setOpen(false)} />
          </PopoverContent>
        </Popover>
      </div>

      <div className="relative mt-4 h-24" aria-hidden>
        {goal && (
          <div
            className="absolute inset-x-0 border-t border-dashed border-foreground/50"
            style={{ bottom: `${(goal / max) * 100}%` }}
          >
            <span className="absolute -top-4 right-0 text-xs text-muted-foreground bg-card px-1">
              goal {goal}
            </span>
          </div>
        )}
        <div className="flex h-full items-end gap-1">
          {weeks.map((week, i) => (
            <div key={week.start} className="flex-1 h-full flex flex-col justify-end" title={`Week of ${format(parseISO(week.start), "d MMM")}: ${week.total}`}>
              <div
                className={cn(
                  "rounded-t-sm",
                  i === weeks.length - 1 ? "bg-primary" : "bg-primary/80",
                  week.total === 0 && "bg-muted",
                )}
                style={{ height: week.total ? `${(week.total / max) * 100}%` : "2px" }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground" aria-hidden>
        <span>{weeks[0] && format(parseISO(weeks[0].start), "d MMM")}</span>
        <span>This week</span>
      </div>

      <div className="sr-only">
        <table>
          <caption>Applications per week{goal ? `, goal ${goal}` : ""}</caption>
          <thead>
            <tr>
              <th scope="col">Week of</th>
              <th scope="col">Applications</th>
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={week.start}>
                <td>{format(parseISO(week.start), "d MMMM yyyy")}</td>
                <td>{week.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

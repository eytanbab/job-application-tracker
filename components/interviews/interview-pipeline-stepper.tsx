"use client";

import { InterviewItem, getRoundTypeShortLabel, getRoundTypeColors } from "@/lib/interviews";
import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface InterviewPipelineStepperProps {
  rounds: InterviewItem[];
  activeRoundId: string | null;
  onSelectRound: (roundId: string) => void;
}

export function InterviewPipelineStepper({
  rounds,
  activeRoundId,
  onSelectRound,
}: InterviewPipelineStepperProps) {
  if (!rounds || rounds.length === 0) return null;

  const completedCount = rounds.filter((r) => r.status === "completed").length;
  const activeIndex = rounds.findIndex((r) => r.id === activeRoundId);
  const currentRound = activeIndex !== -1 ? rounds[activeIndex] : rounds[0];
  const currentLabel = getRoundTypeShortLabel(currentRound.roundType, currentRound.roundLabel);

  return (
    <div className="w-full min-w-0 max-w-full space-y-2.5 overflow-hidden">
      {/* MACRO PROGRESS HEADER */}
      <div className="flex items-center justify-between text-xs min-w-0 gap-2">
        <span className="font-semibold text-foreground truncate">
          {currentRound ? `${currentLabel} (Round ${(activeIndex !== -1 ? activeIndex : 0) + 1} of ${rounds.length})` : "Pipeline Overview"}
        </span>
        <span className="text-[11px] font-bold text-muted-foreground shrink-0">
          {completedCount}/{rounds.length} Done
        </span>
      </div>

      {/* ADAPTIVE SEGMENTED PROGRESS BAR */}
      <div className="w-full grid gap-1.5 min-w-0" style={{ gridTemplateColumns: `repeat(${rounds.length}, minmax(0, 1fr))` }}>
        {rounds.map((round, idx) => {
          const isSelected = round.id === activeRoundId;
          const isCompleted = round.status === "completed";
          const isCancelled = round.status === "cancelled";

          return (
            <button
              key={round.id}
              type="button"
              onClick={() => onSelectRound(round.id)}
              className={cn(
                "group relative h-2.5 w-full rounded-full transition-all duration-200 cursor-pointer overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isCompleted && "bg-emerald-500 hover:bg-emerald-600",
                !isCompleted && !isCancelled && isSelected && "bg-primary ring-2 ring-primary/40",
                !isCompleted && !isCancelled && !isSelected && "bg-muted hover:bg-muted-foreground/30",
                isCancelled && "bg-slate-300 dark:bg-slate-700 opacity-60",
              )}
              aria-label={`Round ${idx + 1}: ${getRoundTypeShortLabel(round.roundType, round.roundLabel)} - ${round.status}`}
            />
          );
        })}
      </div>

      {/* HORIZONTAL STAGE PILL STRIP (SAFE TOUCH CHIPS) */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 min-w-0">
        {rounds.map((round, idx) => {
          const isSelected = round.id === activeRoundId;
          const isCompleted = round.status === "completed";
          const isCancelled = round.status === "cancelled";
          const shortLabel = getRoundTypeShortLabel(round.roundType, round.roundLabel);

          return (
            <button
              key={round.id}
              type="button"
              onClick={() => onSelectRound(round.id)}
              className={cn(
                "h-7 px-2.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all active:scale-[0.98] cursor-pointer border",
                isCompleted && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
                !isCompleted && !isCancelled && isSelected && "bg-primary text-primary-foreground border-primary shadow-2xs",
                !isCompleted && !isCancelled && !isSelected && "bg-card text-muted-foreground hover:text-foreground border-border/60 hover:bg-muted/30",
                isCancelled && "bg-muted text-muted-foreground border-border/40 line-through opacity-60",
              )}
            >
              {isCompleted ? (
                <Check className="h-3 w-3 stroke-[2.5]" />
              ) : round.scheduledAt ? (
                <Clock className="h-3 w-3" />
              ) : (
                <span className="text-[11px] font-bold">{idx + 1}</span>
              )}
              <span className="truncate max-w-[110px]">{shortLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

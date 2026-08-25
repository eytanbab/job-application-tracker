"use client";

import { useEffect, useState, useTransition } from "react";
import {
  InterviewItem,
  InterviewStatus,
  pipelineTemplates,
} from "@/lib/interviews";
import {
  getInterviews,
  createInterview,
  updateInterview,
  deleteInterview,
  reorderInterviews,
  createPipelineFromTemplate,
  generateAiInterviewPrep,
} from "@/app/actions/interviews";
import { updateApplication } from "@/app/actions/applications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InterviewPipelineStepper } from "./interview-pipeline-stepper";
import { InterviewRoundCard } from "./interview-round-card";
import { ScheduleInterviewForm } from "./schedule-interview-dialog";
import {
  Plus,
  Sparkles,
  Calendar,
  Layers,
  Loader2,
  ChevronDown,
  Trophy,
  CheckCircle2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface InterviewPipelineProps {
  applicationId: string;
  application: {
    role_name: string;
    company_name: string;
  };
  onInterviewChange?: () => void;
}

export function InterviewPipeline({
  applicationId,
  application,
  onInterviewChange,
}: InterviewPipelineProps) {
  const [rounds, setRounds] = useState<InterviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeRoundId, setActiveRoundId] = useState<string | null>(null);
  const [isScheduleFormOpen, setIsScheduleFormOpen] = useState(false);
  const [editingRound, setEditingRound] = useState<InterviewItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadInterviews = async () => {
    try {
      setIsLoading(true);
      const data = await getInterviews(applicationId);
      setRounds(data);
      if (data.length > 0 && !activeRoundId) {
        const upcoming = data.find((r) => r.status === "scheduled") || data[0];
        setActiveRoundId(upcoming.id);
      }
    } catch (err) {
      console.error("Failed to load interviews:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (applicationId) {
      loadInterviews();
    }
  }, [applicationId]);

  const handleCreateOrUpdate = async (data: {
    applicationId: string;
    roundType: string;
    roundLabel?: string | null;
    scheduledAt?: string | null;
    durationMins?: string | null;
    format: string;
    meetingLink?: string | null;
    location?: string | null;
    interviewerName?: string | null;
    interviewerTitle?: string | null;
    interviewerLinkedin?: string | null;
    prepNotes?: string | null;
    questionsToAsk?: string | null;
    focusAreas?: string | null;
  }) => {
    if (editingRound?.id) {
      await updateInterview(editingRound.id, data);
      toast({ description: "Interview round updated!" });
    } else {
      const created = await createInterview(data);
      toast({ description: "Interview round scheduled!" });
      if (created?.id) {
        setActiveRoundId(created.id);
      }
    }
    setIsScheduleFormOpen(false);
    setEditingRound(null);
    await loadInterviews();
    if (onInterviewChange) onInterviewChange();
  };

  const handleDelete = async (roundId: string) => {
    try {
      await deleteInterview(roundId);
      toast({ description: "Interview round deleted" });
      await loadInterviews();
      if (onInterviewChange) onInterviewChange();
    } catch {
      toast({ description: "Failed to delete round", variant: "destructive" });
    }
  };

  const handleUpdateStatus = async (roundId: string, status: InterviewStatus) => {
    try {
      await updateInterview(roundId, { status });
      toast({ description: `Round marked as ${status}` });
      await loadInterviews();
      if (onInterviewChange) onInterviewChange();
    } catch {
      toast({ description: "Failed to update status", variant: "destructive" });
    }
  };

  const handleSaveDebrief = async (
    roundId: string,
    debriefData: { sentiment?: string; debriefNotes?: string; questionsAsked?: string; nextSteps?: string },
  ) => {
    await updateInterview(roundId, {
      ...debriefData,
      status: "completed",
    });
    await loadInterviews();
    if (onInterviewChange) onInterviewChange();
  };

  const handleGenerateAiPrep = async (roundId: string) => {
    await generateAiInterviewPrep(roundId);
    await loadInterviews();
    if (onInterviewChange) onInterviewChange();
  };

  const handleApplyTemplate = async (templateKey: keyof typeof pipelineTemplates) => {
    startTransition(async () => {
      try {
        await createPipelineFromTemplate(applicationId, templateKey);
        toast({ description: `Applied ${pipelineTemplates[templateKey].name}!` });
        await loadInterviews();
        if (onInterviewChange) onInterviewChange();
      } catch {
        toast({ description: "Failed to apply template", variant: "destructive" });
      }
    });
  };

  const handleMoveRound = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= rounds.length) return;

    const newRounds = [...rounds];
    const [moved] = newRounds.splice(index, 1);
    newRounds.splice(targetIndex, 0, moved);

    setRounds(newRounds);
    try {
      await reorderInterviews(
        applicationId,
        newRounds.map((r) => r.id),
      );
      toast({ description: "Pipeline reordered" });
    } catch {
      await loadInterviews();
      toast({ description: "Failed to reorder rounds", variant: "destructive" });
    }
  };

  const allRoundsCompleted = rounds.length > 0 && rounds.every((r) => r.status === "completed");

  return (
    <div className="space-y-3.5 w-full min-w-0 max-w-full overflow-hidden">
      {/* PIPELINE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-border/40 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <Calendar className="h-4 w-4 text-primary shrink-0" />
          <h3 className="text-sm font-bold text-foreground font-heading truncate">
            Interview Pipeline
          </h3>
          {rounds.length > 0 && (
            <span className="text-xs bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full border border-primary/20 shrink-0">
              {rounds.filter((r) => r.status === "completed").length}/{rounds.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Template dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isPending}
                className="h-8 text-xs font-medium gap-1 bg-card cursor-pointer"
              >
                <Layers className="h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline">Templates</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 text-xs">
              <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase">
                1-Click Templates
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(pipelineTemplates) as Array<keyof typeof pipelineTemplates>).map((key) => {
                const t = pipelineTemplates[key];
                return (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => handleApplyTemplate(key)}
                    className="cursor-pointer py-2"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-foreground">{t.name}</span>
                      <span className="text-[11px] text-muted-foreground">{t.description}</span>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {!isScheduleFormOpen && (
            <Button
              size="sm"
              onClick={() => {
                setEditingRound(null);
                setIsScheduleFormOpen(true);
              }}
              className="h-8 text-xs font-bold gap-1 cursor-pointer bg-primary text-primary-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Round</span>
            </Button>
          )}
        </div>
      </div>

      {/* ADAPTIVE SEGMENTED PROGRESS STEPPER */}
      {rounds.length > 0 && (
        <div className="bg-card p-3 rounded-xl border border-border/40 shadow-2xs min-w-0 w-full overflow-hidden">
          <InterviewPipelineStepper
            rounds={rounds}
            activeRoundId={activeRoundId}
            onSelectRound={(id) => {
              setActiveRoundId((prev) => (prev === id ? null : id));
            }}
          />
        </div>
      )}

      {/* INLINE SCHEDULE / EDIT FORM (ZERO NESTED MODALS ON MOBILE) */}
      {isScheduleFormOpen && (
        <ScheduleInterviewForm
          applicationId={applicationId}
          initialInterview={editingRound}
          onCancel={() => {
            setIsScheduleFormOpen(false);
            setEditingRound(null);
          }}
          onSubmit={handleCreateOrUpdate}
          isInline={true}
        />
      )}

      {/* ALL COMPLETED CELEBRATORY MILESTONE */}
      {allRoundsCompleted && !isScheduleFormOpen && (
        <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between gap-3 text-xs animate-in fade-in-50">
          <div className="flex items-center gap-2.5 min-w-0">
            <Trophy className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div className="min-w-0">
              <p className="font-bold text-foreground truncate">All interview rounds completed!</p>
              <p className="text-[11px] text-muted-foreground truncate">Advance application status or log final notes</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs font-bold border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 shrink-0"
            onClick={async () => {
              await updateApplication({
                id: applicationId,
                status: "Accepted / Offer",
                statusCategory: "accepted",
              } as any);
              toast({ description: "Application status updated to Accepted / Offer 🎉" });
              if (onInterviewChange) onInterviewChange();
            }}
          >
            Mark Offer Received 🏆
          </Button>
        </div>
      )}

      {/* ROUNDS LIST OR EMPTY STATE */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground text-xs gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span>Loading interview rounds...</span>
        </div>
      ) : rounds.length === 0 && !isScheduleFormOpen ? (
        <div className="flex flex-col items-center justify-center text-center py-7 px-4 bg-card rounded-xl border border-dashed border-border/70 space-y-3 min-w-0 w-full">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Calendar className="h-4 w-4" />
          </div>

          <div className="space-y-1 max-w-sm">
            <h4 className="text-xs sm:text-sm font-bold text-foreground">No interview rounds scheduled yet</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Track your interview rounds, generate targeted AI prep dossiers, and log instant debriefs.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => {
                setEditingRound(null);
                setIsScheduleFormOpen(true);
              }}
              className="h-9 text-xs font-bold gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Schedule First Round</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleApplyTemplate("tech_loop")}
              disabled={isPending}
              className="h-9 text-xs font-medium gap-1.5 bg-card"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span>Standard 4-Round Loop</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5 w-full min-w-0">
          {rounds.map((round, idx) => (
            <InterviewRoundCard
              key={round.id}
              round={round}
              index={idx}
              totalRounds={rounds.length}
              application={application}
              isExpanded={activeRoundId === round.id}
              onToggleExpand={() => setActiveRoundId((prev) => (prev === round.id ? null : round.id))}
              onEdit={(r) => {
                setEditingRound(r);
                setIsScheduleFormOpen(true);
              }}
              onDelete={handleDelete}
              onUpdateStatus={handleUpdateStatus}
              onSaveDebrief={handleSaveDebrief}
              onGenerateAiPrep={handleGenerateAiPrep}
              onMoveUp={() => handleMoveRound(idx, "up")}
              onMoveDown={() => handleMoveRound(idx, "down")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

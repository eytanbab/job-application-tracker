"use client";

import { useState } from "react";
import {
  InterviewItem,
  getRoundTypeLabel,
  getRoundTypeColors,
  getInterviewStatusBadge,
  formatInterviewDate,
  getRelativeInterviewTime,
  getGoogleCalendarUrl,
  generateIcsFileString,
  InterviewStatus,
  InterviewSentiment,
} from "@/lib/interviews";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Video,
  Phone,
  Building,
  User,
  Globe,
  Calendar,
  Clock,
  MoreVertical,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Sparkles,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  FileDown,
  Smile,
  Meh,
  Frown,
  Loader2,
  CalendarPlus,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface InterviewRoundCardProps {
  round: InterviewItem;
  index: number;
  totalRounds: number;
  application: {
    role_name: string;
    company_name: string;
  };
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: (round: InterviewItem) => void;
  onDelete: (roundId: string) => void;
  onUpdateStatus: (roundId: string, status: InterviewStatus) => void;
  onSaveDebrief: (roundId: string, debriefData: { sentiment?: string; debriefNotes?: string; questionsAsked?: string; nextSteps?: string }) => Promise<void>;
  onGenerateAiPrep: (roundId: string) => Promise<void>;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

export function InterviewRoundCard({
  round,
  index,
  totalRounds,
  application,
  isExpanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onUpdateStatus,
  onSaveDebrief,
  onGenerateAiPrep,
  onMoveUp,
  onMoveDown,
}: InterviewRoundCardProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isSavingDebrief, setIsSavingDebrief] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Local state for debrief fields
  const [sentiment, setSentiment] = useState<InterviewSentiment>(round.sentiment || "");
  const [questionsAsked, setQuestionsAsked] = useState(round.questionsAsked || "");
  const [debriefNotes, setDebriefNotes] = useState(round.debriefNotes || "");
  const [nextSteps, setNextSteps] = useState(round.nextSteps || "");

  const colors = getRoundTypeColors(round.roundType);
  const statusBadge = getInterviewStatusBadge(round.status);
  const timeInfo = getRelativeInterviewTime(round.scheduledAt);
  const label = getRoundTypeLabel(round.roundType, round.roundLabel);
  const gcalUrl = getGoogleCalendarUrl(round, application);

  const handleCopyMeetingLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!round.meetingLink) return;
    navigator.clipboard.writeText(round.meetingLink);
    setCopiedLink(true);
    toast({ description: "Meeting link copied to clipboard" });
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDownloadIcs = (e: React.MouseEvent) => {
    e.stopPropagation();
    const icsContent = generateIcsFileString(round, application);
    if (!icsContent) {
      toast({ description: "Could not generate calendar invite", variant: "destructive" });
      return;
    }
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `interview-${round.roundNumber}-${application.company_name}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ description: "Calendar invite (.ics) downloaded" });
  };

  const handleAiPrepClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGeneratingAi(true);
    try {
      await onGenerateAiPrep(round.id);
      toast({ description: "✨ AI Interview Prep briefing generated & saved!" });
    } catch {
      toast({ description: "Failed to generate AI prep briefing", variant: "destructive" });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleSaveDebriefClick = async () => {
    setIsSavingDebrief(true);
    try {
      await onSaveDebrief(round.id, {
        sentiment: sentiment || undefined,
        questionsAsked: questionsAsked || undefined,
        debriefNotes: debriefNotes || undefined,
        nextSteps: nextSteps || undefined,
      });
      toast({ description: "Debrief notes saved successfully!" });
    } catch {
      toast({ description: "Failed to save debrief notes", variant: "destructive" });
    } finally {
      setIsSavingDebrief(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "rounded-xl border transition-all duration-200 bg-card overflow-hidden shadow-2xs w-full min-w-0 max-w-full",
          isExpanded ? "border-primary/40 ring-1 ring-primary/10" : "border-border/60 hover:border-border",
        )}
      >
        {/* CARD HEADER */}
        <div
          onClick={onToggleExpand}
          className="p-3 sm:p-4 flex items-start sm:items-center justify-between gap-2.5 cursor-pointer select-none bg-card hover:bg-muted/10 transition-colors min-w-0"
        >
          <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
            {/* Round Number Indicator */}
            <div
              className={cn(
                "h-8 w-8 sm:h-9 sm:w-9 rounded-lg flex items-center justify-center shrink-0 font-bold text-xs border",
                colors.badge,
              )}
            >
              <span>R{round.roundNumber || index + 1}</span>
            </div>

            <div className="min-w-0 flex-1 space-y-1 overflow-hidden">
              <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-foreground font-heading tracking-tight truncate max-w-full">
                  {label}
                </h4>

                <Badge variant="outline" className={cn("text-[11px] py-0 h-5 font-semibold shrink-0", statusBadge.className)}>
                  {statusBadge.label}
                </Badge>

                {timeInfo.urgency === "today" && (
                  <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 text-[11px] py-0 h-5 font-semibold shrink-0">
                    🔴 Today
                  </Badge>
                )}
                {timeInfo.urgency === "tomorrow" && (
                  <Badge className="bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30 text-[11px] py-0 h-5 font-semibold shrink-0">
                    Tomorrow
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground min-w-0">
                {round.scheduledAt ? (
                  <span className="flex items-center gap-1 font-medium text-foreground/90 truncate">
                    <Calendar className="h-3 w-3 text-primary shrink-0" />
                    {formatInterviewDate(round.scheduledAt)}
                  </span>
                ) : (
                  <span className="text-muted-foreground/80 italic text-xs">Date TBD</span>
                )}

                {round.durationMins && (
                  <span className="flex items-center gap-1 shrink-0">
                    <Clock className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                    {round.durationMins}m
                  </span>
                )}

                {round.interviewerName && (
                  <span className="hidden md:flex items-center gap-1 truncate max-w-[140px]">
                    <User className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                    {round.interviewerName}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {round.meetingLink && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-xs font-semibold gap-1 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer hidden sm:inline-flex"
                asChild
              >
                <a href={round.meetingLink} target="_blank" rel="noopener noreferrer" title="Join Call">
                  <Video className="h-3.5 w-3.5 text-primary" />
                  <span>Join</span>
                </a>
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 text-xs">
                <DropdownMenuItem onClick={() => onEdit(round)} className="cursor-pointer gap-2">
                  <Pencil className="h-3.5 w-3.5" /> Edit Details
                </DropdownMenuItem>

                {gcalUrl && (
                  <DropdownMenuItem asChild className="cursor-pointer gap-2">
                    <a href={gcalUrl} target="_blank" rel="noopener noreferrer">
                      <CalendarPlus className="h-3.5 w-3.5 text-primary" /> Add to Google Calendar
                    </a>
                  </DropdownMenuItem>
                )}

                {round.scheduledAt && (
                  <DropdownMenuItem onClick={handleDownloadIcs} className="cursor-pointer gap-2">
                    <FileDown className="h-3.5 w-3.5 text-primary" /> Download .ics Invite
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                {round.status !== "completed" ? (
                  <DropdownMenuItem onClick={() => onUpdateStatus(round.id, "completed")} className="cursor-pointer gap-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark Completed
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onUpdateStatus(round.id, "scheduled")} className="cursor-pointer gap-2">
                    <Clock className="h-3.5 w-3.5" /> Mark Scheduled
                  </DropdownMenuItem>
                )}

                {onMoveUp && index > 0 && (
                  <DropdownMenuItem onClick={onMoveUp} className="cursor-pointer gap-2">
                    <ArrowUp className="h-3.5 w-3.5" /> Move Up
                  </DropdownMenuItem>
                )}
                {onMoveDown && index < totalRounds - 1 && (
                  <DropdownMenuItem onClick={onMoveDown} className="cursor-pointer gap-2">
                    <ArrowDown className="h-3.5 w-3.5" /> Move Down
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="cursor-pointer gap-2 text-destructive focus:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" /> Delete Round
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleExpand}
              className="h-8 w-8 p-0 text-muted-foreground"
              aria-label={isExpanded ? "Collapse details" : "Expand details"}
            >
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* EXPANDED CONTENT DRAWER */}
        {isExpanded && (
          <div className="p-3.5 sm:p-4 pt-0 border-t border-border/40 space-y-3.5 bg-muted/10 animate-in fade-in-50 duration-200 min-w-0">
            {/* Mobile Prominent Join Button */}
            {round.meetingLink && (
              <div className="sm:hidden pt-3">
                <Button
                  size="sm"
                  className="w-full h-11 text-xs font-bold gap-2 bg-primary text-primary-foreground shadow-sm"
                  asChild
                >
                  <a href={round.meetingLink} target="_blank" rel="noopener noreferrer">
                    <Video className="h-4 w-4" />
                    <span>Join Video Meeting</span>
                  </a>
                </Button>
              </div>
            )}

            {/* Logistics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs min-w-0">
              {/* Format & Link */}
              <div className="bg-card p-3 rounded-lg border border-border/40 space-y-1 min-w-0">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  {round.format === "video" && <Video className="h-3 w-3 text-sky-500" />}
                  {round.format === "phone" && <Phone className="h-3 w-3 text-emerald-500" />}
                  {round.format === "onsite" && <Building className="h-3 w-3 text-amber-500" />}
                  Format & Link
                </span>
                <p className="font-medium capitalize text-foreground truncate">
                  {round.format === "video" ? "Video Call" : round.format === "phone" ? "Phone Call" : "Onsite"}
                </p>
                {round.meetingLink && (
                  <div className="flex items-center gap-1 pt-1 min-w-0">
                    <a
                      href={round.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-semibold truncate flex-1 block text-xs"
                    >
                      {round.meetingLink}
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyMeetingLink}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground shrink-0"
                      title="Copy Meeting Link"
                    >
                      {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                )}
                {round.location && (
                  <p className="text-muted-foreground text-xs pt-1 truncate">📍 {round.location}</p>
                )}
              </div>

              {/* People Context */}
              <div className="bg-card p-3 rounded-lg border border-border/40 space-y-1 min-w-0">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <User className="h-3 w-3 text-primary" /> Interviewer
                </span>
                <p className="font-medium text-foreground truncate">
                  {round.interviewerName || "Not specified"}
                </p>
                {round.interviewerTitle && (
                  <p className="text-muted-foreground text-xs truncate">{round.interviewerTitle}</p>
                )}
                {round.interviewerLinkedin && (
                  <a
                    href={round.interviewerLinkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sky-600 hover:underline text-xs pt-1 font-medium truncate max-w-full"
                  >
                    <Globe className="h-3 w-3 shrink-0" /> View Profile
                  </a>
                )}
              </div>

              {/* Calendar Quick Sync */}
              <div className="bg-card p-3 rounded-lg border border-border/40 space-y-2 min-w-0">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Calendar className="h-3 w-3 text-primary" /> Calendar Sync
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {gcalUrl ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-medium gap-1 flex-1 bg-card"
                      asChild
                    >
                      <a href={gcalUrl} target="_blank" rel="noopener noreferrer">
                        <CalendarPlus className="h-3.5 w-3.5 text-primary" /> GCal
                      </a>
                    </Button>
                  ) : null}
                  {round.scheduledAt && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleDownloadIcs}
                      className="h-8 text-xs font-medium gap-1 flex-1 text-muted-foreground hover:text-foreground"
                    >
                      <FileDown className="h-3.5 w-3.5" /> .ics
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* PREPARATION & FOCUS AREAS */}
            <div className="bg-card p-3.5 rounded-lg border border-border/40 space-y-3 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" /> Prep Briefing
                </h5>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAiPrepClick}
                  disabled={isGeneratingAi}
                  className="h-8 text-xs px-2.5 gap-1.5 font-semibold text-primary border-primary/30 hover:bg-primary/10 cursor-pointer"
                >
                  {isGeneratingAi ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      <span>✨ AI Prep Briefing</span>
                    </>
                  )}
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs min-w-0">
                <div className="space-y-1 min-w-0">
                  <span className="font-semibold text-muted-foreground block text-xs">
                    Key Focus Areas & Concepts
                  </span>
                  <div className="rounded-md border border-border/30 bg-muted/20 p-2.5 leading-relaxed whitespace-pre-wrap min-h-[45px]">
                    {round.focusAreas || "No focus areas noted yet. Click 'AI Prep Briefing' to auto-generate."}
                  </div>
                </div>

                <div className="space-y-1 min-w-0">
                  <span className="font-semibold text-muted-foreground block text-xs">
                    Questions for Interviewer
                  </span>
                  <div className="rounded-md border border-border/30 bg-muted/20 p-2.5 leading-relaxed whitespace-pre-wrap min-h-[45px]">
                    {round.questionsToAsk || "No questions noted yet."}
                  </div>
                </div>
              </div>

              {round.prepNotes && (
                <div className="space-y-1 text-xs pt-1 min-w-0">
                  <span className="font-semibold text-muted-foreground block text-xs">
                    Strategic Briefing & STAR Stories
                  </span>
                  <div className="rounded-md border border-border/30 bg-muted/20 p-2.5 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                    {round.prepNotes}
                  </div>
                </div>
              )}
            </div>

            {/* POST-INTERVIEW DEBRIEF */}
            <div className="bg-card p-3.5 rounded-lg border border-border/40 space-y-3 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Post-Interview Debrief
                </h5>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveDebriefClick}
                  disabled={isSavingDebrief}
                  className="h-8 text-xs px-3 font-bold cursor-pointer"
                >
                  {isSavingDebrief ? "Saving..." : "Save Debrief"}
                </Button>
              </div>

              {/* 1-Tap Sentiment Chips */}
              <div className="space-y-1.5 min-w-0">
                <span className="text-xs font-semibold text-muted-foreground block">
                  How did this round go?
                </span>
                <div className="grid grid-cols-3 gap-1.5 min-w-0">
                  <Button
                    type="button"
                    variant={sentiment === "great" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setSentiment("great")}
                    className={cn(
                      "h-9 text-xs font-semibold gap-1",
                      sentiment === "great" && "border-emerald-500/60 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/30",
                    )}
                  >
                    <Smile className="h-3.5 w-3.5 text-emerald-500 shrink-0" /> Went Well 😊
                  </Button>
                  <Button
                    type="button"
                    variant={sentiment === "okay" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setSentiment("okay")}
                    className={cn(
                      "h-9 text-xs font-semibold gap-1",
                      sentiment === "okay" && "border-amber-500/60 bg-amber-500/15 text-amber-700 dark:text-amber-300 ring-1 ring-amber-500/30",
                    )}
                  >
                    <Meh className="h-3.5 w-3.5 text-amber-500 shrink-0" /> Mixed 😐
                  </Button>
                  <Button
                    type="button"
                    variant={sentiment === "rough" ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setSentiment("rough")}
                    className={cn(
                      "h-9 text-xs font-semibold gap-1",
                      sentiment === "rough" && "border-rose-500/60 bg-rose-500/15 text-rose-700 dark:text-rose-300 ring-1 ring-rose-500/30",
                    )}
                  >
                    <Frown className="h-3.5 w-3.5 text-rose-500 shrink-0" /> Rough 😟
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs pt-1 min-w-0">
                <div className="space-y-1 min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground block">
                    Questions They Asked You
                  </span>
                  <Textarea
                    placeholder="e.g. Distributed lock design, handling DB failovers, past conflict with PM"
                    value={questionsAsked}
                    onChange={(e) => setQuestionsAsked(e.target.value)}
                    className="text-xs min-h-[60px] bg-muted/10 leading-relaxed"
                  />
                </div>

                <div className="space-y-1 min-w-0">
                  <span className="text-xs font-semibold text-muted-foreground block">
                    Next Steps & Feedback Date
                  </span>
                  <Textarea
                    placeholder="e.g. Recruiter Promised update by Friday; send thank-you note by tomorrow"
                    value={nextSteps}
                    onChange={(e) => setNextSteps(e.target.value)}
                    className="text-xs min-h-[60px] bg-muted/10 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CONFIRMATION DIALOG FOR DELETE */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="w-full max-w-[calc(100vw-2rem)] sm:max-w-md p-4 sm:p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              Delete Interview Round?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              This will permanently delete <strong className="text-foreground">{label}</strong> and any saved prep notes, debrief logs, and calendar linkages.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                onDelete(round.id);
              }}
            >
              Delete Round
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

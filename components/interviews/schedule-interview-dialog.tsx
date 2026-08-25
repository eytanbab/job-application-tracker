"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Calendar as CalendarIcon,
  Clock,
  Video,
  Phone,
  Building,
  User,
  Globe,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Link as LinkIcon,
  Clipboard,
  X,
} from "lucide-react";
import {
  RoundType,
  InterviewFormat,
  InterviewItem,
  roundTypeOptions,
  formatOptions,
  getUserLocalTimezone,
} from "@/lib/interviews";
import { format, addDays, parseISO } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface ScheduleInterviewFormProps {
  applicationId: string;
  initialInterview?: InterviewItem | null;
  onCancel: () => void;
  onSubmit: (data: {
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
  }) => Promise<void>;
  isInline?: boolean;
}

export function ScheduleInterviewForm({
  applicationId,
  initialInterview,
  onCancel,
  onSubmit,
  isInline = true,
}: ScheduleInterviewFormProps) {
  const isEditing = !!initialInterview?.id;

  const [roundType, setRoundType] = useState<RoundType>("technical");
  const [roundLabel, setRoundLabel] = useState("");
  const [dateString, setDateString] = useState(format(addDays(new Date(), 1), "yyyy-MM-dd"));
  const [timeString, setTimeString] = useState("14:00");
  const [durationMins, setDurationMins] = useState("45");
  const [formatType, setFormatType] = useState<InterviewFormat>("video");
  const [meetingLink, setMeetingLink] = useState("");
  const [location, setLocation] = useState("");
  const [interviewerName, setInterviewerName] = useState("");
  const [interviewerTitle, setInterviewerTitle] = useState("");
  const [interviewerLinkedin, setInterviewerLinkedin] = useState("");
  const [focusAreas, setFocusAreas] = useState("");
  const [questionsToAsk, setQuestionsToAsk] = useState("");
  const [prepNotes, setPrepNotes] = useState("");

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const localTimezone = getUserLocalTimezone();

  useEffect(() => {
    if (initialInterview) {
      setRoundType((initialInterview.roundType as RoundType) || "technical");
      setRoundLabel(initialInterview.roundLabel || "");
      if (initialInterview.scheduledAt) {
        const d = typeof initialInterview.scheduledAt === "string"
          ? parseISO(initialInterview.scheduledAt)
          : initialInterview.scheduledAt;
        if (!isNaN(d.getTime())) {
          setDateString(format(d, "yyyy-MM-dd"));
          setTimeString(format(d, "HH:mm"));
        }
      }
      setDurationMins(initialInterview.durationMins || "45");
      setFormatType((initialInterview.format as InterviewFormat) || "video");
      setMeetingLink(initialInterview.meetingLink || "");
      setLocation(initialInterview.location || "");
      setInterviewerName(initialInterview.interviewerName || "");
      setInterviewerTitle(initialInterview.interviewerTitle || "");
      setInterviewerLinkedin(initialInterview.interviewerLinkedin || "");
      setFocusAreas(initialInterview.focusAreas || "");
      setQuestionsToAsk(initialInterview.questionsToAsk || "");
      setPrepNotes(initialInterview.prepNotes || "");
      setShowAdvanced(
        Boolean(
          initialInterview.interviewerName ||
          initialInterview.interviewerLinkedin ||
          initialInterview.prepNotes ||
          initialInterview.questionsToAsk,
        ),
      );
    } else {
      setRoundType("phone_screen");
      setRoundLabel("");
      setDateString(format(addDays(new Date(), 1), "yyyy-MM-dd"));
      setTimeString("14:00");
      setDurationMins("30");
      setFormatType("video");
      setMeetingLink("");
      setLocation("");
      setInterviewerName("");
      setInterviewerTitle("");
      setInterviewerLinkedin("");
      setFocusAreas("");
      setQuestionsToAsk("");
      setPrepNotes("");
      setShowAdvanced(false);
    }
  }, [initialInterview]);

  const handleRoundTypeChange = (type: RoundType) => {
    setRoundType(type);
    const opt = roundTypeOptions.find((o) => o.value === type);
    if (opt && !initialInterview) {
      setDurationMins(String(opt.defaultDuration));
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && (text.startsWith("http://") || text.startsWith("https://"))) {
        setMeetingLink(text);
        if (text.includes("zoom") || text.includes("meet.google") || text.includes("teams")) {
          setFormatType("video");
        }
        toast({ description: "Meeting link pasted from clipboard" });
      } else {
        toast({ description: "No valid URL found in clipboard", variant: "destructive" });
      }
    } catch {
      toast({ description: "Could not access clipboard", variant: "destructive" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let combinedIsoDate: string | null = null;
      if (dateString) {
        const [hours, mins] = timeString.split(":").map(Number);
        const [year, month, day] = dateString.split("-").map(Number);
        const fullDate = new Date(year, month - 1, day, hours || 0, mins || 0, 0, 0);
        if (!isNaN(fullDate.getTime())) {
          combinedIsoDate = fullDate.toISOString();
        }
      }

      await onSubmit({
        applicationId,
        roundType,
        roundLabel: roundLabel.trim() || null,
        scheduledAt: combinedIsoDate,
        durationMins: durationMins || "30",
        format: formatType,
        meetingLink: meetingLink.trim() || null,
        location: location.trim() || null,
        interviewerName: interviewerName.trim() || null,
        interviewerTitle: interviewerTitle.trim() || null,
        interviewerLinkedin: interviewerLinkedin.trim() || null,
        focusAreas: focusAreas.trim() || null,
        questionsToAsk: questionsToAsk.trim() || null,
        prepNotes: prepNotes.trim() || null,
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error saving interview",
        description: "Please check your network connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={cn(
        "w-full min-w-0 max-w-full overflow-hidden transition-all duration-300 rounded-xl border border-primary/30 bg-card p-3.5 sm:p-5 shadow-sm space-y-4",
        isInline ? "animate-in slide-in-from-top-2 duration-200" : "",
      )}
    >
      {/* FORM HEADER */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/40">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <CalendarIcon className="h-4 w-4" />
          </div>
          <h4 className="text-sm font-bold text-foreground font-heading truncate">
            {isEditing ? "Edit Interview Round" : "Schedule Interview Round"}
          </h4>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground shrink-0 rounded-full"
          aria-label="Cancel scheduling"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 min-w-0 max-w-full">
        {/* 1-TAP SEGMENTED ROUND TYPE CHIPS */}
        <div className="space-y-1.5 min-w-0">
          <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
            <span>Round Type</span>
            <span className="text-[11px] text-muted-foreground font-normal">1-tap select</span>
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 min-w-0">
            {roundTypeOptions.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant={roundType === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleRoundTypeChange(opt.value)}
                className={cn(
                  "h-10 text-xs font-semibold px-2 flex flex-col items-center justify-center gap-0.5 rounded-lg active:scale-[0.98] transition-transform",
                  roundType === opt.value
                    ? "bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/20"
                    : "bg-card hover:bg-muted/40 text-foreground border-border/60",
                )}
              >
                <span className="truncate w-full text-center">{opt.shortLabel}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* CUSTOM ROUND TITLE */}
        <div className="space-y-1">
          <Label htmlFor="custom-label" className="text-xs font-medium text-muted-foreground">
            Custom Stage Name <span className="text-[11px]">(Optional)</span>
          </Label>
          <Input
            id="custom-label"
            placeholder="e.g. System Design Deep Dive"
            value={roundLabel}
            onChange={(e) => setRoundLabel(e.target.value)}
            className="h-10 text-xs bg-card"
          />
        </div>

        {/* MOBILE-FIRST DATE & TIME + TIMEZONE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center justify-between">
              <Label htmlFor="interview-date" className="text-xs font-semibold text-foreground">
                Date
              </Label>
              <div className="flex items-center gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setDateString(format(new Date(), "yyyy-MM-dd"))}
                  className="text-primary font-medium hover:underline cursor-pointer"
                >
                  Today
                </button>
                <span className="text-muted-foreground">·</span>
                <button
                  type="button"
                  onClick={() => setDateString(format(addDays(new Date(), 1), "yyyy-MM-dd"))}
                  className="text-primary font-medium hover:underline cursor-pointer"
                >
                  Tomorrow
                </button>
              </div>
            </div>
            <div className="relative min-w-0">
              <Input
                id="interview-date"
                type="date"
                value={dateString}
                onChange={(e) => setDateString(e.target.value)}
                className="h-10 text-xs bg-card pl-8 font-medium w-full"
              />
              <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center justify-between">
              <Label htmlFor="interview-time" className="text-xs font-semibold text-foreground">
                Start Time
              </Label>
              <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                <Globe className="h-3 w-3 text-sky-500" />
                {localTimezone.split("/").pop()?.replace("_", " ") || "Local"}
              </span>
            </div>
            <div className="relative min-w-0">
              <Input
                id="interview-time"
                type="time"
                value={timeString}
                onChange={(e) => setTimeString(e.target.value)}
                className="h-10 text-xs bg-card pl-8 font-medium w-full"
              />
              <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>
        </div>

        {/* 1-TAP DURATION PRESET CHIPS */}
        <div className="space-y-1.5 min-w-0">
          <Label className="text-xs font-semibold text-foreground">Expected Duration</Label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 min-w-0">
            {["15", "30", "45", "60", "90", "180"].map((mins) => (
              <Button
                key={mins}
                type="button"
                variant={durationMins === mins ? "default" : "outline"}
                size="sm"
                onClick={() => setDurationMins(mins)}
                className={cn(
                  "h-9 text-xs font-medium rounded-lg active:scale-[0.98] transition-all",
                  durationMins === mins
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "bg-card text-foreground border-border/60 hover:bg-muted/40",
                )}
              >
                {mins === "180" ? "3 Hours" : `${mins} min`}
              </Button>
            ))}
          </div>
        </div>

        {/* FORMAT SELECTION (3-SEGMENT BAR) */}
        <div className="space-y-1.5 min-w-0">
          <Label className="text-xs font-semibold text-foreground">Interview Format</Label>
          <div className="grid grid-cols-3 gap-1.5 min-w-0">
            {formatOptions.map((opt) => (
              <Button
                key={opt.value}
                type="button"
                variant={formatType === opt.value ? "secondary" : "outline"}
                size="sm"
                onClick={() => setFormatType(opt.value)}
                className={cn(
                  "h-10 text-xs font-semibold gap-1.5 rounded-lg active:scale-[0.98] transition-all bg-card",
                  formatType === opt.value && "bg-secondary border-primary/40 ring-1 ring-primary/20",
                )}
              >
                {opt.value === "video" && <Video className="h-4 w-4 text-sky-500 shrink-0" />}
                {opt.value === "phone" && <Phone className="h-4 w-4 text-emerald-500 shrink-0" />}
                {opt.value === "onsite" && <Building className="h-4 w-4 text-amber-500 shrink-0" />}
                <span className="truncate">{opt.label.split(" ")[0]}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* MEETING LINK WITH 1-TAP CLIPBOARD INGESTION */}
        <div className="space-y-1.5 min-w-0">
          <div className="flex items-center justify-between">
            <Label htmlFor="meeting-link" className="text-xs font-semibold text-foreground flex items-center gap-1">
              <LinkIcon className="h-3.5 w-3.5 text-primary" /> Meeting Link / Video URL
            </Label>
            <button
              type="button"
              onClick={handlePasteClipboard}
              className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Clipboard className="h-3 w-3" /> Paste Clipboard
            </button>
          </div>
          <Input
            id="meeting-link"
            placeholder="https://zoom.us/j/... or Google Meet URL"
            value={meetingLink}
            onChange={(e) => {
              setMeetingLink(e.target.value);
              if (e.target.value.includes("zoom") || e.target.value.includes("meet") || e.target.value.includes("teams")) {
                setFormatType("video");
              }
            }}
            className="h-10 text-xs bg-card w-full"
          />
        </div>

        {/* ONSITE PHYSICAL ADDRESS */}
        {formatType === "onsite" && (
          <div className="space-y-1.5 min-w-0 animate-in fade-in-50">
            <Label htmlFor="onsite-location" className="text-xs font-medium">
              Office / Onsite Address
            </Label>
            <Input
              id="onsite-location"
              placeholder="e.g. 1600 Amphitheatre Pkwy, Mountain View, CA"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="h-10 text-xs bg-card w-full"
            />
          </div>
        )}

        {/* COLLAPSIBLE CONTEXT & PREP (PROGRESSIVE DISCLOSURE) */}
        <div className="border-t border-border/40 pt-2 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground hover:text-foreground h-9 px-2"
          >
            <span>{showAdvanced ? "Hide Interviewer & Prep Notes" : "+ Add Interviewer & Strategy Notes"}</span>
            {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          {showAdvanced && (
            <div className="space-y-3.5 pt-3 animate-in fade-in-50 duration-200 min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                <div className="space-y-1">
                  <Label htmlFor="interviewer-name" className="text-xs font-medium flex items-center gap-1">
                    <User className="h-3.5 w-3.5" /> Interviewer Name
                  </Label>
                  <Input
                    id="interviewer-name"
                    placeholder="e.g. Sarah Chen"
                    value={interviewerName}
                    onChange={(e) => setInterviewerName(e.target.value)}
                    className="h-10 text-xs bg-card"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="interviewer-title" className="text-xs font-medium">
                    Interviewer Title
                  </Label>
                  <Input
                    id="interviewer-title"
                    placeholder="e.g. Staff Engineer"
                    value={interviewerTitle}
                    onChange={(e) => setInterviewerTitle(e.target.value)}
                    className="h-10 text-xs bg-card"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="interviewer-linkedin" className="text-xs font-medium flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5 text-sky-600" /> LinkedIn Profile URL
                </Label>
                <Input
                  id="interviewer-linkedin"
                  placeholder="https://linkedin.com/in/..."
                  value={interviewerLinkedin}
                  onChange={(e) => setInterviewerLinkedin(e.target.value)}
                  className="h-10 text-xs bg-card"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="focus-areas" className="text-xs font-medium flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Focus Areas & Topics
                </Label>
                <Textarea
                  id="focus-areas"
                  placeholder="e.g. System design, distributed caching, team leadership stories"
                  value={focusAreas}
                  onChange={(e) => setFocusAreas(e.target.value)}
                  className="text-xs min-h-[60px] bg-card leading-relaxed"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="questions-to-ask" className="text-xs font-medium">
                  Questions to Ask Interviewer
                </Label>
                <Textarea
                  id="questions-to-ask"
                  placeholder="e.g. What is the engineering team's current highest leverage project?"
                  value={questionsToAsk}
                  onChange={(e) => setQuestionsToAsk(e.target.value)}
                  className="text-xs min-h-[60px] bg-card leading-relaxed"
                />
              </div>
            </div>
          )}
        </div>

        {/* STICKY BOTTOM THUMB-ZONE ACTION BAR */}
        <div className="pt-3 border-t border-border/40 flex items-center justify-end gap-2.5 min-w-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
            className="h-10 text-xs font-medium px-4 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting}
            className="h-10 text-xs font-bold px-5 bg-primary text-primary-foreground shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
          >
            {isSubmitting ? "Saving..." : isEditing ? "Update Round" : "Save & Schedule"}
          </Button>
        </div>
      </form>
    </div>
  );
}

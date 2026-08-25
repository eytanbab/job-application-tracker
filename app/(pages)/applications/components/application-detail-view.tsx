"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Globe,
  MapPin,
  DollarSign,
  FileText,
  MessageSquare,
  Copy,
  Check,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, parseISO } from "date-fns";
import { statusOptions, statusLabels, StatusKind } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";
import { ApplicationTimeline, TimelineEntry } from "./application-timeline";
import { InterviewPipeline } from "@/components/interviews/interview-pipeline";

export interface ApplicationDetailViewProps {
  currentApp: {
    id?: string;
    role_name: string;
    company_name: string;
    date_applied: string;
    link: string;
    platform: string;
    status: string;
    statusCategory?: string | null;
    description?: string | null;
    notes?: string | null;
    location: string;
    salary?: string | null;
  };
  currentKind: StatusKind;
  quickStatusText: string;
  setQuickStatusText: (val: string) => void;
  handleQuickStatusChange: (cat: string, text?: string) => void;
  isSaving: boolean;
  history: TimelineEntry[];
  isLoadingHistory: boolean;
  onDeleteTimelineEntry: (id: string) => void;
}

export function ApplicationDetailView({
  currentApp,
  currentKind,
  quickStatusText,
  setQuickStatusText,
  handleQuickStatusChange,
  isSaving,
  history,
  isLoadingHistory,
  onDeleteTimelineEntry,
}: ApplicationDetailViewProps) {
  const [copiedJd, setCopiedJd] = useState(false);

  const handleCopyJd = () => {
    if (!currentApp.description) return;
    try {
      navigator.clipboard.writeText(currentApp.description).then(() => {
        setCopiedJd(true);
        toast({
          title: "Copied to clipboard",
          description: "Job description copied successfully.",
        });
        setTimeout(() => setCopiedJd(false), 2000);
      }).catch(() => {
        toast({
          title: "Copy failed",
          description: "Could not copy job description to clipboard.",
          variant: "destructive",
        });
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Clipboard access unavailable.",
        variant: "destructive",
      });
    }
  };

  const formattedAppliedDate = currentApp.date_applied
    ? formatDate(parseISO(currentApp.date_applied), "MMM d, yyyy")
    : "Unknown date";

  return (
    <>
      {/* Quick status update control */}
      <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground tracking-wide">
            Update Status & Stage
          </span>
          <span className="text-[10px] text-muted-foreground">
            {isSaving ? "Saving changes..." : "Auto-saves on change"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label
              htmlFor="quick-status-select"
              className="text-[11px] font-medium text-muted-foreground block"
            >
              Stage Category
            </label>
            <Select
              disabled={isSaving}
              value={currentKind}
              onValueChange={(cat) => handleQuickStatusChange(cat)}
            >
              <SelectTrigger
                id="quick-status-select"
                className="w-full bg-card border-border/40 rounded-lg h-9 text-xs"
              >
                <SelectValue placeholder="Select stage category" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="capitalize text-xs cursor-pointer"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label
              htmlFor="quick-stage-detail"
              className="text-[11px] font-medium text-muted-foreground block"
            >
              Custom Stage Detail (Optional)
            </label>
            <div className="relative">
              <Input
                id="quick-stage-detail"
                placeholder={
                  statusLabels[currentKind]
                    ? `e.g. ${statusLabels[currentKind]} - Round 2`
                    : "e.g. Technical Interview / Phone Screen"
                }
                value={quickStatusText}
                onChange={(e) => setQuickStatusText(e.target.value)}
                onBlur={(e) =>
                  handleQuickStatusChange(currentKind, e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.currentTarget.blur();
                  }
                }}
                className="h-9 text-xs bg-card border-border/40 rounded-lg pr-14"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium pointer-events-none hidden sm:inline-block">
                Enter ↵
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-card p-3.5 border border-border/30 rounded-md">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
            <Calendar className="h-3.5 w-3.5" /> Date Applied
          </span>
          <p className="font-medium text-foreground text-xs sm:text-sm">
            {formattedAppliedDate}
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
            <Globe className="h-3.5 w-3.5" /> Platform
          </span>
          <p className="font-medium capitalize text-foreground text-xs sm:text-sm">
            {currentApp.platform || "-"}
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
            <MapPin className="h-3.5 w-3.5" /> Location
          </span>
          <p className="font-medium text-foreground text-xs sm:text-sm">
            {currentApp.location || "-"}
          </p>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
            <DollarSign className="h-3.5 w-3.5" /> Salary
          </span>
          <p className="font-medium text-foreground text-xs sm:text-sm">
            {currentApp.salary || "-"}
          </p>
        </div>
      </div>

      {/* Structured Interview Pipeline & Scheduling */}
      {currentApp.id && (
        <InterviewPipeline
          applicationId={currentApp.id}
          application={{
            role_name: currentApp.role_name,
            company_name: currentApp.company_name,
          }}
        />
      )}

      {/* Separated Job Description & Personal Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Job Description
            </h4>
            {currentApp.description?.trim() && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCopyJd}
                className="h-6 text-[11px] px-2 gap-1 font-semibold text-primary hover:bg-primary/10 cursor-pointer"
                aria-label="Copy job description to clipboard"
              >
                {copiedJd ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            )}
          </div>
          <div className="rounded-md border border-border/30 bg-card p-3 text-xs text-foreground leading-relaxed whitespace-pre-wrap min-h-[90px] max-h-64 sm:max-h-72 overflow-y-auto">
            {currentApp.description?.trim()
              ? currentApp.description
              : "No job description provided."}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 text-primary" /> Personal
            Candidate Notes
          </h4>
          <div className="rounded-md border border-border/30 bg-card p-3 text-xs text-foreground leading-relaxed whitespace-pre-wrap min-h-[90px] max-h-64 sm:max-h-72 overflow-y-auto">
            {currentApp.notes?.trim()
              ? currentApp.notes
              : "No personal notes added yet."}
          </div>
        </div>
      </div>

      {/* Status Timeline History */}
      <ApplicationTimeline
        history={history}
        isLoadingHistory={isLoadingHistory}
        onDeleteEntry={onDeleteTimelineEntry}
      />
    </>
  );
}

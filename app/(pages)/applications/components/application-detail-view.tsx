"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Globe,
  MapPin,
  DollarSign,
  FileText,
  MessageSquare,
  Copy,
  Check,
  Pencil,
  Loader2,
  Download,
  Eye,
  Paperclip,
  ChevronDown,
  ChevronUp,
  Trash2,
  Plus,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate, parseISO } from "date-fns";
import { statusOptions, statusLabels, StatusKind, cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { ApplicationTimeline, TimelineEntry } from "./application-timeline";
import {
  getDocument,
  getViewUrl,
  getDownloadUrl,
} from "@/app/actions/documents";
import {
  AttachResumeDialog,
  ResumeMeta,
} from "./attach-resume-dialog";

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
    resumeId?: string | null;
    resumeTitle?: string | null;
    resumeFileName?: string | null;
    resumeFileSize?: string | null;
    [key: string]: unknown;
  };
  currentKind: StatusKind;
  quickStatusText: string;
  setQuickStatusText: (val: string) => void;
  handleQuickStatusChange: (cat: string, text?: string) => void;
  isSaving: boolean;
  history: TimelineEntry[];
  isLoadingHistory: boolean;
  onDeleteTimelineEntry: (id: string) => void;
  onUpdateNotes?: (notes: string) => Promise<void>;
  onUpdateDraftField?: (field: string, value: unknown) => void;
  onEdit?: () => void;
  onAttachResume?: (resumeId: string, meta: ResumeMeta) => Promise<void>;
  onDetachResume?: () => Promise<void>;
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
  onUpdateNotes,
  onUpdateDraftField,
  onEdit,
  onAttachResume,
  onDetachResume,
}: ApplicationDetailViewProps) {
  const [copiedJd, setCopiedJd] = useState(false);
  const [isJdExpanded, setIsJdExpanded] = useState(false);
  const [isEditingJd, setIsEditingJd] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [isEditingPlatform, setIsEditingPlatform] = useState(false);

  const [dateValue, setDateValue] = useState(currentApp.date_applied || "");
  const [platformValue, setPlatformValue] = useState(currentApp.platform || "");
  const [locationValue, setLocationValue] = useState(currentApp.location || "");
  const [salaryValue, setSalaryValue] = useState(currentApp.salary || "");
  const [jdValue, setJdValue] = useState(currentApp.description || "");
  const [notesValue, setNotesValue] = useState(currentApp.notes || "");

  const [resumeInfo, setResumeInfo] = useState<{
    id: string;
    title: string;
    fileName?: string | null;
    fileSize?: string | null;
  } | null>(() => {
    if (currentApp.resumeId) {
      return {
        id: currentApp.resumeId,
        title: currentApp.resumeTitle || "Applied Resume",
        fileName: currentApp.resumeFileName || null,
        fileSize: currentApp.resumeFileSize || null,
      };
    }
    return null;
  });
  const [isPreviewingResume, setIsPreviewingResume] = useState(false);
  const [isDownloadingResume, setIsDownloadingResume] = useState(false);
  const [isAttachDialogOpen, setIsAttachDialogOpen] = useState(false);
  const [isDetachingResume, setIsDetachingResume] = useState(false);

  useEffect(() => {
    setDateValue(currentApp.date_applied || "");
    setPlatformValue(currentApp.platform || "");
    setLocationValue(currentApp.location || "");
    setSalaryValue(currentApp.salary || "");
    setJdValue(currentApp.description || "");
    setNotesValue(currentApp.notes || "");
  }, [
    currentApp.date_applied,
    currentApp.platform,
    currentApp.location,
    currentApp.salary,
    currentApp.description,
    currentApp.notes,
  ]);

  useEffect(() => {
    let isMounted = true;
    if (currentApp.resumeId) {
      if (currentApp.resumeTitle) {
        setResumeInfo({
          id: currentApp.resumeId,
          title: currentApp.resumeTitle,
          fileName: currentApp.resumeFileName || null,
          fileSize: currentApp.resumeFileSize || null,
        });
      }
      getDocument(currentApp.resumeId)
        .then((doc) => {
          if (!isMounted) return;
          if (doc) {
            setResumeInfo({
              id: doc.id,
              title: doc.title,
              fileName: doc.file_name,
              fileSize: doc.file_size,
            });
          } else {
            setResumeInfo(null);
          }
        })
        .catch(() => {
          if (isMounted) setResumeInfo(null);
        });
    } else {
      setResumeInfo(null);
    }

    return () => {
      isMounted = false;
    };
  }, [
    currentApp.resumeId,
    currentApp.resumeTitle,
    currentApp.resumeFileName,
    currentApp.resumeFileSize,
  ]);

  const handlePreviewResume = async () => {
    if (!currentApp.resumeId) return;
    setIsPreviewingResume(true);
    try {
      const res = await getViewUrl(currentApp.resumeId);
      if (res.error || !res.url) {
        toast({
          title: "Preview unavailable",
          description:
            res.error || "Could not generate view URL for this resume.",
          variant: "destructive",
        });
        return;
      }
      window.open(res.url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Preview error:", err);
      toast({
        title: "Preview error",
        description: "Could not open resume preview.",
        variant: "destructive",
      });
    } finally {
      setIsPreviewingResume(false);
    }
  };

  const handleDownloadResume = async () => {
    if (!currentApp.resumeId) return;
    setIsDownloadingResume(true);
    try {
      const res = await getDownloadUrl(currentApp.resumeId);
      if (res.error || !res.url) {
        toast({
          title: "Download unavailable",
          description:
            res.error || "Could not generate download URL for this resume.",
          variant: "destructive",
        });
        return;
      }
      const link = document.createElement("a");
      link.href = res.url;
      link.download = resumeInfo?.fileName || "resume.pdf";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Download error:", err);
      toast({
        title: "Download error",
        description: "Could not download resume.",
        variant: "destructive",
      });
    } finally {
      setIsDownloadingResume(false);
    }
  };

  const handleSelectResume = async (resumeId: string, meta: ResumeMeta) => {
    try {
      if (onAttachResume) {
        await onAttachResume(resumeId, meta);
      } else if (onUpdateDraftField) {
        onUpdateDraftField("resumeId", resumeId);
        onUpdateDraftField("resumeTitle", meta.title);
        onUpdateDraftField("resumeFileName", meta.fileName);
        onUpdateDraftField("resumeFileSize", meta.fileSize);
      }
      setResumeInfo({
        id: resumeId,
        title: meta.title,
        fileName: meta.fileName,
        fileSize: meta.fileSize,
      });
    } catch (err) {
      console.error("Select resume error:", err);
      toast({
        title: "Error",
        description: "Failed to attach resume.",
        variant: "destructive",
      });
    }
  };

  const handleDetachResume = async () => {
    setIsDetachingResume(true);
    try {
      if (onDetachResume) {
        await onDetachResume();
      } else if (onUpdateDraftField) {
        onUpdateDraftField("resumeId", null);
        onUpdateDraftField("resumeTitle", null);
        onUpdateDraftField("resumeFileName", null);
        onUpdateDraftField("resumeFileSize", null);
      }
      setResumeInfo(null);
    } catch (err) {
      console.error("Detach resume error:", err);
      toast({
        title: "Error",
        description: "Failed to remove resume from application.",
        variant: "destructive",
      });
    } finally {
      setIsDetachingResume(false);
    }
  };

  const handleCopyJd = () => {
    if (!currentApp.description) return;
    try {
      navigator.clipboard
        .writeText(currentApp.description)
        .then(() => {
          setCopiedJd(true);
          toast({
            title: "Copied to clipboard",
            description: "Job description copied successfully.",
          });
          setTimeout(() => setCopiedJd(false), 2000);
        })
        .catch(() => {
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

  const isLongJd = (currentApp.description?.length || 0) > 320;

  return (
    <>
      {/* Quick status update control */}
      <div className="rounded-xl border border-border/40 bg-muted/20 p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground tracking-wide">
            Stage & Status
          </span>
          {isSaving && (
            <span className="text-[11px] text-primary flex items-center gap-1 font-medium animate-pulse">
              <Loader2 className="h-3 w-3 animate-spin" /> Saving changes...
            </span>
          )}
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

      {/* Details grid with full in-place editable fields */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-card p-3.5 border border-border/30 rounded-xl">
        {/* Date Applied */}
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground flex items-center justify-between font-medium">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" /> Date Applied
            </span>
            {onUpdateDraftField && !isEditingDate && (
              <button
                type="button"
                onClick={() => setIsEditingDate(true)}
                className="text-muted-foreground/70 hover:text-primary transition-colors text-[10px] flex items-center gap-0.5 cursor-pointer"
                title="Edit date applied"
              >
                <Pencil className="h-2.5 w-2.5" /> Edit
              </button>
            )}
          </span>
          {isEditingDate ? (
            <Input
              type="date"
              value={dateValue}
              onChange={(e) => {
                setDateValue(e.target.value);
                onUpdateDraftField?.("date_applied", e.target.value);
              }}
              onBlur={() => setIsEditingDate(false)}
              className="h-8 text-xs bg-background"
              autoFocus
            />
          ) : (
            <p
              onClick={() => {
                if (onUpdateDraftField) setIsEditingDate(true);
              }}
              className={cn(
                "font-medium text-foreground text-xs sm:text-sm truncate",
                onUpdateDraftField &&
                  "cursor-pointer hover:text-primary transition-colors",
              )}
              title={onUpdateDraftField ? "Click to edit date" : undefined}
            >
              {formattedAppliedDate}
            </p>
          )}
        </div>

        {/* Platform */}
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground flex items-center justify-between font-medium">
            <span className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5" /> Platform
            </span>
            {onUpdateDraftField && !isEditingPlatform && (
              <button
                type="button"
                onClick={() => setIsEditingPlatform(true)}
                className="text-muted-foreground/70 hover:text-primary transition-colors text-[10px] flex items-center gap-0.5 cursor-pointer"
                title="Edit platform"
              >
                <Pencil className="h-2.5 w-2.5" /> Edit
              </button>
            )}
          </span>
          {isEditingPlatform ? (
            <Input
              value={platformValue}
              onChange={(e) => {
                setPlatformValue(e.target.value);
                onUpdateDraftField?.("platform", e.target.value);
              }}
              onBlur={() => setIsEditingPlatform(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setIsEditingPlatform(false);
              }}
              placeholder="e.g. LinkedIn, Indeed"
              className="h-8 text-xs bg-background"
              autoFocus
            />
          ) : (
            <p
              onClick={() => {
                if (onUpdateDraftField) setIsEditingPlatform(true);
              }}
              className={cn(
                "font-medium capitalize text-foreground text-xs sm:text-sm truncate",
                onUpdateDraftField &&
                  "cursor-pointer hover:text-primary transition-colors",
              )}
              title={onUpdateDraftField ? "Click to edit platform" : undefined}
            >
              {currentApp.platform || "-"}
            </p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground flex items-center justify-between font-medium">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> Location
            </span>
            {onUpdateDraftField && !isEditingLocation && (
              <button
                type="button"
                onClick={() => setIsEditingLocation(true)}
                className="text-muted-foreground/70 hover:text-primary transition-colors text-[10px] flex items-center gap-0.5 cursor-pointer"
                title="Edit location"
              >
                <Pencil className="h-2.5 w-2.5" /> Edit
              </button>
            )}
          </span>
          {isEditingLocation ? (
            <Input
              value={locationValue}
              onChange={(e) => {
                setLocationValue(e.target.value);
                onUpdateDraftField?.("location", e.target.value);
              }}
              onBlur={() => setIsEditingLocation(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setIsEditingLocation(false);
              }}
              placeholder="e.g. Remote / New York"
              className="h-8 text-xs bg-background"
              autoFocus
            />
          ) : (
            <p
              onClick={() => {
                if (onUpdateDraftField) setIsEditingLocation(true);
              }}
              className={cn(
                "font-medium text-foreground text-xs sm:text-sm truncate",
                onUpdateDraftField &&
                  "cursor-pointer hover:text-primary transition-colors",
              )}
              title={onUpdateDraftField ? "Click to edit location" : undefined}
            >
              {currentApp.location || "-"}
            </p>
          )}
        </div>

        {/* Salary */}
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground flex items-center justify-between font-medium">
            <span className="flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5" /> Salary
            </span>
            {onUpdateDraftField && !isEditingSalary && (
              <button
                type="button"
                onClick={() => setIsEditingSalary(true)}
                className="text-muted-foreground/70 hover:text-primary transition-colors text-[10px] flex items-center gap-0.5 cursor-pointer"
                title="Edit salary"
              >
                <Pencil className="h-2.5 w-2.5" /> Edit
              </button>
            )}
          </span>
          {isEditingSalary ? (
            <Input
              value={salaryValue}
              onChange={(e) => {
                setSalaryValue(e.target.value);
                onUpdateDraftField?.("salary", e.target.value);
              }}
              onBlur={() => setIsEditingSalary(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter") setIsEditingSalary(false);
              }}
              placeholder="e.g. $120,000"
              className="h-8 text-xs bg-background"
              autoFocus
            />
          ) : (
            <p
              onClick={() => {
                if (onUpdateDraftField) setIsEditingSalary(true);
              }}
              className={cn(
                "font-medium text-foreground text-xs sm:text-sm truncate",
                onUpdateDraftField &&
                  "cursor-pointer hover:text-primary transition-colors",
              )}
              title={onUpdateDraftField ? "Click to edit salary" : undefined}
            >
              {currentApp.salary || "-"}
            </p>
          )}
        </div>
      </div>

      {/* Applied Resume Section */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Paperclip className="h-3.5 w-3.5 text-primary" /> Applied Resume
        </h4>

        {resumeInfo ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-2xs hover:border-primary/40 transition-colors">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <p className="text-xs sm:text-sm font-semibold text-foreground truncate">
                  {resumeInfo.title}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground truncate">
                  <span className="truncate">
                    {resumeInfo.fileName || "resume.pdf"}
                  </span>
                  {resumeInfo.fileSize && (
                    <>
                      <span>•</span>
                      <span>{resumeInfo.fileSize}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-end sm:self-auto flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePreviewResume}
                disabled={isPreviewingResume}
                className="h-8 text-xs px-2.5 gap-1.5 cursor-pointer font-medium"
              >
                {isPreviewingResume ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Eye className="h-3.5 w-3.5 text-primary" />
                )}
                <span>Preview</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadResume}
                disabled={isDownloadingResume}
                className="h-8 text-xs px-2.5 gap-1.5 cursor-pointer font-medium"
              >
                {isDownloadingResume ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5 text-primary" />
                )}
                <span>Download</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAttachDialogOpen(true)}
                className="h-8 text-xs px-2.5 gap-1.5 cursor-pointer font-medium text-foreground hover:bg-muted"
                title="Select a different resume"
              >
                <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Change</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDetachResume}
                disabled={isDetachingResume}
                className="h-8 text-xs px-2.5 gap-1.5 cursor-pointer font-medium text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
                title="Remove resume from this application"
              >
                {isDetachingResume ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                <span>Detach</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-xl border border-dashed border-border/60 bg-muted/20 px-3.5 py-2.5 text-xs text-muted-foreground">
            <span className="italic">No resume attached to this application.</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsAttachDialogOpen(true)}
              className="h-6 text-[11px] px-2 text-primary hover:bg-primary/10 cursor-pointer font-medium gap-1"
            >
              <Plus className="h-3 w-3" />
              <span>Attach Resume</span>
            </Button>
          </div>
        )}
      </div>

      {/* Separated Job Description & Personal Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Job Description (Collapsible + Inline Editable) */}
        <div className="space-y-2 flex flex-col">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-primary" /> Job Description
            </h4>
            <div className="flex items-center gap-1">
              {currentApp.description?.trim() && !isEditingJd && (
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
              {onUpdateDraftField && !isEditingJd && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingJd(true)}
                  className="h-6 text-[11px] px-2 gap-1 font-semibold text-primary hover:bg-primary/10 cursor-pointer"
                >
                  <Pencil className="h-3 w-3" />
                  <span>{currentApp.description?.trim() ? "Edit" : "Add"}</span>
                </Button>
              )}
            </div>
          </div>

          {isEditingJd ? (
            <div className="space-y-2 animate-in fade-in duration-150">
              <Textarea
                value={jdValue}
                onChange={(e) => {
                  setJdValue(e.target.value);
                  onUpdateDraftField?.("description", e.target.value);
                }}
                placeholder="Paste the full job posting requirements and role description..."
                className="text-xs min-h-[140px] max-h-80 resize-y rounded-xl"
                autoFocus
              />
              <div className="flex items-center gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setJdValue(currentApp.description || "");
                    setIsEditingJd(false);
                  }}
                  className="h-7 text-xs px-2.5 cursor-pointer"
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="relative">
                <div
                  onClick={() => {
                    if (onUpdateDraftField && !currentApp.description?.trim()) {
                      setIsEditingJd(true);
                    }
                  }}
                  className={cn(
                    "rounded-xl border border-border/30 bg-muted/10 p-3.5 text-xs text-foreground leading-relaxed whitespace-pre-wrap min-h-[90px] transition-all",
                    !isJdExpanded && isLongJd && "max-h-40 overflow-hidden",
                    !currentApp.description?.trim() &&
                      onUpdateDraftField &&
                      "cursor-pointer hover:border-primary/40",
                  )}
                >
                  {currentApp.description?.trim() ? (
                    currentApp.description
                  ) : (
                    <span className="text-muted-foreground italic">
                      No job description provided. Click to add.
                    </span>
                  )}
                </div>
                {!isJdExpanded && isLongJd && (
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-card via-card/75 to-transparent pointer-events-none rounded-b-xl" />
                )}
              </div>

              {isLongJd && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsJdExpanded(!isJdExpanded)}
                  className="h-6 text-[11px] px-2 gap-1 font-medium text-primary hover:bg-primary/10 cursor-pointer self-start"
                >
                  {isJdExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3" /> Show less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3" /> Show full description
                    </>
                  )}
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Personal Candidate Notes (Inline Editable) */}
        <div className="space-y-2 flex flex-col">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="h-3.5 w-3.5 text-primary" /> Personal
              Candidate Notes
            </h4>
            {onUpdateDraftField && !isEditingNotes && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNotesValue(currentApp.notes || "");
                  setIsEditingNotes(true);
                }}
                className="h-6 text-[11px] px-2 gap-1 font-semibold text-primary hover:bg-primary/10 cursor-pointer"
              >
                <Pencil className="h-3 w-3" />
                <span>{currentApp.notes?.trim() ? "Edit" : "Add"}</span>
              </Button>
            )}
          </div>

          {isEditingNotes ? (
            <div className="space-y-2 animate-in fade-in duration-150">
              <Textarea
                value={notesValue}
                onChange={(e) => {
                  setNotesValue(e.target.value);
                  onUpdateDraftField?.("notes", e.target.value);
                }}
                placeholder="Add referral contacts, interview notes, questions to ask..."
                className="text-xs min-h-[140px] max-h-80 resize-y rounded-xl"
                autoFocus
              />
              <div className="flex items-center gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNotesValue(currentApp.notes || "");
                    setIsEditingNotes(false);
                  }}
                  className="h-7 text-xs px-2.5 cursor-pointer"
                >
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => {
                if (onUpdateDraftField) {
                  setNotesValue(currentApp.notes || "");
                  setIsEditingNotes(true);
                }
              }}
              className="rounded-xl border border-border/30 bg-muted/10 p-3.5 text-xs text-foreground leading-relaxed whitespace-pre-wrap min-h-[90px] cursor-pointer hover:border-primary/40 transition-colors"
              title="Click to edit notes"
            >
              {currentApp.notes?.trim() ? (
                currentApp.notes
              ) : (
                <span className="text-muted-foreground italic">
                  No personal notes added yet. Click to add notes.
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Status Timeline History */}
      <ApplicationTimeline
        history={history}
        isLoadingHistory={isLoadingHistory}
        onDeleteEntry={onDeleteTimelineEntry}
      />

      {/* Attach Resume Dialog */}
      <AttachResumeDialog
        open={isAttachDialogOpen}
        onOpenChange={setIsAttachDialogOpen}
        currentResumeId={resumeInfo?.id}
        onSelectResume={handleSelectResume}
      />
    </>
  );
}

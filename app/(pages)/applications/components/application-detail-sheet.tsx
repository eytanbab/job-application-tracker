"use client";

import { useEffect, useState, useTransition, useMemo, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ExternalLink,
  MapPin,
  DollarSign,
  Building2,
  Globe,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  Check,
  Loader2,
} from "lucide-react";
import {
  getStatusDisplay,
  getStatusKind,
  statusLabels,
  StatusKind,
  resolveUpdatedStatus,
  isStatusKind,
  isStandardStatus,
  cn,
} from "@/lib/utils";
import {
  getApplicationHistory,
  updateApplication,
  deleteStatusHistoryEntry,
} from "@/app/actions/applications";
import { toast } from "@/hooks/use-toast";
import { TimelineEntry } from "./application-timeline";
import { ApplicationDetailView } from "./application-detail-view";
import { ApplicationForm, FormValues } from "@/app/_components/application-form";

export interface ApplicationDetail {
  id?: string;
  role_name: string;
  company_name: string;
  date_applied: string;
  link: string;
  platform: string;
  status: string;
  statusCategory?: string | null;
  month: string;
  year: string;
  description?: string | null;
  notes?: string | null;
  location: string;
  salary?: string | null;
  createdAt?: Date;
  resumeId?: string | null;
  resumeTitle?: string | null;
  resumeFileName?: string | null;
  resumeFileSize?: string | null;
  [key: string]: unknown;
}

interface ApplicationDetailSheetProps {
  application: ApplicationDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditClick?: (app: ApplicationDetail) => void;
  onDeleteClick?: (id: string) => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  currentIndex?: number;
  totalApps?: number;
}

const statusBadgeClasses: Record<StatusKind, string> = {
  applied:
    "bg-primary/15 text-primary border-primary/25 rounded-md font-semibold",
  accepted:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 rounded-md font-semibold",
  ghosted:
    "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/30 rounded-md font-semibold",
  review:
    "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/25 rounded-md font-semibold",
  interview:
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25 rounded-md font-semibold",
  rejected:
    "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/25 rounded-md font-semibold",
  other:
    "bg-secondary text-secondary-foreground border-border rounded-md font-medium",
};

export function ApplicationDetailSheet({
  application: initialApp,
  open,
  onOpenChange,
  onDeleteClick,
  hasPrevious = false,
  hasNext = false,
  onPrevious,
  onNext,
  currentIndex = 0,
  totalApps = 0,
}: ApplicationDetailSheetProps) {
  const [currentApp, setCurrentApp] = useState<ApplicationDetail | null>(
    initialApp,
  );
  const [draftApp, setDraftApp] = useState<ApplicationDetail | null>(
    initialApp ? { ...initialApp } : null,
  );
  const [isDirty, setIsDirty] = useState(false);
  const [showGuardDialog, setShowGuardDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "close" | "prev" | "next" | null
  >(null);

  // In-place editable header fields
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [roleValue, setRoleValue] = useState(initialApp?.role_name || "");
  const [companyValue, setCompanyValue] = useState(
    initialApp?.company_name || "",
  );
  const [linkValue, setLinkValue] = useState(initialApp?.link || "");

  const [quickStatusText, setQuickStatusText] = useState<string>(
    initialApp?.status || "",
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [history, setHistory] = useState<TimelineEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSaving, startSaveTransition] = useTransition();

  const activeApp = draftApp || currentApp || initialApp;

  // Check if draftApp differs from currentApp
  const checkIsDirty = useCallback(
    (draft: ApplicationDetail | null, original: ApplicationDetail | null) => {
      if (!draft || !original) return false;
      return (
        (draft.role_name || "") !== (original.role_name || "") ||
        (draft.company_name || "") !== (original.company_name || "") ||
        (draft.location || "") !== (original.location || "") ||
        (draft.salary || "") !== (original.salary || "") ||
        (draft.platform || "") !== (original.platform || "") ||
        (draft.date_applied || "") !== (original.date_applied || "") ||
        (draft.link || "") !== (original.link || "") ||
        (draft.description || "") !== (original.description || "") ||
        (draft.notes || "") !== (original.notes || "")
      );
    },
    [],
  );

  useEffect(() => {
    setCurrentApp(initialApp);
    setDraftApp(initialApp ? { ...initialApp } : null);
    setIsDirty(false);
    setRoleValue(initialApp?.role_name || "");
    setCompanyValue(initialApp?.company_name || "");
    setLinkValue(initialApp?.link || "");
    setIsEditingRole(false);
    setIsEditingCompany(false);
    setIsEditingLink(false);

    if (initialApp) {
      const isStandard = isStandardStatus(initialApp.status);
      setQuickStatusText(isStandard ? "" : initialApp.status || "");

      if (open && initialApp.id) {
        setIsEditing(false);
        setIsConfirmingDelete(false);
        setIsLoadingHistory(true);
        getApplicationHistory(initialApp.id as string)
          .then((res) => {
            setHistory(res);
          })
          .catch((err) => {
            console.error("Failed to load history:", err);
          })
          .finally(() => {
            setIsLoadingHistory(false);
          });
      }
    }
  }, [initialApp, open]);

  // Handle draft field changes
  const handleUpdateDraftField = useCallback(
    (field: string, value: unknown) => {
      setDraftApp((prev) => {
        if (!prev) return prev;
        const next = { ...prev, [field]: value };
        setIsDirty(checkIsDirty(next, currentApp));
        return next;
      });
    },
    [checkIsDirty, currentApp],
  );

  // Save changes explicitly
  const handleSaveChanges = useCallback(async (): Promise<boolean> => {
    if (!draftApp?.id) return false;
    return new Promise((resolve) => {
      startSaveTransition(async () => {
        try {
          await updateApplication(draftApp as unknown as FormValues);
          setCurrentApp(draftApp);
          setIsDirty(false);
          setIsEditingRole(false);
          setIsEditingCompany(false);
          setIsEditingLink(false);
          toast({ description: "Application updated successfully!" });
          if (draftApp.id) {
            const updatedHistory = await getApplicationHistory(draftApp.id);
            setHistory(updatedHistory);
          }
          resolve(true);
        } catch (err) {
          console.error(err);
          toast({
            description: "Failed to update application",
            variant: "destructive",
          });
          resolve(false);
        }
      });
    });
  }, [draftApp]);

  // Discard changes
  const handleDiscardChanges = useCallback(() => {
    if (currentApp) {
      setDraftApp({ ...currentApp });
      setRoleValue(currentApp.role_name || "");
      setCompanyValue(currentApp.company_name || "");
      setLinkValue(currentApp.link || "");
      setIsDirty(false);
      setIsEditingRole(false);
      setIsEditingCompany(false);
      setIsEditingLink(false);
      toast({ description: "Unsaved changes discarded." });
    }
  }, [currentApp]);

  // Navigation requests intercepted when dirty
  const requestClose = useCallback(() => {
    if (isDirty) {
      setPendingAction("close");
      setShowGuardDialog(true);
    } else {
      onOpenChange(false);
    }
  }, [isDirty, onOpenChange]);

  const requestPrevious = useCallback(() => {
    if (isDirty) {
      setPendingAction("prev");
      setShowGuardDialog(true);
    } else if (onPrevious) {
      onPrevious();
    }
  }, [isDirty, onPrevious]);

  const requestNext = useCallback(() => {
    if (isDirty) {
      setPendingAction("next");
      setShowGuardDialog(true);
    } else if (onNext) {
      onNext();
    }
  }, [isDirty, onNext]);

  const handleConfirmDiscard = useCallback(() => {
    if (currentApp) {
      setDraftApp({ ...currentApp });
      setRoleValue(currentApp.role_name || "");
      setCompanyValue(currentApp.company_name || "");
      setLinkValue(currentApp.link || "");
      setIsDirty(false);
      setIsEditingRole(false);
      setIsEditingCompany(false);
      setIsEditingLink(false);
    }
    setShowGuardDialog(false);
    const action = pendingAction;
    setPendingAction(null);
    if (action === "close") {
      onOpenChange(false);
    } else if (action === "prev" && onPrevious) {
      onPrevious();
    } else if (action === "next" && onNext) {
      onNext();
    }
  }, [currentApp, onOpenChange, onPrevious, onNext, pendingAction]);

  const handleSaveAndProceed = useCallback(async () => {
    const success = await handleSaveChanges();
    if (success) {
      setShowGuardDialog(false);
      const action = pendingAction;
      setPendingAction(null);
      if (action === "close") {
        onOpenChange(false);
      } else if (action === "prev" && onPrevious) {
        onPrevious();
      } else if (action === "next" && onNext) {
        onNext();
      }
    }
  }, [handleSaveChanges, onOpenChange, onPrevious, onNext, pendingAction]);

  // Keyboard shortcut navigation (J/K or ArrowUp/ArrowDown)
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }
      if (e.key === "j" || e.key === "ArrowDown") {
        if (hasNext) {
          e.preventDefault();
          requestNext();
        }
      } else if (e.key === "k" || e.key === "ArrowUp") {
        if (hasPrevious) {
          e.preventDefault();
          requestPrevious();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, hasNext, hasPrevious, requestNext, requestPrevious]);

  if (!activeApp) return null;

  const currentKind = getStatusKind(
    activeApp.status,
    activeApp.statusCategory,
  );
  const displayStatusText = getStatusDisplay(
    activeApp.status,
    activeApp.statusCategory,
  );

  const handleQuickStatusChange = (
    newCategory: string,
    newStatusText?: string,
  ) => {
    if (!activeApp?.id) return;

    const cat = (isStatusKind(newCategory) ? newCategory : "other") as StatusKind;
    const updatedStatus = resolveUpdatedStatus(
      activeApp.status,
      cat,
      newStatusText,
    );

    const customText = isStandardStatus(updatedStatus) ? "" : updatedStatus;

    if (cat === activeApp.statusCategory && updatedStatus === activeApp.status) {
      setQuickStatusText(customText);
      return;
    }

    const payload: ApplicationDetail = {
      ...activeApp,
      id: activeApp.id,
      role_name: activeApp.role_name,
      company_name: activeApp.company_name,
      date_applied: activeApp.date_applied,
      link: activeApp.link,
      platform: activeApp.platform,
      location: activeApp.location,
      month: activeApp.month,
      year: activeApp.year,
      statusCategory: cat,
      status: updatedStatus,
    };

    setCurrentApp(payload);
    setDraftApp(payload);
    setQuickStatusText(customText);

    startSaveTransition(async () => {
      try {
        await updateApplication(payload as unknown as FormValues);
        toast({
          description: `Status updated to ${statusLabels[cat] || cat}`,
        });

        if (activeApp.id) {
          const updatedHistory = await getApplicationHistory(activeApp.id);
          setHistory(updatedHistory);
        }
      } catch (err) {
        console.error(err);
        toast({
          description: "Failed to update status",
          variant: "destructive",
        });
      }
    });
  };

  const handleDeleteTimelineEntry = async (entryId: string) => {
    try {
      const updated = await deleteStatusHistoryEntry(entryId);
      setHistory((prev) => prev.filter((h) => h.id !== entryId));
      if (updated && activeApp) {
        const nextApp = {
          ...activeApp,
          status: updated.status,
          statusCategory: updated.statusCategory,
        };
        setCurrentApp(nextApp);
        setDraftApp(nextApp);
        const isStandard = isStandardStatus(updated.status);
        setQuickStatusText(isStandard ? "" : updated.status);
      }
      toast({ description: "Timeline entry removed" });
    } catch {
      toast({
        description: "Failed to remove timeline entry",
        variant: "destructive",
      });
    }
  };

  const handleUpdateNotes = async (newNotes: string) => {
    handleUpdateDraftField("notes", newNotes);
  };

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            requestClose();
          } else {
            onOpenChange(true);
          }
        }}
      >
        <SheetContent
          side="right"
          onPointerDownOutside={(e) => {
            if (isDirty) {
              e.preventDefault();
              requestClose();
            }
          }}
          onEscapeKeyDown={(e) => {
            if (isDirty) {
              e.preventDefault();
              requestClose();
            }
          }}
          className="w-full max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl p-0 flex flex-col h-full bg-card border-l border-border/40 shadow-2xl focus:outline-none overflow-hidden"
        >
          {/* Header Bar */}
          <SheetHeader className="space-y-3 p-4 sm:p-6 pb-4 border-b border-border/40 shrink-0 bg-card pr-14 text-left">
            {/* Top Navigation Row: Mobile Back & Cycling */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={requestClose}
                  className="sm:hidden h-8 w-8 -ml-1 text-muted-foreground hover:text-foreground cursor-pointer"
                  title="Back"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>

                {totalApps > 1 && (
                  <div className="flex items-center gap-1 bg-muted/40 p-0.5 rounded-lg border border-border/40 text-xs">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-md cursor-pointer disabled:opacity-30"
                      disabled={!hasPrevious}
                      onClick={requestPrevious}
                      title="Previous application (K or ↑)"
                      aria-label="Previous application"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <span className="px-1.5 text-[11px] font-medium text-muted-foreground select-none font-mono">
                      {currentIndex} / {totalApps}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-md cursor-pointer disabled:opacity-30"
                      disabled={!hasNext}
                      onClick={requestNext}
                      title="Next application (J or ↓)"
                      aria-label="Next application"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground/60 select-none">
                <span>Navigate:</span>
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/50 font-mono text-[10px]">
                  J
                </kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border/50 font-mono text-[10px]">
                  K
                </kbd>
              </div>
            </div>

            {/* Role, Company, & Job Link Title Section */}
            <div className="space-y-1.5 w-full min-w-0">
              {isEditing ? (
                <SheetTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-heading">
                  Edit Job Application
                </SheetTitle>
              ) : (
                <>
                  {/* Role Title (with in-place click-to-edit) */}
                  <div className="flex items-center gap-2 group">
                    {isEditingRole ? (
                      <Input
                        value={roleValue}
                        onChange={(e) => {
                          setRoleValue(e.target.value);
                          handleUpdateDraftField("role_name", e.target.value);
                        }}
                        onBlur={() => setIsEditingRole(false)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") setIsEditingRole(false);
                        }}
                        placeholder="Role title"
                        className="h-9 text-lg sm:text-xl font-bold bg-background"
                        autoFocus
                      />
                    ) : (
                      <SheetTitle
                        onClick={() => setIsEditingRole(true)}
                        className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-heading break-words cursor-pointer hover:text-primary transition-colors flex items-center gap-2"
                        title="Click to edit role name"
                      >
                        <span>{activeApp.role_name}</span>
                        <Pencil className="h-3.5 w-3.5 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                      </SheetTitle>
                    )}
                  </div>

                  {/* Company Name (with in-place click-to-edit) */}
                  <div className="flex items-center gap-2 group">
                    {isEditingCompany ? (
                      <Input
                        value={companyValue}
                        onChange={(e) => {
                          setCompanyValue(e.target.value);
                          handleUpdateDraftField(
                            "company_name",
                            e.target.value,
                          );
                        }}
                        onBlur={() => setIsEditingCompany(false)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") setIsEditingCompany(false);
                        }}
                        placeholder="Company name"
                        className="h-8 text-sm font-medium bg-background"
                        autoFocus
                      />
                    ) : (
                      <p
                        onClick={() => setIsEditingCompany(true)}
                        className="flex items-center gap-1.5 text-sm sm:text-base font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                        title="Click to edit company name"
                      >
                        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                        <span className="truncate">{activeApp.company_name}</span>
                        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                      </p>
                    )}
                  </div>

                  {/* Integrated Job Link (Fix for Bug 4: seamlessly connected to role & company) */}
                  <div className="pt-0.5">
                    {isEditingLink ? (
                      <div className="flex items-center gap-1.5 max-w-md">
                        <Input
                          value={linkValue}
                          onChange={(e) => {
                            setLinkValue(e.target.value);
                            handleUpdateDraftField("link", e.target.value);
                          }}
                          onBlur={() => setIsEditingLink(false)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") setIsEditingLink(false);
                          }}
                          placeholder="https://company.com/jobs/..."
                          className="h-7 text-xs bg-background"
                          autoFocus
                        />
                      </div>
                    ) : activeApp.link ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground group">
                        <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                        <a
                          href={activeApp.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 truncate max-w-xs sm:max-w-md font-medium"
                          title={activeApp.link}
                        >
                          <span className="truncate">
                            {activeApp.link.replace(/^https?:\/\/(www\.)?/, "")}
                          </span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setIsEditingLink(true)}
                          className="text-muted-foreground/60 hover:text-foreground p-0.5 rounded cursor-pointer"
                          title="Edit job link"
                        >
                          <Pencil className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditingLink(true)}
                        className="text-[11px] text-muted-foreground/70 hover:text-primary flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Globe className="h-3 w-3" />
                        <span>+ Add job posting link</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Badges Summary */}
            {!isEditing && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Badge
                  variant="outline"
                  className={`border ${statusBadgeClasses[currentKind]}`}
                >
                  {displayStatusText}
                </Badge>

                <Badge variant="secondary" className="capitalize">
                  {activeApp.platform}
                </Badge>

                {activeApp.location && (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 text-muted-foreground"
                  >
                    <MapPin className="h-3 w-3" />
                    {activeApp.location}
                  </Badge>
                )}

                {activeApp.salary && (
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
                  >
                    <DollarSign className="h-3 w-3" />
                    {activeApp.salary}
                  </Badge>
                )}
              </div>
            )}
          </SheetHeader>

          {/* Unified Scroll Container */}
          <div
            className={cn(
              "flex-1 min-w-0 flex flex-col min-h-0",
              isEditing
                ? "overflow-hidden"
                : "overflow-y-auto p-4 sm:p-6 py-4 space-y-5",
            )}
          >
            {isEditing ? (
              <ApplicationForm
                defaultValues={activeApp as FormValues & { id?: string }}
                onClose={() => setIsEditing(false)}
                onSubmit={async (values) => {
                  try {
                    await updateApplication(values);
                    const updated = {
                      ...activeApp,
                      ...values,
                      id: activeApp.id,
                    } as ApplicationDetail;
                    setCurrentApp(updated);
                    setDraftApp(updated);
                    setIsDirty(false);
                    setQuickStatusText(
                      isStandardStatus(updated.status)
                        ? ""
                        : updated.status || "",
                    );
                    setIsEditing(false);
                    toast({
                      description: "Application updated successfully!",
                    });
                    if (activeApp.id) {
                      const updatedHistory = await getApplicationHistory(
                        activeApp.id,
                      );
                      setHistory(updatedHistory);
                    }
                  } catch (err) {
                    toast({
                      description: "Failed to update application",
                      variant: "destructive",
                    });
                    throw err;
                  }
                }}
              />
            ) : (
              <ApplicationDetailView
                currentApp={activeApp}
                currentKind={currentKind}
                quickStatusText={quickStatusText}
                setQuickStatusText={setQuickStatusText}
                handleQuickStatusChange={handleQuickStatusChange}
                isSaving={isSaving}
                history={history}
                isLoadingHistory={isLoadingHistory}
                onDeleteTimelineEntry={handleDeleteTimelineEntry}
                onUpdateNotes={handleUpdateNotes}
                onUpdateDraftField={handleUpdateDraftField}
                onEdit={() => setIsEditing(true)}
              />
            )}
          </div>

          {/* Floating Docked "Unsaved Changes" Action Bar */}
          {isDirty && !isEditing && (
            <div className="sticky bottom-0 z-30 border-t border-border/40 bg-card/95 backdrop-blur-md p-3 sm:p-4 px-4 sm:px-6 shadow-2xl flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <span className="text-xs sm:text-sm font-medium text-foreground">
                  You have unsaved changes
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isSaving}
                  onClick={handleDiscardChanges}
                  className="h-8 text-xs cursor-pointer"
                >
                  Discard
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={isSaving}
                  onClick={handleSaveChanges}
                  className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="h-3.5 w-3.5" />
                  )}
                  Save Changes
                </Button>
              </div>
            </div>
          )}

          {/* Footer Actions (When not editing and no dirty bar active) */}
          {!isEditing && !isDirty && (
            <div className="p-4 sm:p-6 py-3 border-t border-border/40 bg-card/95 backdrop-blur-sm flex items-center justify-between gap-3 shrink-0">
              {isConfirmingDelete ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 p-2.5 bg-destructive/10 border border-destructive/20 rounded-xl animate-in fade-in duration-150">
                  <span className="text-xs text-destructive font-medium">
                    Permanently delete this application?
                  </span>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs cursor-pointer"
                      onClick={() => setIsConfirmingDelete(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-8 text-xs cursor-pointer"
                      onClick={() => {
                        if (currentApp?.id && onDeleteClick) {
                          onDeleteClick(currentApp.id);
                          setIsConfirmingDelete(false);
                          onOpenChange(false);
                        }
                      }}
                    >
                      Delete Application
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid="edit-details-button"
                    className="flex-1 gap-2 h-9 font-medium rounded-md cursor-pointer"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-4 w-4" /> Edit Details
                  </Button>

                  {onDeleteClick && currentApp?.id && (
                    <Button
                      variant="destructive"
                      size="sm"
                      data-testid="delete-application-button"
                      className="gap-2 h-9 font-medium rounded-md cursor-pointer"
                      onClick={() => setIsConfirmingDelete(true)}
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Unsaved Changes Navigation Guard Dialog */}
      <Dialog open={showGuardDialog} onOpenChange={setShowGuardDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes to this application. If you leave now,
              your changes will be discarded.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowGuardDialog(false);
                setPendingAction(null);
              }}
              className="cursor-pointer"
            >
              Keep Editing
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDiscard}
              className="cursor-pointer"
            >
              Discard Changes
            </Button>
            <Button
              type="button"
              onClick={handleSaveAndProceed}
              disabled={isSaving}
              className="cursor-pointer font-semibold"
            >
              {isSaving && (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              )}
              Save & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

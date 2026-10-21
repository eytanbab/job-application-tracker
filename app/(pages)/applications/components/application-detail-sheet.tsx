"use client";

import {
  useEffect,
  useState,
  useTransition,
  useMemo,
  useCallback,
  useRef,
} from "react";
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
  formatPlatformLabel,
  normalizeJobLink,
} from "@/lib/utils";
import {
  getApplicationHistory,
  updateApplication,
  updateApplicationResume,
  deleteStatusHistoryEntry,
} from "@/app/actions/applications";
import { toast } from "@/hooks/use-toast";
import {
  useApplicationDetails,
  type ApplicationDetails,
} from "@/hooks/use-application-details";
import { TimelineEntry } from "./application-timeline";
import { ApplicationDetailView } from "./application-detail-view";
import {
  ApplicationForm,
  FormValues,
  type ApplicationFormHandle,
} from "@/app/_components/application-form";
import { ResumeMeta } from "./attach-resume-dialog";
import { statusBadgeClasses } from "./status-badge-classes";

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
  const editFormRef = useRef<ApplicationFormHandle>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  // The application to return focus to when the panel closes. J/K can move
  // to another row, and the row data is cleared on close, so track it here.
  const focusReturnIdRef = useRef<string | undefined>(undefined);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [history, setHistory] = useState<TimelineEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSaving, startSaveTransition] = useTransition();

  const activeApp = draftApp || currentApp || initialApp;

  // The application on screen, for discarding responses that arrive after
  // J/K moved on, and the last reset, for telling a refresh of the same row
  // from opening another one.
  const shownIdRef = useRef<string | undefined>(undefined);
  const lastResetRef = useRef<{ id?: string; open: boolean }>({ open: false });
  const isDirtyRef = useRef(false);
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  /** Reloads the timeline, ignoring the answer if another application is shown by then. */
  const refreshHistory = useCallback(async (appId: string) => {
    const entries = await getApplicationHistory(appId);
    if (shownIdRef.current === appId) setHistory(entries);
  }, []);

  useEffect(() => {
    if (activeApp?.id) focusReturnIdRef.current = activeApp.id;
  }, [activeApp?.id]);

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
        (draft.notes || "") !== (original.notes || "") ||
        (draft.resumeId ?? null) !== (original.resumeId ?? null)
      );
    },
    [],
  );

  useEffect(() => {
    const isRefresh =
      open &&
      lastResetRef.current.open &&
      !!initialApp?.id &&
      lastResetRef.current.id === initialApp.id;
    lastResetRef.current = { id: initialApp?.id, open };

    if (isRefresh) {
      // New data for the row already on screen (after any revalidation):
      // take the server's copy, but never overwrite unsaved edits.
      setCurrentApp(initialApp);
      if (!isDirtyRef.current) setDraftApp({ ...initialApp });
      return;
    }

    shownIdRef.current = initialApp?.id;
    isDirtyRef.current = false;
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
        const appId = initialApp.id as string;
        setHistory([]);
        setIsLoadingHistory(true);
        getApplicationHistory(appId)
          .then((res) => {
            if (shownIdRef.current === appId) setHistory(res);
          })
          .catch((err) => {
            console.error("Failed to load history:", err);
          })
          .finally(() => {
            if (shownIdRef.current === appId) setIsLoadingHistory(false);
          });
      }
    }
  }, [initialApp, open]);

  // List rows leave out the description and notes; load them for the open
  // row and merge them in. Runs after the reset above, so a refreshed row
  // keeps its text.
  const {
    details,
    isLoading: isLoadingDetails,
    error: detailsError,
    retry: retryDetails,
    setDetails,
  } = useApplicationDetails(open ? initialApp?.id : null);

  useEffect(() => {
    if (!details) return;
    const withDetails = (app: ApplicationDetail | null) =>
      app ? { ...app, ...details } : app;
    setCurrentApp(withDetails);
    if (!isDirtyRef.current) setDraftApp(withDetails);
  }, [details, initialApp]);

  /** Keeps the loaded details in step with text that was just saved. */
  const rememberSavedDetails = useCallback(
    (saved: Partial<ApplicationDetails>) => {
      const next: Partial<ApplicationDetails> = {};
      if (saved.description !== undefined) next.description = saved.description;
      if (saved.notes !== undefined) next.notes = saved.notes;
      setDetails(next);
    },
    [setDetails],
  );

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
          rememberSavedDetails(draftApp);
          setIsDirty(false);
          setIsEditingRole(false);
          setIsEditingCompany(false);
          setIsEditingLink(false);
          toast({ description: "Application updated successfully!" });
          if (draftApp.id) await refreshHistory(draftApp.id);
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
  }, [draftApp, rememberSavedDetails, refreshHistory]);

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

  // Handle direct resume attachment & detachment from detail view
  const handleAttachResume = useCallback(
    async (resumeId: string, meta: ResumeMeta) => {
      if (!currentApp?.id) return;
      await updateApplicationResume(currentApp.id, resumeId);
      const updatedPersisted: ApplicationDetail = {
        ...currentApp,
        resumeId,
        resumeTitle: meta.title,
        resumeFileName: meta.fileName,
        resumeFileSize: meta.fileSize,
      };
      setCurrentApp(updatedPersisted);
      if (draftApp) {
        setDraftApp({
          ...draftApp,
          resumeId,
          resumeTitle: meta.title,
          resumeFileName: meta.fileName,
          resumeFileSize: meta.fileSize,
        });
      } else {
        setDraftApp(updatedPersisted);
      }
      toast({ description: "Resume attached successfully." });
    },
    [currentApp, draftApp],
  );

  const handleDetachResume = useCallback(async () => {
    if (!currentApp?.id) return;
    await updateApplicationResume(currentApp.id, null);
    const updatedPersisted: ApplicationDetail = {
      ...currentApp,
      resumeId: null,
      resumeTitle: null,
      resumeFileName: null,
      resumeFileSize: null,
    };
    setCurrentApp(updatedPersisted);
    if (draftApp) {
      setDraftApp({
        ...draftApp,
        resumeId: null,
        resumeTitle: null,
        resumeFileName: null,
        resumeFileSize: null,
      });
    } else {
      setDraftApp(updatedPersisted);
    }
    toast({ description: "Resume removed from application." });
  }, [currentApp, draftApp]);

  // While the full edit form is open, run its own unsaved-changes guard first
  const runAfterEditForm = useCallback(
    (action: () => void) => {
      if (isEditing && editFormRef.current) {
        editFormRef.current.requestClose(action);
      } else {
        action();
      }
    },
    [isEditing],
  );

  // Navigation requests intercepted when dirty
  const requestClose = useCallback(() => {
    runAfterEditForm(() => {
      if (isDirty) {
        setPendingAction("close");
        setShowGuardDialog(true);
      } else {
        onOpenChange(false);
      }
    });
  }, [runAfterEditForm, isDirty, onOpenChange]);

  const requestPrevious = useCallback(() => {
    runAfterEditForm(() => {
      if (isDirty) {
        setPendingAction("prev");
        setShowGuardDialog(true);
      } else if (onPrevious) {
        onPrevious();
      }
    });
  }, [runAfterEditForm, isDirty, onPrevious]);

  const requestNext = useCallback(() => {
    runAfterEditForm(() => {
      if (isDirty) {
        setPendingAction("next");
        setShowGuardDialog(true);
      } else if (onNext) {
        onNext();
      }
    });
  }, [runAfterEditForm, isDirty, onNext]);

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

  // Keyboard shortcut navigation (J/K or ArrowUp/ArrowDown).
  // Disabled while the edit form is open so keys on its buttons and
  // selects don't jump to another application.
  useEffect(() => {
    if (!open || isEditing) return;
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
  }, [open, isEditing, hasNext, hasPrevious, requestNext, requestPrevious]);

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

    // Save only the stage, on top of the saved copy: unsaved inline edits
    // stay a draft.
    const saved = currentApp ?? activeApp;
    const previous = { status: saved.status, statusCategory: saved.statusCategory };
    const previousText = quickStatusText;
    const payload: ApplicationDetail = { ...saved, statusCategory: cat, status: updatedStatus };
    const appId = saved.id as string;
    const applyStatus = (next: { status: string; statusCategory: string }) => {
      setCurrentApp((prev) => (prev ? { ...prev, ...next } : prev));
      setDraftApp((prev) => (prev ? { ...prev, ...next } : prev));
    };

    applyStatus({ status: updatedStatus, statusCategory: cat });
    setQuickStatusText(customText);

    startSaveTransition(async () => {
      try {
        await updateApplication(payload as unknown as FormValues);
        toast({
          description: `Status updated to ${statusLabels[cat] || cat}`,
        });
        await refreshHistory(appId);
      } catch (err) {
        console.error(err);
        // Put the stage back, unless the user has already moved on.
        if (shownIdRef.current === appId) {
          applyStatus(previous as { status: string; statusCategory: string });
          setQuickStatusText(previousText);
        }
        toast({
          description: "Failed to update status",
          variant: "destructive",
        });
      }
    });
  };

  const handleDeleteTimelineEntry = async (entryId: string) => {
    const appId = shownIdRef.current;
    try {
      const updated = await deleteStatusHistoryEntry(entryId);
      if (shownIdRef.current !== appId) return;
      setHistory((prev) => prev.filter((h) => h.id !== entryId));
      if (updated) {
        const next = { status: updated.status, statusCategory: updated.statusCategory };
        setCurrentApp((prev) => (prev ? { ...prev, ...next } : prev));
        setDraftApp((prev) => (prev ? { ...prev, ...next } : prev));
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
          ref={contentRef}
          side="right"
          // Focus the panel itself so screen readers announce its title,
          // instead of landing on the first button ("Next application").
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            contentRef.current?.focus();
          }}
          // The panel opens from state, not a Radix trigger, so return focus
          // to the row, card or Kanban card of the application last shown.
          onCloseAutoFocus={(e) => {
            const id = focusReturnIdRef.current;
            const target = id
              ? Array.from(
                  document.querySelectorAll<HTMLElement>(
                    `[data-open-application="${CSS.escape(id)}"]`,
                  ),
                ).find((el) => el.getClientRects().length > 0)
              : undefined;
            if (target) {
              e.preventDefault();
              target.focus();
            }
          }}
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

                {/* Hidden for a linked row that isn't on the current page */}
                {totalApps > 1 && currentIndex > 0 && (
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
                    ) : normalizeJobLink(activeApp.link) ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground group">
                        <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                        <a
                          href={normalizeJobLink(activeApp.link)!}
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

                <Badge variant="secondary">
                  {formatPlatformLabel(activeApp.platform)}
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
            {isEditing && !details ? (
              <div
                role="status"
                className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground"
              >
                {detailsError ? (
                  <>
                    Couldn&apos;t load this application.
                    <Button variant="outline" size="sm" onClick={retryDetails}>
                      Try again
                    </Button>
                  </>
                ) : (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading application...
                  </>
                )}
              </div>
            ) : isEditing ? (
              <ApplicationForm
                ref={editFormRef}
                defaultValues={activeApp as FormValues & { id?: string }}
                onClose={() => setIsEditing(false)}
                onSubmit={async (values) => {
                  try {
                    await updateApplication(values);
                    rememberSavedDetails(values);
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
                    if (activeApp.id) await refreshHistory(activeApp.id);
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
                onAttachResume={handleAttachResume}
                onDetachResume={handleDetachResume}
                isLoadingDetails={isLoadingDetails}
                detailsError={detailsError}
                onRetryDetails={retryDetails}
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

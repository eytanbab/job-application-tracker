"use client";

import { useEffect, useState, useTransition } from "react";
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
  Pencil,
  Trash2,
} from "lucide-react";
import {
  getStatusDisplay,
  getStatusKind,
  statusLabels,
  StatusKind,
  resolveUpdatedStatus,
  isStatusKind,
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

interface ApplicationDetail {
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
  [key: string]: unknown;
}

interface ApplicationDetailSheetProps {
  application: ApplicationDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditClick?: (app: ApplicationDetail) => void;
  onDeleteClick?: (id: string) => void;
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
  onEditClick,
  onDeleteClick,
}: ApplicationDetailSheetProps) {
  const [currentApp, setCurrentApp] = useState<ApplicationDetail | null>(
    initialApp,
  );
  const [quickStatusText, setQuickStatusText] = useState<string>(
    initialApp?.status || "",
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [history, setHistory] = useState<TimelineEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSaving, startSaveTransition] = useTransition();

  const activeApp = currentApp || initialApp;

  useEffect(() => {
    setCurrentApp(initialApp);
    if (initialApp) {
      const effectiveStatus = getStatusDisplay(
        initialApp.status,
        initialApp.statusCategory,
      );
      setQuickStatusText(effectiveStatus);

      if (open && initialApp.id) {
        setIsEditing(false);
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
    
    if (cat === activeApp.statusCategory && updatedStatus === activeApp.status) {
      setQuickStatusText(updatedStatus);
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
    setQuickStatusText(updatedStatus);

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
      await deleteStatusHistoryEntry(entryId);
      setHistory((prev) => prev.filter((h) => h.id !== entryId));
      toast({ description: "Timeline entry removed" });
    } catch {
      toast({
        description: "Failed to remove timeline entry",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-[calc(100vw-1.5rem)] sm:max-w-2xl md:max-w-3xl overflow-y-auto max-h-[85dvh] sm:max-h-[85vh] p-4 sm:p-6 rounded-2xl sm:rounded-xl shadow-lg border border-border/40">
        <DialogHeader className="space-y-3 pb-3 border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 w-full min-w-0">
              {isEditing ? (
                <DialogTitle className="text-2xl font-bold tracking-tight text-foreground font-heading">
                  Edit Job Application
                </DialogTitle>
              ) : (
                <>
                  <DialogTitle className="text-2xl font-bold tracking-tight text-foreground font-heading break-words">
                    {activeApp.role_name}
                  </DialogTitle>
                  <p className="flex items-center gap-1.5 text-base font-medium text-muted-foreground">
                    <Building2 className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                    <span className="truncate">{activeApp.company_name}</span>
                  </p>
                </>
              )}
            </div>

            {!isEditing && activeApp.link && (
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-md mr-8 cursor-pointer"
                asChild
              >
                <a
                  href={activeApp.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open Job Link"
                  aria-label="Open job posting in new tab"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>

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
        </DialogHeader>

        <div className="py-4 space-y-5">
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
                  setQuickStatusText(
                    getStatusDisplay(updated.status, updated.statusCategory),
                  );
                  setIsEditing(false);
                  toast({ description: "Application updated successfully!" });
                  if (activeApp.id) {
                    const updatedHistory = await getApplicationHistory(activeApp.id);
                    setHistory(updatedHistory);
                  }
                } catch {
                  toast({
                    description: "Failed to update application",
                    variant: "destructive",
                  });
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
            />
          )}
        </div>

        {/* Footer Actions */}
        {!isEditing && (
          <div className="sticky bottom-0 bg-card/95 backdrop-blur-sm pt-3 pb-1 border-t border-border/40 flex items-center justify-between gap-3 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 px-4 sm:px-6 rounded-b-2xl sm:rounded-b-xl">
            <Button
              variant="outline"
              size="sm"
              data-testid="edit-details-button"
              className="flex-1 gap-2 h-9 font-medium rounded-md"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4" /> Edit Details
            </Button>

            {onDeleteClick && currentApp?.id && (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2 h-9 font-medium rounded-md"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>

                <Dialog
                  open={isDeleteDialogOpen}
                  onOpenChange={setIsDeleteDialogOpen}
                >
                  <DialogContent onClick={(e) => e.stopPropagation()}>
                    <DialogHeader>
                      <DialogTitle>Are you absolutely sure?</DialogTitle>
                      <DialogDescription>
                        This action cannot be undone. This will permanently delete
                        your application for{" "}
                        <strong className="text-foreground">
                          {activeApp.role_name}
                        </strong>{" "}
                        at{" "}
                        <strong className="text-foreground">
                          {activeApp.company_name}
                        </strong>
                        .
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button
                        variant="destructive"
                        onClick={() => {
                          if (currentApp?.id) {
                            onDeleteClick(currentApp.id);
                            setIsDeleteDialogOpen(false);
                            onOpenChange(false);
                          }
                        }}
                      >
                        Delete Application
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDeleteDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

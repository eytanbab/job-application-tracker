"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
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
} from "@/lib/utils";
import {
  getApplicationHistory,
  updateApplication,
  deleteStatusHistoryEntry,
} from "@/app/actions/applications";
import { toast } from "@/hooks/use-toast";
import { TimelineEntry } from "./application-timeline";
import {
  ApplicationDetailEditForm,
  DetailEditFormData,
} from "./application-detail-edit-form";
import { ApplicationDetailView } from "./application-detail-view";

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
    "bg-muted/80 text-muted-foreground border-border/50 rounded-md font-medium",
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
}: ApplicationDetailSheetProps) {
  const [currentApp, setCurrentApp] = useState<ApplicationDetail | null>(
    initialApp,
  );
  const [quickStatusText, setQuickStatusText] = useState<string>(
    initialApp?.status || "",
  );
  const [isEditing, setIsEditing] = useState(false);
  const [history, setHistory] = useState<TimelineEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSaving, startSaveTransition] = useTransition();

  const [initialEditForm, setInitialEditForm] = useState<
    DetailEditFormData | undefined
  >(undefined);
  const [editForm, setEditForm] = useState<DetailEditFormData>({
    role_name: "",
    company_name: "",
    location: "",
    salary: "",
    platform: "",
    link: "",
    date_applied: "",
    description: "",
    notes: "",
    status: "",
    statusCategory: "applied",
  });

  useEffect(() => {
    setCurrentApp(initialApp);
    if (initialApp) {
      const effectiveStatus = getStatusDisplay(
        initialApp.status,
        initialApp.statusCategory,
      );
      setQuickStatusText(effectiveStatus);
      const initialValues: DetailEditFormData = {
        role_name: initialApp.role_name || "",
        company_name: initialApp.company_name || "",
        location: initialApp.location || "",
        salary: initialApp.salary || "",
        platform: initialApp.platform || "",
        link: initialApp.link || "",
        date_applied: initialApp.date_applied || "",
        description: initialApp.description || "",
        notes: initialApp.notes || "",
        status: effectiveStatus,
        statusCategory: getStatusKind(
          initialApp.status,
          initialApp.statusCategory,
        ),
      };
      setEditForm(initialValues);
      setInitialEditForm(initialValues);

      if (open) {
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

  if (!currentApp) return null;

  const currentKind = getStatusKind(
    currentApp.status,
    currentApp.statusCategory,
  );
  const displayStatusText = getStatusDisplay(
    currentApp.status,
    currentApp.statusCategory,
  );

  const handleQuickStatusChange = (
    newCategory: string,
    newStatusText?: string,
  ) => {
    if (!currentApp.id) return;
    startSaveTransition(async () => {
      try {
        const updatedStatus = getStatusDisplay(
          newStatusText || currentApp.status,
          newCategory,
        );
        const payload = {
          ...currentApp,
          id: currentApp.id,
          role_name: currentApp.role_name,
          company_name: currentApp.company_name,
          date_applied: currentApp.date_applied,
          link: currentApp.link,
          platform: currentApp.platform,
          location: currentApp.location,
          month: currentApp.month,
          year: currentApp.year,
          statusCategory: newCategory,
          status: updatedStatus,
        };
        await updateApplication(payload);
        setCurrentApp(payload);
        toast({
          description: `Status updated to ${statusLabels[newCategory as StatusKind] || newCategory}`,
        });

        if (currentApp.id) {
          const updatedHistory = await getApplicationHistory(currentApp.id);
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

  const handleSaveInline = () => {
    if (!currentApp.id) return;
    startSaveTransition(async () => {
      try {
        const updatedKind = editForm.statusCategory;
        const updatedStatusText = getStatusDisplay(
          editForm.status,
          updatedKind,
        );

        const payload = {
          ...currentApp,
          id: currentApp.id,
          role_name: editForm.role_name.trim(),
          company_name: editForm.company_name.trim(),
          location: editForm.location.trim(),
          salary: editForm.salary.trim(),
          platform: editForm.platform.toLowerCase().trim(),
          link: editForm.link.trim(),
          date_applied: editForm.date_applied,
          description: editForm.description,
          notes: editForm.notes,
          statusCategory: updatedKind,
          status: updatedStatusText.trim(),
        };

        await updateApplication(payload);
        setCurrentApp(payload);
        setInitialEditForm({ ...editForm, status: updatedStatusText.trim() });
        setIsEditing(false);
        toast({ description: "Application updated successfully!" });

        if (currentApp.id) {
          const updatedHistory = await getApplicationHistory(currentApp.id);
          setHistory(updatedHistory);
        }
      } catch (err) {
        console.error(err);
        toast({
          description: "Failed to update application",
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
      <DialogContent className="w-full max-w-2xl md:max-w-3xl overflow-y-auto max-h-[92vh] sm:max-h-[85vh] p-4 sm:p-6 rounded-xl sm:rounded-md shadow-lg border border-border/40">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="space-y-1 w-full">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label
                      htmlFor="edit-role-name"
                      className="text-[11px] font-semibold text-muted-foreground uppercase"
                    >
                      Role Title
                    </label>
                    <Input
                      id="edit-role-name"
                      value={editForm.role_name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, role_name: e.target.value })
                      }
                      className="font-semibold text-base h-9"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-company-name"
                      className="text-[11px] font-semibold text-muted-foreground uppercase"
                    >
                      Company Name
                    </label>
                    <Input
                      id="edit-company-name"
                      value={editForm.company_name}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          company_name: e.target.value,
                        })
                      }
                      className="text-sm h-9"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <DialogTitle className="text-2xl font-bold tracking-tight text-foreground font-heading">
                    {currentApp.role_name}
                  </DialogTitle>
                  <p className="flex items-center gap-1.5 text-base font-medium text-muted-foreground">
                    <Building2 className="h-4 w-4 shrink-0 text-muted-foreground/70" />
                    {currentApp.company_name}
                  </p>
                </>
              )}
            </div>

            {!isEditing && currentApp.link && (
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-md"
                asChild
              >
                <a
                  href={currentApp.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open Job Link"
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
                {currentApp.platform}
              </Badge>

              {currentApp.location && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 text-muted-foreground"
                >
                  <MapPin className="h-3 w-3" />
                  {currentApp.location}
                </Badge>
              )}

              {currentApp.salary && (
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"
                >
                  <DollarSign className="h-3 w-3" />
                  {currentApp.salary}
                </Badge>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="py-4 space-y-5">
          {isEditing ? (
            <ApplicationDetailEditForm
              editForm={editForm}
              setEditForm={setEditForm}
              initialForm={initialEditForm}
              isSaving={isSaving}
              onSave={handleSaveInline}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <ApplicationDetailView
              currentApp={currentApp}
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
          <div className="pt-4 border-t border-border/40 flex items-center justify-between gap-3">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-2 h-9 font-medium rounded-md"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4" /> Edit Details
            </Button>

            {onDeleteClick && currentApp.id && (
              <Button
                variant="destructive"
                size="sm"
                className="gap-2 h-9 font-medium rounded-md"
                onClick={() => {
                  if (currentApp.id) {
                    onDeleteClick(currentApp.id);
                    onOpenChange(false);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ExternalLink,
  MapPin,
  Calendar,
  DollarSign,
  Building2,
  Clock,
  History,
  Pencil,
  Trash2,
  Check,
  X,
  Loader2,
  FileText,
  MessageSquare,
} from 'lucide-react';
import {
  getStatusDisplay,
  getStatusKind,
  statusLabels,
  statusOptions,
  StatusKind,
} from '@/lib/utils';
import { formatDate, parseISO } from 'date-fns';
import { getApplicationHistory, updateApplication, deleteStatusHistoryEntry } from '@/app/actions/applications';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  applied: 'bg-primary/15 text-primary border-primary/25 rounded-md font-semibold',
  accepted:
    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 rounded-md font-semibold',
  ghosted: 'bg-muted/80 text-muted-foreground border-border/50 rounded-md font-medium',
  review: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/25 rounded-md font-semibold',
  interview:
    'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25 rounded-md font-semibold',
  rejected: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/25 rounded-md font-semibold',
  other: 'bg-secondary text-secondary-foreground border-border rounded-md font-medium',
};

export function ApplicationDetailSheet({
  application: initialApp,
  open,
  onOpenChange,
  onDeleteClick,
}: ApplicationDetailSheetProps) {
  const [currentApp, setCurrentApp] = useState<ApplicationDetail | null>(initialApp);
  const [quickStatusText, setQuickStatusText] = useState<string>(initialApp?.status || '');
  const [isEditing, setIsEditing] = useState(false);
  const [history, setHistory] = useState<
    { id: string; status: string; statusCategory: string; createdAt: Date }[]
  >([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSaving, startSaveTransition] = useTransition();

  // Form edit state
  const [editForm, setEditForm] = useState<{
    role_name: string;
    company_name: string;
    location: string;
    salary: string;
    platform: string;
    link: string;
    date_applied: string;
    description: string;
    notes: string;
    status: string;
    statusCategory: string;
  }>({
    role_name: '',
    company_name: '',
    location: '',
    salary: '',
    platform: '',
    link: '',
    date_applied: '',
    description: '',
    notes: '',
    status: '',
    statusCategory: 'applied',
  });

  useEffect(() => {
    setCurrentApp(initialApp);
    if (initialApp) {
      const effectiveStatus = getStatusDisplay(initialApp.status, initialApp.statusCategory);
      setQuickStatusText(effectiveStatus);
      setEditForm({
        role_name: initialApp.role_name || '',
        company_name: initialApp.company_name || '',
        location: initialApp.location || '',
        salary: initialApp.salary || '',
        platform: initialApp.platform || '',
        link: initialApp.link || '',
        date_applied: initialApp.date_applied || '',
        description: initialApp.description || '',
        notes: initialApp.notes || '',
        status: effectiveStatus,
        statusCategory: getStatusKind(initialApp.status, initialApp.statusCategory),
      });

      if (open) {
        setIsLoadingHistory(true);
        getApplicationHistory(initialApp.id as string)
          .then((res) => {
            setHistory(res);
          })
          .catch((err) => {
            console.error('Failed to load history:', err);
          })
          .finally(() => {
            setIsLoadingHistory(false);
          });
      }
    }
  }, [initialApp, open]);

  if (!currentApp) return null;

  const currentKind = getStatusKind(currentApp.status, currentApp.statusCategory);
  const displayStatusText = getStatusDisplay(
    currentApp.status,
    currentApp.statusCategory
  );

  const handleQuickStatusChange = (newCategory: string, newStatusText?: string) => {
    if (!currentApp.id) return;
    startSaveTransition(async () => {
      try {
        const updatedStatus = getStatusDisplay(newStatusText || currentApp.status, newCategory);
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
        toast({ description: `Status updated to ${statusLabels[newCategory as StatusKind] || newCategory}` });
        
        if (currentApp.id) {
          const updatedHistory = await getApplicationHistory(currentApp.id);
          setHistory(updatedHistory);
        }
      } catch (err) {
        console.error(err);
        toast({ description: 'Failed to update status', variant: 'destructive' });
      }
    });
  };

  const handleSaveInline = () => {
    if (!currentApp.id) return;
    startSaveTransition(async () => {
      try {
        const updatedKind = editForm.statusCategory;
        const updatedStatusText = getStatusDisplay(editForm.status, updatedKind);
        
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
        setIsEditing(false);
        toast({ description: 'Application updated successfully!' });

        if (currentApp.id) {
          const updatedHistory = await getApplicationHistory(currentApp.id);
          setHistory(updatedHistory);
        }
      } catch (err) {
        console.error(err);
        toast({ description: 'Failed to update application', variant: 'destructive' });
      }
    });
  };

  const formattedAppliedDate = currentApp.date_applied
    ? formatDate(parseISO(currentApp.date_applied), 'PPP')
    : 'Unknown date';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-2xl md:max-w-3xl overflow-y-auto max-h-[92vh] sm:max-h-[85vh] p-4 sm:p-6 rounded-xl sm:rounded-md shadow-lg border border-border/40">
        <DialogHeader className="space-y-3 pb-4 border-b">
          <div className="flex items-start justify-between gap-3 pr-6">
            <div className="space-y-1 w-full">
              {isEditing ? (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label htmlFor="edit-role-name" className="text-[11px] font-semibold text-muted-foreground uppercase">Role Title</label>
                    <Input
                      id="edit-role-name"
                      value={editForm.role_name}
                      onChange={(e) => setEditForm({ ...editForm, role_name: e.target.value })}
                      className="font-semibold text-base h-9"
                    />
                  </div>
                  <div>
                    <label htmlFor="edit-company-name" className="text-[11px] font-semibold text-muted-foreground uppercase">Company Name</label>
                    <Input
                      id="edit-company-name"
                      value={editForm.company_name}
                      onChange={(e) => setEditForm({ ...editForm, company_name: e.target.value })}
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
              <Badge variant="outline" className={`border ${statusBadgeClasses[currentKind]}`}>
                {displayStatusText}
              </Badge>

              <Badge variant="secondary" className="capitalize">
                {currentApp.platform}
              </Badge>

              {currentApp.location && (
                <Badge variant="outline" className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {currentApp.location}
                </Badge>
              )}

              {currentApp.salary && (
                <Badge variant="outline" className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="h-3 w-3" />
                  {currentApp.salary}
                </Badge>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="py-4 space-y-5">
          {isEditing ? (
            /* Inline Edit View */
            <div className="space-y-4 text-sm opacity-100 transition-opacity duration-200">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-status-category" className="text-[11px] font-semibold text-muted-foreground uppercase">Status Category</label>
                  <Select
                    value={editForm.statusCategory}
                    onValueChange={(val) => setEditForm({ ...editForm, statusCategory: val })}
                  >
                    <SelectTrigger id="edit-status-category" className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="capitalize">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="edit-status-detail" className="text-[11px] font-semibold text-muted-foreground uppercase">Stage Details / Custom Status</label>
                  <Input
                    id="edit-status-detail"
                    placeholder="e.g. Self-withdrawn, Post-tech screen"
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-platform" className="text-[11px] font-semibold text-muted-foreground uppercase">Platform</label>
                  <Input
                    id="edit-platform"
                    placeholder="e.g. LinkedIn"
                    value={editForm.platform}
                    onChange={(e) => setEditForm({ ...editForm, platform: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div>
                  <label htmlFor="edit-date-applied" className="text-[11px] font-semibold text-muted-foreground uppercase">Date Applied</label>
                  <Input
                    id="edit-date-applied"
                    type="date"
                    value={editForm.date_applied ? editForm.date_applied.split('T')[0] : ''}
                    onChange={(e) => setEditForm({ ...editForm, date_applied: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-location" className="text-[11px] font-semibold text-muted-foreground uppercase">Location</label>
                  <Input
                    id="edit-location"
                    placeholder="e.g. Tel Aviv / Remote"
                    value={editForm.location}
                    onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div>
                  <label htmlFor="edit-salary" className="text-[11px] font-semibold text-muted-foreground uppercase">Salary Range</label>
                  <Input
                    id="edit-salary"
                    placeholder="e.g. 30k - 40k"
                    value={editForm.salary}
                    onChange={(e) => setEditForm({ ...editForm, salary: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="edit-link" className="text-[11px] font-semibold text-muted-foreground uppercase">Job URL</label>
                <Input
                  id="edit-link"
                  placeholder="https://..."
                  value={editForm.link}
                  onChange={(e) => setEditForm({ ...editForm, link: e.target.value })}
                  className="h-9"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="edit-description" className="text-[11px] font-semibold text-muted-foreground uppercase">Job Description</label>
                  <Textarea
                    id="edit-description"
                    rows={4}
                    placeholder="Job posting responsibilities..."
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label htmlFor="edit-notes" className="text-[11px] font-semibold text-muted-foreground uppercase">Personal Candidate Notes</label>
                  <Textarea
                    id="edit-notes"
                    rows={4}
                    placeholder="Recruiter contact, interview feedback..."
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Button
                  className="flex-1 gap-2 font-medium"
                  disabled={isSaving}
                  onClick={handleSaveInline}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  disabled={isSaving}
                  onClick={() => setIsEditing(false)}
                  className="gap-1.5"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            /* Read-only View */
            <>
              {/* Quick status update control */}
              <div className="rounded-md border border-border/30 bg-muted/30 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="quick-status-select" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Quick Update Status
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Select
                    disabled={isSaving}
                    value={currentKind}
                    onValueChange={(cat) => handleQuickStatusChange(cat)}
                  >
                    <SelectTrigger id="quick-status-select" className="w-full bg-card border-border/40 rounded-md">
                      <SelectValue placeholder="Select new status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value} className="capitalize text-xs">
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Custom stage detail (optional)"
                    value={quickStatusText}
                    onChange={(e) => setQuickStatusText(e.target.value)}
                    onBlur={(e) => handleQuickStatusChange(currentKind, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.currentTarget.blur();
                        handleQuickStatusChange(currentKind, quickStatusText);
                      }
                    }}
                    className="h-9 text-xs bg-card border-border/40"
                  />
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm bg-card p-3.5 border border-border/30 rounded-md">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                    <Calendar className="h-3.5 w-3.5" /> Date Applied
                  </span>
                  <p className="font-medium text-foreground text-xs sm:text-sm">{formattedAppliedDate}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                    <Clock className="h-3.5 w-3.5" /> Platform
                  </span>
                  <p className="font-medium capitalize text-foreground text-xs sm:text-sm">{currentApp.platform || '-'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                    <MapPin className="h-3.5 w-3.5" /> Location
                  </span>
                  <p className="font-medium text-foreground text-xs sm:text-sm">{currentApp.location || '-'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                    <DollarSign className="h-3.5 w-3.5" /> Salary
                  </span>
                  <p className="font-medium text-foreground text-xs sm:text-sm">{currentApp.salary || '-'}</p>
                </div>
              </div>

              {/* Separated Job Description & Personal Notes (Item 3) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5" /> Job Description
                  </h4>
                  <div className="rounded-md border border-border/30 bg-card p-3 text-xs text-foreground leading-relaxed whitespace-pre-wrap max-h-44 overflow-y-auto">
                    {currentApp.description?.trim()
                      ? currentApp.description
                      : 'No job description provided.'}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" /> Personal Candidate Notes
                  </h4>
                  <div className="rounded-md border border-border/30 bg-card p-3 text-xs text-foreground leading-relaxed whitespace-pre-wrap max-h-44 overflow-y-auto">
                    {currentApp.notes?.trim()
                      ? currentApp.notes
                      : 'No personal notes added yet.'}
                  </div>
                </div>
              </div>

              {/* Status Timeline History */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <History className="h-4 w-4" /> Application Timeline
                </h4>

                {isLoadingHistory ? (
                  <p className="text-xs text-muted-foreground italic">Loading timeline...</p>
                ) : history.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No status history recorded yet.</p>
                ) : (
                  <div className="relative pl-4 border-l border-border space-y-3 my-2">
                    {history.map((item, idx) => {
                      const itemKind = getStatusKind(item.status, item.statusCategory);
                      const displayTitle = getStatusDisplay(item.status, item.statusCategory);
                      const categoryLabel = statusLabels[itemKind];
                      const showCategoryTag =
                        Boolean(categoryLabel) &&
                        displayTitle.toLowerCase() !== categoryLabel.toLowerCase();
                      const formattedTime = item.createdAt
                        ? formatDate(new Date(item.createdAt), 'MMM d, yyyy · h:mm a')
                        : '';
                      return (
                        <div key={item.id || `${item.status}-${item.createdAt}`} className="relative space-y-0.5 group">
                          <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold capitalize text-foreground">
                                {displayTitle}
                              </span>
                              {showCategoryTag && (
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 font-normal text-muted-foreground">
                                  {categoryLabel}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground text-[11px]">{formattedTime}</span>
                              {item.id && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      await deleteStatusHistoryEntry(item.id);
                                      setHistory((prev) => prev.filter((h) => h.id !== item.id));
                                      toast({ description: 'Timeline entry removed' });
                                    } catch {
                                      toast({ description: 'Failed to remove timeline entry', variant: 'destructive' });
                                    }
                                  }}
                                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                                  title="Delete this timeline entry"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {!isEditing && (
          <div className="pt-4 border-t flex items-center justify-between gap-3">
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

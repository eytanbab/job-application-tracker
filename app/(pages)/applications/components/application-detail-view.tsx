'use client';

import { Input } from '@/components/ui/input';
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  FileText,
  MessageSquare,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDate, parseISO } from 'date-fns';
import { statusOptions, StatusKind } from '@/lib/utils';
import { ApplicationTimeline, TimelineEntry } from './application-timeline';

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
  const formattedAppliedDate = currentApp.date_applied
    ? formatDate(parseISO(currentApp.date_applied), 'PPP')
    : 'Unknown date';

  return (
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

          <div className="relative flex-1">
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
              className="h-9 text-xs bg-card border-border/40 pr-20"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-medium pointer-events-none">
              {isSaving ? 'Saving...' : 'Press Enter'}
            </span>
          </div>
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

      {/* Separated Job Description & Personal Notes */}
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
      <ApplicationTimeline
        history={history}
        isLoadingHistory={isLoadingHistory}
        onDeleteEntry={onDeleteTimelineEntry}
      />
    </>
  );
}

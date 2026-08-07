'use client';

import { useMemo, useState, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Calendar,
  ExternalLink,
  MapPin,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  getStatusDisplay,
  getStatusKind,
  statusLabels,
  statusOptions,
  StatusKind,
} from '@/lib/utils';
import { formatDate, parseISO } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import { updateApplication } from '@/app/actions/applications';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface KanbanItem {
  id?: string;
  role_name: string;
  company_name: string;
  date_applied: string;
  link: string;
  platform: string;
  status: string;
  statusCategory?: string | null;
  statusLabel?: string | null;
  month: string;
  year: string;
  description?: string | null;
  notes?: string | null;
  location: string;
  salary?: string | null;
  [key: string]: unknown;
}

interface ApplicationsKanbanProps {
  data: KanbanItem[];
  searchFilter: string;
  statusFilter: string;
  onSelectApplication: (app: KanbanItem) => void;
  onEditApplication: (app: KanbanItem) => void;
  onDeleteApplication: (id: string) => void;
}

const KANBAN_COLUMNS: { id: StatusKind; label: string; headerBg: string }[] = [
  {
    id: 'applied',
    label: 'Applied',
    headerBg: 'bg-primary/10 text-primary border-primary/25',
  },
  {
    id: 'review',
    label: 'In Review',
    headerBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
  },
  {
    id: 'interview',
    label: 'Interviewing',
    headerBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
  },
  {
    id: 'accepted',
    label: 'Offer / Accepted',
    headerBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
  },
  {
    id: 'rejected',
    label: 'Rejected',
    headerBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
  },
  {
    id: 'ghosted',
    label: 'Ghosted',
    headerBg: 'bg-muted/80 text-muted-foreground border-border/50',
  },
];

export function ApplicationsKanban({
  data,
  searchFilter,
  statusFilter,
  onSelectApplication,
  onEditApplication,
  onDeleteApplication,
}: ApplicationsKanbanProps) {
  const [, startTransition] = useTransition();
  const [dragOverCol, setDragOverCol] = useState<StatusKind | null>(null);
  const [activeMobileCol, setActiveMobileCol] = useState<StatusKind>('applied');

  // Filter data based on search and status filter
  const filteredData = useMemo(() => {
    const query = searchFilter.toLowerCase().trim();
    return data.filter((item) => {
      if (statusFilter && statusFilter !== 'all') {
        const itemKind = getStatusKind(item.status, item.statusCategory);
        if (itemKind !== statusFilter) return false;
      }

      if (!query) return true;
      return (
        item.role_name.toLowerCase().includes(query) ||
        item.company_name.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.platform.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.notes && item.notes.toLowerCase().includes(query))
      );
    });
  }, [data, searchFilter, statusFilter]);

  // Group applications by canonical status
  const groupedData = useMemo(() => {
    const map: Record<StatusKind, KanbanItem[]> = {
      applied: [],
      review: [],
      interview: [],
      accepted: [],
      rejected: [],
      ghosted: [],
      other: [],
    };

    filteredData.forEach((item) => {
      const kind = getStatusKind(item.status, item.statusCategory);
      if (map[kind]) {
        map[kind].push(item);
      } else {
        map.other.push(item);
      }
    });

    return map;
  }, [filteredData]);

  const handleQuickStatusMove = (item: KanbanItem, newCategory: string) => {
    if (!item.id) return;
    startTransition(async () => {
      try {
        await updateApplication({
          ...item,
          id: item.id,
          statusCategory: newCategory,
          status: getStatusDisplay(item.status, newCategory, item.statusLabel),
        });
        toast({
          description: `Moved "${item.role_name}" to ${
            statusLabels[newCategory as StatusKind] || newCategory
          }`,
        });
      } catch (err) {
        console.error(err);
        toast({ description: 'Failed to move application', variant: 'destructive' });
      }
    });
  };

  const handleDropOnColumn = (targetColId: StatusKind, itemJson: string) => {
    try {
      const item: KanbanItem = JSON.parse(itemJson);
      const currentKind = getStatusKind(item.status, item.statusCategory);
      if (currentKind !== targetColId) {
        handleQuickStatusMove(item, targetColId);
      }
    } catch (err) {
      console.error('Failed to parse drag item:', err);
    }
  };

  const renderColumnContent = (col: typeof KANBAN_COLUMNS[0], colIdx: number) => {
    const items = groupedData[col.id] || [];
    const prevCol = colIdx > 0 ? KANBAN_COLUMNS[colIdx - 1] : null;
    const nextCol = colIdx < KANBAN_COLUMNS.length - 1 ? KANBAN_COLUMNS[colIdx + 1] : null;

    const isDropTarget = dragOverCol === col.id;

    return (
      <div
        key={col.id}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOverCol(col.id);
        }}
        onDragLeave={() => setDragOverCol(null)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOverCol(null);
          const dataStr = e.dataTransfer.getData('application/json');
          if (dataStr) {
            handleDropOnColumn(col.id, dataStr);
          }
        }}
        className={cn(
          'flex-1 flex flex-col w-full rounded-md border p-3 shadow-2xs transition-all duration-200',
          isDropTarget
            ? 'border-2 border-primary bg-primary/10 ring-2 ring-primary/20 scale-[1.01]'
            : 'bg-card/40 border-border/40'
        )}
      >
        {/* Column Header */}
        <div
          className={`flex items-center justify-between px-3 py-2 rounded-md border font-semibold text-xs mb-3 ${col.headerBg}`}
        >
          <span className="truncate">{col.label}</span>
          <Badge variant="secondary" className="h-5 rounded-md px-2 text-[11px] shrink-0 font-bold">
            {items.length}
          </Badge>
        </div>

        {/* Cards List */}
        <div className="flex flex-col gap-2.5 min-h-[260px] max-h-[68vh] overflow-y-auto pr-1 pb-4">
          {items.length === 0 ? (
            <div
              className={cn(
                'flex flex-col items-center justify-center p-8 text-center rounded-md border border-dashed text-xs text-muted-foreground transition-colors',
                isDropTarget ? 'border-primary text-primary font-medium bg-primary/5' : 'border-border/40'
              )}
            >
              {isDropTarget ? 'Drop item here' : 'No applications in this stage'}
            </div>
          ) : (
            items.map((item) => {
              const formattedDate = item.date_applied
                ? formatDate(parseISO(item.date_applied), 'MMM d')
                : '';
              const displayLabel = getStatusDisplay(
                item.status,
                item.statusCategory,
                item.statusLabel
              );

              return (
                <Card
                  key={item.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/json', JSON.stringify(item));
                  }}
                  className="group relative cursor-grab active:cursor-grabbing border bg-card hover:border-primary/50 transition-all hover:shadow-md rounded-md"
                  onClick={() => onSelectApplication(item)}
                >
                  <CardHeader className="p-3 pb-1.5 flex flex-row items-start justify-between space-y-0 gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                      <CardTitle className="text-sm font-bold tracking-tight text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                        {item.role_name}
                      </CardTitle>
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 truncate">
                        <Building2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">{item.company_name}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {/* Quick Stage Shifting Buttons on Hover */}
                      {prevCol && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          title={`Move to ${prevCol.label}`}
                          onClick={() => handleQuickStatusMove(item, prevCol.id)}
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {nextCol && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-md text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                          title={`Move to ${nextCol.label}`}
                          onClick={() => handleQuickStatusMove(item, nextCol.id)}
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground opacity-70 group-hover:opacity-100"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => onSelectApplication(item)}>
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onEditApplication(item)}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>

                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              Change Status
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent className="w-40">
                              {statusOptions.map((opt) => (
                                <DropdownMenuItem
                                  key={opt.value}
                                  onClick={() => handleQuickStatusMove(item, opt.value)}
                                  className="capitalize"
                                >
                                  {opt.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>

                          <DropdownMenuItem
                            onClick={() => item.id && onDeleteApplication(item.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="p-3 pt-1 space-y-2 text-xs">
                    {item.statusLabel && (
                      <Badge variant="outline" className="text-[10px] font-normal truncate max-w-full block rounded-sm">
                        {displayLabel}
                      </Badge>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-1 text-muted-foreground text-[11px] pt-1">
                      <span className="flex items-center gap-1 shrink-0">
                        <Calendar className="h-3 w-3" />
                        {formattedDate}
                      </span>

                      <div className="flex items-center gap-1.5 min-w-0">
                        {item.location && (
                          <span className="flex items-center gap-0.5 truncate max-w-[90px]">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{item.location}</span>
                          </span>
                        )}
                        {item.link && (
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-muted-foreground hover:text-foreground shrink-0"
                            title="Job Link"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full space-y-4">
      {/* Mobile Column Segment Switcher (< 768px) */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto pb-2 scrollbar-none">
        {KANBAN_COLUMNS.map((col) => {
          const count = (groupedData[col.id] || []).length;
          const isActive = activeMobileCol === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setActiveMobileCol(col.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-all border',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary shadow-2xs'
                  : 'bg-card text-muted-foreground border-border/40 hover:text-foreground'
              )}
            >
              <span>{col.label}</span>
              <span className={cn(
                'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile View: Single Column */}
      <div className="md:hidden">
        {KANBAN_COLUMNS.filter(c => c.id === activeMobileCol).map((col) => {
          const colIdx = KANBAN_COLUMNS.findIndex(c => c.id === col.id);
          return renderColumnContent(col, colIdx);
        })}
      </div>

      {/* Desktop View: All 6 Columns Grid (>= 768px) */}
      <div className="hidden md:block w-full overflow-x-auto pb-4 pt-1">
        <div className="flex gap-4 min-w-[1080px] w-full items-start">
          {KANBAN_COLUMNS.map((col, colIdx) => renderColumnContent(col, colIdx))}
        </div>
      </div>
    </div>
  );
}

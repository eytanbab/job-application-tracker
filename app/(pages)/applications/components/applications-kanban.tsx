'use client';

import { useMemo, useTransition } from 'react';
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

  // Filter data based on search and status filter
  const filteredData = useMemo(() => {
    const query = searchFilter.toLowerCase().trim();
    return data.filter((item) => {
      // Status filter check
      if (statusFilter && statusFilter !== 'all') {
        const itemKind = getStatusKind(item.status, item.statusCategory);
        if (itemKind !== statusFilter) return false;
      }

      // Search query check
      if (!query) return true;
      return (
        item.role_name.toLowerCase().includes(query) ||
        item.company_name.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query) ||
        item.platform.toLowerCase().includes(query) ||
        (item.description && item.description.toLowerCase().includes(query))
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

  return (
    <div className="w-full overflow-x-auto pb-4 pt-1">
      <div className="flex gap-4 min-w-[1080px] w-full items-start">
        {KANBAN_COLUMNS.map((col) => {
          const items = groupedData[col.id] || [];

          return (
            <div
              key={col.id}
              className="flex-1 flex flex-col min-w-[240px] max-w-[300px] rounded-xl border bg-card/40 backdrop-blur-xs p-3 shadow-2xs"
            >
              {/* Column Header */}
              <div
                className={`flex items-center justify-between px-3 py-2 rounded-lg border font-semibold text-xs mb-3 ${col.headerBg}`}
              >
                <span className="truncate">{col.label}</span>
                <Badge variant="secondary" className="h-5 rounded-full px-2 text-[11px] shrink-0">
                  {items.length}
                </Badge>
              </div>

              {/* Cards List */}
              <div className="flex flex-col gap-2.5 min-h-[240px] max-h-[68vh] overflow-y-auto pr-1 pb-4">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center rounded-lg border border-dashed text-xs text-muted-foreground">
                    No applications
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
                        className="group relative cursor-pointer border bg-card hover:border-primary/50 transition-all hover:shadow-md"
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

                          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
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
                            <Badge variant="outline" className="text-[10px] font-normal truncate max-w-full block">
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
        })}
      </div>
    </div>
  );
}

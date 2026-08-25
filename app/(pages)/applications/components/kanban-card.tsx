"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import {
  getStatusDisplay,
  getStatusKind,
  statusLabels,
  statusOptions,
  StatusKind,
  isStandardStatus,
} from "@/lib/utils";
import { useState } from "react";
import { formatDate, parseISO } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";

export interface KanbanItem {
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
  [key: string]: unknown;
}

interface KanbanCardProps {
  item: KanbanItem;
  prevCol: { id: StatusKind; label: string } | null;
  nextCol: { id: StatusKind; label: string } | null;
  onSelectApplication: (app: KanbanItem) => void;
  onEditApplication: (app: KanbanItem) => void;
  onDeleteApplication: (id: string) => void;
  onQuickStatusMove: (item: KanbanItem, newCategory: string) => void;
}

export function KanbanCard({
  item,
  prevCol,
  nextCol,
  onSelectApplication,
  onEditApplication,
  onDeleteApplication,
  onQuickStatusMove,
}: KanbanCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const formattedDate = item.date_applied
    ? formatDate(parseISO(item.date_applied), "MMM d")
    : "";
  const displayLabel = getStatusDisplay(item.status, item.statusCategory);

  const isCustomStage =
    Boolean(item.status) && !isStandardStatus(item.status);

  return (
    <>
      <Card
        draggable
        tabIndex={0}
        role="article"
        aria-label={`Application for ${item.role_name} at ${item.company_name}`}
        onDragStart={(e) => {
          e.dataTransfer.setData("application/json", JSON.stringify(item));
        }}
        className="group relative cursor-grab active:cursor-grabbing border bg-card hover:border-primary/50 transition-[border-color,box-shadow] hover:shadow-md rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-w-0 w-full"
        onClick={() => onSelectApplication(item)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelectApplication(item);
          }
        }}
      >
        <CardHeader className="p-3 pb-1.5 flex flex-row items-start justify-between space-y-0 gap-2 min-w-0">
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-sm font-bold tracking-tight text-foreground line-clamp-2 break-words leading-tight group-hover:text-primary transition-colors">
              {item.role_name}
            </CardTitle>
            <p className="text-xs font-medium text-muted-foreground flex items-center gap-1 truncate">
              <Building2 className="h-3 w-3 shrink-0" />
              <span className="truncate">{item.company_name}</span>
            </p>
          </div>

          <div
            className="flex items-center gap-0.5 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            {prevCol && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity"
                title={`Move to ${prevCol.label}`}
                onClick={() => onQuickStatusMove(item, prevCol.id)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {nextCol && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-md text-muted-foreground hover:text-foreground opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity"
                title={`Move to ${nextCol.label}`}
                onClick={() => onQuickStatusMove(item, nextCol.id)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="More actions"
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
                  <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-40">
                    {statusOptions.map((opt) => (
                      <DropdownMenuItem
                        key={opt.value}
                        onClick={() => onQuickStatusMove(item, opt.value)}
                        className="capitalize"
                      >
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>

                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

      <CardContent className="p-3 pt-1 space-y-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {isCustomStage ? (
            <Badge
              variant="outline"
              className="text-[10px] font-normal truncate max-w-full block rounded-sm bg-primary/5 text-primary border-primary/20"
            >
              {displayLabel}
            </Badge>
          ) : item.statusCategory === "interview" ? (
            <Badge
              variant="outline"
              className="text-[10px] font-semibold truncate max-w-full block rounded-sm bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30"
            >
              🗓️ Interviewing
            </Badge>
          ) : null}
          {item.platform && (
            <Badge
              variant="secondary"
              className="text-[10px] font-medium capitalize px-1.5 py-0 rounded-sm bg-secondary/80 text-secondary-foreground"
            >
              {item.platform}
            </Badge>
          )}
          {item.salary && (
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm truncate max-w-[120px]">
              {item.salary}
            </span>
          )}
        </div>

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

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete
              your application for{" "}
              <strong className="text-foreground">
                {item.role_name}
              </strong>{" "}
              at{" "}
              <strong className="text-foreground">
                {item.company_name}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="destructive"
              onClick={() => {
                if (item.id) {
                  onDeleteApplication(item.id);
                  setIsDeleteDialogOpen(false);
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
  );
}

"use client";

import { ColumnDef, Column, Table } from "@tanstack/react-table";
import { useEffect, useRef } from "react";
import {
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Eye,
  Building2,
} from "lucide-react";

import { EditApplicationSheet } from "@/app/_components/edit-application-sheet";
import {
  deleteApplication,
  updateApplication,
} from "@/app/actions/applications";
import { formatDate, parseISO } from "date-fns";
import { toast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getStatusDisplay,
  getStatusKind,
  statusLabels,
  StatusKind,
  cn,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { z } from "zod";
import { insertApplicationSchema } from "@/app/db/schema";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const columnsSchema = insertApplicationSchema.omit({ userId: true });
export type FormValues = z.input<typeof columnsSchema>;

export interface CustomColumnMeta {
  onSelectApplication?: (app: FormValues) => void;
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

const handleApplicationDelete = async (id: string) => {
  try {
    await deleteApplication(id);
    toast({ description: "Successfully deleted application!" });
  } catch (err) {
    console.error(err);
    toast({
      description: "Failed to delete application",
      variant: "destructive",
    });
  }
};

function renderSortHeader<TData, TValue>(column: Column<TData, TValue>, label: string) {
  const isSorted = column.getIsSorted();
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "h-auto p-0 font-bold hover:bg-transparent transition-colors justify-start text-left text-xs uppercase tracking-wider text-foreground select-none",
        isSorted && "text-primary font-extrabold",
      )}
      onClick={() => column.toggleSorting(isSorted === "asc")}
    >
      <span>{label}</span>
      {isSorted === "asc" ? (
        <ArrowUp className="ml-1 h-3.5 w-3.5 text-primary" />
      ) : isSorted === "desc" ? (
        <ArrowDown className="ml-1 h-3.5 w-3.5 text-primary" />
      ) : (
        <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground/60" />
      )}
    </Button>
  );
}

function SelectAllCheckbox({ table }: { table: Table<FormValues> }) {
  const isSomeSelected = table.getIsSomePageRowsSelected();
  const isAllSelected = table.getIsAllPageRowsSelected();

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      className="flex items-center justify-center"
    >
      <Checkbox
        checked={isAllSelected ? true : isSomeSelected ? "indeterminate" : false}
        onCheckedChange={(checked: boolean) =>
          table.toggleAllPageRowsSelected(!!checked)
        }
        aria-label="Select all"
      />
    </div>
  );
}

export const columns: ColumnDef<FormValues>[] = [
  {
    id: "select",
    header: ({ table }) => <SelectAllCheckbox table={table} />,
    cell: ({ row }) => (
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        className="flex items-center justify-center"
      >
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(checked: boolean) => row.toggleSelected(!!checked)}
          aria-label="Select row"
        />
      </div>
    ),

    enableSorting: false,
    enableHiding: false,
  },
  {
    id: "role_name",
    accessorFn: (row) => `${row.role_name} ${row.company_name}`,
    header: ({ column }) => renderSortHeader(column, "Role & Company"),
    cell: ({ row }) => {
      const role = row.original.role_name;
      const company = row.original.company_name;
      const link = row.original.link;
      const href =
        link &&
        (link.startsWith("http://") || link.startsWith("https://")
          ? link
          : `https://${link}`);

      return (
        <div className="space-y-0.5 max-w-[170px] xl:max-w-[230px]">
          <div className="font-semibold text-foreground truncate">{role}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 truncate">
            <Building2 className="h-3 w-3 shrink-0" />
            <span className="truncate">{company}</span>
            {href && (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                className="inline-flex items-center justify-center h-5 w-5 rounded text-muted-foreground/70 hover:text-primary hover:bg-primary/10 transition-colors shrink-0 cursor-pointer"
                title="Open job link (opens in new tab)"
                aria-label={`Open job posting for ${role} at ${company}`}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "date_applied",
    header: ({ column }) => renderSortHeader(column, "Date Applied"),
    cell: ({ row }) => {
      const rawDate = row.getValue<string>("date_applied");
      if (!rawDate) return <span className="text-muted-foreground">-</span>;
      const formattedDate = formatDate(parseISO(rawDate), "MMM d, yyyy");
      return (
        <div className="text-xs xl:text-sm font-medium text-foreground whitespace-nowrap">
          {formattedDate}
        </div>
      );
    },
  },
  {
    id: "status",
    accessorFn: (row) => getStatusKind(row.status, row.statusCategory),
    header: ({ column }) => renderSortHeader(column, "Status"),
    cell: ({ row }) => {
      const kind = getStatusKind(
        row.original.status,
        row.original.statusCategory,
      );
      const displayText = getStatusDisplay(
        row.original.status,
        row.original.statusCategory,
      );
      return (
        <Badge
          variant="outline"
          className={`capitalize font-medium border whitespace-nowrap text-[11px] xl:text-xs px-2 py-0.5 ${statusBadgeClasses[kind]}`}
        >
          <span className="sr-only">{statusLabels[kind]}: </span>
          {displayText}
        </Badge>
      );
    },
  },
  {
    accessorKey: "location",
    header: ({ column }) => renderSortHeader(column, "Location"),
    cell: ({ row }) => {
      const location = row.getValue<string>("location");
      return (
        <div className="text-xs xl:text-sm truncate max-w-[110px] xl:max-w-[140px] text-muted-foreground">
          {location || "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "platform",
    header: ({ column }) => renderSortHeader(column, "Platform"),
    cell: ({ row }) => {
      const platform = row.getValue<string>("platform");
      if (!platform) return <span className="text-muted-foreground">-</span>;
      return (
        <div className="flex items-center min-w-0 max-w-[100px] xl:max-w-[125px]" title={platform}>
          <Badge
            variant="secondary"
            className="capitalize text-[11px] xl:text-xs font-normal whitespace-nowrap truncate block px-2 py-0.5"
          >
            {platform}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "salary",
    header: ({ column }) => renderSortHeader(column, "Salary"),
    cell: ({ row }) => {
      const salary = row.getValue<string>("salary");
      return (
        <div className="text-xs xl:text-sm font-medium text-muted-foreground whitespace-nowrap">
          {salary || "-"}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row, table }) => {
      const editDefaults = {
        ...row.original,
      } as FormValues;

      const meta = table.options.meta as CustomColumnMeta | undefined;

      const onSubmit = async (values: FormValues) => {
        try {
          await updateApplication(values);
          toast({
            description: "Application updated successfully!",
            variant: "default",
          });
        } catch (err) {
          toast({
            description: "Failed to update application.",
            variant: "destructive",
          });
          throw err;
        }
      };

      return (
        <div
          className="flex items-center gap-0.5 xl:gap-1 justify-end"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          {meta?.onSelectApplication && (
            <Button
              variant="ghost"
              size="icon"
              data-testid="view-details-button"
              className="h-7 w-7 xl:h-8 xl:w-8 text-muted-foreground hover:text-foreground"
              title="View details"
              onClick={(e) => {
                e.stopPropagation();
                meta.onSelectApplication!(row.original);
              }}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  meta.onSelectApplication!(row.original);
                }
              }}
            >
              <Eye className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
            </Button>
          )}

          <EditApplicationSheet
            row={{ original: editDefaults }}
            onSubmit={onSubmit}
          />

          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                data-testid="delete-application-button"
                className="h-7 w-7 xl:h-8 xl:w-8 text-muted-foreground hover:text-destructive"
                title="Delete application"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <Trash2 className="h-3.5 w-3.5 xl:h-4 xl:w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete
                  your application for{" "}
                  <strong className="text-foreground">
                    {row.original.role_name}
                  </strong>{" "}
                  at{" "}
                  <strong className="text-foreground">
                    {row.original.company_name}
                  </strong>
                  .
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <DialogClose asChild>
                  <Button type="button" variant="outline" className="cursor-pointer">
                    Cancel
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button
                    variant="destructive"
                    className="cursor-pointer"
                    onClick={() => handleApplicationDelete(row.original.id!)}
                  >
                    Delete Application
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      );
    },
  },
];

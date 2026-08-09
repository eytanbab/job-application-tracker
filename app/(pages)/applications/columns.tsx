'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Trash2, ArrowUpDown, ExternalLink, Eye, Building2 } from 'lucide-react';

import { EditApplicationSheet } from '@/app/_components/edit-application-sheet';
import {
  deleteApplication,
  updateApplication,
} from '@/app/actions/applications';
import { formatDate, parseISO } from 'date-fns';
import { toast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { getStatusDisplay, getStatusKind, statusLabels, StatusKind } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { z } from 'zod';
import { insertApplicationSchema } from '@/app/db/schema';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const columnsSchema = insertApplicationSchema.omit({ userId: true });
export type FormValues = z.input<typeof columnsSchema>;

export interface CustomColumnMeta {
  onSelectApplication?: (app: FormValues) => void;
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

const handleApplicationDelete = async (id: string) => {
  try {
    await deleteApplication(id);
    toast({ description: 'Successfully deleted application!' });
  } catch (err) {
    console.error(err);
    toast({ description: 'Failed to delete application', variant: 'destructive' });
  }
};

export const columns: ColumnDef<FormValues>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
        checked={table.getIsAllPageRowsSelected()}
        onChange={(e) => table.toggleAllPageRowsSelected(!!e.target.checked)}
        aria-label="Select all"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
        checked={row.getIsSelected()}
        onChange={(e) => row.toggleSelected(!!e.target.checked)}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'role_name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="font-semibold p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Role & Company
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const role = row.getValue<string>('role_name');
      const company = row.original.company_name;
      return (
        <div className="space-y-0.5 max-w-[220px]">
          <div className="font-semibold text-foreground truncate">{role}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-1 truncate">
            <Building2 className="h-3 w-3 shrink-0" />
            {company}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'date_applied',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="font-semibold p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Date Applied
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const rawDate = row.getValue<string>('date_applied');
      if (!rawDate) return <span className="text-muted-foreground">-</span>;
      const formattedDate = formatDate(parseISO(rawDate), 'dd/MM/yyyy');
      return <div className="text-sm font-medium text-foreground">{formattedDate}</div>;
    },
  },
  {
    id: 'status',
    accessorFn: (row) => getStatusKind(row.status, row.statusCategory),
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="font-semibold p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Status
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const kind = getStatusKind(row.original.status, row.original.statusCategory);
      const displayText = getStatusDisplay(
        row.original.status,
        row.original.statusCategory
      );
      return (
        <Badge
          variant="outline"
          className={`capitalize font-medium border ${statusBadgeClasses[kind]}`}
        >
          <span className="sr-only">{statusLabels[kind]}: </span>
          {displayText}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'location',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="font-semibold p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Location
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const location = row.getValue<string>('location');
      return <div className="text-sm truncate max-w-[140px] text-muted-foreground">{location || '-'}</div>;
    },
  },
  {
    accessorKey: 'platform',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="font-semibold p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Platform
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const platform = row.getValue<string>('platform');
      return (
        <Badge variant="secondary" className="capitalize text-xs font-normal">
          {platform}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'salary',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          className="font-semibold p-0 hover:bg-transparent"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Salary
          <ArrowUpDown className="ml-2 h-3.5 w-3.5" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const salary = row.getValue<string>('salary');
      return (
        <div className="text-sm font-medium text-muted-foreground truncate max-w-[120px]">
          {salary || '-'}
        </div>
      );
    },
  },
  {
    accessorKey: 'link',
    header: () => <span className="font-semibold text-xs">Link</span>,
    cell: ({ row }) => {
      const url = row.getValue<string>('link');
      if (!url) return null;
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-primary hover:bg-accent/60"
          title="Open application link"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      );
    },
  },
  {
    id: 'actions',
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
            description: 'Application updated successfully!',
            variant: 'default',
          });
        } catch (err) {
          toast({
            description: 'Failed to update application.',
            variant: 'destructive',
          });
          throw err;
        }
      };

      return (
        <div
          className="flex items-center gap-1 justify-end"
          onClick={(e) => e.stopPropagation()}
        >
          {meta?.onSelectApplication && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              title="View details"
              onClick={() => meta.onSelectApplication!(row.original)}
            >
              <Eye className="h-4 w-4" />
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
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                title="Delete application"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete
                  your application for <strong className="text-foreground">{row.original.role_name}</strong> at <strong className="text-foreground">{row.original.company_name}</strong>.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <DialogClose asChild>
                  <Button
                    variant="destructive"
                    onClick={() => handleApplicationDelete(row.original.id!)}
                  >
                    Delete Application
                  </Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
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

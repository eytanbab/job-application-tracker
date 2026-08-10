'use client';

import { ColumnDef } from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { ApplicationsKpiSummary } from './components/applications-kpi-summary';
import { ApplicationsKanban } from './components/applications-kanban';
import { ApplicationDetailSheet } from './components/application-detail-sheet';
import { EditApplicationSheet } from '@/app/_components/edit-application-sheet';
import { ApplicationForm } from '@/app/_components/application-form';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { type FormValues } from './columns';
import { createApplication, updateApplication } from '@/app/actions/applications';
import { toast } from '@/hooks/use-toast';
import { DataTableToolbar } from './components/data-table-toolbar';
import { DataTableGrid } from './components/data-table-grid';
import { DataTableBulkActions } from './components/data-table-bulk-actions';
import { useDataTable, ApplicationRow } from './hooks/use-data-table';

interface DataTableProps<TData extends ApplicationRow, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData extends ApplicationRow, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const {
    viewMode,
    setViewMode,
    selectedApp,
    isDetailOpen,
    setIsDetailOpen,
    isCreateOpen,
    setIsCreateOpen,
    editingApp,
    setEditingApp,
    isMobileFilterOpen,
    setIsMobileFilterOpen,
    globalFilter,
    setGlobalFilter,
    statusFilter,
    setStatusFilter,
    platformFilter,
    setPlatformFilter,
    table,
    uniquePlatforms,
    selectedCount,
    handleBulkDelete,
    handleBulkStatusChange,
    hasActiveFilters,
    clearFilters,
    defaultCreateValues,
    handleSelectRow,
    handleDelete,
    setRowSelection,
  } = useDataTable({ columns, data });

  return (
    <div className="w-full space-y-6">
      <ApplicationsKpiSummary data={data} />

      <DataTableToolbar
        globalFilter={globalFilter}
        setGlobalFilter={setGlobalFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        platformFilter={platformFilter}
        setPlatformFilter={setPlatformFilter}
        uniquePlatforms={uniquePlatforms}
        hasActiveFilters={hasActiveFilters}
        clearFilters={clearFilters}
        isMobileFilterOpen={isMobileFilterOpen}
        setIsMobileFilterOpen={setIsMobileFilterOpen}
        viewMode={viewMode}
        setViewMode={setViewMode}
        onOpenCreate={() => setIsCreateOpen(true)}
      />

      {viewMode === 'kanban' ? (
        <ApplicationsKanban
          data={data}
          searchFilter={globalFilter}
          statusFilter={statusFilter}
          onSelectApplication={(app) => handleSelectRow(app as TData)}
          onEditApplication={(app) => setEditingApp(app as TData)}
          onDeleteApplication={handleDelete}
        />
      ) : (
        <DataTableGrid
          table={table}
          columnsCount={columns.length}
          hasActiveFilters={hasActiveFilters}
          clearFilters={clearFilters}
          onSelectRow={handleSelectRow}
        />
      )}

      <DataTableBulkActions
        selectedCount={selectedCount}
        onDeselectAll={() => setRowSelection({})}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkDelete={handleBulkDelete}
      />

      <button
        type="button"
        onClick={() => setIsCreateOpen(true)}
        className={cn(
          "fixed right-5 z-40 md:hidden h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer ring-4 ring-background/50",
          selectedCount > 0 ? "bottom-24" : "bottom-6"
        )}
        aria-label="Add Application"
        title="Add Application"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-y-auto p-6">
          <SheetHeader className="pb-4 border-b">
            <SheetTitle className="text-xl font-bold">New Job Application</SheetTitle>
          </SheetHeader>
          <div className="py-4">
            <ApplicationForm
              defaultValues={defaultCreateValues}
              onClose={() => setIsCreateOpen(false)}
              onSubmit={async (values) => {
                try {
                  await createApplication(values);
                  toast({ description: 'Application created successfully!' });
                  setIsCreateOpen(false);
                } catch {
                  toast({ description: 'Failed to create application', variant: 'destructive' });
                }
              }}
            />
          </div>
        </SheetContent>
      </Sheet>

      <ApplicationDetailSheet
        application={selectedApp}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        onEditClick={(app) => setEditingApp(app as TData)}
        onDeleteClick={handleDelete}
      />

      {editingApp && (
        <EditApplicationSheet
          row={{ original: editingApp as unknown as FormValues }}
          onSubmit={async (values) => {
            try {
              await updateApplication(values);
              toast({ description: 'Application updated successfully!' });
              setEditingApp(null);
            } catch {
              toast({ description: 'Failed to update application', variant: 'destructive' });
            }
          }}
        />
      )}
    </div>
  );
}

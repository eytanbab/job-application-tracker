"use client";

import { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { StatusFilterPills } from "./components/status-filter-pills";
import { AnalyticsFilterChip } from "./components/analytics-filter-chip";
import { ApplicationsKanban } from "./components/applications-kanban";
import { OptimisticChangeContext } from "./hooks/optimistic-changes";
import type { ApplicationFormHandle } from "@/app/_components/application-form";
import { useRef } from "react";
import { useLazyModule } from "./hooks/use-lazy-module";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { type FormValues } from "./columns";
import {
  createApplication,
  updateApplication,
} from "@/app/actions/applications";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { DataTableToolbar } from "./components/data-table-toolbar";
import { DataTableGrid } from "./components/data-table-grid";
import { DataTableBulkActions } from "./components/data-table-bulk-actions";
import { ApplicationsEmptyState } from "./components/applications-empty-state";
import { useDataTable, ApplicationRow } from "./hooks/use-data-table";
import type { KanbanColumns } from "@/app/actions/applications";
import type { StatusCounts } from "@/lib/applications/list-query";

// The sheets and the add form are only needed once a row or the add button
// is used, so they load in their own chunks, fetched when the browser is idle
// (and on demand if the user is quicker).
const loadDetailSheet = () => import("./components/application-detail-sheet");
const loadEditSheet = () => import("@/app/_components/edit-application-sheet");
const loadApplicationForm = () => import("@/app/_components/application-form");

interface DataTableProps<TData extends ApplicationRow, TValue> {
  columns: ColumnDef<TData, TValue>[];
  /** The current table page; empty in the Kanban view. */
  data: TData[];
  /** Rows matching the current filters across all pages. */
  totalRows: number;
  /** The page the server returned; it clamps a page past the end. */
  currentPage: number;
  /** The first cards of each column; null in the table view. */
  kanbanColumns: KanbanColumns | null;
  statusCounts: StatusCounts;
  platforms: string[];
  /** The ?appId= row, loaded separately in case it isn't on this page. */
  linkedApp: TData | null;
  /** Whether AI autofill needs a signed-in user (false in the local demo). */
  aiRequiresSignIn: boolean;
}

export function DataTable<TData extends ApplicationRow, TValue>({
  columns,
  data,
  totalRows,
  currentPage,
  kanbanColumns,
  statusCounts,
  platforms,
  linkedApp,
  aiRequiresSignIn,
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
    searchResetKey,
    statusFilter,
    setStatusFilter,
    platformFilter,
    setPlatformFilter,
    analyticsFilter,
    hasAnalyticsFilter,
    clearAnalyticsFilter,
    table,
    uniquePlatforms,
    selectedCount,
    isBulkPending,
    handleBulkDelete,
    handleBulkStatusChange,
    hasActiveFilters,
    clearFilters,
    defaultCreateValues,
    handleSelectRow,
    openApplicationById,
    handleCloseDetail,
    handleDelete,
    optimisticChanges,
    addOptimisticChange,
    setRowSelection,
    hasPreviousApp,
    hasNextApp,
    goToPreviousApp,
    goToNextApp,
    currentIndex,
    totalApps,
    isPending,
    density,
    setDensity,
  } = useDataTable({
    columns,
    data,
    totalRows,
    currentPage,
    platforms,
    linkedApp,
  });

  const createFormRef = useRef<ApplicationFormHandle>(null);

  const ApplicationDetailSheet = useLazyModule(loadDetailSheet, {
    needed: isDetailOpen,
    preloadWhenIdle: true,
    onFailed: handleCloseDetail,
  })?.ApplicationDetailSheet;
  const EditApplicationSheet = useLazyModule(loadEditSheet, {
    needed: !!editingApp,
    preloadWhenIdle: true,
    onFailed: () => setEditingApp(null),
  })?.EditApplicationSheet;
  const ApplicationForm = useLazyModule(loadApplicationForm, {
    needed: isCreateOpen,
    preloadWhenIdle: true,
    onFailed: () => setIsCreateOpen(false),
  })?.ApplicationForm;

  // A brand-new account gets onboarding instead of an empty table and
  // seven zero-count filters
  const isFirstRun = statusCounts.all === 0 && !hasActiveFilters;

  return (
    <OptimisticChangeContext.Provider value={addOptimisticChange}>
      <div className="w-full space-y-4">
        {/* The visible title is in the top bar, which is hidden on phones */}
        <h1 className="sr-only">Job applications</h1>
        {isFirstRun ? (
          <ApplicationsEmptyState onOpenCreate={() => setIsCreateOpen(true)} />
        ) : (
          <>
            <DataTableToolbar
              topRow={
                viewMode !== "kanban" && (
                  <StatusFilterPills
                    counts={statusCounts}
                    statusFilter={statusFilter}
                    onStatusFilterChange={setStatusFilter}
                  />
                )
              }
              globalFilter={globalFilter}
              setGlobalFilter={setGlobalFilter}
              searchResetKey={searchResetKey}
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

            {hasAnalyticsFilter && (
              <AnalyticsFilterChip {...analyticsFilter} onClear={clearAnalyticsFilter} />
            )}

            {viewMode === "kanban" ? (
              <ApplicationsKanban
                columns={kanbanColumns ?? {}}
                searchFilter={globalFilter}
                statusFilter={statusFilter}
                platformFilter={platformFilter}
                stageFilter={analyticsFilter.stage}
                fromFilter={analyticsFilter.from}
                toFilter={analyticsFilter.to}
                isPending={isPending}
                onSelectApplication={(app) => handleSelectRow(app as TData)}
                onEditApplication={(app) => setEditingApp(app as TData)}
                onDeleteApplication={handleDelete}
                optimisticChanges={optimisticChanges}
              />
            ) : (
              <DataTableGrid
                table={table}
                columnsCount={columns.length}
                hasActiveFilters={hasActiveFilters}
                clearFilters={clearFilters}
                onSelectRow={handleSelectRow}
                isPending={isPending}
                density={density}
                onDensityChange={setDensity}
              />
            )}
          </>
        )}

        <DataTableBulkActions
          selectedCount={selectedCount}
          isPending={isBulkPending}
          onDeselectAll={() => setRowSelection({})}
          onBulkStatusChange={handleBulkStatusChange}
          onBulkDelete={handleBulkDelete}
        />

        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className={cn(
            "fixed right-5 z-40 lg:hidden h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer ring-4 ring-background/50 bottom-[calc(1.5rem+env(safe-area-inset-bottom))]",
            selectedCount > 0 && "hidden",
          )}
          aria-label="Add Application"
          title="Add Application"
        >
          <Plus className="h-6 w-6" />
        </button>

        <Dialog
          open={isCreateOpen && !!ApplicationForm}
          onOpenChange={(open) => {
            // Esc, outside click and the close button go through the form's
            // unsaved-changes guard instead of closing immediately.
            if (!open && createFormRef.current) {
              createFormRef.current.requestClose();
            } else {
              setIsCreateOpen(open);
            }
          }}
        >
          <DialogContent className="w-full max-w-[calc(100vw-1.5rem)] sm:max-w-md md:max-w-lg p-0 overflow-hidden flex flex-col max-h-[85dvh] sm:max-h-[90vh] rounded-2xl border border-border/40 bg-card shadow-2xl">
            <DialogHeader className="text-left px-4 sm:px-6 pt-5 pb-3 border-b border-border/30 shrink-0">
              <DialogTitle className="text-xl font-bold">
                New Job Application
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Paste a job link to autofill, or enter details manually.
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {ApplicationForm && (
                <ApplicationForm
                  ref={createFormRef}
                  defaultValues={defaultCreateValues}
                  aiRequiresSignIn={aiRequiresSignIn}
                  onClose={() => setIsCreateOpen(false)}
                  onSubmit={async (values) => {
                    try {
                      const [{ insertedId }] = await createApplication(values);
                      toast({
                        description: `Added ${values.role_name} at ${values.company_name}.`,
                        action: insertedId ? (
                          <ToastAction
                            altText="Open the new application"
                            onClick={() => openApplicationById(insertedId)}
                          >
                            View
                          </ToastAction>
                        ) : undefined,
                      });
                      setIsCreateOpen(false);
                    } catch (err) {
                      toast({
                        description: "Failed to create application",
                        variant: "destructive",
                      });
                      throw err;
                    }
                  }}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>

        {ApplicationDetailSheet && (
          <ApplicationDetailSheet
            application={selectedApp}
            open={isDetailOpen}
            onOpenChange={(open) => {
              if (!open) {
                handleCloseDetail();
              } else {
                setIsDetailOpen(true);
              }
            }}
            onEditClick={(app) => setEditingApp(app as TData)}
            onDeleteClick={handleDelete}
            hasPrevious={hasPreviousApp}
            hasNext={hasNextApp}
            onPrevious={goToPreviousApp}
            onNext={goToNextApp}
            currentIndex={currentIndex}
            totalApps={totalApps}
          />
        )}

        {editingApp && EditApplicationSheet && (
          <EditApplicationSheet
            open={!!editingApp}
            onOpenChange={(open) => {
              if (!open) setEditingApp(null);
            }}
            showTrigger={false}
            row={{ original: editingApp as unknown as FormValues }}
            onSubmit={async (values) => {
              try {
                await updateApplication(values);
                toast({ description: "Application updated successfully!" });
                setEditingApp(null);
              } catch (err) {
                toast({
                  description: "Failed to update application",
                  variant: "destructive",
                });
                throw err;
              }
            }}
          />
        )}
      </div>
    </OptimisticChangeContext.Provider>
  );
}

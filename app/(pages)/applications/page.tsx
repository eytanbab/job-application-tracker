import { DataTable } from "./data-table";
import { columns } from "./columns";
import {
  getApplicationListItem,
  getApplicationsPage,
  getApplicationStatusCounts,
  getKanbanColumns,
  getUserPlatforms,
} from "@/app/actions/applications";
import { isAiDemoMode } from "@/app/actions/_utils/require-signed-in-user";
import { loadApplicationsSearchParams } from "@/lib/applications/list-query";

export async function generateMetadata() {
  return {
    title: "JobTracker | Applications",
  };
}

// Load failures propagate to ./error.tsx, which reports them and offers a retry
export default async function Dashboard({
  searchParams,
}: PageProps<"/applications">) {
  const aiRequiresSignIn = !isAiDemoMode();
  const params = await loadApplicationsSearchParams(searchParams);
  const isKanban = params.view === "kanban";

  // Only the active view's rows are loaded: one table page, or the first
  // cards of each Kanban column.
  const [page, kanban, statusCounts, platforms, linkedApp] = await Promise.all([
    isKanban ? null : getApplicationsPage(params),
    isKanban ? getKanbanColumns(params) : null,
    getApplicationStatusCounts(),
    getUserPlatforms(),
    params.appId ? getApplicationListItem(params.appId) : null,
  ]);

  return (
    <DataTable
      columns={columns}
      data={page?.rows ?? []}
      totalRows={page?.total ?? 0}
      kanbanColumns={kanban}
      statusCounts={statusCounts}
      platforms={platforms}
      linkedApp={linkedApp}
      aiRequiresSignIn={aiRequiresSignIn}
    />
  );
}

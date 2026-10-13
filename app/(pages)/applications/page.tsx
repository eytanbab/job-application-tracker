import { DataTable } from "./data-table";
import { columns } from "./columns";
import { getApplications } from "@/app/actions/applications";
import { isAiDemoMode } from "@/app/actions/_utils/require-signed-in-user";

export async function generateMetadata() {
  return {
    title: "JobTracker | Applications",
  };
}

export default async function Dashboard() {
  const aiRequiresSignIn = !isAiDemoMode();
  try {
    const data = await getApplications();
    return (
      <DataTable
        columns={columns}
        data={data as any}
        aiRequiresSignIn={aiRequiresSignIn}
      />
    );
  } catch (err) {
    console.error("Error fetching applications from database:", err);
    return (
      <DataTable
        columns={columns}
        data={[] as any}
        aiRequiresSignIn={aiRequiresSignIn}
        error="Unable to connect to the database. Your existing job applications could not be loaded."
      />
    );
  }
}

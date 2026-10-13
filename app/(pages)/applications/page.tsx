import { DataTable } from "./data-table";
import { columns } from "./columns";
import { getApplications } from "@/app/actions/applications";
import { isAiDemoMode } from "@/app/actions/_utils/require-signed-in-user";

export async function generateMetadata() {
  return {
    title: "JobTracker | Applications",
  };
}

// Load failures propagate to ./error.tsx, which reports them and offers a retry
export default async function Dashboard() {
  const aiRequiresSignIn = !isAiDemoMode();
  const data = await getApplications();
  return (
    <DataTable
      columns={columns}
      data={data}
      aiRequiresSignIn={aiRequiresSignIn}
    />
  );
}

import { DataTable } from "./data-table";
import { columns } from "./columns";
import { getApplications } from "@/app/actions/applications";

export async function generateMetadata() {
  return {
    title: "JobTracker | Applications",
  };
}

export default async function Dashboard() {
  try {
    const data = await getApplications();
    return <DataTable columns={columns} data={data as any} />;
  } catch (err) {
    console.error("Error fetching applications from database:", err);
    return (
      <DataTable
        columns={columns}
        data={[] as any}
        error="Unable to connect to the database. Your existing job applications could not be loaded."
      />
    );
  }
}

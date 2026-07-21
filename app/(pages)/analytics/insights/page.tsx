import { getDetailedApplicationBreakdown, getYears } from "@/app/actions/analytics";
import { AnalyticsFilter } from "../components/analytics-filter";
import { InsightsDashboard } from "./components/insights-dashboard";

export async function generateMetadata() {
  return {
    title: "JAT | Journey Insights",
  };
}

export default async function InsightsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const month =
    typeof searchParams.month === "string" ? searchParams.month : undefined;
  const year =
    typeof searchParams.year === "string" ? searchParams.year : undefined;

  const [breakdownData, years] = await Promise.all([
    getDetailedApplicationBreakdown(month, year),
    getYears(),
  ]);

  return (
    <div className="flex flex-col gap-4 w-full">
      <div>
        <AnalyticsFilter years={years} />
      </div>
      <InsightsDashboard data={breakdownData} />
    </div>
  );
}

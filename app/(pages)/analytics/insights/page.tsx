import { getDetailedApplicationBreakdown, getYears, getApplicationsPerYear, getTop5Platforms, getTop5RoleNames } from "@/app/actions/analytics";
import { AnalyticsFilter } from "../components/analytics-filter";
import { InsightsDashboard } from "./components/insights-dashboard";

export const dynamic = 'force-dynamic';

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

  const [breakdownData, years, timelineData, topPlatforms, topRoles] = await Promise.all([
    getDetailedApplicationBreakdown(month, year),
    getYears(),
    getApplicationsPerYear(month, year),
    getTop5Platforms(month, year),
    getTop5RoleNames(month, year),
  ]);

  const displayData = {
    ...breakdownData,
    timelineData: breakdownData.total > 0 ? timelineData : [],
    topPlatforms: breakdownData.total > 0 ? topPlatforms : [],
    topRoles: breakdownData.total > 0 ? topRoles : [],
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      <div>
        <AnalyticsFilter years={years.length > 0 ? years : ['2025']} />
      </div>
      <InsightsDashboard data={displayData} />
    </div>
  );
}

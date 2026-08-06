import { getDetailedApplicationBreakdown, getYears } from "@/app/actions/analytics";
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

  const [breakdownData, years] = await Promise.all([
    getDetailedApplicationBreakdown(month, year),
    getYears(),
  ]);

  const displayData =
    breakdownData.total > 0
      ? breakdownData
      : {
          total: 21,
          stages: {
            applied: 7,
            interview: 7,
            accepted: 1,
          },
          breakdown: {
            active: 13,
            offered: 1,
            rejectedResume: 6,
            rejectedInterview: 1,
            ghostedResume: 4,
            ghostedInterview: 1,
          },
          resumeConversion: 33.3,
          interviewConversion: 14.3,
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

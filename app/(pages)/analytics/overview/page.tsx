import { Suspense } from "react";
import dynamicImport from "next/dynamic";
import {
  getApplicationsPerYear,
  getYears,
  getDetailedApplicationBreakdown,
  getStatusPerPlatform,
} from "@/app/actions/analytics";
import {
  getWorkModeAnalysis,
  getSalaryInsights,
} from "../insights/actions";

import { AnalyticsFilter } from "../components/analytics-filter";
import { KpiSummaryStrip } from "../components/kpi-summary-strip";
import { PipelineHealthHero } from "../components/pipeline-health-hero";
import { ChannelPerformanceMatrix } from "../components/channel-performance-matrix";
import { MarketRealityMatrix } from "../components/market-reality-matrix";
import AnalyticsOverviewLoading from "./loading";

const YearlyTrendsCard = dynamicImport(
  () =>
    import("../components/yearly-trends-card").then(
      (m) => m.YearlyTrendsCard,
    ),
  {
    loading: () => (
      <div className="min-h-[320px] bg-card/40 rounded-xl border border-border/30 animate-pulse" />
    ),
  },
);

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "JobTracker | Analytics",
  };
}

async function AnalyticsDashboardContent({
  month,
  year,
  availableYears,
}: {
  month?: string;
  year?: string;
  availableYears: string[];
}) {
  const isAllMonths = !month || month === "all";

  // Fetch only the analytics datasets needed
  const [
    breakdownData,
    statusPerPlatform,
    workModes,
    salaryInsights,
    applicationsPerYear,
  ] = await Promise.all([
    getDetailedApplicationBreakdown(month, year),
    getStatusPerPlatform(month, year),
    getWorkModeAnalysis(month, year),
    getSalaryInsights(month, year),
    isAllMonths ? getApplicationsPerYear(undefined, year) : Promise.resolve([]),
  ]);

  const totalApplications = breakdownData.total;

  const interviewRate = totalApplications
    ? breakdownData.stages.interview / totalApplications
    : 0;

  const interviewConversionRate = breakdownData.stages.interview
    ? breakdownData.stages.accepted / breakdownData.stages.interview
    : 0;

  const ghostedCount =
    breakdownData.breakdown.ghostedResume +
    breakdownData.breakdown.ghostedInterview;

  const rejectedCount =
    breakdownData.breakdown.rejectedResume +
    breakdownData.breakdown.rejectedInterview;

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      {/* 1. Key Metrics Summary Strip */}
      <section aria-label="Key Performance Indicators">
        <KpiSummaryStrip
          total={totalApplications}
          activeCount={breakdownData.breakdown.active}
          activeStages={breakdownData.breakdown.activeStages}
          interviewCount={breakdownData.stages.interview}
          offerCount={breakdownData.stages.accepted}
          interviewRate={interviewRate}
          interviewConversionRate={interviewConversionRate}
          averageResponseDays={breakdownData.averageResponseDays}
        />
      </section>

      {/* 2. Application Funnel & Outcomes */}
      <section aria-label="Application Funnel and Outcomes">
        <PipelineHealthHero
          total={totalApplications}
          activeCount={breakdownData.breakdown.active}
          activeStages={breakdownData.breakdown.activeStages}
          interviewCount={breakdownData.stages.interview}
          offerCount={breakdownData.stages.accepted}
          ghostedCount={ghostedCount}
          rejectedCount={rejectedCount}
          rejectedResumeCount={breakdownData.breakdown.rejectedResume}
          rejectedInterviewCount={breakdownData.breakdown.rejectedInterview}
          interviewRate={interviewRate}
          interviewConversionRate={interviewConversionRate}
          averageResponseDays={breakdownData.averageResponseDays}
        />
      </section>

      {/* 3. Platform Breakdown */}
      <section aria-label="Platforms and Application Sources">
        <ChannelPerformanceMatrix platforms={statusPerPlatform} />
      </section>

      {/* 4. Work Model & Compensation */}
      <section aria-label="Work Model and Salary Benchmarks">
        <MarketRealityMatrix modes={workModes} salary={salaryInsights} />
      </section>

      {/* 5. Activity Over Time (Displayed when viewing all months) */}
      {isAllMonths && (
        <section aria-label="Application Activity Over Time">
          <YearlyTrendsCard
            years={availableYears}
            applicationsPerYear={applicationsPerYear}
            globalYear={year}
          />
        </section>
      )}
    </div>
  );
}

export default async function Overview(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const month =
    typeof searchParams.month === "string" ? searchParams.month : undefined;
  const year =
    typeof searchParams.year === "string" ? searchParams.year : undefined;

  const currentYear = new Date().getFullYear().toString();
  const years = await getYears();
  const availableYears = years.length > 0 ? years : [currentYear];

  return (
    <div className="flex flex-col gap-5 w-full max-w-7xl mx-auto opacity-100 transition-opacity duration-500 pb-12 min-w-0">
      {/* 1. Timeframe Filter Toolbar */}
      <Suspense
        fallback={
          <div className="h-14 w-full bg-card/40 rounded-xl border border-border/30 animate-pulse" />
        }
      >
        <AnalyticsFilter years={availableYears} />
      </Suspense>

      {/* 2. Reactive Suspense Data Content with Key */}
      <Suspense
        key={`${month || "all"}-${year || "all"}`}
        fallback={<AnalyticsOverviewLoading hideFilter />}
      >
        <AnalyticsDashboardContent
          month={month}
          year={year}
          availableYears={availableYears}
        />
      </Suspense>
    </div>
  );
}

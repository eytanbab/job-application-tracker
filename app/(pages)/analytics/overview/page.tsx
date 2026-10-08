import { Suspense } from "react";
import {
  getApplicationsPerYear,
  getStasusesPerYear,
  getTop5Statuses,
  getYears,
  getDetailedApplicationBreakdown,
  getGhostedApplications,
  getStatusPerPlatform,
  getDomainLeaderboard,
} from "@/app/actions/analytics";
import {
  getWorkModeAnalysis,
  getSalaryInsights,
} from "../insights/actions";

import { AnalyticsFilter } from "../components/analytics-filter";
import { ActionCenterTray } from "../components/action-center-tray";
import { KpiSummaryStrip } from "../components/kpi-summary-strip";
import { PipelineHealthHero } from "../components/pipeline-health-hero";
import { ChannelMarketTabs } from "../components/channel-market-tabs";
import AnalyticsOverviewLoading from "./loading";

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
  const [
    breakdownData,
    ghostedData,
    statusPerPlatform,
    domainLeaderboard,
    workModes,
    salaryInsights,
    top5Statuses,
    applicationsPerYear,
    statusesPerYear,
  ] = await Promise.all([
    getDetailedApplicationBreakdown(month, year),
    getGhostedApplications(month, year),
    getStatusPerPlatform(month, year),
    getDomainLeaderboard(month, year),
    getWorkModeAnalysis(month, year),
    getSalaryInsights(month, year),
    getTop5Statuses(month, year),
    getApplicationsPerYear(undefined, year),
    getStasusesPerYear(undefined, year),
  ]);

  const totalApplications = breakdownData.total;

  const interviewRate = totalApplications
    ? breakdownData.stages.interview / totalApplications
    : 0;

  const interviewConversionRate = breakdownData.stages.interview
    ? breakdownData.stages.accepted / breakdownData.stages.interview
    : 0;

  return (
    <>
      {/* 1. Contextual Follow-Up Reminders */}
      <section aria-label="Follow-Up Reminders">
        <ActionCenterTray
          count={ghostedData.count}
          oldestDays={ghostedData.oldestDays}
          followUpCount={ghostedData.followUpCount}
          followUpQueue={ghostedData.followUpQueue}
        />
      </section>

      {/* 2. Key Metrics Summary Strip */}
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

      {/* 3. Application Funnel & Outcomes */}
      <section aria-label="Application Funnel and Outcomes">
        <PipelineHealthHero
          total={totalApplications}
          activeCount={breakdownData.breakdown.active}
          activeStages={breakdownData.breakdown.activeStages}
          interviewCount={breakdownData.stages.interview}
          offerCount={breakdownData.stages.accepted}
          ghostedCount={
            breakdownData.breakdown.ghostedResume +
            breakdownData.breakdown.ghostedInterview
          }
          rejectedCount={
            breakdownData.breakdown.rejectedResume +
            breakdownData.breakdown.rejectedInterview
          }
          rejectedResumeCount={breakdownData.breakdown.rejectedResume}
          rejectedInterviewCount={breakdownData.breakdown.rejectedInterview}
          interviewRate={interviewRate}
          interviewConversionRate={interviewConversionRate}
          averageResponseDays={breakdownData.averageResponseDays}
        />
      </section>

      {/* 4. Detailed Breakdowns (Platforms, Trends & Status, Work & Salary) */}
      <section aria-label="Detailed Analytics Breakdowns">
        <ChannelMarketTabs
          platforms={statusPerPlatform}
          domains={domainLeaderboard}
          modes={workModes}
          salary={salaryInsights}
          top5Statuses={top5Statuses}
          totalApplications={totalApplications}
          availableYears={availableYears}
          statusesPerYear={statusesPerYear}
          applicationsPerYear={applicationsPerYear}
          globalYear={year}
        />
      </section>
    </>
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

      {/* 2-4. Reactive Suspense Data Content with Key */}
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

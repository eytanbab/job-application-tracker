import { Suspense } from "react";
import dynamicImport from "next/dynamic";
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
import { ExecutivePulseStrip } from "../components/executive-pulse-strip";
import { ActionCenterTray } from "../components/action-center-tray";
import { PipelineFlowRibbon } from "../components/pipeline-flow-ribbon";
import { ChannelMarketTabs } from "../components/channel-market-tabs";

const PieChartComponent = dynamicImport(
  () => import("../components/pie-chart").then((m) => m.PieChartComponent),
  {
    loading: () => (
      <div className="min-h-[320px] bg-card/40 rounded-xl border border-border/30 animate-pulse" />
    ),
  },
);

const YearlyTrendsCard = dynamicImport(
  () =>
    import("../components/yearly-trends-card").then((m) => m.YearlyTrendsCard),
  {
    loading: () => (
      <div className="min-h-[320px] bg-card/40 rounded-xl border border-border/30 animate-pulse" />
    ),
  },
);

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "JAT | Analytics & Intelligence",
  };
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

  const [
    years,
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
    getYears(),
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

  const interviewRate = breakdownData.total
    ? breakdownData.stages.interview / breakdownData.total
    : 0;

  const interviewConversionRate = breakdownData.stages.interview
    ? breakdownData.stages.accepted / breakdownData.stages.interview
    : 0;

  const availableYears = years.length > 0 ? years : [currentYear];

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto opacity-100 transition-opacity duration-500 pb-12">
      {/* 1. Timeframe Filter Toolbar */}
      <Suspense
        fallback={
          <div className="h-14 w-full bg-card/40 rounded-xl border border-border/30 animate-pulse" />
        }
      >
        <AnalyticsFilter years={availableYears} />
      </Suspense>

      {/* 2. Executive Pulse Strip */}
      <section aria-label="Executive Pipeline Summary">
        <ExecutivePulseStrip
          totalApplications={totalApplications}
          activeCount={breakdownData.breakdown.active}
          activeStages={breakdownData.breakdown.activeStages}
          interviewRate={interviewRate}
          interviewConversionRate={interviewConversionRate}
          averageResponseDays={breakdownData.averageResponseDays}
        />
      </section>

      {/* 3. Tactical Action Center */}
      <section aria-label="Follow-Up Queue">
        <ActionCenterTray
          count={ghostedData.count}
          oldestDays={ghostedData.oldestDays}
          followUpCount={ghostedData.followUpCount}
          followUpQueue={ghostedData.followUpQueue}
        />
      </section>

      {/* 4. Stepped Pipeline Conversion Ribbon */}
      <section aria-label="Pipeline Progression and Outcomes">
        <PipelineFlowRibbon
          total={totalApplications}
          activeCount={breakdownData.breakdown.active}
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
        />
      </section>

      {/* 5. Channel & Market Intelligence */}
      <section aria-label="Channel and Market Intelligence">
        <ChannelMarketTabs
          platforms={statusPerPlatform}
          domains={domainLeaderboard}
          modes={workModes}
          salary={salaryInsights}
        />
      </section>

      {/* 6. Historical Volume Trends & Status Breakdown */}
      <section aria-label="Historical Volume Trends" className="space-y-3 pt-1">
        <div className="border-b border-border/20 pb-2">
          <h2 className="text-sm font-bold tracking-tight text-foreground">
            Volume Trends & Status Distribution
          </h2>
          <p className="text-xs text-muted-foreground">
            Historical trajectory across active and completed pipeline stages over time.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PieChartComponent
            title="Status Distribution"
            data={top5Statuses}
            total={totalApplications}
          />
          <YearlyTrendsCard
            years={availableYears}
            statusesPerYear={statusesPerYear}
            applicationsPerYear={applicationsPerYear}
            globalYear={year}
          />
        </div>
      </section>
    </div>
  );
}

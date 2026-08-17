import { Suspense } from "react";
import {
  getApplicationsPerYear,
  getStasusesPerYear,
  getTop5Statuses,
  getYears,
  getDetailedApplicationBreakdown,
  getBestPlatformInsight,
  getGhostedApplications,
  getFunnelBottleneckInsight,
} from "@/app/actions/analytics";

import dynamicImport from "next/dynamic";

const PieChartComponent = dynamicImport(
  () => import("../components/pie-chart").then((m) => m.PieChartComponent),
  {
    loading: () => (
      <div className="min-h-[360px] bg-card rounded-xl border border-border/30 animate-pulse" />
    ),
  },
);
const YearlyTrendsCard = dynamicImport(
  () =>
    import("../components/yearly-trends-card").then((m) => m.YearlyTrendsCard),
  {
    loading: () => (
      <div className="min-h-[360px] bg-card rounded-xl border border-border/30 animate-pulse" />
    ),
  },
);

import { KpiSummary } from "../components/kpi-summary";
import { AnalyticsFilter } from "../components/analytics-filter";
import { BestPlatformsCard } from "../components/best-platforms-card";
import { GhostingRiskCard } from "../components/ghosting-risk-card";
import { FunnelBottleneckCard } from "../components/funnel-bottleneck-card";
import { BarChart3, Lightbulb, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "JAT | Overview",
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
    top5Statuses,
    applicationsPerYear,
    years,
    statusesPerYear,
    breakdownData,
    bestPlatformInsight,
    ghostedApplications,
    funnelBottleneck,
  ] = await Promise.all([
    getTop5Statuses(month, year),
    getApplicationsPerYear(month, year),
    getYears(),
    getStasusesPerYear(month, year),
    getDetailedApplicationBreakdown(month, year),
    getBestPlatformInsight(month, year),
    getGhostedApplications(month, year),
    getFunnelBottleneckInsight(month, year),
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
    <div className="flex flex-col gap-6 w-full opacity-100 transition-opacity duration-500">
      <h1 className="sr-only">Analytics Overview</h1>

      {/* 1. Header Filter Toolbar */}
      <Suspense
        fallback={
          <div className="h-14 w-full bg-card rounded-xl animate-pulse" />
        }
      >
        <AnalyticsFilter years={availableYears} />
      </Suspense>

      {/* 2. Key Performance Rates */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
            Key Performance Rates
          </h2>
        </div>
        <KpiSummary
          totalApplications={totalApplications}
          activeCount={breakdownData.breakdown.active}
          activeStages={breakdownData.breakdown.activeStages}
          interviewRate={interviewRate}
          interviewConversionRate={interviewConversionRate}
          averageResponseDays={breakdownData.averageResponseDays}
        />
      </section>

      {/* 3. Strategy Coaching */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
            Strategy Coaching
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <BestPlatformsCard {...bestPlatformInsight} />
          <GhostingRiskCard {...ghostedApplications} />
          <div className="sm:col-span-2 lg:col-span-1">
            <FunnelBottleneckCard {...funnelBottleneck} />
          </div>
        </div>
      </section>

      {/* 4. Charts */}
      <section className="space-y-3 pt-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
            Trends & Status
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PieChartComponent
            title="Status Breakdown"
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

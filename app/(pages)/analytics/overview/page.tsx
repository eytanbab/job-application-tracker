import { Suspense } from "react";
import dynamicImport from "next/dynamic";
import { getAnalyticsOverview } from "@/lib/analytics/load";
import type { AnalyticsOverview } from "@/lib/analytics/summarize";
import { statusOptions } from "@/lib/utils";

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

/** Reshapes monthly activity into the series the yearly chart expects. */
function activitySeries(activity: AnalyticsOverview["activity"]) {
  const monthName = (month: string) =>
    new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1).toLocaleString(
      "en-US",
      { month: "long" },
    );
  const years = [...new Set(activity.map((b) => b.month.slice(0, 4)))].sort().reverse();
  const applicationsPerYear = years.flatMap((year) =>
    Array.from({ length: 12 }, (_, i) => {
      const key = `${year}-${String(i + 1).padStart(2, "0")}`;
      return {
        year,
        month: monthName(key),
        numOfApplications: activity.find((b) => b.month === key)?.total ?? 0,
      };
    }),
  );
  const statusesPerYear = activity.flatMap((bucket) =>
    statusOptions
      .filter(({ value }) => bucket.byKind[value] > 0)
      .map(({ value, label }) => ({
        year: bucket.month.slice(0, 4),
        month: String(Number(bucket.month.slice(5, 7))),
        status: label,
        statusCount: bucket.byKind[value],
      })),
  );
  return { years, applicationsPerYear, statusesPerYear };
}

async function AnalyticsDashboardContent({
  month,
  year,
}: {
  month?: string;
  year?: string;
}) {
  const isAllMonths = !month || month === "all";
  // Until the period picker lands, the month/year filter maps to a range and
  // an unfiltered page shows all time, as before.
  const overview = await getAnalyticsOverview({ month, year }, "all");
  const { totals } = overview;
  const series = activitySeries(overview.activity);

  return (
    <div className="flex flex-col gap-6 w-full min-w-0">
      {/* 1. Key Metrics Summary Strip */}
      <section aria-label="Key Performance Indicators">
        <KpiSummaryStrip
          total={totals.applications}
          activeCount={totals.active}
          activeStages={totals.activeByKind}
          interviewCount={totals.interviewed}
          offerCount={totals.offers}
          interviewRate={overview.kpis.interviewRate.rate.pct}
          interviewConversionRate={overview.kpis.offerRate.rate.pct}
          averageResponseDays={overview.kpis.daysToFirstUpdate.median}
        />
      </section>

      {/* 2. Application Funnel & Outcomes */}
      <section aria-label="Application Funnel and Outcomes">
        <PipelineHealthHero
          total={totals.applications}
          activeCount={totals.active}
          activeStages={totals.activeByKind}
          interviewCount={totals.interviewed}
          offerCount={totals.offers}
          ghostedCount={totals.ghosted.total}
          rejectedCount={totals.rejected.total}
          rejectedResumeCount={totals.rejected.beforeInterview}
          rejectedInterviewCount={totals.rejected.afterInterview}
          interviewRate={overview.kpis.interviewRate.rate.pct}
          interviewConversionRate={overview.kpis.offerRate.rate.pct}
          averageResponseDays={overview.kpis.daysToFirstUpdate.median}
        />
      </section>

      {/* 3. Platform Breakdown */}
      <section aria-label="Platforms and Application Sources">
        <ChannelPerformanceMatrix
          platforms={overview.platforms}
          topPlatformKey={overview.topPlatformKey}
        />
      </section>

      {/* 4. Work Model & Compensation */}
      <section aria-label="Work Model and Salary Benchmarks">
        <MarketRealityMatrix modes={overview.workModes} salary={overview.salary} />
      </section>

      {/* 5. Activity Over Time (Displayed when viewing all months) */}
      {isAllMonths && (
        <section aria-label="Application Activity Over Time">
          <YearlyTrendsCard
            years={series.years}
            applicationsPerYear={series.applicationsPerYear}
            statusesPerYear={series.statusesPerYear}
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

  return (
    <div className="flex flex-col gap-5 w-full max-w-7xl mx-auto opacity-100 transition-opacity duration-500 pb-12 min-w-0">
      {/* 1. Timeframe Filter Toolbar */}
      <Suspense
        fallback={
          <div className="h-14 w-full bg-card/40 rounded-xl border border-border/30 animate-pulse" />
        }
      >
        <FilterBar />
      </Suspense>

      {/* 2. Reactive Suspense Data Content with Key */}
      <Suspense
        key={`${month || "all"}-${year || "all"}`}
        fallback={<AnalyticsOverviewLoading hideFilter />}
      >
        <AnalyticsDashboardContent month={month} year={year} />
      </Suspense>
    </div>
  );
}

/** Streams in with the year list so the page shell is not held back by it. */
async function FilterBar() {
  const overview = await getAnalyticsOverview({ range: "all" });
  const years = overview.years.length
    ? overview.years
    : [new Date().getFullYear().toString()];
  return <AnalyticsFilter years={years} />;
}

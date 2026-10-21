import { Suspense } from "react";
import dynamicImport from "next/dynamic";
import { redirect } from "next/navigation";
import { getAnalyticsOverview } from "@/lib/analytics/load";
import type { RangeParams } from "@/lib/analytics/range";
import {
  legacyRangeRedirect,
  loadAnalyticsSearchParams,
} from "@/lib/analytics/search-params";
import type { AnalyticsOverview } from "@/lib/analytics/summarize";
import { statusOptions } from "@/lib/utils";

import { FilteredEmptyState } from "../components/filtered-empty-state";
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

async function AnalyticsDashboardContent({ params }: { params: RangeParams }) {
  const overview = await getAnalyticsOverview(params);
  const { totals } = overview;
  const series = activitySeries(overview.activity);

  // The account has data, just not in this period: one card, not five empty ones.
  if (totals.applications === 0 && overview.years.length > 0) {
    return <FilteredEmptyState range={overview.range} />;
  }

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

      {/* 5. Activity Over Time */}
      {series.years.length > 0 && (
        <section aria-label="Application Activity Over Time">
          <YearlyTrendsCard
            years={series.years}
            applicationsPerYear={series.applicationsPerYear}
            statusesPerYear={series.statusesPerYear}
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
  const legacy = legacyRangeRedirect(searchParams, new Date());
  if (legacy) redirect(legacy);

  const { range, from, to } = loadAnalyticsSearchParams(searchParams);

  return (
    <div className="flex flex-col gap-5 w-full max-w-7xl mx-auto pb-12 min-w-0">
      <Suspense
        key={`${range}-${from ?? ""}-${to ?? ""}`}
        fallback={<AnalyticsOverviewLoading hideFilter />}
      >
        <AnalyticsDashboardContent params={{ range, from, to }} />
      </Suspense>
    </div>
  );
}

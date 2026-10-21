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

import { INTERVIEW_RATE_BENCHMARK } from "@/lib/analytics/benchmarks";
import { formatPct } from "@/lib/analytics/format";
import { AnalyticsSection } from "../components/analytics-section";
import {
  FilteredEmptyState,
  NoApplicationsState,
} from "../components/filtered-empty-state";
import { KpiRow } from "../components/kpi-row";
import { NeedsAction } from "../components/needs-action";
import { PipelineFunnel } from "../components/pipeline-funnel";
import { PlatformsTable } from "../components/platforms-table";
import { ResumeOutcomesCard } from "../components/resume-outcomes-card";
import { SalaryCard } from "../components/salary-card";
import { TimeInStage } from "../components/time-in-stage";
import { WorkModelCard } from "../components/work-model-card";
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

  if (overview.years.length === 0) return <NoApplicationsState />;
  // The account has data, just not in this period: one card, not empty sections.
  if (totals.applications === 0) return <FilteredEmptyState range={overview.range} />;

  const benchmark = `Across job seekers, about ${formatPct(INTERVIEW_RATE_BENCHMARK.low)} to ${formatPct(
    INTERVIEW_RATE_BENCHMARK.high,
  )} of applications reach an interview (${INTERVIEW_RATE_BENCHMARK.asOf}).`;

  return (
    <div className="flex flex-col gap-8 w-full min-w-0">
      <AnalyticsSection
        id="how-am-i-doing"
        title="How am I doing"
        description={`${overview.range.label}${overview.range.previous ? ", compared with the period before" : ""}. Each number opens the matching applications.`}
      >
        <KpiRow overview={overview} />
        <p className="text-xs text-muted-foreground">{benchmark}</p>
      </AnalyticsSection>

      <AnalyticsSection
        id="where-is-it-stuck"
        title="Where is it stuck"
        description="How far applications get, where the rest went, and what to follow up on."
      >
        <PipelineFunnel overview={overview} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <NeedsAction overview={overview} />
          </div>
          <TimeInStage overview={overview} />
        </div>
      </AnalyticsSection>

      <AnalyticsSection
        id="what-works"
        title="What works"
        description="Compare platforms, work models and resume versions by how often they lead to an interview."
      >
        <PlatformsTable
          platforms={overview.platforms}
          topPlatformKey={overview.topPlatformKey}
          range={overview.range.current}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <WorkModelCard overview={overview} />
          <ResumeOutcomesCard overview={overview} />
          <SalaryCard overview={overview} />
        </div>
      </AnalyticsSection>

      {series.years.length > 0 && (
        <AnalyticsSection id="activity" title="Activity" description="Applications per month, by current status.">
          <YearlyTrendsCard
            years={series.years}
            applicationsPerYear={series.applicationsPerYear}
            statusesPerYear={series.statusesPerYear}
          />
        </AnalyticsSection>
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
        fallback={<AnalyticsOverviewLoading />}
      >
        <AnalyticsDashboardContent params={{ range, from, to }} />
      </Suspense>
    </div>
  );
}

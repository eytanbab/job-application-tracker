import {
  getApplicationsPerYear,
  getStasusesPerYear,
  getTop5Statuses,
  getYears,
  getDetailedApplicationBreakdown,
  getBestPlatformInsight,
  getGhostedApplications,
  getDomainLeaderboard,
} from "@/app/actions/analytics";

import { PieChartComponent } from "../components/pie-chart";
import { YearlyTrendsCard } from "../components/yearly-trends-card";
import { KpiSummary } from "../components/kpi-summary";
import { AnalyticsFilter } from "../components/analytics-filter";
import { BestPlatformsCard } from "../components/best-platforms-card";
import { GhostingRiskCard } from "../components/ghosting-risk-card";
import { DomainLeaderboardCard } from "../components/domain-leaderboard-card";
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

  const [
    top5Statuses,
    applicationsPerYear,
    years,
    statusesPerYear,
    breakdownData,
    bestPlatformInsight,
    ghostedApplications,
    domainLeaderboard,
  ] = await Promise.all([
    getTop5Statuses(month, year),
    getApplicationsPerYear(month, year),
    getYears(),
    getStasusesPerYear(month, year),
    getDetailedApplicationBreakdown(month, year),
    getBestPlatformInsight(month, year),
    getGhostedApplications(month, year),
    getDomainLeaderboard(),
  ]);

  const hasData = top5Statuses.length > 0;

  const displayStatuses = hasData
    ? top5Statuses
    : [
        { name: 'Applied', freq: 7 },
        { name: 'Interview', freq: 7 },
        { name: 'In Review', freq: 6 },
        { name: 'Rejected', freq: 1 },
      ];

  const totalApplications = breakdownData.total;
  
  const interviewRate = breakdownData.total 
    ? breakdownData.stages.interview / breakdownData.total 
    : 0;
  
  const totalRejections = breakdownData.breakdown.rejectedResume + breakdownData.breakdown.rejectedInterview;
  const rejectionRate = breakdownData.total 
    ? totalRejections / breakdownData.total 
    : 0;
    
  const responseRate = breakdownData.total 
    ? breakdownData.responseConversion / 100 
    : 0;

  const displayTotal = totalApplications || 21;
  const displayInterviewRate = interviewRate || 0.33;
  const displayRejectionRate = rejectionRate || 0.05;
  const displayResponseRate = responseRate || 0.33;

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      {/* 1. Header Filter Toolbar */}
      <AnalyticsFilter years={years.length > 0 ? years : ['2025']} />

      {/* 2. Key Performance Rates */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Key Performance Rates
          </h2>
        </div>
        <KpiSummary
          totalApplications={displayTotal}
          interviewRate={displayInterviewRate}
          rejectionRate={displayRejectionRate}
          responseRate={displayResponseRate}
        />
      </section>

      {/* 3. Strategy Coaching */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Strategy Coaching
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BestPlatformsCard {...bestPlatformInsight} />
          <GhostingRiskCard {...ghostedApplications} />
          <DomainLeaderboardCard domains={domainLeaderboard} />
        </div>
      </section>

      {/* 4. Charts */}
      <section className="space-y-3 pt-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Trends & Status
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PieChartComponent
            title="Status Breakdown"
            data={displayStatuses}
            total={displayTotal}
          />
          <YearlyTrendsCard
            years={years.length > 0 ? years : ['2025']}
            statusesPerYear={statusesPerYear}
            applicationsPerYear={applicationsPerYear}
            globalYear={year}
          />
        </div>
      </section>
    </div>
  );
}

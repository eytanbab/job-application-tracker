import {
  getApplicationsPerYear,
  getStasusesPerYear,
  getTop5Companies,
  getTop5Locations,
  getTop5Platforms,
  getTop5RoleNames,
  getTop5Statuses,
  getYears,
  getDetailedApplicationBreakdown,
} from "@/app/actions/analytics";

import { PieChartComponent } from "../components/pie-chart";
import { YearlyTrendsCard } from "../components/yearly-trends-card";
import { KpiSummary } from "../components/kpi-summary";
import { AnalyticsFilter } from "../components/analytics-filter";
import { LeaderboardCard } from "../components/leaderboard-card";
import { BarChart3, Building2, Globe, TrendingUp } from "lucide-react";

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
    top5Companies,
    top5Statuses,
    top5Platforms,
    top5Locations,
    top5RoleNames,
    applicationsPerYear,
    years,
    statusesPerYear,
    breakdownData,
  ] = await Promise.all([
    getTop5Companies(month, year),
    getTop5Statuses(month, year),
    getTop5Platforms(month, year),
    getTop5Locations(month, year),
    getTop5RoleNames(month, year),
    getApplicationsPerYear(month, year),
    getYears(),
    getStasusesPerYear(month, year),
    getDetailedApplicationBreakdown(month, year),
  ]);

  const hasData = top5Companies.length > 0;

  const displayCompanies = hasData
    ? top5Companies
    : [
        { name: 'Tech Corp', freq: 5 },
        { name: 'DataTech', freq: 4 },
        { name: 'WebWorks', freq: 4 },
        { name: 'DeployHub', freq: 3 },
        { name: 'AppGenix', freq: 3 },
      ];

  const displayStatuses = hasData
    ? top5Statuses
    : [
        { name: 'Applied', freq: 7 },
        { name: 'Interview', freq: 7 },
        { name: 'In Review', freq: 6 },
        { name: 'Rejected', freq: 1 },
      ];

  const displayPlatforms = hasData
    ? top5Platforms
    : [
        { name: 'LinkedIn', freq: 10 },
        { name: 'Indeed', freq: 5 },
        { name: 'Glassdoor', freq: 4 },
        { name: 'AngelList', freq: 2 },
      ];

  const displayLocations = hasData
    ? top5Locations
    : [
        { name: 'Remote', freq: 8 },
        { name: 'Austin, USA', freq: 5 },
        { name: 'Chicago, USA', freq: 4 },
        { name: 'New York, USA', freq: 4 },
      ];

  const displayRoles = hasData
    ? top5RoleNames
    : [
        { name: 'Frontend Developer', freq: 6 },
        { name: 'Backend Developer', freq: 5 },
        { name: 'Fullstack Developer', freq: 4 },
        { name: 'DevOps Engineer', freq: 3 },
        { name: 'AI Engineer', freq: 3 },
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

      {/* 3. Top Sources & Status Breakdown */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Top Targets & Status Distribution
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <LeaderboardCard
            title="Top Companies Applied To"
            data={displayCompanies}
            total={displayTotal}
          />
          <LeaderboardCard
            title="Top Role Titles"
            data={displayRoles}
            total={displayTotal}
          />
          <PieChartComponent
            title="Status Breakdown"
            data={displayStatuses}
            total={displayTotal}
          />
        </div>
      </section>

      {/* 4. Channel & Geographic Distribution */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Channels & Locations
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PieChartComponent
            title="Top Sourcing Platforms"
            data={displayPlatforms}
            total={displayTotal}
          />
          <PieChartComponent
            title="Top Locations"
            data={displayLocations}
            total={displayTotal}
          />
        </div>
      </section>

      {/* 5. Yearly Application Trends (Consolidated Single Card) */}
      {(!month || month === "all") && (
        <section className="space-y-3 pt-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Yearly Application Trends
            </h2>
          </div>
          <YearlyTrendsCard
            years={years.length > 0 ? years : ['2025']}
            statusesPerYear={statusesPerYear}
            applicationsPerYear={applicationsPerYear}
            globalYear={year}
          />
        </section>
      )}
    </div>
  );
}

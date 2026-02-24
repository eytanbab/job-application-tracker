import {
  getActionableNudges,
  getApplicationsFunnel,
  getApplicationsPerYear,
  getConsistencyHeatmapData,
  getDayOfWeekPerformance,
  getDomainLeaderboard,
  getGhostedApplications,
  getKeywordPerformance,
  getKpiSummary,
  getPlatformPerformance,
  getSalaryRealityCheck,
  getYears,
} from '@/app/actions/analytics';
import { ActionableNudge } from './components/actionable-nudge';
import { ApplicationVelocityChart } from './components/application-velocity-chart';
import { ConsistencyHeatmap } from './components/consistency-heatmap';
import { DayOfWeekPerformance } from './components/day-of-week-performance';
import { DomainLeaderboard } from './components/domain-leaderboard';
import { FunnelChart } from './components/funnel-chart';
import { GhostingDetector } from './components/ghosting-detector';
import { KeywordPerformance } from './components/keyword-performance';
import { KpiSummary } from './components/kpi-summary';
import { PlatformPerformance } from './components/platform-performance';
import { SalaryRealityCheck } from './components/salary-reality-check';

export async function generateMetadata() {
  return {
    title: 'JAT | AI Insights',
  };
}

export default async function AiInsightsPage() {
  const [
    performanceData,
    kpiData,
    applicationsPerYear,
    years,
    funnelData,
    heatmapData,
    domainLeaderboardData,
    keywordPerformanceData,
    salaryRealityCheckData,
    ghostedApplicationsCount,
    dayOfWeekPerformanceData,
    actionableNudge,
  ] = await Promise.all([
    getPlatformPerformance(),
    getKpiSummary(),
    getApplicationsPerYear(),
    getYears(),
    getApplicationsFunnel(),
    getConsistencyHeatmapData(),
    getDomainLeaderboard(),
    getKeywordPerformance(),
    getSalaryRealityCheck(),
    getGhostedApplications(),
    getDayOfWeekPerformance(),
    getActionableNudges(),
  ]);

  return (
    <div className='flex flex-col gap-8 p-4 md:p-6'>
      <h1 className='text-2xl font-bold'>AI Insights</h1>
      <ActionableNudge message={actionableNudge} />
      <KpiSummary kpiData={kpiData} />
      <div className='grid grid-cols-1 gap-8'>
        <div>
          <h2 className='text-xl font-semibold mb-2'>The Funnel</h2>
          <FunnelChart data={funnelData} />
        </div>
        <div>
          <h2 className='text-xl font-semibold mb-2'>Application Velocity</h2>
          <ApplicationVelocityChart
            data={applicationsPerYear}
            years={years}
          />
        </div>
        <div>
          <h2 className='text-xl font-semibold mb-2'>
            ATS/Domain Leaderboard
          </h2>
          <DomainLeaderboard data={domainLeaderboardData} />
        </div>
        <div>
          <h2 className='text-xl font-semibold mb-2'>
            Role Keyword Performance
          </h2>
          <KeywordPerformance data={keywordPerformanceData} />
        </div>
        <div>
          <h2 className='text-xl font-semibold mb-2'>
            Platform Performance
          </h2>
          <PlatformPerformance performanceData={performanceData} />
        </div>
        <div>
          <h2 className='text-xl font-semibold mb-2'>Salary Reality Check</h2>
          <SalaryRealityCheck data={salaryRealityCheckData} />
        </div>
        <div>
          <h2 className='text-xl font-semibold mb-2'>
            Day of Week Optimizer
          </h2>
          <DayOfWeekPerformance data={dayOfWeekPerformanceData} />
        </div>
        <GhostingDetector count={ghostedApplicationsCount} />
        <div>
          <h2 className='text-xl font-semibold mb-2'>Consistency Heatmap</h2>
          <ConsistencyHeatmap data={heatmapData} />
        </div>
      </div>
    </div>
  );
}

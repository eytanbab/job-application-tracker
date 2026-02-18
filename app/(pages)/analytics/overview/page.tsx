import {
  getApplicationsPerYear,
  getStasusesPerYear,
  getTop5Companies,
  getTop5Locations,
  getTop5Platforms,
  getTop5RoleNames,
  getTop5Statuses,
  getYears,
} from '@/app/actions/analytics';

import { PieChartComponent } from '../components/pie-chart';
import { Section } from '../components/Section';
import { StatusesPerYearBarChart } from '../components/statuses-per-year-bar-chart';
import { TotalApplicationsPerYearBarChart } from '../components/total-applications-per-year-bar-chart';
import { KpiSummary } from '../components/kpi-summary';

export async function generateMetadata() {
  return {
    title: 'JAT | Overview',
  };
}

export default async function Overview() {
  const [
    top5Companies,
    top5Statuses,
    top5Platforms,
    top5Locations,
    top5RoleNames,
    applicationsPerYear,
    years,
    statusesPerYear,
  ] = await Promise.all([
    getTop5Companies(),
    getTop5Statuses(),
    getTop5Platforms(),
    getTop5Locations(),
    getTop5RoleNames(),
    getApplicationsPerYear(),
    getYears(),
    getStasusesPerYear(),
  ]);

  if (top5Companies.length === 0)
    return (
      <p>No applications found. Add an application to see the analytics.</p>
    );

  const totalApplications = applicationsPerYear.reduce(
    (sum, entry) => sum + Number(entry.numOfApplications),
    0
  );
  const interviewCount = statusesPerYear.reduce(
    (sum, entry) =>
      entry.status.toLowerCase().includes('interview')
        ? sum + Number(entry.statusCount)
        : sum,
    0
  );
  const rejectionCount = statusesPerYear.reduce(
    (sum, entry) =>
      entry.status.toLowerCase().includes('reject')
        ? sum + Number(entry.statusCount)
        : sum,
    0
  );
  const responseCount = statusesPerYear.reduce(
    (sum, entry) =>
      !entry.status.toLowerCase().includes('applied') &&
      !entry.status.toLowerCase().includes('ghost')
        ? sum + Number(entry.statusCount)
        : sum,
    0
  );

  const interviewRate = totalApplications
    ? interviewCount / totalApplications
    : 0;
  const rejectionRate = totalApplications
    ? rejectionCount / totalApplications
    : 0;
  const responseRate = totalApplications
    ? responseCount / totalApplications
    : 0;

  return (
    <Section>
      <KpiSummary
        totalApplications={totalApplications}
        interviewRate={interviewRate}
        rejectionRate={rejectionRate}
        responseRate={responseRate}
      />
      <PieChartComponent title='Top 5 companies' data={top5Companies} />
      <PieChartComponent title='Top 5 platforms' data={top5Platforms} />
      <PieChartComponent
        title='Top 5 Applications status'
        data={top5Statuses}
      />
      <PieChartComponent title='Top 5 Locations' data={top5Locations} />
      <PieChartComponent title='Top 5 Roles' data={top5RoleNames} />
      <div className='col-span-full grid w-full grid-cols-1 gap-4 3xl:grid-cols-2'>
        <StatusesPerYearBarChart years={years} rawData={statusesPerYear} />
        <TotalApplicationsPerYearBarChart
          years={years}
          data={applicationsPerYear}
        />
      </div>
    </Section>
  );
}

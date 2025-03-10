import {
  getApplicationsPerYear,
  getTop5Companies,
  getTop5Locations,
  getTop5Platforms,
  getTop5RoleNames,
  getTop5Statuses,
  getYears,
} from '@/app/actions';
import { ApplicationsPerYearBarChart } from '../components/applications-per-year-bar-chart';
import { PieChartComponent } from '../components/pie-chart';
import { Section } from '../components/Section';

export default async function Overview() {
  const top5Companies = await getTop5Companies();
  const top5Statuses = await getTop5Statuses();
  const top5Platforms = await getTop5Platforms();
  const top5Locations = await getTop5Locations();
  const top5RoleNames = await getTop5RoleNames();

  const applicationsPerYear = await getApplicationsPerYear();
  const years = await getYears();

  if (top5Companies.length === 0)
    return (
      <p>No applications found. Add an application to see the analytics.</p>
    );

  return (
    <Section>
      <PieChartComponent title='Top 5 companies' data={top5Companies} />
      <PieChartComponent title='Top 5 platforms' data={top5Platforms} />
      <PieChartComponent
        title='Top 5 Applications status'
        data={top5Statuses}
      />
      <PieChartComponent title='Top 5 Locations' data={top5Locations} />
      <PieChartComponent title='Top 5 Roles' data={top5RoleNames} />
      <ApplicationsPerYearBarChart years={years} data={applicationsPerYear} />
    </Section>
  );
}

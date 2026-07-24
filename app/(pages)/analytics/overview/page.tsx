import { Section } from "../components/Section";
import { AnalyticsFilter } from "../components/analytics-filter";
import { getOverviewMetrics, getApplicationVelocity } from "./actions";
import { getYears } from "@/app/actions/analytics";
import { DiagnosticBanner } from "./components/diagnostic-banner";
import { KpiStrip } from "./components/kpi-strip";
import { BrutalFunnel } from "./components/brutal-funnel";
import { VelocityChart } from "./components/velocity-chart";

export async function generateMetadata() {
  return {
    title: "JAT | Overview",
  };
}

export default async function Overview(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const month = typeof searchParams.month === "string" ? searchParams.month : undefined;
  const year = typeof searchParams.year === "string" ? searchParams.year : undefined;

  const [metrics, velocity, years] = await Promise.all([
    getOverviewMetrics(month, year),
    getApplicationVelocity(month, year),
    getYears(),
  ]);

  if (metrics.totalApplications === 0 && !month && !year) {
    return (
      <Section>
        <div className="col-span-full">
          <AnalyticsFilter years={years} />
        </div>
        <div className="col-span-full flex h-60 items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">
            No applications found. Add an application to see the analytics.
          </p>
        </div>
      </Section>
    );
  }

  return (
    <Section>
      <div className="col-span-full mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Pipeline Overview</h1>
            <p className="text-sm text-muted-foreground mt-1">Macro-level performance & health diagnostics.</p>
          </div>
          <AnalyticsFilter years={years} />
        </div>
      </div>

      <div className="col-span-full grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
        <DiagnosticBanner 
          totalApplications={metrics.totalApplications} 
          interviewYield={metrics.interviewYield} 
          ghostRate={metrics.ghostRate}
        />
        
        <KpiStrip 
          totalApplications={metrics.totalApplications}
          activePipeline={metrics.activePipeline}
          interviewYield={metrics.interviewYield}
          ghostRate={metrics.ghostRate}
        />

        <div className="col-span-full grid grid-cols-1 xl:grid-cols-12 gap-6">
          <BrutalFunnel 
            applied={metrics.totalApplications} 
            interview={metrics.interview} 
            offer={metrics.accepted} 
          />
          <VelocityChart data={velocity} />
        </div>
      </div>
    </Section>
  );
}

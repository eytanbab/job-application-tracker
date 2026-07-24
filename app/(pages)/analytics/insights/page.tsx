import { Section } from "../components/Section";
import { AnalyticsFilter } from "../components/analytics-filter";
import { getYears } from "@/app/actions/analytics";
import { getPlatformRoi, getBlackHoleBreakdown, getRoleTargetingAnalysis } from "./actions";

import { PlatformRoiMatrix } from "./components/platform-roi-matrix";
import { BlackholeBreakdown } from "./components/blackhole-breakdown";
import { RoleTargetingCard } from "./components/role-targeting-card";

export async function generateMetadata() {
  return {
    title: "JAT | Insights",
  };
}

export default async function Insights(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const month = typeof searchParams.month === "string" ? searchParams.month : undefined;
  const year = typeof searchParams.year === "string" ? searchParams.year : undefined;

  const [platformRoi, blackhole, roleTargeting, years] = await Promise.all([
    getPlatformRoi(month, year),
    getBlackHoleBreakdown(month, year),
    getRoleTargetingAnalysis(month, year),
    getYears(),
  ]);

  if (platformRoi.length === 0 && !month && !year) {
    return (
      <Section>
        <div className="col-span-full">
          <AnalyticsFilter years={years} />
        </div>
        <div className="col-span-full flex h-60 items-center justify-center rounded-lg border border-dashed">
          <p className="text-muted-foreground">
            No applications found. Add an application to see insights.
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
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Diagnostic Insights</h1>
            <p className="text-sm text-muted-foreground mt-1">Micro-level analysis of sourcing, ghosting, and targeting.</p>
          </div>
          <AnalyticsFilter years={years} />
        </div>
      </div>

      <div className="col-span-full grid grid-cols-1 xl:grid-cols-12 gap-6 w-full mt-6">
        <PlatformRoiMatrix data={platformRoi} />
        <BlackholeBreakdown data={blackhole} />
      </div>

      <div className="col-span-full grid grid-cols-1 xl:grid-cols-12 gap-6 w-full mt-6">
        <RoleTargetingCard data={roleTargeting} />
      </div>
    </Section>
  );
}

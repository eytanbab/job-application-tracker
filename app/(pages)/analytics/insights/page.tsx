import { Suspense } from "react";
import dynamicImport from "next/dynamic";
import {
  getYears,
  getDomainLeaderboard,
  getStatusPerPlatform,
} from "@/app/actions/analytics";
import {
  getBlackHoleBreakdown,
  getRoleTargetingAnalysis,
  getWorkModeAnalysis,
  getSalaryInsights,
} from "./actions";
import { AnalyticsFilter } from "../components/analytics-filter";
import { RoleTargetingCard } from "../components/role-targeting-card";
import { BlackHoleBreakdownCard } from "../components/blackhole-breakdown-card";
import { DomainLeaderboardCard } from "../components/domain-leaderboard-card";
import { WorkModeCard } from "../components/work-mode-card";
import { SalaryInsightsCard } from "../components/salary-insights-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lightbulb, Rocket, Globe, DollarSign, Layers } from "lucide-react";

const PlatformRoiDashboard = dynamicImport(
  () =>
    import("../components/platform-roi-dashboard").then(
      (m) => m.PlatformRoiDashboard,
    ),
  {
    loading: () => (
      <div className="min-h-[360px] bg-card rounded-xl border border-border/30 animate-pulse" />
    ),
  },
);

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "JAT | Channel & Strategy",
  };
}

export default async function InsightsPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const month =
    typeof searchParams.month === "string" ? searchParams.month : undefined;
  const year =
    typeof searchParams.year === "string" ? searchParams.year : undefined;

  const currentYear = new Date().getFullYear().toString();

  const [
    years,
    statusPerPlatform,
    blackHoleData,
    roleTargeting,
    domainLeaderboard,
    workModes,
    salaryInsights,
  ] = await Promise.all([
    getYears(),
    getStatusPerPlatform(month, year),
    getBlackHoleBreakdown(month, year),
    getRoleTargetingAnalysis(month, year),
    getDomainLeaderboard(month, year),
    getWorkModeAnalysis(month, year),
    getSalaryInsights(month, year),
  ]);

  const availableYears = years.length > 0 ? years : [currentYear];

  const isAllEmpty =
    statusPerPlatform.length === 0 &&
    blackHoleData.ghosted === 0 &&
    blackHoleData.rejected === 0 &&
    roleTargeting.length === 0 &&
    domainLeaderboard.length === 0;

  return (
    <div className="flex flex-col gap-6 w-full opacity-100 transition-opacity duration-500">
      <h1 className="sr-only">Channel & Strategy Analytics</h1>

      {/* 1. Header Filter Toolbar */}
      <Suspense
        fallback={
          <div className="h-14 w-full bg-card rounded-xl animate-pulse" />
        }
      >
        <AnalyticsFilter years={availableYears} />
      </Suspense>

      {/* Onboarding Banner when all metrics are empty */}
      {isAllEmpty && !month && !year && (
        <Card className="relative overflow-hidden border border-primary/30 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent backdrop-blur-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary animate-pulse" />
              <CardTitle className="text-base font-bold">
                Unlock Channel & Strategy Intelligence
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-foreground/80 font-medium mt-1">
              Channel & Strategy automatically analyzes your platform conversion yields, role targeting focus, workplace setups, and compensation benchmarks as you track applications.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild size="sm" className="gap-1.5 font-semibold text-xs cursor-pointer">
              <Link href="/applications">+ Add Your First Application</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 2. Platform & Channel Intelligence */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
            Platform & Channel Performance
          </h2>
        </div>
        <PlatformRoiDashboard data={statusPerPlatform} />
      </section>

      {/* 3. ATS Domain Intelligence */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
            ATS Platform Distribution
          </h2>
        </div>
        <DomainLeaderboardCard domains={domainLeaderboard} />
      </section>

      {/* 4. Strategic Targeting & Funnel Loss */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
            Targeting, Work Mode & Funnel Loss
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <RoleTargetingCard roles={roleTargeting} />
          <WorkModeCard modes={workModes} />
          <BlackHoleBreakdownCard {...blackHoleData} />
        </div>
      </section>

      {/* 5. Compensation & Salary Insights */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
            Compensation & Target Salary
          </h2>
        </div>
        <SalaryInsightsCard salary={salaryInsights} />
      </section>
    </div>
  );
}

import { Suspense } from "react";
import { getYears, getDomainLeaderboard } from "@/app/actions/analytics";
import {
  getPlatformRoi,
  getBlackHoleBreakdown,
  getRoleTargetingAnalysis,
} from "./actions";
import { AnalyticsFilter } from "../components/analytics-filter";
import { RoleTargetingCard } from "../components/role-targeting-card";
import { BlackHoleBreakdownCard } from "../components/blackhole-breakdown-card";
import { DomainLeaderboardCard } from "../components/domain-leaderboard-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lightbulb, Zap, Rocket } from "lucide-react";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return {
    title: "JAT | Strategic Insights",
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

  const [years, platformRoi, blackHoleData, roleTargeting, domainLeaderboard] =
    await Promise.all([
      getYears(),
      getPlatformRoi(month, year),
      getBlackHoleBreakdown(month, year),
      getRoleTargetingAnalysis(month, year),
      getDomainLeaderboard(month, year),
    ]);

  const availableYears = years.length > 0 ? years : [currentYear];

  const isAllEmpty =
    platformRoi.length === 0 &&
    blackHoleData.ghosted === 0 &&
    blackHoleData.rejected === 0 &&
    roleTargeting.length === 0 &&
    domainLeaderboard.length === 0;

  return (
    <div className="flex flex-col gap-6 w-full opacity-100 transition-opacity duration-500">
      <h1 className="sr-only">Strategic Insights</h1>

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
                Unlock Strategic Insights
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-foreground/80 font-medium mt-1">
              Strategic Insights automatically analyzes your role targeting focus, ghosting vs. rejection funnel loss, and platform yield leaderboards as you track applications.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <Button asChild size="sm" className="gap-1.5 font-semibold text-xs cursor-pointer">
              <Link href="/applications">+ Add Your First Application</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 2. Strategic Insights Overview */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
            Strategic Targeting & Funnel Loss
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RoleTargetingCard roles={roleTargeting} />
          <BlackHoleBreakdownCard {...blackHoleData} />
        </div>
      </section>

      {/* 3. Channel Intelligence & ATS Performance */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
            Channel Intelligence & ATS Performance
          </h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card className="w-full h-full bg-card shadow-2xs border border-border/30 rounded-xl flex flex-col justify-between">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold">
                  Platform Interview Yield Leaderboard
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Highest interview conversion rate platforms for the selected
                  timeframe
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-2 flex-1">
                {platformRoi.length === 0 ? (
                  <div className="flex flex-col gap-2 py-6 items-center justify-center text-center">
                    <p className="text-sm text-muted-foreground max-w-sm">
                      {month || year
                        ? "No platform interview yield recorded for the selected timeframe filter."
                        : "No platform ROI data available yet. Track your job applications and interviews to calculate platform yield rates."}
                    </p>
                    <Button asChild variant="outline" size="sm" className="mt-1 gap-1.5 text-xs font-semibold cursor-pointer">
                      <Link href="/applications">+ Track Applications</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {platformRoi.map((item, idx) => (
                      <div
                        key={item.name}
                        className="p-3 rounded-lg bg-background border border-border/40 flex flex-col justify-between gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold capitalize text-sm text-foreground">
                            #{idx + 1} {item.name}
                          </span>
                          <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold"
                          >
                            {item.yieldRate.toFixed(1)}% yield
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {item.interviews}{" "}
                          {item.interviews === 1 ? "interview" : "interviews"} from{" "}
                          {item.total} total{" "}
                          {item.total === 1 ? "application" : "applications"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <DomainLeaderboardCard domains={domainLeaderboard} />
          </div>
        </div>
      </section>
    </div>
  );
}

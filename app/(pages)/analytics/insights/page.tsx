import { Suspense } from "react";
import { getYears } from "@/app/actions/analytics";
import {
  getPlatformRoi,
  getBlackHoleBreakdown,
  getRoleTargetingAnalysis,
} from "./actions";
import { AnalyticsFilter } from "../components/analytics-filter";
import { RoleTargetingCard } from "../components/role-targeting-card";
import { BlackHoleBreakdownCard } from "../components/blackhole-breakdown-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Layers, Zap } from "lucide-react";

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

  const [years, platformRoi, blackHoleData, roleTargeting] = await Promise.all([
    getYears(),
    getPlatformRoi(month, year),
    getBlackHoleBreakdown(month, year),
    getRoleTargetingAnalysis(month, year),
  ]);

  return (
    <div className="flex flex-col gap-6 w-full opacity-100 transition-opacity duration-500">
      {/* 1. Header Filter Toolbar */}
      <Suspense
        fallback={
          <div className="h-14 w-full bg-card rounded-xl animate-pulse" />
        }
      >
        <AnalyticsFilter years={years.length > 0 ? years : ["2025"]} />
      </Suspense>

      {/* 2. Strategic Insights Overview */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Strategic Targeting & Funnel Loss
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <RoleTargetingCard roles={roleTargeting} />
          <BlackHoleBreakdownCard {...blackHoleData} />
        </div>
      </section>

      {/* 3. Top Yielding Channels */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Top Yielding Application Channels
          </h2>
        </div>
        <Card className="w-full bg-card shadow-2xs border border-border/30 rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">
              Platform Interview Yield Leaderboard
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Highest interview conversion rate platforms for the selected
              timeframe
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {platformRoi.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No platform ROI data available
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
                        className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30 text-xs font-semibold"
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
      </section>
    </div>
  );
}

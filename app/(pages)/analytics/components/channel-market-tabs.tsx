"use client";

import dynamicImport from "next/dynamic";
import { parseAsString, useQueryStates } from "nuqs";
import { Globe, Briefcase, BarChart3 } from "lucide-react";
import { ChannelPerformanceMatrix } from "./channel-performance-matrix";
import { MarketRealityMatrix } from "./market-reality-matrix";
import type { WorkModeData, SalaryInsightsData } from "../insights/actions";

const PieChartComponent = dynamicImport(
  () => import("./pie-chart").then((m) => m.PieChartComponent),
  {
    loading: () => (
      <div className="min-h-[320px] bg-card/40 rounded-xl border border-border/30 animate-pulse" />
    ),
  },
);

const YearlyTrendsCard = dynamicImport(
  () => import("./yearly-trends-card").then((m) => m.YearlyTrendsCard),
  {
    loading: () => (
      <div className="min-h-[320px] bg-card/40 rounded-xl border border-border/30 animate-pulse" />
    ),
  },
);

interface PlatformData {
  platformName: string;
  statuses: { status: string; value: number }[];
  total?: number;
  interviewCount?: number;
}

interface DomainData {
  domain: string;
  total: number;
  interviews: number;
  successRate: number;
}

interface ChannelMarketTabsProps {
  platforms: PlatformData[];
  domains: DomainData[];
  modes: WorkModeData[];
  salary: SalaryInsightsData;
  top5Statuses: { name: string; freq: number; fill?: string }[];
  totalApplications: number;
  availableYears: string[];
  statusesPerYear: any[];
  applicationsPerYear: any[];
  globalYear?: string;
}

export function ChannelMarketTabs({
  platforms,
  domains,
  modes,
  salary,
  top5Statuses,
  totalApplications,
  availableYears,
  statusesPerYear,
  applicationsPerYear,
  globalYear,
}: ChannelMarketTabsProps) {
  const [tabState, setTabState] = useQueryStates(
    {
      tab: parseAsString.withDefault("platforms"),
    },
    {
      shallow: true,
    },
  );

  const activeTab = tabState.tab || "platforms";

  const handleTabChange = (newTab: "platforms" | "trends" | "workplace") => {
    setTabState({ tab: newTab === "platforms" ? null : newTab });
  };

  return (
    <div className="w-full space-y-4">
      {/* Header & Tab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/20 pb-3">
        <div>
          <h2 className="text-sm sm:text-base font-semibold tracking-tight text-foreground">
            Detailed Breakdowns
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Deep dive into platform conversion, status progression, and compensation.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Detailed analytics breakdowns"
          className="grid grid-cols-3 sm:flex items-center gap-1 p-0.5 rounded-lg bg-muted/40 border border-border/30 w-full sm:w-fit shrink-0"
        >
          <button
            type="button"
            role="tab"
            id="tab-platforms"
            aria-selected={activeTab === "platforms"}
            aria-controls="panel-platforms"
            onClick={() => handleTabChange("platforms")}
            className={`inline-flex min-w-0 items-center justify-center gap-1.5 px-3 py-1.5 sm:py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "platforms"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate min-w-0">Platforms</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-trends"
            aria-selected={activeTab === "trends"}
            aria-controls="panel-trends"
            onClick={() => handleTabChange("trends")}
            className={`inline-flex min-w-0 items-center justify-center gap-1.5 px-3 py-1.5 sm:py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "trends"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate min-w-0">Trends & Status</span>
          </button>

          <button
            type="button"
            role="tab"
            id="tab-workplace"
            aria-selected={activeTab === "workplace"}
            aria-controls="panel-workplace"
            onClick={() => handleTabChange("workplace")}
            className={`inline-flex min-w-0 items-center justify-center gap-1.5 px-3 py-1.5 sm:py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "workplace"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate min-w-0">Work & Salary</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="w-full">
        {activeTab === "platforms" && (
          <div
            id="panel-platforms"
            role="tabpanel"
            aria-labelledby="tab-platforms"
            className="animate-in fade-in duration-200"
          >
            <ChannelPerformanceMatrix platforms={platforms} domains={domains} />
          </div>
        )}

        {activeTab === "trends" && (
          <div
            id="panel-trends"
            role="tabpanel"
            aria-labelledby="tab-trends"
            className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full min-w-0 animate-in fade-in duration-200"
          >
            <YearlyTrendsCard
              years={availableYears}
              statusesPerYear={statusesPerYear}
              applicationsPerYear={applicationsPerYear}
              globalYear={globalYear}
            />
            <PieChartComponent
              title="Status Breakdown"
              data={top5Statuses}
              total={totalApplications}
            />
          </div>
        )}

        {activeTab === "workplace" && (
          <div
            id="panel-workplace"
            role="tabpanel"
            aria-labelledby="tab-workplace"
            className="animate-in fade-in duration-200"
          >
            <MarketRealityMatrix modes={modes} salary={salary} />
          </div>
        )}
      </div>
    </div>
  );
}

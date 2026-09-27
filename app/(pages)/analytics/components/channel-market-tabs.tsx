"use client";

import { useState } from "react";
import dynamicImport from "next/dynamic";
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
  const [activeTab, setActiveTab] = useState<"channels" | "market" | "trends">("channels");

  return (
    <div className="w-full space-y-4">
      {/* Workspace Header & Tab Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/20 pb-3">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-foreground">
            Strategic Intelligence & Analytics
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Channel yields, workplace setup benchmarks, and historical volume progression.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Intelligence analytics views"
          className="grid grid-cols-3 sm:flex items-center gap-1 p-0.5 rounded-lg bg-muted/40 border border-border/30 w-full sm:w-fit shrink-0"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "channels"}
            onClick={() => setActiveTab("channels")}
            className={`inline-flex min-w-0 items-center justify-center gap-1.5 px-3 py-1.5 sm:py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "channels"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate min-w-0">Channels</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "market"}
            onClick={() => setActiveTab("market")}
            className={`inline-flex min-w-0 items-center justify-center gap-1.5 px-3 py-1.5 sm:py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "market"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate min-w-0">Workplace & Salary</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "trends"}
            onClick={() => setActiveTab("trends")}
            className={`inline-flex min-w-0 items-center justify-center gap-1.5 px-3 py-1.5 sm:py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "trends"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate min-w-0">Volume & Trends</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === "channels" && (
        <ChannelPerformanceMatrix platforms={platforms} domains={domains} />
      )}

      {activeTab === "market" && (
        <MarketRealityMatrix modes={modes} salary={salary} />
      )}

      {activeTab === "trends" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0 animate-in fade-in duration-300">
          <PieChartComponent
            title="Status Distribution"
            data={top5Statuses}
            total={totalApplications}
          />
          <YearlyTrendsCard
            years={availableYears}
            statusesPerYear={statusesPerYear}
            applicationsPerYear={applicationsPerYear}
            globalYear={globalYear}
          />
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Globe, Briefcase } from "lucide-react";
import { ChannelPerformanceMatrix } from "./channel-performance-matrix";
import { MarketRealityMatrix } from "./market-reality-matrix";
import type { WorkModeData, SalaryInsightsData } from "../insights/actions";

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
}

export function ChannelMarketTabs({
  platforms,
  domains,
  modes,
  salary,
}: ChannelMarketTabsProps) {
  const [activeTab, setActiveTab] = useState<"channels" | "market">("channels");

  return (
    <div className="w-full space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/20 pb-2">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-foreground">
            Channel & Market Intelligence
          </h2>
          <p className="text-xs text-muted-foreground">
            Application yield across job portals, workplace setups, and compensation bands.
          </p>
        </div>

        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-muted/40 border border-border/30 w-fit shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("channels")}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "channels"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            Application Channels
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("market")}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "market"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            Workplace & Compensation
          </button>
        </div>
      </div>

      {activeTab === "channels" ? (
        <ChannelPerformanceMatrix platforms={platforms} domains={domains} />
      ) : (
        <MarketRealityMatrix modes={modes} salary={salary} />
      )}
    </div>
  );
}

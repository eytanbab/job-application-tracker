"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Globe, Layers } from "lucide-react";
import { getStatusKind, statusLabels, StatusKind } from "@/lib/utils";

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

interface ChannelPerformanceMatrixProps {
  platforms: PlatformData[];
  domains: DomainData[];
}

const getStatusBgColor = (kind: StatusKind) => {
  switch (kind) {
    case "accepted":
      return "bg-emerald-500";
    case "interview":
      return "bg-amber-500";
    case "review":
      return "bg-blue-500";
    case "rejected":
      return "bg-rose-500";
    case "ghosted":
      return "bg-slate-400";
    case "applied":
      return "bg-muted-foreground/40";
    default:
      return "bg-muted-foreground/30";
  }
};

export function ChannelPerformanceMatrix({
  platforms,
  domains,
}: ChannelPerformanceMatrixProps) {
  const [activeTab, setActiveTab] = useState<"platforms" | "ats">("platforms");

  // Enrich platform data with calculated stats
  const enrichedPlatforms = platforms.map((item) => {
    const total = item.total || item.statuses.reduce((acc, s) => acc + s.value, 0);
    const interviewCount =
      item.interviewCount ??
      item.statuses.reduce((acc, s) => {
        const kind = getStatusKind(s.status);
        return kind === "interview" || kind === "accepted" ? acc + s.value : acc;
      }, 0);

    const respondedCount = item.statuses.reduce((acc, s) => {
      const kind = getStatusKind(s.status);
      return kind === "interview" || kind === "accepted" || kind === "rejected"
        ? acc + s.value
        : acc;
    }, 0);

    const interviewRate = total > 0 ? (interviewCount / total) * 100 : 0;
    const responseRate = total > 0 ? (respondedCount / total) * 100 : 0;

    return {
      ...item,
      total,
      interviewCount,
      respondedCount,
      interviewRate,
      responseRate,
    };
  });

  // Top platform selection with minimum sample size guard (N >= 3)
  const qualifiedPlatforms = enrichedPlatforms.filter(
    (p) => p.interviewCount > 0 && p.total >= 3,
  );
  const topPlatform =
    [...qualifiedPlatforms].sort(
      (a, b) => b.interviewRate - a.interviewRate || b.total - a.total,
    )[0] || null;

  return (
    <div className="w-full rounded-xl border border-border/40 bg-card/60 shadow-2xs backdrop-blur-sm p-4 sm:p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-border/20">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-foreground">
            Channel & Platform Performance
          </h2>
          <p className="text-xs text-muted-foreground">
            Interview yield and response velocity across application channels and direct employer portals.
          </p>
        </div>

        {/* View Toggle */}
        <div className="grid grid-cols-2 sm:flex items-center gap-1 p-0.5 rounded-lg bg-muted/40 border border-border/30 w-full sm:w-fit shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("platforms")}
            className={`inline-flex min-w-0 items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "platforms"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate min-w-0">Job Boards ({platforms.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ats")}
            className={`inline-flex min-w-0 items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "ats"
                ? "bg-background text-foreground shadow-2xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate min-w-0">ATS Portals ({domains.length})</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === "platforms" ? (
        platforms.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No platform application data recorded for this timeframe.
          </p>
        ) : (
          <div className="space-y-3">
            {/* Top platform highlight banner if qualified */}
            {topPlatform && (
              <div className="p-3 rounded-lg bg-background/50 border border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                <span className="text-foreground">
                  <strong className="font-semibold capitalize text-primary">{topPlatform.platformName}</strong> is
                  your highest-yielding channel with a{" "}
                  <strong className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                    {topPlatform.interviewRate.toFixed(1)}% interview yield
                  </strong>{" "}
                  ({topPlatform.interviewCount} of {topPlatform.total} applications).
                </span>
                <Badge variant="outline" className="text-[10px] font-mono shrink-0 border-border/40 self-start sm:self-auto">
                  Sample: {topPlatform.total} apps
                </Badge>
              </div>
            )}

            {/* Mobile Platform Cards (< md) */}
            <div className="md:hidden flex flex-col gap-2.5">
              {enrichedPlatforms.map((platform) => (
                <div
                  key={platform.platformName}
                  className="p-3 rounded-lg border border-border/30 bg-background/50 flex flex-col gap-2.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold capitalize text-foreground text-sm truncate min-w-0">
                      {platform.platformName}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-[10px] font-mono font-medium border-border/30">
                        {platform.total} {platform.total === 1 ? "app" : "apps"}
                      </Badge>
                      <Link
                        href={`/applications?platform=${encodeURIComponent(platform.platformName)}`}
                        className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        View
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs py-1 border-y border-border/20">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Interview Yield</span>
                      {platform.total < 3 && platform.interviewCount > 0 ? (
                        <span className="font-mono text-xs text-muted-foreground">
                          {platform.interviewCount}/{platform.total} <span className="text-[10px] opacity-75">(early)</span>
                        </span>
                      ) : (
                        <span className="font-mono font-semibold text-foreground">
                          {platform.interviewRate.toFixed(1)}% ({platform.interviewCount})
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Response Rate</span>
                      <span className="font-mono font-medium text-foreground">
                        {platform.responseRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Stage Distribution Bar */}
                  <div className="space-y-1">
                    <div className="h-1.5 w-full rounded-full bg-muted/60 flex overflow-hidden">
                      {platform.statuses.map((s) => {
                        const kind = getStatusKind(s.status);
                        const width = platform.total > 0 ? (s.value / platform.total) * 100 : 0;
                        if (width <= 0) return null;
                        return (
                          <div
                            key={s.status}
                            className={`h-full ${getStatusBgColor(kind)}`}
                            style={{ width: `${width}%` }}
                            title={`${s.status}: ${s.value}`}
                          />
                        );
                      })}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                      {platform.statuses.map((s) => (
                        <span key={s.status}>
                          {s.value} {statusLabels[getStatusKind(s.status)] || s.status}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop & Tablet Platform Table (>= md) */}
            <div className="hidden md:block w-full overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-muted-foreground font-medium border-b border-border/20">
                  <tr>
                    <th className="py-2.5 pr-4 font-normal">Channel</th>
                    <th className="py-2.5 px-4 font-normal text-center">Volume</th>
                    <th className="py-2.5 px-4 font-normal text-center">Interview Yield</th>
                    <th className="py-2.5 px-4 font-normal text-center">Response Rate</th>
                    <th className="py-2.5 px-4 font-normal">Pipeline Distribution</th>
                    <th className="py-2.5 pl-4 text-right font-normal">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {enrichedPlatforms.map((platform) => (
                    <tr key={platform.platformName} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 pr-4 font-semibold capitalize text-foreground">
                        {platform.platformName}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-foreground">
                        {platform.total}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {platform.total < 3 && platform.interviewCount > 0 ? (
                          <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                            {platform.interviewCount}/{platform.total} <span className="text-[10px] opacity-75">(early)</span>
                          </span>
                        ) : (
                          <span className="font-mono font-semibold text-foreground">
                            {platform.interviewRate.toFixed(1)}% ({platform.interviewCount})
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-muted-foreground">
                        {platform.responseRate.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 min-w-[180px]">
                        <div className="flex flex-col gap-1">
                          <div className="h-1.5 w-full rounded-full bg-muted/60 flex overflow-hidden">
                            {platform.statuses.map((s) => {
                              const kind = getStatusKind(s.status);
                              const width = platform.total > 0 ? (s.value / platform.total) * 100 : 0;
                              if (width <= 0) return null;
                              return (
                                <div
                                  key={s.status}
                                  className={`h-full ${getStatusBgColor(kind)}`}
                                  style={{ width: `${width}%` }}
                                  title={`${s.status}: ${s.value}`}
                                />
                              );
                            })}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground truncate">
                            {platform.statuses.map((s) => (
                              <span key={s.status}>
                                {s.value} {statusLabels[getStatusKind(s.status)] || s.status}
                              </span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pl-4 text-right">
                        <Link
                          href={`/applications?platform=${encodeURIComponent(platform.platformName)}`}
                          className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          View
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        /* Direct ATS Domains Tab */
        domains.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4 text-center">
            No direct ATS portal links recorded. Direct employer links (Greenhouse, Lever, Ashby) will appear here.
          </p>
        ) : (
          <>
            {/* Mobile ATS Cards (< md) */}
            <div className="md:hidden flex flex-col gap-2">
              {domains.map((item) => (
                <div
                  key={item.domain}
                  className="p-3 rounded-lg border border-border/30 bg-background/50 flex flex-col gap-2 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-medium text-foreground truncate min-w-0">
                      {item.domain}
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono border-border/30 shrink-0">
                      {item.total} {item.total === 1 ? "app" : "apps"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{item.interviews} interviews</span>
                    <span className="font-mono font-semibold text-foreground">
                      {item.successRate.toFixed(1)}% yield
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full"
                      style={{ width: `${Math.max(item.successRate, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop & Tablet ATS Table (>= md) */}
            <div className="hidden md:block w-full overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-muted-foreground font-medium border-b border-border/20">
                  <tr>
                    <th className="py-2.5 pr-4 font-normal">ATS Domain</th>
                    <th className="py-2.5 px-4 font-normal text-center">Volume</th>
                    <th className="py-2.5 px-4 font-normal text-center">Interviews</th>
                    <th className="py-2.5 px-4 font-normal text-center">Conversion Rate</th>
                    <th className="py-2.5 pl-4 font-normal">Progress Bar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {domains.map((item) => (
                    <tr key={item.domain} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 pr-4 font-mono font-medium text-foreground">
                        {item.domain}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-foreground">
                        {item.total}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-foreground">
                        {item.interviews}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-foreground">
                        {item.successRate.toFixed(1)}%
                      </td>
                      <td className="py-3 pl-4 min-w-[150px]">
                        <div className="h-1.5 w-full rounded-full bg-muted/60 overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full"
                            style={{ width: `${Math.max(item.successRate, 4)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )
      )}
    </div>
  );
}

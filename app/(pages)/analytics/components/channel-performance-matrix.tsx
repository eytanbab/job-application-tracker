"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { getStatusKind, statusLabels, StatusKind } from "@/lib/utils";

interface PlatformData {
  platformName: string;
  statuses: { status: string; value: number }[];
  total?: number;
  interviewCount?: number;
}

interface ChannelPerformanceMatrixProps {
  platforms: PlatformData[];
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

const formatStatusText = (status: string) => {
  const kind = getStatusKind(status);
  if (statusLabels[kind]) return statusLabels[kind];
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
};

type SortField = "channel" | "total" | "interviewRate" | "responseRate";
type SortDirection = "asc" | "desc";

export function ChannelPerformanceMatrix({
  platforms,
}: ChannelPerformanceMatrixProps) {
  const [sortField, setSortField] = useState<SortField>("total");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

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

  // Handle column sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "channel" ? "asc" : "desc");
    }
  };

  const sortedPlatforms = [...enrichedPlatforms].sort((a, b) => {
    let comparison = 0;
    if (sortField === "channel") {
      comparison = a.platformName.localeCompare(b.platformName);
    } else if (sortField === "total") {
      comparison = a.total - b.total;
    } else if (sortField === "interviewRate") {
      comparison = a.interviewRate - b.interviewRate;
    } else if (sortField === "responseRate") {
      comparison = a.responseRate - b.responseRate;
    }
    return sortDirection === "desc" ? -comparison : comparison;
  });

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 opacity-40 ml-1 inline" />;
    }
    return sortDirection === "desc" ? (
      <ArrowDown className="h-3 w-3 text-primary ml-1 inline" />
    ) : (
      <ArrowUp className="h-3 w-3 text-primary ml-1 inline" />
    );
  };

  return (
    <div className="w-full rounded-xl border border-border/40 bg-card/60 shadow-2xs backdrop-blur-sm p-4 sm:p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-border/20">
        <div>
          <h2 className="text-sm sm:text-base font-semibold tracking-tight text-foreground">
            Platforms & Sources
          </h2>
          <p className="text-xs text-muted-foreground">
            Compare application volume, interview rates, and response rates across your job platforms.
          </p>
        </div>

        <Badge variant="outline" className="text-xs font-mono w-fit self-start sm:self-auto border-border/40">
          {platforms.length} {platforms.length === 1 ? "Platform" : "Platforms"}
        </Badge>
      </div>

      {/* Content */}
      {platforms.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">
          No platform application data recorded for this timeframe.
        </p>
      ) : (
        <div className="space-y-3">
          {/* Top platform highlight banner */}
          {topPlatform && (
            <div className="p-3 rounded-lg bg-background/50 border border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
              <span className="text-foreground">
                <strong className="font-semibold capitalize text-primary">{topPlatform.platformName}</strong> is
                your top-performing source with an{" "}
                <strong className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                  {topPlatform.interviewRate.toFixed(1)}% interview rate
                </strong>{" "}
                ({topPlatform.interviewCount} of {topPlatform.total} applications led to interviews).
              </span>
              <Badge variant="outline" className="text-[10px] font-mono shrink-0 border-border/40 self-start sm:self-auto">
                Sample: {topPlatform.total} apps
              </Badge>
            </div>
          )}

          {/* Mobile Platform Cards (< md) */}
          <div className="md:hidden flex flex-col gap-2.5">
            {sortedPlatforms.map((platform) => (
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
                    <span className="text-[10px] text-muted-foreground block">Interview Rate</span>
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
                          title={`${formatStatusText(s.status)}: ${s.value}`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-muted-foreground pt-0.5">
                    {platform.statuses.map((s) => {
                      const kind = getStatusKind(s.status);
                      return (
                        <span key={s.status} className="inline-flex items-center gap-1">
                          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${getStatusBgColor(kind)}`} />
                          {s.value} {formatStatusText(s.status)}
                        </span>
                      );
                    })}
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
                  <th
                    className="py-2.5 pr-4 font-normal cursor-pointer hover:text-foreground transition-colors select-none"
                    onClick={() => handleSort("channel")}
                  >
                    Channel {renderSortIcon("channel")}
                  </th>
                  <th
                    className="py-2.5 px-4 font-normal text-center cursor-pointer hover:text-foreground transition-colors select-none"
                    onClick={() => handleSort("total")}
                  >
                    Volume {renderSortIcon("total")}
                  </th>
                  <th
                    className="py-2.5 px-4 font-normal text-center cursor-pointer hover:text-foreground transition-colors select-none"
                    onClick={() => handleSort("interviewRate")}
                  >
                    Interview Rate {renderSortIcon("interviewRate")}
                  </th>
                  <th
                    className="py-2.5 px-4 font-normal text-center cursor-pointer hover:text-foreground transition-colors select-none"
                    onClick={() => handleSort("responseRate")}
                  >
                    Response Rate {renderSortIcon("responseRate")}
                  </th>
                  <th className="py-2.5 px-4 font-normal">Pipeline Distribution</th>
                  <th className="py-2.5 pl-4 text-right font-normal">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {sortedPlatforms.map((platform) => (
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
                    <td className="py-3 px-4 min-w-[200px]">
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
                                title={`${formatStatusText(s.status)}: ${s.value}`}
                              />
                            );
                          })}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                          {platform.statuses.map((s) => {
                            const kind = getStatusKind(s.status);
                            return (
                              <span key={s.status} className="inline-flex items-center gap-1">
                                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${getStatusBgColor(kind)}`} />
                                {s.value} {formatStatusText(s.status)}
                              </span>
                            );
                          })}
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
      )}
    </div>
  );
}

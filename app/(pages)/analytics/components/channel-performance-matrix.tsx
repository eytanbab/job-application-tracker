"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { getStatusKind, statusLabels, StatusKind, cn } from "@/lib/utils";

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Enrich platform data with calculated stats
  const enrichedPlatforms = useMemo(() => {
    return platforms.map((item) => {
      const total =
        item.total || item.statuses.reduce((acc, s) => acc + s.value, 0);
      const interviewCount =
        item.interviewCount ??
        item.statuses.reduce((acc, s) => {
          const kind = getStatusKind(s.status);
          return kind === "interview" || kind === "accepted"
            ? acc + s.value
            : acc;
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
  }, [platforms]);

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

  const sortedPlatforms = useMemo(() => {
    return [...enrichedPlatforms].sort((a, b) => {
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
  }, [enrichedPlatforms, sortField, sortDirection]);

  const filteredPlatforms = useMemo(() => {
    if (!searchQuery.trim()) return sortedPlatforms;
    const q = searchQuery.toLowerCase().trim();
    return sortedPlatforms.filter((p) =>
      p.platformName.toLowerCase().includes(q),
    );
  }, [sortedPlatforms, searchQuery]);

  const displayedPlatforms = useMemo(() => {
    if (isExpanded || searchQuery.trim().length > 0) {
      return filteredPlatforms;
    }
    return filteredPlatforms.slice(0, 5);
  }, [filteredPlatforms, isExpanded, searchQuery]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 opacity-30 ml-1 inline" />;
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
                {topPlatform.total} applications logged
              </Badge>
            </div>
          )}

          {/* Interactive Sort Controls & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 py-1 text-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-muted-foreground text-[11px] font-medium mr-0.5">
                Sort by:
              </span>
              {[
                { field: "total" as const, label: "Volume" },
                { field: "interviewRate" as const, label: "Interview Rate" },
                { field: "responseRate" as const, label: "Response Rate" },
                { field: "channel" as const, label: "Platform Name" },
              ].map((item) => {
                const isActive = sortField === item.field;
                return (
                  <button
                    key={item.field}
                    type="button"
                    onClick={() => handleSort(item.field)}
                    className={cn(
                      "h-7 px-2.5 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition-colors cursor-pointer",
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                        : "bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted",
                    )}
                  >
                    <span>{item.label}</span>
                    {isActive &&
                      (sortDirection === "desc" ? (
                        <ArrowDown className="h-3 w-3" />
                      ) : (
                        <ArrowUp className="h-3 w-3" />
                      ))}
                  </button>
                );
              })}
            </div>

            {platforms.length > 5 && (
              <div className="relative w-full sm:w-48">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter platforms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-7 text-xs pl-8 bg-background/60"
                />
              </div>
            )}
          </div>

          {/* Mobile Platform Cards (< md) */}
          <div className="md:hidden flex flex-col gap-2.5">
            {displayedPlatforms.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">
                No platforms matching &quot;{searchQuery}&quot;
              </p>
            ) : (
              displayedPlatforms.map((platform) => (
                <div
                  key={platform.platformName}
                  className="p-3 rounded-lg border border-border/30 bg-background/50 flex flex-col gap-2.5 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold capitalize text-foreground text-sm truncate min-w-0">
                      {platform.platformName}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-mono font-medium border-border/30",
                          sortField === "total" && "border-primary/40 text-primary font-bold bg-primary/5",
                        )}
                      >
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
                    <div className={cn(sortField === "interviewRate" && "bg-primary/5 p-1 rounded-md")}>
                      <span className="text-[10px] text-muted-foreground block">
                        Interview Rate
                      </span>
                      {platform.total < 3 && platform.interviewCount > 0 ? (
                        <span className="font-mono text-xs text-muted-foreground">
                          {platform.interviewCount}/{platform.total}{" "}
                          <span className="text-[10px] opacity-75">(early)</span>
                        </span>
                      ) : (
                        <span className="font-mono font-semibold text-foreground">
                          {platform.interviewRate.toFixed(1)}% ({platform.interviewCount})
                        </span>
                      )}
                    </div>
                    <div className={cn(sortField === "responseRate" && "bg-primary/5 p-1 rounded-md")}>
                      <span className="text-[10px] text-muted-foreground block">
                        Response Rate
                      </span>
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
                        const width =
                          platform.total > 0 ? (s.value / platform.total) * 100 : 0;
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
                            <span
                              className={`h-1.5 w-1.5 rounded-full shrink-0 ${getStatusBgColor(kind)}`}
                            />
                            {s.value} {formatStatusText(s.status)}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop & Tablet Platform Table (>= md) */}
          <div className="hidden md:block w-full overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-muted-foreground font-medium border-b border-border/20">
                <tr>
                  <th
                    className={cn(
                      "py-2.5 pr-4 cursor-pointer select-none transition-colors",
                      sortField === "channel"
                        ? "text-primary font-bold bg-primary/10 rounded-md pl-2"
                        : "hover:text-foreground font-normal",
                    )}
                    onClick={() => handleSort("channel")}
                  >
                    Channel {renderSortIcon("channel")}
                  </th>
                  <th
                    className={cn(
                      "py-2.5 px-4 text-center cursor-pointer select-none transition-colors",
                      sortField === "total"
                        ? "text-primary font-bold bg-primary/10 rounded-md"
                        : "hover:text-foreground font-normal",
                    )}
                    onClick={() => handleSort("total")}
                  >
                    Volume {renderSortIcon("total")}
                  </th>
                  <th
                    className={cn(
                      "py-2.5 px-4 text-center cursor-pointer select-none transition-colors",
                      sortField === "interviewRate"
                        ? "text-primary font-bold bg-primary/10 rounded-md"
                        : "hover:text-foreground font-normal",
                    )}
                    onClick={() => handleSort("interviewRate")}
                  >
                    Interview Rate {renderSortIcon("interviewRate")}
                  </th>
                  <th
                    className={cn(
                      "py-2.5 px-4 text-center cursor-pointer select-none transition-colors",
                      sortField === "responseRate"
                        ? "text-primary font-bold bg-primary/10 rounded-md"
                        : "hover:text-foreground font-normal",
                    )}
                    onClick={() => handleSort("responseRate")}
                  >
                    Response Rate {renderSortIcon("responseRate")}
                  </th>
                  <th className="py-2.5 px-4 font-normal">Pipeline Distribution</th>
                  <th className="py-2.5 pl-4 text-right font-normal">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {displayedPlatforms.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-muted-foreground">
                      No platforms matching &quot;{searchQuery}&quot;
                    </td>
                  </tr>
                ) : (
                  displayedPlatforms.map((platform) => (
                    <tr
                      key={platform.platformName}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td
                        className={cn(
                          "py-3 pr-4 font-semibold capitalize text-foreground",
                          sortField === "channel" && "pl-2 bg-primary/[0.03]",
                        )}
                      >
                        {platform.platformName}
                      </td>
                      <td
                        className={cn(
                          "py-3 px-4 text-center font-mono text-foreground",
                          sortField === "total"
                            ? "font-bold bg-primary/[0.04]"
                            : "font-semibold",
                        )}
                      >
                        {platform.total}
                      </td>
                      <td
                        className={cn(
                          "py-3 px-4 text-center",
                          sortField === "interviewRate" && "bg-primary/[0.04]",
                        )}
                      >
                        {platform.total < 3 && platform.interviewCount > 0 ? (
                          <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                            {platform.interviewCount}/{platform.total}{" "}
                            <span className="text-[10px] opacity-75">(early)</span>
                          </span>
                        ) : (
                          <span
                            className={cn(
                              "font-mono",
                              sortField === "interviewRate"
                                ? "font-bold text-foreground"
                                : "font-semibold text-foreground",
                            )}
                          >
                            {platform.interviewRate.toFixed(1)}% ({platform.interviewCount})
                          </span>
                        )}
                      </td>
                      <td
                        className={cn(
                          "py-3 px-4 text-center font-mono",
                          sortField === "responseRate"
                            ? "font-bold text-foreground bg-primary/[0.04]"
                            : "text-muted-foreground",
                        )}
                      >
                        {platform.responseRate.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 min-w-[200px]">
                        <div className="flex flex-col gap-1">
                          <div className="h-1.5 w-full rounded-full bg-muted/60 flex overflow-hidden">
                            {platform.statuses.map((s) => {
                              const kind = getStatusKind(s.status);
                              const width =
                                platform.total > 0
                                  ? (s.value / platform.total) * 100
                                  : 0;
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
                                <span
                                  key={s.status}
                                  className="inline-flex items-center gap-1"
                                >
                                  <span
                                    className={`h-1.5 w-1.5 rounded-full shrink-0 ${getStatusBgColor(kind)}`}
                                  />
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Show More / Show Less Toggle (Guards against 66+ rows) */}
          {filteredPlatforms.length > 5 && !searchQuery.trim() && (
            <div className="flex justify-center pt-2 border-t border-border/20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 text-xs font-semibold gap-1.5 cursor-pointer rounded-lg border-border/40"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    Show Top 5 Platforms
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    Show All {filteredPlatforms.length} Platforms ({filteredPlatforms.length - 5} More)
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

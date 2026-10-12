"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
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

  const renderSortHeader = (
    field: SortField,
    label: string,
    align: "left" | "center" = "left",
  ) => {
    const isSorted = sortField === field;
    return (
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-7 px-1.5 font-semibold hover:bg-muted/60 transition-colors text-xs text-muted-foreground hover:text-foreground select-none inline-flex items-center gap-1",
          align === "center" ? "mx-auto justify-center" : "justify-start -ml-1.5",
          isSorted && "text-foreground font-bold",
        )}
        onClick={() => handleSort(field)}
      >
        <span>{label}</span>
        {isSorted ? (
          sortDirection === "asc" ? (
            <ArrowUp className="h-3.5 w-3.5 text-primary shrink-0" />
          ) : (
            <ArrowDown className="h-3.5 w-3.5 text-primary shrink-0" />
          )
        ) : (
          <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
        )}
      </Button>
    );
  };

  return (
    <div className="w-full rounded-xl border border-border/40 bg-card/60 shadow-2xs backdrop-blur-sm p-4 sm:p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/20">
        <div>
          <h2 className="text-sm sm:text-base font-semibold tracking-tight text-foreground">
            Platforms & Sources
          </h2>
          <p className="text-xs text-muted-foreground">
            Compare application volume, interview rates, and response rates across your job platforms.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {platforms.length > 5 && (
            <div className="relative w-44 sm:w-52">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search platforms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-7 text-xs bg-background/60 rounded-lg"
              />
              {searchQuery.length > 0 && (
                <button
                  type="button"
                  aria-label="Clear filter"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
          <Badge
            variant="outline"
            className="text-xs font-mono w-fit border-border/40 shrink-0"
          >
            {platforms.length} {platforms.length === 1 ? "Platform" : "Platforms"}
          </Badge>
        </div>
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
            <div className="p-3 rounded-lg bg-background/50 border border-border/30 text-xs text-muted-foreground">
              <span className="text-foreground">
                <strong className="font-semibold capitalize text-primary">{topPlatform.platformName}</strong> is
                your top-performing source with an{" "}
                <strong className="font-semibold font-mono text-emerald-600 dark:text-emerald-400">
                  {topPlatform.interviewRate.toFixed(1)}% interview rate
                </strong>{" "}
                ({topPlatform.interviewCount} of {topPlatform.total} applications led to interviews).
              </span>
            </div>
          )}

          {/* Mobile Sort Select (< md only, table headers handle desktop) */}
          <div className="md:hidden flex items-center justify-between gap-2 pt-1 pb-1">
            <span className="text-xs text-muted-foreground font-medium">Sort by</span>
            <Select
              value={sortField}
              onValueChange={(val) => {
                if (val === sortField) {
                  setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
                } else {
                  setSortField(val as SortField);
                  setSortDirection(val === "channel" ? "asc" : "desc");
                }
              }}
            >
              <SelectTrigger className="h-8 w-44 text-xs bg-background/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="total">Volume</SelectItem>
                <SelectItem value="interviewRate">Interview Rate</SelectItem>
                <SelectItem value="responseRate">Response Rate</SelectItem>
                <SelectItem value="channel">Platform Name</SelectItem>
              </SelectContent>
            </Select>
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
                      <span className="font-mono text-xs text-muted-foreground">
                        {platform.total} apps
                      </span>
                      <Link
                        href={`/applications?platform=${encodeURIComponent(platform.platformName)}`}
                        className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-0.5"
                      >
                        View
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-border/20">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">
                        Interview Rate
                      </span>
                      {platform.total < 3 && platform.interviewCount > 0 ? (
                        <span className="font-mono text-muted-foreground">
                          {platform.interviewCount}/{platform.total}{" "}
                          <span className="text-[10px] opacity-75">(early)</span>
                        </span>
                      ) : (
                        <span className="font-mono font-semibold text-foreground">
                          {platform.interviewRate.toFixed(1)}% ({platform.interviewCount})
                        </span>
                      )}
                    </div>
                    <div>
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

          {/* Desktop & Tablet Platform Table (>= md) with Rigid Fixed Layout */}
          <div className="hidden md:block w-full rounded-xl border border-border/30 overflow-hidden bg-background/40">
            <Table className="w-full text-xs table-fixed">
              <TableHeader className="bg-muted/30">
                <TableRow className="border-b border-border/30 hover:bg-transparent">
                  <TableHead className="w-[22%] py-2.5 px-3 text-left">
                    {renderSortHeader("channel", "Channel", "left")}
                  </TableHead>
                  <TableHead className="w-[12%] py-2.5 px-3 text-center">
                    {renderSortHeader("total", "Volume", "center")}
                  </TableHead>
                  <TableHead className="w-[18%] py-2.5 px-3 text-center">
                    {renderSortHeader("interviewRate", "Interview Rate", "center")}
                  </TableHead>
                  <TableHead className="w-[15%] py-2.5 px-3 text-center">
                    {renderSortHeader("responseRate", "Response Rate", "center")}
                  </TableHead>
                  <TableHead className="w-[23%] py-2.5 px-3 text-left font-semibold text-xs text-muted-foreground">
                    Pipeline Distribution
                  </TableHead>
                  <TableHead className="w-[10%] py-2.5 px-3 text-right font-semibold text-xs text-muted-foreground">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/20">
                {displayedPlatforms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                      No platforms matching &quot;{searchQuery}&quot;
                    </TableCell>
                  </TableRow>
                ) : (
                  displayedPlatforms.map((platform) => (
                    <TableRow
                      key={platform.platformName}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell
                        className="py-3 px-3 font-semibold capitalize text-foreground truncate min-w-0"
                        title={platform.platformName}
                      >
                        {platform.platformName}
                      </TableCell>
                      <TableCell className="py-3 px-3 text-center font-mono font-semibold text-foreground">
                        {platform.total}
                      </TableCell>
                      <TableCell className="py-3 px-3 text-center">
                        {platform.total < 3 && platform.interviewCount > 0 ? (
                          <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
                            {platform.interviewCount}/{platform.total}{" "}
                            <span className="text-[10px] opacity-75">(early)</span>
                          </span>
                        ) : (
                          <span className="font-mono font-semibold text-foreground">
                            {platform.interviewRate.toFixed(1)}%{" "}
                            <span className="text-muted-foreground font-normal text-[11px]">
                              ({platform.interviewCount})
                            </span>
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="py-3 px-3 text-center font-mono text-muted-foreground">
                        {platform.responseRate.toFixed(1)}%
                      </TableCell>
                      <TableCell className="py-3 px-3">
                        <div className="flex flex-col gap-1 w-full">
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
                                  className="inline-flex items-center gap-1 shrink-0"
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
                      </TableCell>
                      <TableCell className="py-3 px-3 text-right">
                        <Link
                          href={`/applications?platform=${encodeURIComponent(platform.platformName)}`}
                          className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          View
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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

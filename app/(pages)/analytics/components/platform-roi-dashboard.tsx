"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Globe, LayoutGrid, Table as TableIcon, ArrowRight } from "lucide-react";
import { getStatusKind, statusLabels, StatusKind } from "@/lib/utils";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

type PlatformData = {
  platformName: string;
  statuses: { status: string; value: number }[];
  total?: number;
  interviewCount?: number;
};

interface PlatformRoiDashboardProps {
  data: PlatformData[];
}

const getStatusBgColor = (kind: StatusKind) => {
  switch (kind) {
    case "accepted":
      return "bg-emerald-500";
    case "interview":
      return "bg-blue-500";
    case "review":
      return "bg-amber-500";
    case "rejected":
      return "bg-rose-500";
    case "ghosted":
      return "bg-slate-400";
    case "applied":
      return "bg-primary/50";
    default:
      return "bg-muted-foreground/30";
  }
};

function PlatformEmptyState({
  hasFilter,
  onClearFilter,
}: {
  hasFilter: boolean;
  onClearFilter: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 h-60 items-center justify-center rounded-xl border border-dashed border-border/50 p-8 text-center bg-card/30">
      <p className="text-muted-foreground text-sm max-w-sm">
        {hasFilter
          ? "No platform application data found matching your selected timeframe filter."
          : "No application data found. Add your job applications to unlock platform ROI analytics."}
      </p>
      {hasFilter ? (
        <Button
          size="sm"
          variant="outline"
          onClick={onClearFilter}
          className="gap-1.5 font-semibold text-xs cursor-pointer"
        >
          Clear Filters
        </Button>
      ) : (
        <Button asChild size="sm" className="gap-1.5 font-semibold text-xs cursor-pointer">
          <Link href="/applications">+ Add Application</Link>
        </Button>
      )}
    </div>
  );
}

interface EnrichedPlatform {
  platformName: string;
  total: number;
  interviewCount: number;
  offerCount: number;
  respondedCount: number;
  responseRate: number;
  interviewRate: number;
  statuses: { status: string; value: number }[];
}

function PlatformRoiCard({ platform }: { platform: EnrichedPlatform }) {
  return (
    <Card
      key={platform.platformName}
      className="bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow flex flex-col justify-between"
    >
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary capitalize text-sm shrink-0">
              {platform.platformName.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base font-semibold capitalize truncate">
                {platform.platformName}
              </CardTitle>
              <CardDescription className="text-xs truncate">
                {platform.total} total{" "}
                {platform.total === 1 ? "application" : "applications"}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className={
                platform.interviewRate > 0
                  ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 text-[11px] font-semibold"
                  : "text-[11px] font-medium"
              }
            >
              {platform.interviewRate.toFixed(1)}% interview
            </Badge>
            <Badge
              variant="outline"
              className={
                platform.responseRate >= 20
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[11px] font-semibold"
                  : "text-[11px] font-medium"
              }
            >
              {platform.responseRate.toFixed(1)}% response
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 pt-0">
        {/* Segmented Status Progress Bar */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
            <span>Pipeline breakdown</span>
            <span>{platform.interviewCount} interviewed</span>
          </div>
          <div
            className="h-3 w-full rounded-full bg-muted/60 flex overflow-hidden p-0.5 gap-0.5"
            role="progressbar"
            aria-label={`Pipeline breakdown for ${platform.platformName}: ${platform.total} total`}
            aria-valuenow={platform.total}
            aria-valuemin={0}
            aria-valuemax={platform.total}
          >
            {platform.statuses.map((s) => {
              const kind = getStatusKind(s.status);
              const widthPercent =
                platform.total > 0
                  ? (s.value / platform.total) * 100
                  : 0;
              if (widthPercent <= 0) return null;
              return (
                <div
                  key={s.status}
                  aria-label={`${s.status}: ${s.value} (${widthPercent.toFixed(1)}%)`}
                  className={`h-full rounded-sm ${getStatusBgColor(kind)} transition-[width] duration-500`}
                  style={{ width: `${widthPercent}%` }}
                />
              );
            })}
          </div>
        </div>

        {/* Status Badges List with matching color dots */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {platform.statuses.map((s) => {
            const kind = getStatusKind(s.status);
            const label = statusLabels[kind] || s.status;
            const pct =
              platform.total > 0
                ? ((s.value / platform.total) * 100).toFixed(0)
                : "0";
            return (
              <span
                key={s.status}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/50 text-[11px] text-foreground/80 font-medium"
              >
                <span
                  className={`h-2 w-2 rounded-full shrink-0 ${getStatusBgColor(kind)}`}
                />
                <span className="font-semibold text-foreground">
                  {s.value}
                </span>
                <span className="capitalize">{label}</span>
                <span className="text-[10px] text-muted-foreground font-semibold">
                  ({pct}%)
                </span>
              </span>
            );
          })}
        </div>

        {/* Drill-down action link */}
        <div className="border-t border-border/30 pt-2 flex justify-end">
          <Link
            href={`/applications?search=${encodeURIComponent(platform.platformName)}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
          >
            View applications
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function PlatformRoiTable({ platforms }: { platforms: EnrichedPlatform[] }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-border/30 bg-card shadow-2xs">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-muted/50 text-muted-foreground uppercase tracking-wider font-semibold border-b border-border/30">
          <tr>
            <th className="py-3 px-4">Platform</th>
            <th className="py-3 px-4 text-center">Volume</th>
            <th className="py-3 px-4 text-center">Interview Yield</th>
            <th className="py-3 px-4 text-center">Response Rate</th>
            <th className="py-3 px-4">Pipeline Distribution</th>
            <th className="py-3 px-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/20 text-foreground">
          {platforms.map((platform) => (
            <tr
              key={platform.platformName}
              className="hover:bg-muted/30 transition-colors"
            >
              <td className="py-3 px-4 font-semibold capitalize">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded bg-primary/10 flex items-center justify-center font-bold text-primary text-xs shrink-0">
                    {platform.platformName.slice(0, 2)}
                  </div>
                  <span>{platform.platformName}</span>
                </div>
              </td>
              <td className="py-3 px-4 text-center font-bold">
                {platform.total}
              </td>
              <td className="py-3 px-4 text-center">
                <Badge
                  variant="outline"
                  className={
                    platform.interviewRate > 0
                      ? "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 text-xs font-semibold"
                      : "text-xs font-medium"
                  }
                >
                  {platform.interviewRate.toFixed(1)}% ({platform.interviewCount})
                </Badge>
              </td>
              <td className="py-3 px-4 text-center">
                <Badge
                  variant="outline"
                  className={
                    platform.responseRate >= 20
                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold"
                      : "text-xs font-medium"
                  }
                >
                  {platform.responseRate.toFixed(1)}% ({platform.respondedCount})
                </Badge>
              </td>
              <td className="py-3 px-4 min-w-[200px]">
                <div className="flex flex-col gap-1">
                  <div
                    className="h-2 w-full rounded-full bg-muted/60 flex overflow-hidden p-0.5 gap-0.5"
                    role="progressbar"
                    aria-label={`Pipeline for ${platform.platformName}`}
                    aria-valuenow={platform.total}
                    aria-valuemin={0}
                    aria-valuemax={platform.total}
                  >
                    {platform.statuses.map((s) => {
                      const kind = getStatusKind(s.status);
                      const widthPercent =
                        platform.total > 0
                          ? (s.value / platform.total) * 100
                          : 0;
                      if (widthPercent <= 0) return null;
                      return (
                        <div
                          key={s.status}
                          className={`h-full rounded-xs ${getStatusBgColor(kind)}`}
                          style={{ width: `${widthPercent}%` }}
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
              <td className="py-3 px-4 text-right">
                <Button asChild variant="ghost" size="sm" className="h-7 text-xs font-semibold gap-1 cursor-pointer">
                  <Link href={`/applications?search=${encodeURIComponent(platform.platformName)}`}>
                    View
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PlatformRoiDashboard({ data }: PlatformRoiDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasFilter = Boolean(searchParams.get("month") || searchParams.get("year"));

  const [sortBy, setSortBy] = useState<
    "total" | "interview" | "response" | "name"
  >("total");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  if (!data || data.length === 0) {
    return (
      <PlatformEmptyState
        hasFilter={hasFilter}
        onClearFilter={() => router.push(pathname)}
      />
    );
  }

  // Calculate platform stats with conversions
  const enrichedPlatforms = data.map((item) => {
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

    const offerCount = item.statuses.reduce((acc, s) => {
      return getStatusKind(s.status) === "accepted" ? acc + s.value : acc;
    }, 0);

    const respondedCount = item.statuses.reduce((acc, s) => {
      const kind = getStatusKind(s.status);
      return kind === "interview" || kind === "accepted" || kind === "rejected"
        ? acc + s.value
        : acc;
    }, 0);

    const responseRate = total > 0 ? (respondedCount / total) * 100 : 0;
    const interviewRate = total > 0 ? (interviewCount / total) * 100 : 0;

    return {
      ...item,
      total,
      interviewCount,
      offerCount,
      respondedCount,
      responseRate,
      interviewRate,
    };
  });

  // Sort platforms based on user preference
  const sortedPlatforms = [...enrichedPlatforms].sort((a, b) => {
    if (sortBy === "total") return b.total - a.total;
    if (sortBy === "interview") return b.interviewRate - a.interviewRate;
    if (sortBy === "response") return b.responseRate - a.responseRate;
    return a.platformName.localeCompare(b.platformName);
  });

  // Top Interview platform (where interviewCount > 0 and total >= 2)
  const topInterviewPlatform = [...enrichedPlatforms]
    .filter((p) => p.interviewCount > 0 && p.total >= 2)
    .sort((a, b) => b.interviewRate - a.interviewRate)[0];

  // Top Response platform (overall responses and total >= 2)
  const topResponsePlatform = [...enrichedPlatforms]
    .filter((p) => p.respondedCount > 0 && p.total >= 2)
    .sort((a, b) => b.responseRate - a.responseRate)[0];

  return (
    <div className="flex flex-col gap-6 w-full opacity-100 transition-opacity duration-500">
      {/* Platform Highlight Banner */}
      {topInterviewPlatform ? (
        <Card className="relative overflow-hidden border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-accent/5 to-transparent backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400 motion-safe:animate-pulse" />
              <CardTitle className="text-base font-bold">
                Top Interview Channel
              </CardTitle>
            </div>
            <CardDescription className="text-sm text-foreground/80 font-medium mt-1">
              <strong className="text-primary capitalize">
                {topInterviewPlatform.platformName}
              </strong>{" "}
              is your highest-yielding interview source with a{" "}
              <strong className="text-emerald-700 dark:text-emerald-400 font-bold">
                {topInterviewPlatform.interviewRate.toFixed(1)}% interview
                conversion rate
              </strong>{" "}
              ({topInterviewPlatform.interviewCount}{" "}
              {topInterviewPlatform.interviewCount === 1
                ? "interview"
                : "interviews"}{" "}
              from {topInterviewPlatform.total} applications).
            </CardDescription>
          </CardHeader>
        </Card>
      ) : topResponsePlatform ? (
        <Card className="relative overflow-hidden border border-primary/20 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent backdrop-blur-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary motion-safe:animate-pulse" />
              <CardTitle className="text-base font-bold">
                Top Response Channel
              </CardTitle>
            </div>
            <CardDescription className="text-sm text-foreground/80 font-medium mt-1">
              <strong className="text-primary capitalize">
                {topResponsePlatform.platformName}
              </strong>{" "}
              has your highest overall response rate at{" "}
              <strong className="text-primary font-bold">
                {topResponsePlatform.responseRate.toFixed(1)}%
              </strong>{" "}
              ({topResponsePlatform.respondedCount}{" "}
              {topResponsePlatform.respondedCount === 1
                ? "response"
                : "responses"}{" "}
              from {topResponsePlatform.total} applications).
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {/* Controls & Sorting Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-1">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
            Platform Conversion & Yield Matrix
          </h2>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Sorting Control Group */}
          <div
            role="group"
            aria-label="Sort platform data"
            className="inline-flex items-center rounded-lg bg-muted/60 p-1 gap-1 border border-border/20 text-xs font-medium"
          >
            <span className="text-[11px] text-muted-foreground px-1.5">Sort:</span>
            <button
              type="button"
              aria-pressed={sortBy === "total"}
              onClick={() => setSortBy("total")}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer",
                sortBy === "total"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Volume
            </button>
            <button
              type="button"
              aria-pressed={sortBy === "interview"}
              onClick={() => setSortBy("interview")}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer",
                sortBy === "interview"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Interview Rate
            </button>
            <button
              type="button"
              aria-pressed={sortBy === "response"}
              onClick={() => setSortBy("response")}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer",
                sortBy === "response"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Response Rate
            </button>
            <button
              type="button"
              aria-pressed={sortBy === "name"}
              onClick={() => setSortBy("name")}
              className={cn(
                "px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer",
                sortBy === "name"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Name
            </button>
          </div>

          {/* View Mode Toggle (Grid vs Table) */}
          <div
            role="group"
            aria-label="View mode layout"
            className="inline-flex items-center rounded-lg bg-muted/60 p-1 gap-1 border border-border/20"
          >
            <button
              type="button"
              aria-label="Grid card view"
              aria-pressed={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-1.5 rounded-md transition-all cursor-pointer",
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              aria-label="Compact table view"
              aria-pressed={viewMode === "table"}
              onClick={() => setViewMode("table")}
              className={cn(
                "p-1.5 rounded-md transition-all cursor-pointer",
                viewMode === "table"
                  ? "bg-background text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <TableIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Display (Grid or Table) */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sortedPlatforms.map((platform) => (
            <PlatformRoiCard key={platform.platformName} platform={platform} />
          ))}
        </div>
      ) : (
        <PlatformRoiTable platforms={sortedPlatforms} />
      )}
    </div>
  );
}

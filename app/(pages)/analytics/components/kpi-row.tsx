import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import {
  describeDelta,
  formatDays,
  formatPct,
  previousPeriodLabel,
  rateHeadline,
  type DeltaText,
} from "@/lib/analytics/format";
import { trackerHref } from "@/lib/analytics/links";
import type { AnalyticsOverview } from "@/lib/analytics/summarize";
import type { Rate } from "@/lib/analytics/types";
import { cn } from "@/lib/utils";

function DeltaLine({ delta }: { delta: DeltaText | null }) {
  if (!delta) return null;
  const Icon = delta.short.startsWith("+")
    ? ArrowUpRight
    : delta.short.startsWith("-")
      ? ArrowDownRight
      : Minus;
  return (
    <p
      className={cn(
        "flex items-center gap-1 text-xs",
        delta.tone === "good" && "text-emerald-700 dark:text-emerald-400",
        delta.tone === "bad" && "text-rose-700 dark:text-rose-400",
        delta.tone === "neutral" && "text-muted-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span aria-hidden>{delta.short}</span>
      <span className="sr-only">{delta.spoken}</span>
    </p>
  );
}

interface TileProps {
  label: string;
  value: string;
  caption: string;
  delta: DeltaText | null;
  href?: string;
  muted?: boolean;
}

function Tile({ label, value, caption, delta, href, muted }: TileProps) {
  const body = (
    <>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 flex flex-col gap-1">
        <span className={cn("text-2xl font-semibold tracking-tight", muted ? "text-muted-foreground" : "text-foreground")}>
          {value}
        </span>
        <span className="text-xs text-muted-foreground">{caption}</span>
        <DeltaLine delta={delta} />
      </dd>
    </>
  );
  const className =
    "rounded-xl border border-border/40 bg-card shadow-2xs p-4 min-w-0 flex flex-col";
  return href ? (
    <Link
      href={href}
      className={cn(className, "transition-colors hover:border-primary/40 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}
    >
      <dl>{body}</dl>
    </Link>
  ) : (
    <div className={className}>
      <dl>{body}</dl>
    </div>
  );
}

function rateCaption(rate: Rate, noun: string): string {
  if (rate.n === 0) return "No applications in this period";
  const base = `${rate.k} of ${rate.n} ${noun}`;
  return rate.enough ? base : `${base} (too few to compare)`;
}

export function KpiRow({ overview }: { overview: AnalyticsOverview }) {
  const { kpis, range } = overview;
  const period = previousPeriodLabel(range);
  const current = range.current;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <Tile
        label="Applications"
        value={String(kpis.applications.value)}
        caption={range.label}
        delta={describeDelta(kpis.applications.delta, "count", period)}
        href={trackerHref({ range: current })}
      />
      <Tile
        label="Response rate"
        value={rateHeadline(kpis.responseRate.rate)}
        caption={rateCaption(kpis.responseRate.rate, "got a reply")}
        delta={describeDelta(kpis.responseRate.delta, "points", period)}
        href={trackerHref({ range: current, stage: "responded" })}
        muted={!kpis.responseRate.rate.enough}
      />
      <Tile
        label="Interview rate"
        value={rateHeadline(kpis.interviewRate.rate)}
        caption={rateCaption(kpis.interviewRate.rate, "reached an interview")}
        delta={describeDelta(kpis.interviewRate.delta, "points", period)}
        href={trackerHref({ range: current, stage: "interviewed" })}
        muted={!kpis.interviewRate.rate.enough}
      />
      <Tile
        label="Offers"
        value={String(kpis.offers.value)}
        caption={
          kpis.offerRate.rate.n > 0
            ? `${kpis.offerRate.rate.k} of ${kpis.offerRate.rate.n} interviews (${formatPct(kpis.offerRate.rate.pct)})`
            : "No interviews yet"
        }
        delta={null}
        href={trackerHref({ range: current, status: "accepted" })}
      />
      <Tile
        label="Days to first reply"
        value={formatDays(kpis.daysToFirstUpdate.median)}
        caption={
          kpis.daysToFirstUpdate.n > 0
            ? `Median of ${kpis.daysToFirstUpdate.n}, from when you logged the reply`
            : "No replies logged yet"
        }
        delta={
          kpis.daysToFirstUpdate.median !== null && kpis.daysToFirstUpdate.previous !== null
            ? describeDelta(
                {
                  change: kpis.daysToFirstUpdate.median - kpis.daysToFirstUpdate.previous,
                  meaningful: kpis.daysToFirstUpdate.n >= 10,
                },
                "days",
                period,
                false,
              )
            : null
        }
      />
    </div>
  );
}

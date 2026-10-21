"use client";

import Link from "next/link";
import { parseAsBoolean, parseAsStringLiteral, useQueryStates } from "nuqs";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPct } from "@/lib/analytics/format";
import { trackerHref } from "@/lib/analytics/links";
import type { PlatformSummary } from "@/lib/analytics/summarize";
import type { DateRange, Rate } from "@/lib/analytics/types";
import { cn, formatPlatformLabel, statusColor, statusOptions } from "@/lib/utils";

const SORTS = ["platform", "total", "responded", "interviewed", "offers"] as const;
type Sort = (typeof SORTS)[number];

const COLUMNS: { key: Sort; label: string; align: "left" | "right" }[] = [
  { key: "platform", label: "Platform", align: "left" },
  { key: "total", label: "Applications", align: "right" },
  { key: "responded", label: "Got a reply", align: "right" },
  { key: "interviewed", label: "Reached interview", align: "right" },
  { key: "offers", label: "Offers", align: "right" },
];

const TOP_N = 5;

// Display choices, so they replace the history entry instead of adding one.
const tableParams = {
  psort: parseAsStringLiteral(SORTS).withDefault("total"),
  pdir: parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc"),
  pall: parseAsBoolean.withDefault(false),
};

function sortValue(p: PlatformSummary, sort: Sort): number | string {
  switch (sort) {
    case "platform":
      return p.label.toLowerCase();
    case "total":
      return p.total;
    case "responded":
      return p.responded.pct;
    case "interviewed":
      return p.interviewed.pct;
    case "offers":
      return p.offers;
  }
}

function RateCell({ rate }: { rate: Rate }) {
  return (
    <span className={cn("tabular-nums", !rate.enough && "text-muted-foreground")}>
      {rate.k}
      <span className="text-muted-foreground"> · {rate.enough ? formatPct(rate.pct) : "early"}</span>
    </span>
  );
}

function StatusMix({ platform }: { platform: PlatformSummary }) {
  const parts = statusOptions.filter(({ value }) => platform.byKind[value] > 0);
  const summary = parts.map(({ value, label }) => `${platform.byKind[value]} ${label}`).join(", ");
  return (
    <div className="flex h-2 w-full min-w-16 overflow-hidden rounded-full bg-muted" role="img" aria-label={summary}>
      {parts.map(({ value }) => (
        <span
          key={value}
          className="h-full border-r-2 border-card last:border-r-0"
          style={{ width: `${(platform.byKind[value] / platform.total) * 100}%`, background: statusColor(value) }}
        />
      ))}
    </div>
  );
}

export function PlatformsTable({
  platforms,
  topPlatformKey,
  range,
}: {
  platforms: PlatformSummary[];
  topPlatformKey: string | null;
  range: DateRange;
}) {
  const [{ psort, pdir, pall }, setParams] = useQueryStates(tableParams, {
    history: "replace",
    scroll: false,
  });

  const sorted = [...platforms].sort((a, b) => {
    const left = sortValue(a, psort);
    const right = sortValue(b, psort);
    const order = typeof left === "string" ? left.localeCompare(right as string) : left - (right as number);
    return (pdir === "asc" ? order : -order) || b.total - a.total;
  });
  const shown = pall ? sorted : sorted.slice(0, TOP_N);
  const top = platforms.find((p) => topPlatformKey !== null && p.key === topPlatformKey);

  const toggleSort = (key: Sort) =>
    setParams(
      key === psort
        ? { pdir: pdir === "asc" ? "desc" : "asc" }
        : { psort: key, pdir: key === "platform" ? "asc" : "desc" },
    );

  const href = (p: PlatformSummary) =>
    p.key ? trackerHref({ range, platform: p.key }) : trackerHref({ range });

  if (platforms.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">No applications in this period.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {top && (
        <p className="text-sm text-foreground">
          <strong className="font-semibold">{formatPlatformLabel(top.label)}</strong> is clearly ahead:{" "}
          {top.interviewed.k} of {top.total} applications reached an interview ({formatPct(top.interviewed.pct)}).
        </p>
      )}

      {/* Phones and tablets: one card per platform */}
      <ul className="lg:hidden flex flex-col gap-2">
        {shown.map((p) => (
          <li key={p.key || "not-set"}>
            <Link
              href={href(p)}
              className="block rounded-lg border border-border/40 p-3 hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-medium text-foreground truncate">{formatPlatformLabel(p.label)}</span>
                <span className="text-sm text-muted-foreground tabular-nums shrink-0">{p.total} applications</span>
              </div>
              <dl className="mt-2 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Got a reply</dt>
                  <dd><RateCell rate={p.responded} /></dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Interview</dt>
                  <dd><RateCell rate={p.interviewed} /></dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Offers</dt>
                  <dd className="tabular-nums">{p.offers}</dd>
                </div>
              </dl>
              <div className="mt-2"><StatusMix platform={p} /></div>
            </Link>
          </li>
        ))}
      </ul>

      {/* Desktop: sortable table */}
      <div className="hidden lg:block overflow-hidden rounded-lg border border-border/40">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              {COLUMNS.map((col) => {
                const active = psort === col.key;
                const Icon = active ? (pdir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={active ? (pdir === "asc" ? "ascending" : "descending") : "none"}
                    className={cn("px-3 py-2 font-medium text-muted-foreground", col.align === "right" ? "text-right" : "text-left")}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded px-1 -mx-1 py-0.5 hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active && "text-foreground",
                      )}
                    >
                      {col.label}
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  </th>
                );
              })}
              <th scope="col" className="px-3 py-2 text-left font-medium text-muted-foreground w-[22%]">
                Status mix
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {shown.map((p) => (
              <tr key={p.key || "not-set"} className="hover:bg-accent/20">
                <th scope="row" className="px-3 py-2.5 text-left font-medium">
                  <Link href={href(p)} className="text-foreground hover:underline underline-offset-4">
                    {formatPlatformLabel(p.label)}
                  </Link>
                </th>
                <td className="px-3 py-2.5 text-right tabular-nums">{p.total}</td>
                <td className="px-3 py-2.5 text-right"><RateCell rate={p.responded} /></td>
                <td className="px-3 py-2.5 text-right"><RateCell rate={p.interviewed} /></td>
                <td className="px-3 py-2.5 text-right tabular-nums">{p.offers}</td>
                <td className="px-3 py-2.5"><StatusMix platform={p} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Rates show once a platform has 10 applications; before that they are marked early.
        </p>
        {platforms.length > TOP_N && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setParams({ pall: !pall })}
            className="h-8 text-xs gap-1.5 cursor-pointer"
          >
            {pall ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {pall ? `Show top ${TOP_N}` : `Show all ${platforms.length} platforms`}
          </Button>
        )}
      </div>
    </div>
  );
}


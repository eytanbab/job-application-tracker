"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import type { ActivityBucket } from "@/lib/analytics/summarize";
import { statusLabel } from "@/lib/analytics/format";
import { statusColor, type StatusKind } from "@/lib/utils";

export interface PlotProps {
  buckets: ActivityBucket[];
  labels: string[];
  view: "status" | "total";
  kinds: StatusKind[];
}

type Row = { label: string; total: number } & Partial<Record<StatusKind, number>>;

function ActivityTooltip({ active, payload, label }: TooltipContentProps<ValueType, NameType>) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as Row;
  const parts = payload.filter((p) => Number(p.value ?? 0) > 0);
  return (
    <div className="rounded-lg border border-border/60 bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground">{label}</p>
      <p className="text-muted-foreground mb-1">{row.total} {row.total === 1 ? "application" : "applications"}</p>
      {parts.length > 1 &&
        parts.map((p) => (
          <p key={String(p.dataKey)} className="flex items-center gap-1.5 text-foreground">
            <span className="h-2 w-2 rounded-sm" style={{ background: p.color }} aria-hidden />
            {statusLabel(p.dataKey as StatusKind)}: {String(p.value)}
          </p>
        ))}
    </div>
  );
}

/** The Recharts part of the activity chart, loaded on the client only. */
export default function ActivityChartPlot({ buckets, labels, view, kinds }: PlotProps) {
  const data: Row[] = buckets.map((b, i) => ({ label: labels[i], total: b.total, ...b.byKind }));
  const series = view === "status" ? kinds : [];

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barCategoryGap="20%">
        <CartesianGrid vertical={false} stroke="hsl(var(--border))" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval="preserveStartEnd"
          minTickGap={16}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
        />
        <YAxis
          allowDecimals={false}
          width={32}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
        />
        <Tooltip content={ActivityTooltip} cursor={{ fill: "hsl(var(--muted) / 0.5)" }} />
        {view === "total" ? (
          <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        ) : (
          series.map((kind) => (
            <Bar
              key={kind}
              dataKey={kind}
              stackId="status"
              fill={statusColor(kind)}
              // A 2px card-coloured edge separates stacked segments
              stroke="hsl(var(--card))"
              strokeWidth={2}
              isAnimationActive={false}
            />
          ))
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}

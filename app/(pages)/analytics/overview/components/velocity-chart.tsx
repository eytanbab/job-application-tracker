"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface VelocityChartProps {
  data: { date: string; count: number }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border/50 bg-card p-3 shadow-md shadow-black/5">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{label}</p>
        <p className="text-sm font-bold tabular-nums text-foreground">
          {payload[0].value} <span className="text-xs font-medium text-muted-foreground ml-1">applications</span>
        </p>
      </div>
    );
  }
  return null;
};

export function VelocityChart({ data }: VelocityChartProps) {
  return (
    <div className="col-span-full xl:col-span-4 p-6 rounded-xl border border-border/50 bg-card flex flex-col">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground">Application Velocity</h3>
        <p className="text-[13px] text-muted-foreground mt-1">Submission volume over time</p>
      </div>

      <div className="flex-1 w-full h-[200px] min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis 
              dataKey="date" 
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              dy={10}
            />
            <YAxis 
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              allowDecimals={false}
            />
            <Tooltip 
              cursor={{ fill: "hsl(var(--secondary))", opacity: 0.8 }}
              content={<CustomTooltip />}
            />
            <Bar 
              dataKey="count" 
              fill="hsl(var(--primary))" 
              radius={[4, 4, 0, 0]} 
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

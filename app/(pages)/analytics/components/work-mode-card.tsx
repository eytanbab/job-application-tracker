"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Laptop, Building, Compass, Sparkles } from "lucide-react";
import type { WorkModeData } from "../insights/actions";

interface WorkModeCardProps {
  modes: WorkModeData[];
}

export function WorkModeCard({ modes }: WorkModeCardProps) {
  const totalApps = modes.reduce((acc, curr) => acc + curr.total, 0);

  if (totalApps === 0) {
    return (
      <Card className="bg-card shadow-2xs border border-border/30 rounded-xl h-full flex flex-col justify-between">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-bold">
            Work Mode & Location Yield
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Interview conversion by Remote, Hybrid, and On-site targeting
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-6 text-center text-xs text-muted-foreground">
          No location or work mode data recorded for this timeframe.
        </CardContent>
      </Card>
    );
  }

  // Find highest yield mode with at least 1 application
  const activeModes = modes.filter((m) => m.total > 0);
  const bestMode = [...activeModes].sort((a, b) => b.yieldRate - a.yieldRate)[0];

  const getIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "remote":
        return Laptop;
      case "hybrid":
        return Compass;
      default:
        return Building;
    }
  };

  return (
    <Card className="bg-card shadow-2xs border border-border/30 rounded-xl h-full flex flex-col justify-between">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-bold">
              Work Mode & Location
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Targeting distribution and interview yield by workplace setup
            </CardDescription>
          </div>
          {bestMode && bestMode.yieldRate > 0 && (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-semibold gap-1 shrink-0"
            >
              <Sparkles className="h-3 w-3" />
              Top Yield: {bestMode.name}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        {modes.map((mode) => {
          const Icon = getIcon(mode.name);
          return (
            <div
              key={mode.name}
              className="p-2.5 rounded-lg bg-background border border-border/40 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-muted text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="font-semibold text-foreground">{mode.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    ({mode.sharePct.toFixed(0)}% of apps)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      mode.yieldRate > 0
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-semibold"
                        : "bg-muted text-muted-foreground border-border/40 text-[10px] font-semibold"
                    }
                  >
                    {mode.yieldRate.toFixed(1)}% yield
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                <span>
                  {mode.interviews} {mode.interviews === 1 ? "interview" : "interviews"} from {mode.total} {mode.total === 1 ? "app" : "apps"}
                </span>
              </div>

              {/* Share bar */}
              <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary/70 rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(mode.sharePct, mode.total > 0 ? 3 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

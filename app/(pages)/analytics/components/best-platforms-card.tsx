import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";

type Props = {
  bestPlatform: {
    name: string;
    total: number;
    interviews: number;
    interviewRate: number;
  } | null;
  secondBest: {
    name: string;
    total: number;
    interviews: number;
    interviewRate: number;
  } | null;
  multiplier: number;
};

export function BestPlatformsCard({
  bestPlatform,
  secondBest,
  multiplier,
}: Props) {
  return (
    <Card className="bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Best Performing Platform
        </CardTitle>
        <Target className="h-4 w-4 text-emerald-500/70" />
      </CardHeader>
      <CardContent>
        {!bestPlatform ? (
          <div className="pt-2">
            <p className="text-sm text-muted-foreground/90 font-medium">
              Apply to more jobs to see platform insights
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="flex items-end gap-2">
              <p className="text-2xl font-extrabold text-foreground">
                {bestPlatform.name}
              </p>
              <span className="mb-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                {bestPlatform.interviewRate.toFixed(1)}% rate
              </span>
            </div>
            {bestPlatform.interviewRate === 0 ? (
              <p className="text-xs text-muted-foreground mt-1">
                No interviews recorded on this platform yet. Keep applying to unlock conversion insights.
              </p>
            ) : multiplier > 1 && secondBest && secondBest.interviewRate > 0 ? (
              <p className="text-xs text-muted-foreground mt-1">
                You get {multiplier.toFixed(1)}× more interviews from{" "}
                {bestPlatform.name} than {secondBest.name}. Focus there.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                Your highest converting job platform right now.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

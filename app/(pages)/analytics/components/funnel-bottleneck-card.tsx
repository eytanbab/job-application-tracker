import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

type Props = {
  status: "empty" | "gathering" | "resume_bottleneck" | "interview_bottleneck" | "healthy";
  stage: string;
  headline: string;
  description: string;
  actionAdvice: string;
  health: "neutral" | "warning" | "healthy";
};

export function FunnelBottleneckCard({
  stage,
  headline,
  description,
  actionAdvice,
  health,
}: Props) {
  return (
    <Card className="bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Funnel Bottleneck Diagnostic
        </CardTitle>
        {health === "healthy" ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500/70" />
        ) : health === "warning" ? (
          <AlertTriangle className="h-4 w-4 text-amber-500/70" />
        ) : (
          <Info className="h-4 w-4 text-muted-foreground/70" />
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <p className="text-base font-bold text-foreground truncate">
            {headline}
          </p>
          <Badge
            variant="outline"
            className={
              health === "healthy"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] shrink-0 font-semibold"
                : health === "warning"
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] shrink-0 font-semibold"
                  : "bg-muted text-muted-foreground border-border/40 text-[10px] shrink-0 font-semibold"
            }
          >
            {stage}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground">
          {description}
        </p>

        <div className="rounded-lg bg-muted/50 p-2 border border-border/30 mt-1">
          <p className="text-[11px] font-medium text-foreground/90 leading-tight">
            💡 <span className="font-semibold">Coaching:</span> {actionAdvice}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

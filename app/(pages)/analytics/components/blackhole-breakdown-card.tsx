import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { HelpCircle, XCircle } from "lucide-react";

type Props = {
  ghosted: number;
  rejected: number;
  ghostedPct: number;
  rejectedPct: number;
};

export function BlackHoleBreakdownCard({
  ghosted,
  rejected,
  ghostedPct,
  rejectedPct,
}: Props) {
  const total = ghosted + rejected;

  return (
    <Card className="w-full bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold">
          Unsuccessful Endings Analysis
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Ratio of applications that ended in ghosting vs explicit rejections
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-2">
        {total === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No unreturned or rejected applications recorded
          </p>
        ) : (
          <>
            {/* Segmented bar */}
            <div className="flex flex-col gap-1.5">
              <div
                role="img"
                aria-label={`Unsuccessful endings distribution: ${ghosted} ghosted (${ghostedPct.toFixed(1)}%), ${rejected} explicit rejections (${rejectedPct.toFixed(1)}%)`}
                className="h-3.5 w-full rounded-full bg-muted/60 flex overflow-hidden p-0.5 gap-0.5"
              >
                <div
                  className="h-full rounded-sm bg-slate-400 dark:bg-slate-500 bg-[linear-gradient(135deg,rgba(255,255,255,0.25)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.25)_50%,rgba(255,255,255,0.25)_75%,transparent_75%)] bg-[size:8px_8px] transition-all duration-500"
                  style={{ width: `${Math.max(ghostedPct, 2)}%` }}
                  title={`Ghosted (Striped Pattern): ${ghosted} (${ghostedPct.toFixed(1)}%)`}
                />
                <div
                  className="h-full rounded-sm bg-rose-500 transition-all duration-500"
                  style={{ width: `${Math.max(rejectedPct, 2)}%` }}
                  title={`Rejected (Solid Red): ${rejected} (${rejectedPct.toFixed(1)}%)`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-500/10 border border-slate-500/20">
                <HelpCircle className="h-5 w-5 text-slate-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Ghosted (30+ Days)
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {ghosted}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({ghostedPct.toFixed(1)}%)
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <XCircle className="h-5 w-5 text-rose-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    Explicit Rejections
                  </p>
                  <p className="text-lg font-bold text-foreground">
                    {rejected}{" "}
                    <span className="text-xs font-normal text-muted-foreground">
                      ({rejectedPct.toFixed(1)}%)
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

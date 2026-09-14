import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BellRing, Ghost } from "lucide-react";

type Props = {
  count: number;
  companies: string[];
  oldestDays: number;
  followUpCount?: number;
  followUpCompanies?: string[];
};

export function GhostingRiskCard({
  count,
  companies,
  oldestDays,
  followUpCount = 0,
  followUpCompanies = [],
}: Props) {
  const isAllClear = count === 0 && followUpCount === 0;

  return (
    <Card className="bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          {followUpCount > 0 ? (
            <BellRing className="h-4 w-4 text-blue-500/70 shrink-0" />
          ) : (
            <Ghost
              className={`h-4 w-4 shrink-0 ${isAllClear ? "text-emerald-500/70" : "text-amber-500/70"}`}
            />
          )}
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Follow-Up & Ghosting Radar
          </CardTitle>
        </div>
        {followUpCount > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/30">
            {followUpCount} Actionable
          </span>
        )}
      </CardHeader>
      <CardContent>
        {isAllClear ? (
          <div className="pt-2">
            <p className="text-2xl font-extrabold text-foreground">0</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              All Clear
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              No stale applications or pending follow-ups. Pipeline is fresh!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Follow-up Section (7-14 Days) */}
            {followUpCount > 0 && (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                    {followUpCount} for Follow-Up (7–14d)
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Optimal nudge window
                  </span>
                </div>
                {followUpCompanies.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    {followUpCompanies.map((company) => (
                      <Link
                        key={company}
                        href={`/applications?q=${encodeURIComponent(company)}`}
                        className="rounded-md bg-blue-500/10 hover:bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300 transition-colors cursor-pointer inline-flex items-center gap-1 border border-blue-500/20"
                      >
                        {company}
                        <span className="text-[10px] opacity-70">→</span>
                      </Link>
                    ))}
                    <Link
                      href="/applications"
                      className="text-[11px] text-primary hover:underline font-medium ml-1 cursor-pointer"
                    >
                      View all pipeline →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Stale Ghosting Section (>30 Days) */}
            {count > 0 && (
              <div className="flex flex-col gap-1.5 border-t border-border/30 pt-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                    {count} Stale / Ghosted (&gt;30d)
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Oldest: {oldestDays}d
                  </span>
                </div>
                {companies.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                    {companies.map((company) => (
                      <Link
                        key={company}
                        href={`/applications?q=${encodeURIComponent(company)}`}
                        className="rounded-md bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-700 dark:text-amber-300 transition-colors cursor-pointer inline-flex items-center gap-1 border border-amber-500/20"
                      >
                        {company}
                        <span className="text-[10px] opacity-70">→</span>
                      </Link>
                    ))}
                    <Link
                      href="/applications?status=ghosted"
                      className="text-[11px] text-muted-foreground hover:text-foreground font-medium ml-1 cursor-pointer"
                    >
                      View ghosted list →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Follow-Up & Ghosting Radar
        </CardTitle>
        {followUpCount > 0 ? (
          <BellRing className="h-4 w-4 text-blue-500/70" />
        ) : (
          <Ghost
            className={`h-4 w-4 ${isAllClear ? "text-emerald-500/70" : "text-amber-500/70"}`}
          />
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
          <div className="flex flex-col gap-2.5">
            {/* Follow-up Section (7-14 Days) */}
            {followUpCount > 0 && (
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {followUpCount} for Follow-Up (7–14d)
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Optimal nudge window
                  </span>
                </div>
                {followUpCompanies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {followUpCompanies.map((company) => (
                      <Link
                        key={company}
                        href={`/applications?q=${encodeURIComponent(company)}`}
                        className="rounded bg-blue-500/10 hover:bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-400 transition-colors cursor-pointer"
                      >
                        {company} →
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stale Ghosting Section (>30 Days) */}
            {count > 0 && (
              <div className="flex flex-col gap-1 border-t border-border/30 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    {count} Stale / Ghosted (&gt;30d)
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Oldest: {oldestDays}d
                  </span>
                </div>
                {companies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {companies.map((company) => (
                      <Link
                        key={company}
                        href={`/applications?q=${encodeURIComponent(company)}`}
                        className="rounded bg-amber-500/10 hover:bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
                      >
                        {company} →
                      </Link>
                    ))}
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

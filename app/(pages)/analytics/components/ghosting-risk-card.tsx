import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ghost } from "lucide-react";

type Props = {
  count: number;
  companies: string[];
  oldestDays: number;
};

export function GhostingRiskCard({ count, companies, oldestDays }: Props) {
  const isAllClear = count === 0;

  return (
    <Card className="bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Ghosting Risk
        </CardTitle>
        <Ghost
          className={`h-4 w-4 ${isAllClear ? "text-emerald-500/70" : "text-amber-500/70"}`}
        />
      </CardHeader>
      <CardContent>
        {isAllClear ? (
          <div className="pt-2">
            <p className="text-2xl font-extrabold text-foreground">0</p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              All Clear
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              No stale applications. Your pipeline is fresh!
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="flex items-end gap-2">
              <p className="text-2xl font-extrabold text-foreground">{count}</p>
              <span className="mb-1 text-sm font-medium text-muted-foreground">
                applications
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              You have {count} {count === 1 ? "application" : "applications"}{" "}
              older than 30 days with no response.
            </p>

            {companies.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {companies.map((company) => (
                  <Link
                    key={company}
                    href={`/applications?search=${encodeURIComponent(company)}`}
                    className="rounded bg-amber-500/10 hover:bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400 transition-colors cursor-pointer"
                  >
                    {company} →
                  </Link>
                ))}
              </div>
            )}

            <p className="text-[10px] text-muted-foreground font-semibold mt-2 uppercase tracking-wider">
              Oldest: {oldestDays} days
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

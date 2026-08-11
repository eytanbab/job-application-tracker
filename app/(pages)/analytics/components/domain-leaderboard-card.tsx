import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link as LinkIcon } from "lucide-react";

type DomainItem = {
  domain: string;
  total: number;
  interviews: number;
  successRate: number;
};

type Props = {
  domains: DomainItem[];
};

export function DomainLeaderboardCard({ domains }: Props) {
  const topDomain = domains.length > 0 ? domains[0] : null;

  return (
    <Card className="w-full bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-bold">
          ATS Domain Performance
        </CardTitle>
        <LinkIcon className="h-4 w-4 text-muted-foreground/70" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3.5 pt-2">
        {domains.length === 0 ? (
          <p className="text-sm text-muted-foreground/90 font-medium py-4 text-center">
            No domain data available
          </p>
        ) : (
          <>
            {domains.map((item, index) => {
              const percentageVal = Number(item.successRate.toFixed(1));
              const percentageText = item.successRate.toFixed(1);
              return (
                <div key={item.domain} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="truncate font-medium text-foreground max-w-[220px]">
                      <span className="text-muted-foreground/70 font-semibold mr-2">
                        #{index + 1}
                      </span>
                      {item.domain}
                    </span>
                    <span className="text-muted-foreground font-semibold text-[11px]">
                      {item.total} {item.total === 1 ? "app" : "apps"} (
                      {percentageText}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500"
                      style={{ width: `${Math.max(percentageVal, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}

            {topDomain && topDomain.successRate > 0 && (
              <p className="text-xs text-muted-foreground mt-2 border-t border-border/40 pt-3">
                Jobs from{" "}
                <span className="font-semibold text-foreground">
                  {topDomain.domain}
                </span>{" "}
                convert {topDomain.successRate.toFixed(1)}% to interviews.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

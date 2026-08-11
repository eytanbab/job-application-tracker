import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase } from "lucide-react";

type RoleItem = {
  name: string;
  count: number;
};

type Props = {
  roles: RoleItem[];
};

export function RoleTargetingCard({ roles }: Props) {
  const totalCount = roles.reduce((acc, r) => acc + r.count, 0);

  return (
    <Card className="w-full bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-bold">
          Role Targeting Distribution
        </CardTitle>
        <Briefcase className="h-4 w-4 text-primary/80" />
      </CardHeader>
      <CardContent className="flex flex-col gap-3.5 pt-2">
        {roles.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No role targeting data available
          </p>
        ) : (
          <>
            {roles.map((item, index) => {
              const pct = totalCount > 0 ? (item.count / totalCount) * 100 : 0;
              return (
                <div key={item.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span className="truncate font-medium text-foreground max-w-[220px]">
                      <span className="text-muted-foreground/70 font-semibold mr-2">
                        #{index + 1}
                      </span>
                      {item.name}
                    </span>
                    <span className="text-muted-foreground font-semibold text-[11px]">
                      {item.count} {item.count === 1 ? "app" : "apps"} (
                      {pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </CardContent>
    </Card>
  );
}

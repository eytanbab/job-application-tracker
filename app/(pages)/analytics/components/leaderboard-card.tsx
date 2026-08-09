'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Item = {
  name: string;
  freq: number;
};

type Props = {
  title: string;
  data: Item[];
  total: number;
};

export function LeaderboardCard({ title, data, total }: Props) {
  return (
    <Card className="w-full bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3.5 pt-2">
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No data available</p>
        ) : (
          data.map((item, index) => {
            const percentage = total > 0 ? Math.round((item.freq / total) * 100) : 0;
            return (
              <div key={item.name} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="truncate font-medium text-foreground max-w-[220px]">
                    <span className="text-muted-foreground/70 font-semibold mr-2">#{index + 1}</span>
                    {item.name}
                  </span>
                  <span className="text-muted-foreground font-semibold text-[11px]">
                    {item.freq} {item.freq === 1 ? 'app' : 'apps'} ({percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.max(percentage, 5)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

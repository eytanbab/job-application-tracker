'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import dynamicImport from 'next/dynamic';
import { cn } from '@/lib/utils';
import { BarChart3, Layers } from 'lucide-react';

const StatusesPerYearBarChart = dynamicImport(
  () => import('./statuses-per-year-bar-chart').then((m) => m.StatusesPerYearBarChart),
  { loading: () => <div className="h-64 bg-card rounded-xl border border-border/30 animate-pulse" /> }
);

const TotalApplicationsPerYearBarChart = dynamicImport(
  () => import('./total-applications-per-year-bar-chart').then((m) => m.TotalApplicationsPerYearBarChart),
  { loading: () => <div className="h-64 bg-card rounded-xl border border-border/30 animate-pulse" /> }
);


interface YearlyTrendsCardProps {
  years: string[];
  statusesPerYear: any[];
  applicationsPerYear: any[];
  globalYear?: string;
}

export function YearlyTrendsCard({
  years,
  statusesPerYear,
  applicationsPerYear,
  globalYear,
}: YearlyTrendsCardProps) {
  const [activeTab, setActiveTab] = useState<'status' | 'volume'>('status');

  return (
    <Card className="w-full bg-card shadow-2xs border border-border/30 rounded-xl overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-border/30">
        <div>
          <CardTitle className="text-lg font-bold text-foreground">Yearly Application Trends</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Interactive breakdown of volume and status progression over time
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex items-center rounded-md bg-muted/60 p-1 gap-1 border border-border/20">
          <button
            type="button"
            onClick={() => setActiveTab('status')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer',
              activeTab === 'status'
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Status Breakdown</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('volume')}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer',
              activeTab === 'volume'
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>Total Volume</span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-6">
        {activeTab === 'status' ? (
          <StatusesPerYearBarChart
            years={years}
            rawData={statusesPerYear}
            globalYear={globalYear}
          />
        ) : (
          <TotalApplicationsPerYearBarChart
            years={years}
            data={applicationsPerYear}
            globalYear={globalYear}
          />
        )}
      </CardContent>
    </Card>
  );
}

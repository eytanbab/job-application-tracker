'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Globe } from 'lucide-react';
import { getStatusKind, statusLabels, StatusKind } from '@/lib/utils';

type PlatformData = {
  platformName: string;
  statuses: { status: string; value: number }[];
  total?: number;
  interviewCount?: number;
};

interface PlatformRoiDashboardProps {
  data: PlatformData[];
}

const getStatusBgColor = (kind: StatusKind) => {
  switch (kind) {
    case 'accepted': return 'bg-emerald-500';
    case 'interview': return 'bg-blue-500';
    case 'review': return 'bg-amber-500';
    case 'rejected': return 'bg-rose-500';
    case 'ghosted': return 'bg-slate-400';
    case 'applied': return 'bg-primary/50';
    default: return 'bg-muted-foreground/30';
  }
};

export function PlatformRoiDashboard({ data }: PlatformRoiDashboardProps) {
  const [sortBy, setSortBy] = useState<'total' | 'interview' | 'response' | 'name'>('total');

  if (!data || data.length === 0) {
    return (
      <div className='flex h-60 items-center justify-center rounded-lg border border-dashed p-8 text-center'>
        <p className='text-muted-foreground'>No platform application data found for the selected period.</p>
      </div>
    );
  }

  // Calculate platform stats with conversions
  const enrichedPlatforms = data.map((item) => {
    const total = item.total || item.statuses.reduce((acc, s) => acc + s.value, 0);
    
    const interviewCount = item.interviewCount ?? item.statuses.reduce((acc, s) => {
      const kind = getStatusKind(s.status);
      return (kind === 'interview' || kind === 'accepted') ? acc + s.value : acc;
    }, 0);

    const offerCount = item.statuses.reduce((acc, s) => {
      return getStatusKind(s.status) === 'accepted' ? acc + s.value : acc;
    }, 0);

    const respondedCount = item.statuses.reduce((acc, s) => {
      const kind = getStatusKind(s.status);
      return (kind === 'interview' || kind === 'accepted' || kind === 'rejected') ? acc + s.value : acc;
    }, 0);

    const responseRate = total > 0 ? (respondedCount / total) * 100 : 0;
    const interviewRate = total > 0 ? (interviewCount / total) * 100 : 0;

    return {
      ...item,
      total,
      interviewCount,
      offerCount,
      respondedCount,
      responseRate,
      interviewRate,
    };
  });

  // Sort platforms based on user preference
  const sortedPlatforms = [...enrichedPlatforms].sort((a, b) => {
    if (sortBy === 'total') return b.total - a.total;
    if (sortBy === 'interview') return b.interviewRate - a.interviewRate;
    if (sortBy === 'response') return b.responseRate - a.responseRate;
    return a.platformName.localeCompare(b.platformName);
  });

  // Top Interview platform (where interviewCount > 0)
  const topInterviewPlatform = [...enrichedPlatforms]
    .filter(p => p.interviewCount > 0 && p.total >= 2)
    .sort((a, b) => b.interviewRate - a.interviewRate)[0];

  // Top Response platform (overall responses)
  const topResponsePlatform = [...enrichedPlatforms]
    .filter(p => p.respondedCount > 0 && p.total >= 2)
    .sort((a, b) => b.responseRate - a.responseRate)[0];

  return (
    <div className='flex flex-col gap-6 w-full opacity-100 transition-opacity duration-500'>
      
      {/* Platform Highlight Banner */}
      {topInterviewPlatform ? (
        <Card className='relative overflow-hidden border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 via-accent/5 to-transparent backdrop-blur-sm'>
          <CardHeader className='pb-2'>
            <div className='flex items-center gap-2'>
              <Sparkles className='h-5 w-5 text-emerald-500 animate-bounce' />
              <CardTitle className='text-base font-semibold'>Top Interview Channel</CardTitle>
            </div>
            <CardDescription className='text-sm text-foreground/80 font-medium mt-1'>
              <strong className='text-primary capitalize'>{topInterviewPlatform.platformName}</strong> is your highest-yielding interview source with a{' '}
              <strong className='text-emerald-500'>{topInterviewPlatform.interviewRate.toFixed(1)}% interview conversion rate</strong> ({topInterviewPlatform.interviewCount} {topInterviewPlatform.interviewCount === 1 ? 'interview' : 'interviews'} from {topInterviewPlatform.total} applications).
            </CardDescription>
          </CardHeader>
        </Card>
      ) : topResponsePlatform ? (
        <Card className='relative overflow-hidden border border-primary/20 bg-gradient-to-r from-primary/10 via-accent/5 to-transparent backdrop-blur-sm'>
          <CardHeader className='pb-2'>
            <div className='flex items-center gap-2'>
              <Sparkles className='h-5 w-5 text-primary animate-bounce' />
              <CardTitle className='text-base font-semibold'>Top Response Channel</CardTitle>
            </div>
            <CardDescription className='text-sm text-foreground/80 font-medium mt-1'>
              <strong className='text-primary capitalize'>{topResponsePlatform.platformName}</strong> has your highest overall response rate at{' '}
              <strong className='text-primary'>{topResponsePlatform.responseRate.toFixed(1)}%</strong> ({topResponsePlatform.respondedCount} {topResponsePlatform.respondedCount === 1 ? 'response' : 'responses'} from {topResponsePlatform.total} applications).
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {/* Controls & Sorting Header */}
      <div className='flex items-center justify-between flex-wrap gap-3 pb-1'>
        <h2 className='text-lg font-bold flex items-center gap-2'>
          <Globe className='h-5 w-5 text-primary' />
          Platform Conversion & Yield Matrix
        </h2>
        <div className='flex items-center gap-2 text-xs font-medium'>
          <span className='text-muted-foreground'>Sort by:</span>
          <Button
            variant={sortBy === 'total' ? 'secondary' : 'ghost'}
            size='sm'
            onClick={() => setSortBy('total')}
            className='h-7 text-xs px-2.5'
          >
            Volume
          </Button>
          <Button
            variant={sortBy === 'interview' ? 'secondary' : 'ghost'}
            size='sm'
            onClick={() => setSortBy('interview')}
            className='h-7 text-xs px-2.5'
          >
            Interview Rate
          </Button>
          <Button
            variant={sortBy === 'response' ? 'secondary' : 'ghost'}
            size='sm'
            onClick={() => setSortBy('response')}
            className='h-7 text-xs px-2.5'
          >
            Response Rate
          </Button>
          <Button
            variant={sortBy === 'name' ? 'secondary' : 'ghost'}
            size='sm'
            onClick={() => setSortBy('name')}
            className='h-7 text-xs px-2.5'
          >
            Name
          </Button>
        </div>
      </div>

      {/* Platform ROI Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {sortedPlatforms.map((platform) => {
          return (
            <Card
              key={platform.platformName}
              className='bg-background/40 backdrop-blur border border-border/50 hover:border-primary/30 transition-colors duration-300 flex flex-col justify-between'
            >
              <CardHeader className='pb-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2.5'>
                    <div className='h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary capitalize text-sm'>
                      {platform.platformName.slice(0, 2)}
                    </div>
                    <div>
                      <CardTitle className='text-base font-semibold capitalize'>
                        {platform.platformName}
                      </CardTitle>
                      <CardDescription className='text-xs'>
                        {platform.total} total {platform.total === 1 ? 'application' : 'applications'}
                      </CardDescription>
                    </div>
                  </div>
                  <div className='flex items-center gap-1.5'>
                    <Badge
                      variant={platform.interviewRate > 0 ? 'default' : 'outline'}
                      className={platform.interviewRate > 0 ? 'bg-blue-500/15 text-blue-500 hover:bg-blue-500/20 border-blue-500/30' : ''}
                    >
                      {platform.interviewRate.toFixed(1)}% interview
                    </Badge>
                    <Badge
                      variant={platform.responseRate >= 20 ? 'default' : 'outline'}
                      className={platform.responseRate >= 20 ? 'bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/30' : ''}
                    >
                      {platform.responseRate.toFixed(1)}% response
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className='flex flex-col gap-4 pt-0'>
                {/* Segmented Status Progress Bar */}
                <div className='flex flex-col gap-1.5'>
                  <div className='flex items-center justify-between text-[11px] font-medium text-muted-foreground'>
                    <span>Pipeline breakdown</span>
                    <span>{platform.interviewCount} interviewed</span>
                  </div>
                  <div className='h-3 w-full rounded-full bg-muted/60 flex overflow-hidden p-0.5 gap-0.5' aria-label={`Pipeline breakdown for ${platform.platformName}`}>
                    {platform.statuses.map((s) => {
                      const kind = getStatusKind(s.status);
                      const widthPercent = platform.total > 0 ? (s.value / platform.total) * 100 : 0;
                      if (widthPercent <= 0) return null;
                      return (
                        <div
                          key={s.status}
                          aria-label={`${s.status}: ${s.value} (${widthPercent.toFixed(1)}%)`}
                          className={`h-full rounded-sm ${getStatusBgColor(kind)} transition-all duration-500`}
                          style={{ width: `${widthPercent}%` }}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Status Badges List with matching color dots */}
                <div className='flex flex-wrap gap-1.5 pt-1'>
                  {platform.statuses.map((s) => {
                    const kind = getStatusKind(s.status);
                    const label = statusLabels[kind] || s.status;
                    const pct = platform.total > 0 ? ((s.value / platform.total) * 100).toFixed(0) : '0';
                    return (
                      <span
                        key={s.status}
                        className='inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/50 text-[11px] text-foreground/80 font-medium'
                      >
                        <span className={`h-2 w-2 rounded-full shrink-0 ${getStatusBgColor(kind)}`} />
                        <span className='font-semibold text-foreground'>{s.value}</span>
                        <span className='capitalize'>{label}</span>
                        <span className='text-[10px] text-muted-foreground font-semibold'>({pct}%)</span>
                      </span>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

    </div>
  );
}

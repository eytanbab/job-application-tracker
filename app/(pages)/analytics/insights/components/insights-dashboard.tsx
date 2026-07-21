'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  AlertTriangle, 
  HelpCircle,
  FileText,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  TrendingDown
} from 'lucide-react';

interface InsightsDashboardProps {
  data: {
    total: number;
    stages: {
      applied: number;
      interview: number;
      accepted: number;
    };
    breakdown: {
      active: number;
      offered: number;
      rejectedResume: number;
      rejectedInterview: number;
      ghostedResume: number;
      ghostedInterview: number;
    };
    resumeConversion: number;
    interviewConversion: number;
  };
}

const chartConfig = {
  rejected: {
    label: 'Rejected',
    color: 'hsl(var(--status-rejected))',
  },
  ghosted: {
    label: 'Ghosted',
    color: 'hsl(var(--status-ghosted))',
  },
} satisfies ChartConfig;

export function InsightsDashboard({ data }: InsightsDashboardProps) {
  const { resumeConversion, interviewConversion, breakdown, stages, total } = data;

  if (total === 0) {
    return (
      <div className='flex h-[400px] flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center'>
        <HelpCircle className='h-12 w-12 text-muted-foreground/60 mb-4 animate-pulse' />
        <h3 className='text-lg font-semibold'>No Analytics Available</h3>
        <p className='text-muted-foreground max-w-sm mt-2'>
          Add some applications and record their interview or rejection status to unlock detailed journey insights.
        </p>
      </div>
    );
  }

  // 1. Identify primary bottleneck
  let bottleneckTitle = 'Application Funnel Healthy';
  let bottleneckDesc = 'Your conversion rates are stable across all stages. Keep up the great work!';
  let bottleneckStatus: 'healthy' | 'resume' | 'interview' = 'healthy';
  let recommendation = 'Maintain your current cadence, prioritize direct networking, and continue preparing for upcoming interviews.';
  
  if (resumeConversion < 15 && stages.applied >= 5) {
    bottleneckTitle = 'Resume / Sourcing Bottleneck';
    bottleneckDesc = `Your Resume Pass Rate is low (${resumeConversion.toFixed(1)}%). Most of your applications are ending before the interview stage.`;
    bottleneckStatus = 'resume';
    recommendation = 'Focus on optimizing your resume for ATS systems. Align keywords in your resume with job descriptions, tailor cover letters, and ensure your portfolio/GitHub links are prominent. Consider applying through employee referrals or direct messaging hiring managers.';
  } else if (interviewConversion < 25 && stages.interview >= 3) {
    bottleneckTitle = 'Interview Process Bottleneck';
    bottleneckDesc = `Your Interview Success Rate is low (${interviewConversion.toFixed(1)}%). You are securing interviews but finding it difficult to convert them into offers.`;
    bottleneckStatus = 'interview';
    recommendation = 'Focus on interview preparation. Dedicate time to mock interviews, practicing the STAR method for behavioral questions, refining your elevator pitch, and preparing deep questions about the company structure and challenges.';
  }

  // 2. Prepare chart data
  const lossBreakdownData = [
    {
      stage: 'Resume Screen',
      rejected: breakdown.rejectedResume,
      ghosted: breakdown.ghostedResume,
    },
    {
      stage: 'Post-Interview',
      rejected: breakdown.rejectedInterview,
      ghosted: breakdown.ghostedInterview,
    },
  ];

  return (
    <div className='flex flex-col gap-6 w-full animate-in fade-in duration-500'>
      
      {/* Dynamic Recommendation Panel */}
      <Card className='relative overflow-hidden border border-primary/20 bg-gradient-to-r from-primary/5 via-accent/5 to-transparent backdrop-blur-sm'>
        <div className='absolute right-0 top-0 h-40 w-40 bg-primary/5 rounded-full blur-3xl pointer-events-none' />
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Sparkles className='h-5 w-5 text-primary animate-bounce' />
              <CardTitle className='text-xl'>{bottleneckTitle}</CardTitle>
            </div>
            <Badge 
              variant={bottleneckStatus === 'healthy' ? 'default' : 'destructive'}
              className='capitalize font-semibold'
            >
              {bottleneckStatus === 'healthy' ? 'Good Status' : 'Issue Detected'}
            </Badge>
          </div>
          <CardDescription className='text-sm text-foreground/80 font-medium mt-2'>
            {bottleneckDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='rounded-lg bg-background/50 border p-4 text-sm leading-relaxed'>
            <span className='font-bold text-foreground block mb-1'>Actionable Recommendation:</span>
            <p className='text-muted-foreground'>{recommendation}</p>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Metric Cards */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <Card className='bg-background/40 hover:bg-background/60 transition-all duration-300 border border-border/50'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Resume Pass Rate</CardTitle>
            <FileText className='h-4 w-4 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{resumeConversion.toFixed(1)}%</div>
            <p className='text-xs text-muted-foreground mt-1'>
              Applied → Interview conversion
            </p>
            {resumeConversion < 15 && stages.applied >= 5 && (
              <span className='inline-flex items-center text-[10px] font-medium text-destructive mt-1 gap-1'>
                <TrendingDown className='h-3 w-3' /> Below average (target &gt; 15%)
              </span>
            )}
            {resumeConversion >= 15 && (
              <span className='inline-flex items-center text-[10px] font-medium text-emerald-500 mt-1 gap-1'>
                <TrendingUp className='h-3 w-3' /> Solid conversion!
              </span>
            )}
          </CardContent>
        </Card>

        <Card className='bg-background/40 hover:bg-background/60 transition-all duration-300 border border-border/50'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Interview Success Rate</CardTitle>
            <Users className='h-4 w-4 text-blue-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{interviewConversion.toFixed(1)}%</div>
            <p className='text-xs text-muted-foreground mt-1'>
              Interview → Offer conversion
            </p>
            {interviewConversion < 25 && stages.interview >= 3 && (
              <span className='inline-flex items-center text-[10px] font-medium text-destructive mt-1 gap-1'>
                <TrendingDown className='h-3 w-3' /> Below average (target &gt; 25%)
              </span>
            )}
            {interviewConversion >= 25 && (
              <span className='inline-flex items-center text-[10px] font-medium text-emerald-500 mt-1 gap-1'>
                <TrendingUp className='h-3 w-3' /> High interview pass!
              </span>
            )}
          </CardContent>
        </Card>

        <Card className='bg-background/40 hover:bg-background/60 transition-all duration-300 border border-border/50'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Active Pipeline</CardTitle>
            <TrendingUp className='h-4 w-4 text-emerald-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{breakdown.active}</div>
            <p className='text-xs text-muted-foreground mt-1'>
              Applications currently active
            </p>
          </CardContent>
        </Card>

        <Card className='bg-background/40 hover:bg-background/60 transition-all duration-300 border border-border/50'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>Job Offers Secured</CardTitle>
            <Award className='h-4 w-4 text-yellow-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{breakdown.offered}</div>
            <p className='text-xs text-muted-foreground mt-1'>
              Total job offers received
            </p>
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        
        {/* Journey Funnel Visualizer */}
        <Card className='lg:col-span-2 bg-background/40 border border-border/50'>
          <CardHeader>
            <CardTitle>Journey Funnel breakdown</CardTitle>
            <CardDescription>Visualizing unique applications progressing through key hiring milestones</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col gap-6 pt-4'>
            
            {/* Step-by-step funnel visualization */}
            <div className='flex flex-col md:flex-row items-stretch justify-between gap-4 md:gap-2 w-full'>
              
              {/* Applied Step */}
              <div className='flex-1 flex flex-col items-center justify-center p-4 rounded-xl border bg-background/60 backdrop-blur relative group hover:border-primary/40 transition-all duration-300'>
                <div className='absolute -top-3 left-4 px-2 py-0.5 rounded bg-primary/20 text-xs font-semibold text-primary'>Stage 1</div>
                <span className='text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1'>Applied</span>
                <span className='text-3xl font-extrabold text-foreground'>{stages.applied}</span>
                <span className='text-[10px] text-muted-foreground mt-1'>100% of pipeline</span>
              </div>

              {/* Arrow 1 */}
              <div className='flex items-center justify-center md:px-2'>
                <ArrowRight className='h-6 w-6 text-muted-foreground/40 rotate-90 md:rotate-0' />
              </div>

              {/* Interview Step */}
              <div className='flex-1 flex flex-col items-center justify-center p-4 rounded-xl border bg-background/60 backdrop-blur relative group hover:border-blue-500/40 transition-all duration-300'>
                <div className='absolute -top-3 left-4 px-2 py-0.5 rounded bg-blue-500/10 text-xs font-semibold text-blue-500'>Stage 2</div>
                <span className='text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1'>Interviewed</span>
                <span className='text-3xl font-extrabold text-blue-500'>{stages.interview}</span>
                <span className='text-[10px] text-muted-foreground mt-1'>
                  {resumeConversion.toFixed(1)}% conversion rate
                </span>
              </div>

              {/* Arrow 2 */}
              <div className='flex items-center justify-center md:px-2'>
                <ArrowRight className='h-6 w-6 text-muted-foreground/40 rotate-90 md:rotate-0' />
              </div>

              {/* Offer Step */}
              <div className='flex-1 flex flex-col items-center justify-center p-4 rounded-xl border bg-background/60 backdrop-blur relative group hover:border-yellow-500/40 transition-all duration-300'>
                <div className='absolute -top-3 left-4 px-2 py-0.5 rounded bg-yellow-500/10 text-xs font-semibold text-yellow-500'>Stage 3</div>
                <span className='text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1'>Offers Received</span>
                <span className='text-3xl font-extrabold text-yellow-500'>{stages.accepted}</span>
                <span className='text-[10px] text-muted-foreground mt-1'>
                  {interviewConversion.toFixed(1)}% interview to offer
                </span>
              </div>

            </div>

            {/* Explanatory text */}
            <div className='text-xs text-muted-foreground bg-muted/40 rounded-lg p-3 leading-relaxed border border-border/20'>
              <AlertTriangle className='h-4 w-4 inline mr-2 text-primary/70 align-text-bottom' />
              The journey timeline helps isolate where you are drop-off is occurring. If you security-check your resume formatting and tailoring, the applied-to-interview conversion can be boosted. Good interview practice optimizes Stage 3.
            </div>

          </CardContent>
        </Card>

        {/* Rejection and Ghosting Breakdown */}
        <Card className='bg-background/40 border border-border/50'>
          <CardHeader>
            <CardTitle>Drop-off Breakdown</CardTitle>
            <CardDescription>Analyzing the stages where opportunities were lost</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col items-center justify-center pt-2'>
            <ChartContainer config={chartConfig} className='w-full h-[220px]'>
              <BarChart accessibilityLayer data={lossBreakdownData}>
                <CartesianGrid vertical={false} strokeDasharray='3 3' stroke='hsl(var(--border))' />
                <XAxis
                  dataKey='stage'
                  tickLine={false}
                  tickMargin={8}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator='dashed' />}
                />
                <Bar dataKey='rejected' stackId='a' fill='var(--color-rejected)' radius={[0, 0, 4, 4]} />
                <Bar dataKey='ghosted' stackId='a' fill='var(--color-ghosted)' radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
            
            {/* Custom Legend */}
            <div className='flex gap-4 mt-2 text-xs'>
              <div className='flex items-center gap-1.5'>
                <span className='h-3 w-3 rounded bg-[hsl(var(--status-rejected))]' />
                <span className='text-muted-foreground'>Rejected</span>
              </div>
              <div className='flex items-center gap-1.5'>
                <span className='h-3 w-3 rounded bg-[hsl(var(--status-ghosted))]' />
                <span className='text-muted-foreground'>Ghosted / No Reply</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Granular Breakdown Table */}
      <Card className='bg-background/40 border border-border/50'>
        <CardHeader>
          <CardTitle>Detailed Breakdown Categories</CardTitle>
          <CardDescription>A granular review of all completed and ongoing applications in the selected filter</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='w-full overflow-auto rounded-lg border bg-background/50'>
            <table className='w-full text-sm text-left border-collapse'>
              <thead>
                <tr className='border-b bg-muted/30 text-muted-foreground text-xs font-semibold uppercase tracking-wider'>
                  <th className='p-3'>Search Phase</th>
                  <th className='p-3'>Sub-Category</th>
                  <th className='p-3 text-right'>Count</th>
                  <th className='p-3 text-right'>Percentage of Total</th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                <tr>
                  <td className='p-3 font-semibold text-primary' rowSpan={2}>Pre-Interview (Resume Screen)</td>
                  <td className='p-3'>Rejected before interview</td>
                  <td className='p-3 text-right font-medium'>{breakdown.rejectedResume}</td>
                  <td className='p-3 text-right text-muted-foreground'>
                    {total ? ((breakdown.rejectedResume / total) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
                <tr>
                  <td className='p-3'>Ghosted before interview</td>
                  <td className='p-3 text-right font-medium'>{breakdown.ghostedResume}</td>
                  <td className='p-3 text-right text-muted-foreground'>
                    {total ? ((breakdown.ghostedResume / total) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
                
                <tr>
                  <td className='p-3 font-semibold text-blue-500' rowSpan={2}>Post-Interview Stage</td>
                  <td className='p-3'>Rejected after interview(s)</td>
                  <td className='p-3 text-right font-medium'>{breakdown.rejectedInterview}</td>
                  <td className='p-3 text-right text-muted-foreground'>
                    {total ? ((breakdown.rejectedInterview / total) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
                <tr>
                  <td className='p-3'>Ghosted after interview(s)</td>
                  <td className='p-3 text-right font-medium'>{breakdown.ghostedInterview}</td>
                  <td className='p-3 text-right text-muted-foreground'>
                    {total ? ((breakdown.ghostedInterview / total) * 100).toFixed(1) : 0}%
                  </td>
                </tr>

                <tr className='bg-muted/10'>
                  <td className='p-3 font-semibold text-emerald-500'>Offer Stage</td>
                  <td className='p-3'>Accepted offer / Hired</td>
                  <td className='p-3 text-right font-semibold text-emerald-500'>{breakdown.offered}</td>
                  <td className='p-3 text-right text-muted-foreground'>
                    {total ? ((breakdown.offered / total) * 100).toFixed(1) : 0}%
                  </td>
                </tr>

                <tr>
                  <td className='p-3 font-semibold text-muted-foreground'>Ongoing Activity</td>
                  <td className='p-3'>Active Applications</td>
                  <td className='p-3 text-right font-medium'>{breakdown.active}</td>
                  <td className='p-3 text-right text-muted-foreground'>
                    {total ? ((breakdown.active / total) * 100).toFixed(1) : 0}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

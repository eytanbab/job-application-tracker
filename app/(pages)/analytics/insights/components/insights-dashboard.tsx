'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  TrendingDown,
  XCircle,
  Ghost
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

export function InsightsDashboard({ data }: InsightsDashboardProps) {
  const { resumeConversion, interviewConversion, breakdown, stages, total } = data;

  if (total === 0) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border/40 bg-card/40 p-8 text-center">
        <HelpCircle className="h-12 w-12 text-muted-foreground/60 mb-4 animate-pulse" />
        <h3 className="text-lg font-semibold">No Analytics Available</h3>
        <p className="text-muted-foreground max-w-sm mt-2">
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

  // 2. Drop-off breakdown items
  const totalDropOff = breakdown.rejectedResume + breakdown.ghostedResume + breakdown.rejectedInterview + breakdown.ghostedInterview;
  
  const dropOffItems = [
    {
      label: 'Pre-interview Rejections',
      sublabel: 'Resume Screen',
      count: breakdown.rejectedResume,
      icon: XCircle,
      badgeColor: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
      barColor: 'bg-rose-500',
    },
    {
      label: 'Pre-interview Ghosting',
      sublabel: 'No reply after apply',
      count: breakdown.ghostedResume,
      icon: Ghost,
      badgeColor: 'bg-slate-500/15 text-slate-600 dark:text-slate-400',
      barColor: 'bg-slate-400',
    },
    {
      label: 'Post-interview Rejections',
      sublabel: 'After 1+ rounds',
      count: breakdown.rejectedInterview,
      icon: XCircle,
      badgeColor: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      barColor: 'bg-amber-500',
    },
    {
      label: 'Post-interview Ghosting',
      sublabel: 'Silent after interviews',
      count: breakdown.ghostedInterview,
      icon: Ghost,
      badgeColor: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
      barColor: 'bg-indigo-400',
    },
  ];

  const calcPct = (num: number) => (total > 0 ? ((num / total) * 100).toFixed(1) : '0.0');

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-500">
      
      {/* Dynamic Recommendation Panel */}
      <Card className="relative overflow-hidden border border-border/30 bg-gradient-to-r from-primary/10 via-accent/5 to-card shadow-2xs rounded-2xl w-full">
        <div className="absolute right-0 top-0 h-40 w-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/15 text-primary shrink-0">
                <Sparkles className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg sm:text-xl font-bold">{bottleneckTitle}</CardTitle>
            </div>
            <Badge 
              variant="outline"
              className={
                bottleneckStatus === 'healthy'
                  ? 'bg-emerald-500/15 text-emerald-600 border-none font-semibold px-3 py-1 text-xs w-fit'
                  : 'bg-destructive/15 text-destructive border-none font-semibold px-3 py-1 text-xs w-fit'
              }
            >
              {bottleneckStatus === 'healthy' ? 'Good Status' : 'Issue Detected'}
            </Badge>
          </div>
          <CardDescription className="text-sm text-foreground/80 font-medium mt-2">
            {bottleneckDesc}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl bg-background/80 p-4 shadow-2xs space-y-1.5 border-none">
            <p className="text-xs font-bold text-foreground uppercase tracking-wider">
              Actionable Recommendation:
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {recommendation}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 w-full">
        <Card className="bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resume Pass Rate</CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{resumeConversion.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Applied &rarr; Interview conversion
            </p>
            {resumeConversion < 15 && stages.applied >= 5 && (
              <span className="inline-flex items-center text-[10px] font-medium text-destructive mt-1 gap-1">
                <TrendingDown className="h-3 w-3" /> Below average (target &gt; 15%)
              </span>
            )}
            {resumeConversion >= 15 && (
              <span className="inline-flex items-center text-[10px] font-medium text-emerald-500 mt-1 gap-1">
                <TrendingUp className="h-3 w-3" /> Solid conversion!
              </span>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Interview Success Rate</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{interviewConversion.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Interview &rarr; Offer conversion
            </p>
            {interviewConversion < 25 && stages.interview >= 3 && (
              <span className="inline-flex items-center text-[10px] font-medium text-destructive mt-1 gap-1">
                <TrendingDown className="h-3 w-3" /> Below average (target &gt; 25%)
              </span>
            )}
            {interviewConversion >= 25 && (
              <span className="inline-flex items-center text-[10px] font-medium text-emerald-500 mt-1 gap-1">
                <TrendingUp className="h-3 w-3" /> High interview pass!
              </span>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Pipeline</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{breakdown.active}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Applications currently active
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Job Offers Secured</CardTitle>
            <Award className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{breakdown.offered}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total job offers received
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        
        {/* Journey Funnel Visualizer */}
        <Card className="lg:col-span-2 bg-card shadow-2xs border border-border/30 rounded-2xl w-full">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Journey Funnel Breakdown</CardTitle>
            <CardDescription>Visualizing unique applications progressing through key hiring milestones</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 pt-2">
            
            {/* Step-by-step funnel visualization (Fixed badge overflow) */}
            <div className="flex flex-col md:flex-row items-stretch justify-between gap-4 md:gap-3 w-full">
              
              {/* Stage 1: Applied */}
              <div className="flex-1 flex flex-col items-center justify-between p-4 rounded-xl border border-border/30 bg-muted/20 backdrop-blur group hover:border-primary/40 transition-all duration-300 gap-3">
                <Badge variant="outline" className="bg-primary/15 text-primary border-none font-semibold text-[11px]">Stage 1</Badge>
                <div className="text-center space-y-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Applied</span>
                  <span className="text-3xl font-extrabold text-foreground">{stages.applied}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">100% of pipeline</span>
              </div>

              {/* Arrow 1 */}
              <div className="flex items-center justify-center md:px-1">
                <ArrowRight className="h-5 w-5 text-muted-foreground/40 rotate-90 md:rotate-0" />
              </div>

              {/* Stage 2: Interviewed */}
              <div className="flex-1 flex flex-col items-center justify-between p-4 rounded-xl border border-border/30 bg-muted/20 backdrop-blur group hover:border-blue-500/40 transition-all duration-300 gap-3">
                <Badge variant="outline" className="bg-blue-500/15 text-blue-500 border-none font-semibold text-[11px]">Stage 2</Badge>
                <div className="text-center space-y-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Interviewed</span>
                  <span className="text-3xl font-extrabold text-blue-500">{stages.interview}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {resumeConversion.toFixed(1)}% conversion rate
                </span>
              </div>

              {/* Arrow 2 */}
              <div className="flex items-center justify-center md:px-1">
                <ArrowRight className="h-5 w-5 text-muted-foreground/40 rotate-90 md:rotate-0" />
              </div>

              {/* Stage 3: Offers Received */}
              <div className="flex-1 flex flex-col items-center justify-between p-4 rounded-xl border border-border/30 bg-muted/20 backdrop-blur group hover:border-amber-500/40 transition-all duration-300 gap-3">
                <Badge variant="outline" className="bg-amber-500/15 text-amber-500 border-none font-semibold text-[11px]">Stage 3</Badge>
                <div className="text-center space-y-1">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Offers Received</span>
                  <span className="text-3xl font-extrabold text-amber-500">{stages.accepted}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {interviewConversion.toFixed(1)}% interview to offer
                </span>
              </div>

            </div>

            {/* Explanatory callout text */}
            <div className="text-xs text-muted-foreground bg-muted/30 rounded-xl p-3.5 leading-relaxed border border-border/20 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>
                The journey timeline helps isolate where drop-off is occurring. If you refine your resume formatting and tailoring, your applied-to-interview conversion can be boosted. Good interview practice optimizes Stage 3.
              </span>
            </div>

          </CardContent>
        </Card>

        {/* Multi-Stage Drop-off Breakdown (Redesigned List) */}
        <Card className="bg-card shadow-2xs border border-border/30 rounded-2xl w-full flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold">Drop-off Breakdown</CardTitle>
            <CardDescription>Categorizing where opportunities were lost ({totalDropOff} total)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-1">
            {dropOffItems.map((item) => {
              const IconComp = item.icon;
              const pct = total > 0 ? (item.count / total) * 100 : 0;
              return (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`p-1 rounded-md ${item.badgeColor}`}>
                        <IconComp className="h-3.5 w-3.5" />
                      </span>
                      <div>
                        <span className="font-semibold text-foreground block">{item.label}</span>
                        <span className="text-[10px] text-muted-foreground">{item.sublabel}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-foreground">{item.count}</span>
                      <span className="text-[11px] text-muted-foreground ml-1">({pct.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.barColor} transition-all duration-500`}
                      style={{ width: `${Math.max(pct, item.count > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

      </div>

      {/* 100% Full-Width Granular Breakdown Table Matrix */}
      <Card className="bg-card shadow-2xs border border-border/30 rounded-2xl w-full">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Detailed Breakdown Categories</CardTitle>
          <CardDescription>A granular review of all completed and ongoing applications in your pipeline</CardDescription>
        </CardHeader>
        <CardContent className="w-full p-4 sm:p-6 sm:pt-0">
          <div className="w-full overflow-x-auto rounded-xl border border-border/30 bg-card shadow-2xs">
            <table className="w-full text-sm text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-border/30 bg-muted/30 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4 w-[160px]">Stage Phase</th>
                  <th className="py-3 px-4 min-w-[200px]">Outcome Sub-Category</th>
                  <th className="py-3 px-4 min-w-[220px]">Visual Distribution</th>
                  <th className="py-3 px-4 text-right w-[90px]">Count</th>
                  <th className="py-3 px-4 text-right w-[130px]">Pipeline Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {/* 1. Rejected before interview */}
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="py-3.5 px-4">
                    <Badge variant="outline" className="bg-primary/15 text-primary border-none font-semibold text-xs">
                      Pre-Interview
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-foreground">Rejected before interview</td>
                  <td className="py-3.5 px-4">
                    <div className="w-full bg-muted/50 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-destructive h-full rounded-full transition-all duration-500"
                        style={{ width: `${calcPct(breakdown.rejectedResume)}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-foreground">{breakdown.rejectedResume}</td>
                  <td className="py-3.5 px-4 text-right">
                    <Badge variant="secondary" className="font-semibold text-xs">
                      {calcPct(breakdown.rejectedResume)}%
                    </Badge>
                  </td>
                </tr>

                {/* 2. Ghosted before interview */}
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="py-3.5 px-4">
                    <Badge variant="outline" className="bg-primary/15 text-primary border-none font-semibold text-xs">
                      Pre-Interview
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-foreground">Ghosted before interview</td>
                  <td className="py-3.5 px-4">
                    <div className="w-full bg-muted/50 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-slate-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${calcPct(breakdown.ghostedResume)}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-foreground">{breakdown.ghostedResume}</td>
                  <td className="py-3.5 px-4 text-right">
                    <Badge variant="secondary" className="font-semibold text-xs">
                      {calcPct(breakdown.ghostedResume)}%
                    </Badge>
                  </td>
                </tr>

                {/* 3. Rejected after interview */}
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="py-3.5 px-4">
                    <Badge variant="outline" className="bg-blue-500/15 text-blue-500 border-none font-semibold text-xs">
                      Post-Interview
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-foreground">Rejected after interview(s)</td>
                  <td className="py-3.5 px-4">
                    <div className="w-full bg-muted/50 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-destructive h-full rounded-full transition-all duration-500"
                        style={{ width: `${calcPct(breakdown.rejectedInterview)}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-foreground">{breakdown.rejectedInterview}</td>
                  <td className="py-3.5 px-4 text-right">
                    <Badge variant="secondary" className="font-semibold text-xs">
                      {calcPct(breakdown.rejectedInterview)}%
                    </Badge>
                  </td>
                </tr>

                {/* 4. Ghosted after interview */}
                <tr className="hover:bg-muted/20 transition-colors">
                  <td className="py-3.5 px-4">
                    <Badge variant="outline" className="bg-blue-500/15 text-blue-500 border-none font-semibold text-xs">
                      Post-Interview
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-foreground">Ghosted after interview(s)</td>
                  <td className="py-3.5 px-4">
                    <div className="w-full bg-muted/50 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-slate-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${calcPct(breakdown.ghostedInterview)}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-foreground">{breakdown.ghostedInterview}</td>
                  <td className="py-3.5 px-4 text-right">
                    <Badge variant="secondary" className="font-semibold text-xs">
                      {calcPct(breakdown.ghostedInterview)}%
                    </Badge>
                  </td>
                </tr>

                {/* 5. Accepted offer */}
                <tr className="bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
                  <td className="py-3.5 px-4">
                    <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-none font-semibold text-xs">
                      Offer Stage
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-emerald-600">Accepted offer / Hired</td>
                  <td className="py-3.5 px-4">
                    <div className="w-full bg-muted/50 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${calcPct(breakdown.offered)}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-600">{breakdown.offered}</td>
                  <td className="py-3.5 px-4 text-right">
                    <Badge variant="outline" className="bg-emerald-500/15 text-emerald-600 border-none font-semibold text-xs">
                      {calcPct(breakdown.offered)}%
                    </Badge>
                  </td>
                </tr>

                {/* 6. Active Applications */}
                <tr className="bg-primary/5 hover:bg-primary/10 transition-colors">
                  <td className="py-3.5 px-4">
                    <Badge variant="outline" className="bg-primary/15 text-primary border-none font-semibold text-xs">
                      Active Pipeline
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-primary">Active Applications</td>
                  <td className="py-3.5 px-4">
                    <div className="w-full bg-muted/50 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-primary h-full rounded-full transition-all duration-500"
                        style={{ width: `${calcPct(breakdown.active)}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-primary">{breakdown.active}</td>
                  <td className="py-3.5 px-4 text-right">
                    <Badge variant="outline" className="bg-primary/15 text-primary border-none font-semibold text-xs">
                      {calcPct(breakdown.active)}%
                    </Badge>
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

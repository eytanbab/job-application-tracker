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
  Ghost,
  Activity,
  Briefcase,
  Monitor
} from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Pie, PieChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';

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
    responseConversion: number;
    timelineData?: { year: string; month: string; numOfApplications: number }[];
    topPlatforms?: { name: string; freq: number }[];
    topRoles?: { name: string; freq: number }[];
  };
}

const timelineConfig = {
  applications: {
    label: "Applications",
    color: "hsl(var(--primary))",
  }
} satisfies ChartConfig;

const platformConfig = {
  frequency: {
    label: "Applications",
    color: "hsl(var(--chart-1))",
  }
} satisfies ChartConfig;

export function InsightsDashboard({ data }: InsightsDashboardProps) {
  const { resumeConversion, interviewConversion, breakdown, stages, total, timelineData = [], topPlatforms = [], topRoles = [] } = data;

  if (total === 0) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border/40 bg-card/40 p-8 text-center backdrop-blur-md">
        <div className="bg-primary/10 p-4 rounded-full mb-4">
          <HelpCircle className="h-10 w-10 text-primary animate-pulse" />
        </div>
        <h3 className="text-xl font-bold tracking-tight">No Analytics Available</h3>
        <p className="text-muted-foreground max-w-sm mt-2">
          Start adding job applications to unlock detailed journey insights, predictive analytics, and personalized recommendations.
        </p>
      </div>
    );
  }

  // 1. Identify primary bottleneck
  let bottleneckTitle = 'Pipeline Healthy & Active';
  let bottleneckDesc = 'Your conversion rates are stable. Keep the momentum going!';
  let bottleneckStatus: 'healthy' | 'resume' | 'interview' = 'healthy';
  let recommendation = 'Maintain your current cadence, prioritize direct networking, and continue preparing for upcoming interviews.';
  
  if (resumeConversion < 12 && stages.applied >= 5) {
    bottleneckTitle = 'Resume / Sourcing Bottleneck';
    bottleneckDesc = `Your Resume Pass Rate is below market benchmarks (${resumeConversion.toFixed(1)}%). Most applications end before the initial screen.`;
    bottleneckStatus = 'resume';
    recommendation = 'Focus on optimizing your resume for ATS systems. Align keywords in your resume with job descriptions, tailor cover letters, and ensure your portfolio/GitHub links are prominent.';
  } else if (interviewConversion < 18 && stages.interview >= 3) {
    bottleneckTitle = 'Interview Conversion Bottleneck';
    bottleneckDesc = `Your Interview Success Rate is below market benchmarks (${interviewConversion.toFixed(1)}%). You are securing interviews but struggling to convert.`;
    bottleneckStatus = 'interview';
    recommendation = 'Dedicate time to mock interviews, practicing the STAR method for behavioral questions, and refining your elevator pitch.';
  }

  // Colors for donut chart
  const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in zoom-in-95 duration-500 ease-out">
      
      {/* Dynamic Recommendation Panel - Glassmorphism */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl shadow-xl w-full group">
        <div className="absolute -right-20 -top-20 h-64 w-64 bg-primary/20 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/30 transition-colors duration-700" />
        <div className="absolute -left-20 -bottom-20 h-64 w-64 bg-accent/20 rounded-full blur-3xl pointer-events-none group-hover:bg-accent/30 transition-colors duration-700" />
        
        <div className="p-6 sm:p-8 relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/15 text-primary shrink-0 shadow-inner">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{bottleneckTitle}</h2>
              <Badge 
                variant="outline"
                className={
                  bottleneckStatus === 'healthy'
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-semibold px-3 py-1 text-xs backdrop-blur-md ml-2 hidden sm:flex'
                    : 'bg-destructive/10 text-destructive border-destructive/20 font-semibold px-3 py-1 text-xs backdrop-blur-md ml-2 hidden sm:flex'
                }
              >
                {bottleneckStatus === 'healthy' ? 'On Track' : 'Needs Attention'}
              </Badge>
            </div>
            <p className="text-muted-foreground font-medium leading-relaxed">
              {bottleneckDesc}
            </p>
          </div>
          <div className="rounded-2xl bg-foreground/5 dark:bg-foreground/10 border border-white/5 p-5 shadow-inner flex-1 w-full md:w-auto backdrop-blur-sm">
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-2">
              <Activity className="h-3.5 w-3.5" /> AI Recommendation
            </p>
            <p className="text-sm text-foreground/90 leading-relaxed font-medium">
              {recommendation}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        <Card className="bg-card/60 backdrop-blur-md shadow-lg border border-white/5 rounded-3xl hover:bg-card/80 transition-colors duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pass Rate</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg"><FileText className="h-4 w-4 text-primary" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground tracking-tight">{resumeConversion.toFixed(1)}<span className="text-xl text-muted-foreground">%</span></div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Applied &rarr; Interview</p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-md shadow-lg border border-white/5 rounded-3xl hover:bg-card/80 transition-colors duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Win Rate</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg"><Users className="h-4 w-4 text-blue-500" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground tracking-tight">{interviewConversion.toFixed(1)}<span className="text-xl text-muted-foreground">%</span></div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Interview &rarr; Offer</p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-md shadow-lg border border-white/5 rounded-3xl hover:bg-card/80 transition-colors duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active</CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-lg"><TrendingUp className="h-4 w-4 text-emerald-500" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground tracking-tight">{breakdown.active}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Applications in progress</p>
          </CardContent>
        </Card>

        <Card className="bg-card/60 backdrop-blur-md shadow-lg border border-white/5 rounded-3xl hover:bg-card/80 transition-colors duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Offers</CardTitle>
            <div className="p-2 bg-amber-500/10 rounded-lg"><Award className="h-4 w-4 text-amber-500" /></div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground tracking-tight">{breakdown.offered}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Total jobs secured</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        
        {/* Activity Timeline Chart */}
        <Card className="lg:col-span-2 bg-card/60 backdrop-blur-md shadow-lg border border-white/5 rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Application Velocity</CardTitle>
            <CardDescription>Your application volume over the selected period</CardDescription>
          </CardHeader>
          <CardContent className="pt-4 h-[300px]">
            {timelineData.length > 0 ? (
              <ChartContainer config={timelineConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.5} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area type="monotone" dataKey="numOfApplications" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorApps)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No timeline data available</div>
            )}
          </CardContent>
        </Card>

        {/* Funnel Widget */}
        <Card className="bg-card/60 backdrop-blur-md shadow-lg border border-white/5 rounded-3xl flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold">Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center gap-4 relative z-10">
            
            <div className="space-y-4 w-full">
              {/* Applied */}
              <div className="relative group">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-bold text-foreground">Applied</span>
                  <span className="text-sm font-bold text-foreground">{stages.applied}</span>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-1000 ease-out" style={{ width: '100%' }} />
                </div>
              </div>

              {/* Interview */}
              <div className="relative group">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-bold text-foreground">Interviewed</span>
                  <span className="text-sm font-bold text-foreground">{stages.interview}</span>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-out delay-150" 
                    style={{ width: `${Math.max(stages.applied > 0 ? (stages.interview / stages.applied) * 100 : 0, stages.interview > 0 ? 5 : 0)}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 text-right">{resumeConversion.toFixed(1)}% conversion</p>
              </div>

              {/* Offer */}
              <div className="relative group">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-bold text-foreground">Offers</span>
                  <span className="text-sm font-bold text-foreground">{stages.accepted}</span>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out delay-300" 
                    style={{ width: `${Math.max(stages.applied > 0 ? (stages.accepted / stages.applied) * 100 : 0, stages.accepted > 0 ? 5 : 0)}%` }} />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 text-right">{interviewConversion.toFixed(1)}% conversion</p>
              </div>
            </div>

          </CardContent>
        </Card>

      </div>

      {/* Deep Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        
        {/* Top Platforms */}
        <Card className="bg-card/60 backdrop-blur-md shadow-lg border border-white/5 rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2"><Monitor className="h-5 w-5 text-chart-1" /> Top Platforms</CardTitle>
            <CardDescription>Where you source most of your opportunities</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px] flex items-center justify-center">
            {topPlatforms.length > 0 ? (
              <ChartContainer config={platformConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={topPlatforms}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="freq"
                      nameKey="name"
                      stroke="none"
                    >
                      {topPlatforms.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="text-muted-foreground">No platform data available</div>
            )}
          </CardContent>
        </Card>

        {/* Top Roles */}
        <Card className="bg-card/60 backdrop-blur-md shadow-lg border border-white/5 rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2"><Briefcase className="h-5 w-5 text-chart-2" /> Role Distribution</CardTitle>
            <CardDescription>The most common roles you've applied for</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-4 mt-2">
              {topRoles.length > 0 ? topRoles.map((role, idx) => {
                const max = topRoles[0].freq;
                const pct = (role.freq / max) * 100;
                return (
                  <div key={idx} className="group">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-foreground truncate pr-4">{role.name}</span>
                      <span className="font-bold text-muted-foreground">{role.freq}</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700 ease-out" 
                        style={{ width: `${pct}%`, backgroundColor: COLORS[idx % COLORS.length] }} />
                    </div>
                  </div>
                )
              }) : (
                <div className="text-muted-foreground h-[200px] flex items-center justify-center">No role data available</div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

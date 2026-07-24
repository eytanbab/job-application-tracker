import { Send, Clock, Target, Ghost } from "lucide-react";
import Link from "next/link";

interface KpiStripProps {
  totalApplications: number;
  activePipeline: number;
  interviewYield: number;
  ghostRate: number;
}

export function KpiStrip({ totalApplications, activePipeline, interviewYield, ghostRate }: KpiStripProps) {
  return (
    <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Apps */}
      <Link href="/applications" className="flex flex-col p-5 rounded-xl bg-secondary/20 border border-border/40 hover:bg-secondary/40 hover:border-border cursor-pointer transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Output</span>
          <Send className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">{totalApplications}</span>
        </div>
        <span className="text-xs text-muted-foreground mt-1">View all recorded applications</span>
      </Link>

      {/* Active Pipeline */}
      <Link href="/applications" className="flex flex-col p-5 rounded-xl bg-secondary/20 border border-border/40 hover:bg-secondary/40 hover:border-border cursor-pointer transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Pipeline</span>
          <Clock className="h-4 w-4 text-blue-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">{activePipeline}</span>
        </div>
        <span className="text-xs text-muted-foreground mt-1">Awaiting response or in-progress</span>
      </Link>

      {/* Interview Yield */}
      <Link href="/applications?reachedInterview=true" className="flex flex-col p-5 rounded-xl bg-secondary/20 border border-border/40 hover:bg-secondary/40 hover:border-border cursor-pointer transition-all relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Interview Yield</span>
          <Target className="h-4 w-4 text-purple-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold tracking-tight tabular-nums ${interviewYield < 2 ? 'text-red-500' : 'text-foreground'}`}>
            {interviewYield.toFixed(2)}%
          </span>
          {interviewYield < 2 && (
             <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">Below Benchmark</span>
          )}
        </div>
        <span className="text-xs text-muted-foreground mt-1">Click to view interviews</span>
      </Link>

      {/* Ghost Rate */}
      <Link href="/applications?status=ghosted" className="flex flex-col p-5 rounded-xl bg-secondary/20 border border-border/40 hover:bg-secondary/40 hover:border-border cursor-pointer transition-all">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">No Response Rate</span>
          <Ghost className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold tracking-tight text-foreground tabular-nums">{ghostRate.toFixed(1)}%</span>
        </div>
        <span className="text-xs text-muted-foreground mt-1">Click to view ghosted apps</span>
      </Link>
    </div>
  );
}

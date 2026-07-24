import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface BrutalFunnelProps {
  applied: number;
  interview: number;
  offer: number;
}

export function BrutalFunnel({ applied, interview, offer }: BrutalFunnelProps) {
  const interviewRate = applied > 0 ? (interview / applied) * 100 : 0;
  const offerRate = interview > 0 ? (offer / interview) * 100 : 0;

  return (
    <div className="col-span-full xl:col-span-8 p-6 rounded-xl border border-border/50 bg-card">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground">Recruitment Funnel</h3>
        <p className="text-[13px] text-muted-foreground mt-1">Conversion yields across key milestones</p>
      </div>

      <div className="flex flex-col md:flex-row items-stretch gap-2">
        {/* Step 1: Applied */}
        <Link href="/applications" className="flex-1 p-5 rounded-lg bg-secondary/30 border border-border/30 flex flex-col justify-between group hover:bg-secondary/50 hover:border-border cursor-pointer transition-all">
          <div className="flex justify-between items-start mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Applied</span>
          </div>
          <div>
            <span className="text-4xl font-bold tracking-tight text-foreground tabular-nums">{applied}</span>
            <div className="h-1 w-full bg-blue-500 rounded-full mt-3 opacity-80" />
          </div>
        </Link>

        <div className="flex items-center justify-center w-full md:w-8 h-8 md:h-auto shrink-0">
          <ArrowRight className="h-5 w-5 text-muted-foreground/30 rotate-90 md:rotate-0 transition-transform" />
        </div>

        {/* Step 2: Interviewing */}
        <Link href="/applications?reachedInterview=true" className="flex-1 p-5 rounded-lg bg-secondary/30 border border-border/30 flex flex-col justify-between group hover:bg-secondary/50 hover:border-border cursor-pointer transition-all">
          <div className="flex justify-between items-start mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Interviewing</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground group-hover:bg-secondary transition-colors">
              {interviewRate.toFixed(1)}% yield
            </span>
          </div>
          <div>
            <span className="text-4xl font-bold tracking-tight text-foreground tabular-nums">{interview}</span>
            <div className="h-1 w-full bg-purple-500 rounded-full mt-3 opacity-80" style={{ width: `${Math.max(interviewRate, 2)}%` }} />
          </div>
        </Link>

        <div className="flex items-center justify-center w-full md:w-8 h-8 md:h-auto shrink-0">
          <ArrowRight className="h-5 w-5 text-muted-foreground/30 rotate-90 md:rotate-0 transition-transform" />
        </div>

        {/* Step 3: Offer */}
        <Link href="/applications?status=accepted" className="flex-1 p-5 rounded-lg bg-secondary/30 border border-border/30 flex flex-col justify-between group hover:bg-secondary/50 hover:border-border cursor-pointer transition-all">
          <div className="flex justify-between items-start mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Offers</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background border border-border text-muted-foreground group-hover:bg-secondary transition-colors">
              {offerRate.toFixed(1)}% win
            </span>
          </div>
          <div>
            <span className="text-4xl font-bold tracking-tight text-foreground tabular-nums">{offer}</span>
            <div className="h-1 w-full bg-emerald-500 rounded-full mt-3 opacity-80" style={{ width: `${Math.max(offerRate, 2)}%` }} />
          </div>
        </Link>
      </div>
    </div>
  );
}

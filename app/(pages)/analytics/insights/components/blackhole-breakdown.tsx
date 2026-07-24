import Link from "next/link";

interface BlackholeBreakdownProps {
  data: {
    ghosted: number;
    rejected: number;
    ghostedPct: number;
    rejectedPct: number;
  };
}

export function BlackholeBreakdown({ data }: BlackholeBreakdownProps) {
  return (
    <div className="col-span-full xl:col-span-4 p-6 rounded-xl border border-border/50 bg-card">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground">The "Black Hole"</h3>
        <p className="text-[13px] text-muted-foreground mt-1">Ghosted vs. Explicitly Rejected</p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold tracking-tight text-foreground tabular-nums">{data.ghosted + data.rejected}</span>
          <span className="text-xs font-medium text-muted-foreground">Total losses</span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="h-3 w-full rounded-full overflow-hidden flex bg-secondary/50">
            <div className="h-full bg-slate-500/80 transition-all duration-500" style={{ width: `${data.ghostedPct}%` }} />
            <div className="h-full bg-red-500/80 transition-all duration-500" style={{ width: `${data.rejectedPct}%` }} />
          </div>
          
          <div className="flex justify-between items-center text-xs mt-2">
            <Link href="/applications?status=ghosted" className="flex items-center gap-2 hover:underline cursor-pointer">
              <div className="w-2 h-2 rounded-full bg-slate-500/80" />
              <span className="text-muted-foreground font-medium">Ghosted ({data.ghostedPct.toFixed(0)}%)</span>
            </Link>
            <Link href="/applications?status=rejected" className="flex items-center gap-2 hover:underline cursor-pointer">
              <span className="text-muted-foreground font-medium">Rejected ({data.rejectedPct.toFixed(0)}%)</span>
              <div className="w-2 h-2 rounded-full bg-red-500/80" />
            </Link>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-secondary/20 border border-border/30 mt-2">
          <p className="text-[13px] leading-relaxed text-muted-foreground">
            {data.ghostedPct > 50 
              ? "The majority of your applications are receiving no response. Industry baseline for ghosting sits around 65-75%. Your profile may be getting auto-filtered." 
              : "You are receiving explicit rejections. This is good for closure, but indicates a mismatch in expectations or qualifications."}
          </p>
        </div>
      </div>
    </div>
  );
}

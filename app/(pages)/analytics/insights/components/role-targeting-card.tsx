interface RoleTargetingCardProps {
  data: {
    name: string;
    count: number;
  }[];
}

export function RoleTargetingCard({ data }: RoleTargetingCardProps) {
  const max = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="col-span-full xl:col-span-12 p-6 rounded-xl border border-border/50 bg-card">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground">Role Targeting Alignment</h3>
        <p className="text-[13px] text-muted-foreground mt-1">Top job titles you are applying to</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-stretch">
        <div className="flex-1 flex flex-col gap-4">
          {data.map((role, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-[180px] shrink-0">
                <span className="text-[13px] font-medium text-foreground truncate block">{role.name}</span>
              </div>
              <div className="flex-1 h-2 bg-secondary/50 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary/70 rounded-full" 
                  style={{ width: `${(role.count / max) * 100}%` }} 
                />
              </div>
              <div className="w-12 text-right shrink-0">
                <span className="text-[13px] text-muted-foreground tabular-nums">{role.count}</span>
              </div>
            </div>
          ))}
        </div>
        
        <div className="w-px bg-border/50 hidden md:block" />

        <div className="flex-1 flex flex-col justify-center p-4 bg-secondary/20 rounded-xl border border-border/30">
          <h4 className="text-[13px] font-semibold mb-2">Strategy Check</h4>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            If your top 5 roles are vastly different (e.g., "Product Manager" and "Frontend Developer"), your resume is likely too generic to pass strict ATS filters for either role. Specialization increases conversion yield.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";

interface PlatformRoiMatrixProps {
  data: {
    name: string;
    total: number;
    interviews: number;
    yieldRate: number;
  }[];
}

export function PlatformRoiMatrix({ data }: PlatformRoiMatrixProps) {
  const router = useRouter();

  return (
    <div className="col-span-full xl:col-span-8 p-6 rounded-xl border border-border/50 bg-card">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground">Platform ROI Matrix</h3>
        <p className="text-[13px] text-muted-foreground mt-1">Which sourcing channels actually convert to interviews?</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/50 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <th className="pb-3 pl-2">Platform</th>
              <th className="pb-3 text-right">Apps</th>
              <th className="pb-3 text-right">Interviews</th>
              <th className="pb-3 text-right pr-2">Yield</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {data.map((item, i) => (
              <tr 
                key={i} 
                onClick={() => router.push(`/applications?platform=${encodeURIComponent(item.name)}`)}
                className="hover:bg-secondary/40 transition-colors cursor-pointer"
              >
                <td className="py-3 pl-2 text-[13px] font-medium capitalize text-foreground hover:underline">{item.name}</td>
                <td className="py-3 text-right text-[13px] tabular-nums text-muted-foreground">{item.total}</td>
                <td className="py-3 text-right text-[13px] tabular-nums text-blue-500 font-medium">{item.interviews}</td>
                <td className="py-3 text-right pr-2">
                  <div className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[11px] font-semibold min-w-[56px]
                    ${item.yieldRate >= 5 ? 'bg-emerald-500/10 text-emerald-500' : 
                      item.yieldRate > 0 ? 'bg-blue-500/10 text-blue-500' : 'bg-secondary text-muted-foreground'}`}>
                    {item.yieldRate.toFixed(1)}%
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

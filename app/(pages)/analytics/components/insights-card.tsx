import Link from "next/link";
import { AlertCircle, Info, TrendingUp, type LucideIcon } from "lucide-react";
import type { Insight, InsightTone } from "@/lib/analytics/insights";
import { statusColor } from "@/lib/utils";
import { Panel, PanelTitle } from "./analytics-section";

const TONES: Record<InsightTone, { icon: LucideIcon; label: string; color: string }> = {
  warn: { icon: AlertCircle, label: "Needs attention", color: statusColor("interview") },
  good: { icon: TrendingUp, label: "Going well", color: statusColor("accepted") },
  info: { icon: Info, label: "Note", color: "hsl(var(--muted-foreground))" },
};

/** Plain-language findings from the user's own data, computed by rules. */
export function InsightsCard({ insights }: { insights: Insight[] }) {
  if (insights.length === 0) return null;
  return (
    <Panel className="flex flex-col gap-3">
      <PanelTitle>Insights</PanelTitle>
      <ul className="flex flex-col gap-2.5">
        {insights.map(({ id, tone, text, href }) => {
          const { icon: Icon, label, color } = TONES[tone];
          return (
            <li key={id} className="flex items-start gap-2.5 text-sm text-foreground">
              <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color }} aria-hidden />
              <span className="min-w-0">
                <span className="sr-only">{label}: </span>
                {href ? (
                  <Link href={href} className="underline decoration-border underline-offset-4 hover:decoration-foreground">
                    {text}
                  </Link>
                ) : (
                  text
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

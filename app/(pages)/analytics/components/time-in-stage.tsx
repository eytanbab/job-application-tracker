import { formatDays } from "@/lib/analytics/format";
import type { AnalyticsOverview, StageTiming } from "@/lib/analytics/summarize";
import { Panel, PanelTitle } from "./analytics-section";

function Row({ label, timing }: { label: string; timing: StageTiming }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 border-b border-border/30 last:border-0">
      <dt className="text-sm text-foreground">{label}</dt>
      <dd className="text-right">
        <span className="text-sm font-semibold text-foreground tabular-nums">{formatDays(timing.median)}</span>
        <span className="block text-xs text-muted-foreground">
          {timing.n === 0 ? "No data yet" : `median of ${timing.n}`}
        </span>
      </dd>
    </div>
  );
}

export function TimeInStage({ overview }: { overview: AnalyticsOverview }) {
  const { timeInStage } = overview;
  return (
    <Panel>
      <PanelTitle>Time between steps</PanelTitle>
      <dl className="mt-2">
        <Row label="Applied to first reply" timing={timeInStage.toFirstUpdate} />
        <Row label="Earlier reply to interview" timing={timeInStage.updateToInterview} />
        <Row label="Interview to offer" timing={timeInStage.interviewToOffer} />
      </dl>
      <p className="mt-2 text-xs text-muted-foreground">
        Approximate: based on when you logged each status change, not when it happened.
        &quot;Earlier reply&quot; counts applications that were in review before the interview.
      </p>
    </Panel>
  );
}

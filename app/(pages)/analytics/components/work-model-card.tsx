import type { AnalyticsOverview } from "@/lib/analytics/summarize";
import type { WorkMode } from "@/lib/analytics/types";
import { Panel, PanelTitle } from "./analytics-section";
import { OutcomeBreakdown } from "./outcome-breakdown";

const LABELS: Record<WorkMode, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
  unknown: "Location not set",
};

export function WorkModelCard({ overview }: { overview: AnalyticsOverview }) {
  return (
    <Panel>
      <PanelTitle>Work model</PanelTitle>
      <OutcomeBreakdown
        totalApplications={overview.totals.applications}
        rows={overview.workModes.map((m) => ({
          key: m.mode,
          label: LABELS[m.mode],
          total: m.total,
          interviewed: m.interviewed,
        }))}
      />
    </Panel>
  );
}

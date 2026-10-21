import Link from "next/link";
import type { AnalyticsOverview } from "@/lib/analytics/summarize";
import { Panel, PanelTitle } from "./analytics-section";
import { OutcomeBreakdown } from "./outcome-breakdown";

export function ResumeOutcomesCard({ overview }: { overview: AnalyticsOverview }) {
  const { resumes, totals } = overview;
  const attached = resumes.filter((r) => r.resumeId !== null);

  return (
    <Panel>
      <PanelTitle>Resume versions</PanelTitle>
      {attached.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Attach the resume you sent to each application to compare versions here.{" "}
          <Link href="/documents" className="text-primary hover:underline underline-offset-4">
            Manage resumes
          </Link>
        </p>
      ) : (
        <OutcomeBreakdown
          totalApplications={totals.applications}
          rows={resumes.map((r) => ({
            key: r.resumeId ?? "none",
            label: r.title,
            total: r.total,
            interviewed: r.interviewed,
          }))}
        />
      )}
    </Panel>
  );
}

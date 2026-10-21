import Link from "next/link";
import { formatSalary } from "@/lib/analytics/salary";
import { trackerHref } from "@/lib/analytics/links";
import type { AnalyticsOverview } from "@/lib/analytics/summarize";
import { Panel, PanelTitle } from "./analytics-section";

export function SalaryCard({ overview }: { overview: AnalyticsOverview }) {
  const { salary } = overview;
  const leftOut = [
    salary.otherCurrencyCount > 0 && `${salary.otherCurrencyCount} in another currency`,
    salary.excludedCount > 0 && `${salary.excludedCount} that could not be read`,
  ].filter(Boolean);

  return (
    <Panel>
      <div className="flex items-baseline justify-between gap-2">
        <PanelTitle>Salary</PanelTitle>
        {salary.statedCount > 0 && (
          <span className="text-xs text-muted-foreground">
            {salary.statedCount} of {salary.totalCount} stated
          </span>
        )}
      </div>

      {salary.statedCount === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {salary.withTextCount > 0
            ? "The salary text on these applications could not be read as a yearly amount."
            : "Add the salary range when you log an application to see it here."}
        </p>
      ) : (
        <>
          <dl className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <dt className="text-xs text-muted-foreground">Median, yearly</dt>
              <dd className="text-2xl font-semibold text-foreground">{formatSalary(salary.median, salary.currency)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Middle half</dt>
              <dd className="text-lg font-semibold text-foreground">
                {formatSalary(salary.p25, salary.currency)} - {formatSalary(salary.p75, salary.currency)}
              </dd>
            </div>
          </dl>
          {salary.highest && (
            <p className="mt-3 text-xs text-muted-foreground">
              Highest:{" "}
              <Link
                href={trackerHref({ range: overview.range.current, search: salary.highest.company })}
                className="text-foreground hover:underline underline-offset-4"
              >
                {salary.highest.role} at {salary.highest.company}
              </Link>{" "}
              ({formatSalary(salary.highest.annualMid, salary.currency)})
            </p>
          )}
        </>
      )}
      {leftOut.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Left out: {leftOut.join(", ")}.</p>}
      <p className="mt-2 text-xs text-muted-foreground">Base pay only; bonuses and equity are not counted.</p>
    </Panel>
  );
}

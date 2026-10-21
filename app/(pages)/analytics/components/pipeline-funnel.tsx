import Link from "next/link";
import { formatPct } from "@/lib/analytics/format";
import { trackerHref } from "@/lib/analytics/links";
import type { AnalyticsOverview } from "@/lib/analytics/summarize";
import { Panel, PanelTitle } from "./analytics-section";

interface Stage {
  label: string;
  count: number;
  href: string;
}

/**
 * Applied -> replied -> interview -> offer as one set of bars sharing a
 * scale, with the share kept from the previous stage and where the rest went.
 */
export function PipelineFunnel({ overview }: { overview: AnalyticsOverview }) {
  const { totals, range } = overview;
  const current = range.current;
  const stages: Stage[] = [
    { label: "Applied", count: totals.applications, href: trackerHref({ range: current }) },
    { label: "Got a reply", count: totals.responded, href: trackerHref({ range: current, stage: "responded" }) },
    { label: "Reached interview", count: totals.interviewed, href: trackerHref({ range: current, stage: "interviewed" }) },
    { label: "Offer", count: totals.offers, href: trackerHref({ range: current, status: "accepted" }) },
  ];
  const max = Math.max(1, totals.applications);

  const exits = [
    {
      label: "Rejected",
      count: totals.rejected.total,
      detail: `${totals.rejected.beforeInterview} before an interview, ${totals.rejected.afterInterview} after`,
      href: trackerHref({ range: current, status: "rejected" }),
    },
    {
      label: "Ghosted",
      count: totals.ghosted.total,
      detail: `${totals.ghosted.beforeInterview} with no reply, ${totals.ghosted.afterInterview} after an interview`,
      href: trackerHref({ range: current, status: "ghosted" }),
    },
    {
      label: "Still open",
      count: totals.active,
      detail: `${totals.activeByKind.applied + totals.activeByKind.other} waiting, ${totals.activeByKind.review} in review, ${totals.activeByKind.interview} interviewing`,
      href: trackerHref({ range: current, status: "active" }),
    },
  ];

  return (
    <Panel>
      <PanelTitle>Pipeline</PanelTitle>
      <ol className="mt-3 flex flex-col gap-2.5">
        {stages.map((stage, i) => {
          const previous = i > 0 ? stages[i - 1].count : null;
          const kept = previous ? stage.count / previous : null;
          return (
            <li key={stage.label}>
              <Link
                href={stage.href}
                className="group grid grid-cols-[1fr_auto] sm:grid-cols-[minmax(7rem,9rem)_1fr_auto] items-center gap-x-3 gap-y-1 rounded-md -mx-1 px-1 py-1 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="text-sm text-foreground">{stage.label}</span>
                <span className="order-last col-span-2 sm:order-none sm:col-span-1 h-3 rounded-sm bg-muted overflow-hidden" aria-hidden>
                  <span
                    className="block h-full rounded-sm bg-primary"
                    style={{ width: `${(stage.count / max) * 100}%` }}
                  />
                </span>
                <span className="text-sm tabular-nums text-right whitespace-nowrap">
                  <span className="font-semibold text-foreground">{stage.count}</span>
                  {kept !== null && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      {formatPct(kept)} of previous
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      <div className="mt-4 pt-3 border-t border-border/40 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {exits.map((exit) => (
          <Link
            key={exit.label}
            href={exit.href}
            className="rounded-md -m-1 p-1 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="block text-xs text-muted-foreground">{exit.label}</span>
            <span className="block text-lg font-semibold text-foreground tabular-nums">{exit.count}</span>
            <span className="block text-xs text-muted-foreground">{exit.detail}</span>
          </Link>
        ))}
      </div>
    </Panel>
  );
}

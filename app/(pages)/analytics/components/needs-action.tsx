import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { trackerHref } from "@/lib/analytics/links";
import type { ActionGroup, AnalyticsOverview } from "@/lib/analytics/summarize";
import { Panel, PanelTitle } from "./analytics-section";

interface GroupSpec {
  title: string;
  hint: string;
  group: ActionGroup;
  when: (days: number) => string;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Open applications worth a follow-up, whatever period is selected. */
export function NeedsAction({ overview }: { overview: AnalyticsOverview }) {
  const { needsAction } = overview;
  const groups: GroupSpec[] = [
    {
      title: "No reply after a week",
      hint: "Applied 7 to 14 days ago. A short follow-up often gets a reply.",
      group: needsAction.noReply,
      when: (d) => `applied ${plural(d, "day")} ago`,
    },
    {
      title: "Interview with no update",
      hint: "No status change for a week or more.",
      group: needsAction.interviewStale,
      when: (d) => `no update for ${plural(d, "day")}`,
    },
    {
      title: "About to be marked ghosted",
      hint: "Marked ghosted automatically after 30 quiet days.",
      group: needsAction.ghostingSoon,
      when: (d) => `in ${plural(d, "day")}`,
    },
  ];
  const total = groups.reduce((sum, g) => sum + g.group.total, 0);

  return (
    <Panel>
      <div className="flex items-baseline justify-between gap-2">
        <PanelTitle>Needs action</PanelTitle>
        <span className="text-xs text-muted-foreground">{plural(total, "application")}</span>
      </div>

      {total === 0 ? (
        <p className="mt-6 mb-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4" aria-hidden />
          Nothing needs a follow-up right now.
        </p>
      ) : (
        <div className="mt-3 flex flex-col gap-4">
          {groups
            .filter((g) => g.group.total > 0)
            .map((g) => (
              <div key={g.title}>
                <h4 className="text-sm font-medium text-foreground">
                  {g.title} <span className="text-muted-foreground font-normal">({g.group.total})</span>
                </h4>
                <p className="text-xs text-muted-foreground">{g.hint}</p>
                <ul className="mt-1.5 flex flex-col">
                  {g.group.items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={trackerHref({ appId: item.id })}
                        className="flex items-baseline justify-between gap-3 rounded-md -mx-1 px-1 py-1.5 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="min-w-0 truncate text-sm text-foreground">
                          {item.role} <span className="text-muted-foreground">· {item.company}</span>
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">{g.when(item.days)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {g.group.total > g.group.items.length && (
                  <p className="text-xs text-muted-foreground mt-1">
                    and {g.group.total - g.group.items.length} more
                  </p>
                )}
              </div>
            ))}
        </div>
      )}
    </Panel>
  );
}

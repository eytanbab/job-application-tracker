import Link from "next/link";
import { Briefcase, CalendarX } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ResolvedRange } from "@/lib/analytics/range";
import { rangeQuery } from "@/lib/analytics/search-params";

/** Shown when the account has applications but none in the chosen period. */
export function FilteredEmptyState({ range }: { range: ResolvedRange }) {
  const previousHref = range.previous?.from && range.previous.to
    ? `/analytics/overview?${rangeQuery({
        ...range,
        preset: "custom",
        current: range.previous,
      })}`
    : null;

  return (
    <div className="w-full rounded-xl border border-border/40 bg-card/60 shadow-2xs p-8 text-center flex flex-col items-center gap-3">
      <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
        <CalendarX className="h-6 w-6" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-foreground">
          No applications in this period
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          None of your applications were sent in this period ({range.label}).
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 mt-1">
        <Button asChild size="sm">
          <Link href="/analytics/overview?range=all">Show all time</Link>
        </Button>
        {previousHref && (
          <Button asChild size="sm" variant="outline">
            <Link href={previousHref}>Previous period</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

/** Shown before the first application is logged. */
export function NoApplicationsState() {
  return (
    <div className="w-full rounded-xl border border-border/40 bg-card/60 shadow-2xs p-8 text-center flex flex-col items-center gap-3">
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
        <Briefcase className="h-6 w-6" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-foreground">No applications yet</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-md">
          Log the jobs you apply to and this page will show your reply and interview rates, which platforms work, and what needs a follow-up.
        </p>
      </div>
      <Button asChild size="sm" className="mt-1">
        <Link href="/applications/new">Add your first application</Link>
      </Button>
    </div>
  );
}

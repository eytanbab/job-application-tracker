"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const TABS = [
  { url: "/analytics/overview", name: "Overview" },
  { url: "/analytics/status-per-platform", name: "Platform ROI" },
  { url: "/analytics/insights", name: "Strategic Insights" },
];

export default function Tabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const isFiltered = Boolean(month || year);

  return (
    <div className="flex items-center gap-2">
      <nav
        aria-label="Analytics sections"
        className="inline-flex w-fit max-w-full overflow-x-auto flex-nowrap items-center gap-1 rounded-xl bg-muted/60 p-1 scrollbar-none"
      >
        {TABS.map((item) => {
          const params = new URLSearchParams(searchParams.toString());
          const queryString = params.toString();
          const href = queryString ? `${item.url}?${queryString}` : item.url;
          const isActive = pathname === item.url;

          return (
            <Link
              key={item.url}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex items-center shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer capitalize",
                isActive
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.name}
            </Link>
          );
        })}
      </nav>
      {isFiltered && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Filtered
        </span>
      )}
    </div>
  );
}

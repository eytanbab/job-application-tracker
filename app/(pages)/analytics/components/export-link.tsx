"use client";

import { useQueryStates } from "nuqs";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveRange } from "@/lib/analytics/range";
import { analyticsSearchParams, rangeQuery } from "@/lib/analytics/search-params";

/** Downloads the applications in the selected period as CSV. */
export function ExportLink() {
  const [params] = useQueryStates(analyticsSearchParams);
  const resolved = resolveRange(params, new Date());
  const query = rangeQuery(resolved);

  return (
    <Button asChild variant="outline" size="sm" className="h-9 text-xs gap-1.5">
      <a
        href={`/api/analytics/export${query ? `?${query}` : ""}`}
        download
        aria-label={`Export CSV of applications, ${resolved.label}`}
      >
        <Download className="h-3.5 w-3.5" aria-hidden />
        Export CSV
      </a>
    </Button>
  );
}

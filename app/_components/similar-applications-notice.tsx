"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { safeFormatDate } from "@/lib/utils";
import {
  findSimilarApplications,
  type SimilarApplication,
} from "@/app/actions/applications";

interface SimilarApplicationsNoticeProps {
  link?: string | null;
  roleName?: string | null;
  companyName?: string | null;
}

const REASONS: Record<SimilarApplication["reason"], string> = {
  link: "same job link",
  role: "same role and company",
};

/**
 * Warns, without blocking the save, when the application being entered
 * looks like one the user already tracks.
 */
export function SimilarApplicationsNotice({
  link,
  roleName,
  companyName,
}: SimilarApplicationsNoticeProps) {
  const [similar, setSimilar] = useState<SimilarApplication[]>([]);

  useEffect(() => {
    let current = true;
    // Wait for typing to pause before asking the server
    const timer = setTimeout(() => {
      findSimilarApplications({ link, role_name: roleName, company_name: companyName })
        .then((rows) => {
          if (current) setSimilar(rows);
        })
        .catch(() => {
          if (current) setSimilar([]);
        });
    }, 500);
    return () => {
      current = false;
      clearTimeout(timer);
    };
  }, [link, roleName, companyName]);

  if (similar.length === 0) return null;

  return (
    <div
      role="status"
      data-testid="similar-applications-notice"
      className="col-span-full rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs space-y-1.5"
    >
      <p className="flex items-center gap-1.5 font-semibold text-amber-800 dark:text-amber-200">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        You may already track this job
      </p>
      <ul className="space-y-1 text-amber-900/90 dark:text-amber-100/90">
        {similar.map((app) => (
          <li key={app.id} className="flex items-start justify-between gap-2">
            <span className="min-w-0">
              <span className="block truncate font-medium">
                {app.role_name} at {app.company_name}
              </span>
              <span className="block text-[11px] opacity-80">
                {app.status} · {safeFormatDate(app.date_applied, "MMM d, yyyy")} ·{" "}
                {REASONS[app.reason]}
              </span>
            </span>
            <a
              href={`/applications?appId=${encodeURIComponent(app.id)}`}
              target="_blank"
              rel="noopener"
              className="shrink-0 inline-flex items-center gap-0.5 font-medium underline-offset-2 hover:underline"
            >
              Open <ExternalLink className="h-3 w-3" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, CheckCircle2, Clock, Send, Ghost } from "lucide-react";
import { NudgeModal } from "./nudge-modal";

interface ActionItem {
  id: string;
  company: string;
  role: string;
  daysAgo: number;
  dateApplied: string;
}

interface ActionCenterTrayProps {
  count: number;
  oldestDays: number;
  followUpCount?: number;
  followUpQueue?: ActionItem[];
  unansweredQueue?: ActionItem[];
}

export function ActionCenterTray({
  count,
  oldestDays,
  followUpCount = 0,
  followUpQueue = [],
}: ActionCenterTrayProps) {
  const [selectedNudgeItem, setSelectedNudgeItem] = useState<ActionItem | null>(null);

  const hasFollowUps = followUpCount > 0 && followUpQueue.length > 0;
  const isAllClear = count === 0 && !hasFollowUps;

  return (
    <div className="w-full rounded-xl border border-border/40 bg-card/60 shadow-2xs backdrop-blur-sm p-4 sm:p-5 flex flex-col gap-3">
      {/* Tray Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-border/20">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold tracking-tight text-foreground">
              Follow-Up Queue
            </h2>
            {hasFollowUps && (
              <Badge
                variant="outline"
                className="text-[10px] font-mono font-medium px-2 py-0 border-primary/30 text-primary bg-primary/5"
              >
                {followUpCount} actionable
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Applications in the 7–14 day window ready for recruiter check-in.
          </p>
        </div>

        {count > 0 && (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
            <Ghost className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
            <span>
              {count} {count === 1 ? "application" : "applications"} inactive 30d+
            </span>
            <Link
              href="/applications?status=ghosted"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-0.5 ml-0.5 cursor-pointer"
            >
              View
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        )}
      </div>

      {/* Tray Content */}
      {isAllClear ? (
        <div className="flex items-center gap-3 py-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>All applications are up to date. No follow-ups pending.</span>
        </div>
      ) : hasFollowUps ? (
        <>
          {/* Mobile & Small Tablet Card List (< md) */}
          <div className="md:hidden flex flex-col gap-2.5">
            {followUpQueue.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg border border-border/30 bg-background/50 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-foreground text-xs truncate">
                      {item.company}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {item.role || "General Application"}
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground shrink-0 font-mono bg-muted/40 px-2 py-0.5 rounded border border-border/20">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {item.daysAgo}d ago
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1.5 border-t border-border/20 text-xs gap-2 flex-wrap">
                  <span className="font-mono text-muted-foreground text-[11px]">
                    {item.dateApplied}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedNudgeItem(item)}
                      className="h-8 text-xs font-semibold gap-1 px-2.5 cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                    >
                      <Send className="h-3 w-3" />
                      Nudge Recruiter
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 cursor-pointer text-muted-foreground hover:text-foreground"
                    >
                      <Link
                        href={`/applications?q=${encodeURIComponent(item.company)}`}
                        title="View in tracker"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop & Larger Tablet Table (>= md) */}
          <div className="hidden md:block w-full overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-muted-foreground font-medium border-b border-border/20">
                <tr>
                  <th className="py-2 pr-4 font-normal">Company & Position</th>
                  <th className="py-2 px-4 font-normal">Applied Date</th>
                  <th className="py-2 px-4 font-normal">Time Elapsed</th>
                  <th className="py-2 pl-4 text-right font-normal">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {followUpQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-2.5 pr-4">
                      <div className="font-semibold text-foreground">{item.company}</div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[220px]">
                        {item.role || "General Application"}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-muted-foreground text-[11px]">
                      {item.dateApplied}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {item.daysAgo} {item.daysAgo === 1 ? "day" : "days"} ago
                      </span>
                    </td>
                    <td className="py-2.5 pl-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedNudgeItem(item)}
                          className="h-7 text-xs font-semibold gap-1 px-2.5 cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                        >
                          <Send className="h-3 w-3" />
                          Nudge Recruiter
                        </Button>
                        <Button
                          asChild
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 cursor-pointer text-muted-foreground hover:text-foreground"
                        >
                          <Link
                            href={`/applications?q=${encodeURIComponent(item.company)}`}
                            title="View in tracker"
                          >
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 py-2 text-xs text-muted-foreground">
          <span>No applications currently in the 7–14 day follow-up window.</span>
          {count > 0 && (
            <Link
              href="/applications?status=ghosted"
              className="text-primary font-semibold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
            >
              Review {count} inactive applications ({oldestDays}d oldest)
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          )}
        </div>
      )}

      {/* Interactive Outreach Modal */}
      <NudgeModal
        item={selectedNudgeItem}
        open={Boolean(selectedNudgeItem)}
        onOpenChange={(open) => {
          if (!open) setSelectedNudgeItem(null);
        }}
      />
    </div>
  );
}

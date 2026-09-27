"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, CheckCircle2, Clock, Send, Ghost, ChevronDown, ChevronUp } from "lucide-react";
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
  const [isExpanded, setIsExpanded] = useState(false);

  const hasFollowUps = followUpCount > 0 && followUpQueue.length > 0;
  const isAllClear = count === 0 && !hasFollowUps;

  // If there are no follow-ups and no inactive applications, show a serene single-line bar
  if (isAllClear) {
    return (
      <div className="w-full rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground transition-all">
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium text-foreground">Pipeline Up to Date</span>
          <span className="hidden sm:inline text-muted-foreground truncate">
            · All applications are within standard response windows. No follow-ups pending.
          </span>
        </div>
        <Link
          href="/applications"
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-0.5 shrink-0 ml-2 cursor-pointer"
        >
          View Tracker
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  // If no 7-14d follow-ups but there are ghosted applications (>30d)
  if (!hasFollowUps && count > 0) {
    return (
      <div className="w-full rounded-xl border border-border/40 bg-card/60 px-4 py-2.5 flex items-center justify-between text-xs text-muted-foreground transition-all">
        <div className="flex items-center gap-2 min-w-0">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium text-foreground">No Follow-Ups Due</span>
          <span className="hidden sm:inline text-muted-foreground truncate">
            · No applications currently in the 7–14 day nudge window.
          </span>
        </div>
        <Link
          href="/applications?status=ghosted"
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
        >
          <Ghost className="h-3.5 w-3.5 text-muted-foreground/70" />
          Review {count} inactive applications ({oldestDays}d oldest)
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>
    );
  }

  // When actionable follow-ups exist: compact, high-leverage action bar
  const displayedItems = isExpanded ? followUpQueue : followUpQueue.slice(0, 3);
  const remainingCount = followUpQueue.length - 3;

  return (
    <div className="w-full rounded-xl border border-primary/25 bg-primary/5 dark:bg-primary/10 shadow-2xs backdrop-blur-sm p-4 flex flex-col gap-3 transition-all">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1.5 border-b border-primary/15">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
          </span>
          <h2 className="text-xs font-bold tracking-tight text-foreground uppercase">
            Action Pulse
          </h2>
          <Badge
            variant="outline"
            className="text-[10px] font-mono font-medium px-2 py-0 border-primary/30 text-primary bg-background/50"
          >
            {followUpCount} {followUpCount === 1 ? "Follow-Up Ready" : "Follow-Ups Ready"} (7–14d window)
          </Badge>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto text-xs">
          {count > 0 && (
            <Link
              href="/applications?status=ghosted"
              className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 cursor-pointer text-[11px]"
              title="View ghosted applications"
            >
              <Ghost className="h-3 w-3 text-muted-foreground/70" />
              <span>{count} inactive 30d+</span>
            </Link>
          )}

          {remainingCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 text-[11px] font-medium text-primary hover:text-primary hover:bg-primary/10 px-1.5 gap-0.5"
            >
              {isExpanded ? (
                <>
                  Show fewer <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  +{remainingCount} more <ChevronDown className="h-3 w-3" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Actionable Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {displayedItems.map((item) => (
          <div
            key={item.id}
            className="p-3 rounded-lg border border-border/30 bg-background/70 shadow-2xs flex flex-col justify-between gap-2 text-xs"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-foreground truncate">
                  {item.company}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {item.role || "General Application"}
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground shrink-0 font-mono bg-muted/50 px-1.5 py-0.5 rounded border border-border/20">
                <Clock className="h-3 w-3 text-muted-foreground" />
                {item.daysAgo}d ago
              </span>
            </div>

            <div className="flex items-center justify-between pt-1.5 border-t border-border/20 text-xs">
              <span className="font-mono text-muted-foreground text-[10px]">
                Applied {item.dateApplied}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedNudgeItem(item)}
                  className="h-6 text-[11px] font-semibold gap-1 px-2 cursor-pointer hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                >
                  <Send className="h-2.5 w-2.5" />
                  Nudge Recruiter
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 cursor-pointer text-muted-foreground hover:text-foreground"
                >
                  <Link
                    href={`/applications?q=${encodeURIComponent(item.company)}`}
                    title="View in tracker"
                  >
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

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

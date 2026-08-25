"use client";

import { useEffect, useState } from "react";
import { UpcomingInterviewItem, getRoundTypeLabel, getRelativeInterviewTime } from "@/lib/interviews";
import { getUpcomingInterviews } from "@/app/actions/interviews";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Video,
  Building2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface UpcomingInterviewsBannerProps {
  onSelectApplication: (applicationId: string) => void;
}

export function UpcomingInterviewsBanner({
  onSelectApplication,
}: UpcomingInterviewsBannerProps) {
  const [interviews, setInterviews] = useState<UpcomingInterviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    getUpcomingInterviews()
      .then((data) => setInterviews(data))
      .catch((err) => console.error("Failed to load upcoming interviews:", err))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="h-16 rounded-xl border border-border/40 bg-card/60 animate-pulse w-full" />
    );
  }

  if (interviews.length === 0) {
    return null;
  }

  const todayCount = interviews.filter(
    (i) => getRelativeInterviewTime(i.scheduledAt).urgency === "today",
  ).length;

  return (
    <div className="rounded-xl border border-border/50 bg-card p-3.5 sm:p-4 shadow-2xs space-y-3 animate-in fade-in-50 duration-200 w-full min-w-0">
      {/* BANNER HEADER */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
            <Calendar className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-foreground font-heading truncate">
                Upcoming Interviews
              </h3>
              {todayCount > 0 && (
                <Badge className="bg-rose-600 text-white font-bold text-[11px] py-0 px-2 animate-pulse">
                  {todayCount} Today
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {interviews.length} round{interviews.length === 1 ? "" : "s"} scheduled
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground shrink-0 rounded-full"
          aria-label={isCollapsed ? "Expand upcoming banner" : "Collapse upcoming banner"}
        >
          {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
        </Button>
      </div>

      {/* ITEMS LIST */}
      {!isCollapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1 min-w-0">
          {interviews.map((item) => {
            const timeInfo = getRelativeInterviewTime(item.scheduledAt);
            const label = getRoundTypeLabel(item.roundType, item.roundLabel);
            const isToday = timeInfo.urgency === "today";
            const isPast = timeInfo.urgency === "past";

            return (
              <div
                key={item.id}
                onClick={() => onSelectApplication(item.applicationId)}
                className={cn(
                  "p-3 rounded-lg border transition-all duration-200 cursor-pointer bg-card hover:bg-muted/20 flex flex-col justify-between gap-2 shadow-2xs group min-w-0",
                  isToday && "border-rose-500/40 ring-1 ring-rose-500/20 bg-rose-500/5",
                  !isToday && !isPast && "border-border/60 hover:border-primary/40",
                  isPast && "border-amber-500/40 bg-amber-500/5",
                )}
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5 min-w-0">
                    <span
                      className={cn(
                        "text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shrink-0",
                        isToday ? "bg-rose-500/15 text-rose-700 dark:text-rose-400" : isPast ? "bg-amber-500/15 text-amber-800 dark:text-amber-300" : "bg-primary/10 text-primary",
                      )}
                    >
                      {isToday ? "🔴 Today" : isPast ? "💬 Debrief" : timeInfo.label}
                    </span>

                    {item.durationMins && (
                      <span className="text-xs text-muted-foreground font-medium shrink-0">
                        {item.durationMins}m
                      </span>
                    )}
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-foreground font-heading truncate group-hover:text-primary transition-colors pt-0.5">
                    {item.role_name}
                  </h4>

                  <p className="flex items-center gap-1 text-xs text-muted-foreground font-medium truncate">
                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{item.company_name}</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2 text-xs min-w-0">
                  <span className="font-semibold text-foreground/90 truncate">
                    {label}
                  </span>

                  <div className="flex items-center gap-1 shrink-0">
                    {item.meetingLink && isToday && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(item.meetingLink!, "_blank");
                        }}
                        className="h-7 px-2.5 text-xs font-bold gap-1 bg-primary text-primary-foreground shadow-xs"
                      >
                        <Video className="h-3.5 w-3.5" /> Join
                      </Button>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Clock, Users, Award } from "lucide-react";
import { getStatusKind } from "@/lib/utils";

interface ApplicationItem {
  id?: string;
  status: string;
  statusCategory?: string | null;
  [key: string]: unknown;
}

interface ApplicationsKpiSummaryProps {
  data: ApplicationItem[];
  statusFilter?: string | null;
  onStatusFilterChange?: (filter: string | null) => void;
}

export function ApplicationsKpiSummary({
  data,
  statusFilter,
  onStatusFilterChange,
}: ApplicationsKpiSummaryProps) {
  const stats = useMemo(() => {
    const total = data.length;
    if (total === 0) {
      return {
        total: 0,
        active: 0,
        interviewing: 0,
        offers: 0,
      };
    }

    let active = 0;
    let interviewing = 0;
    let offers = 0;

    data.forEach((item) => {
      const kind = getStatusKind(item.status, item.statusCategory);
      if (kind === "applied" || kind === "review") {
        active++;
      }
      if (kind === "interview") {
        interviewing++;
      }
      if (kind === "accepted") {
        offers++;
      }
    });

    return {
      total,
      active,
      interviewing,
      offers,
    };
  }, [data]);

  const cards = [
    {
      id: null,
      title: "Total Applications",
      value: stats.total,
      description: "All tracked job leads",
      icon: Briefcase,
    },
    {
      id: "applied",
      title: "Active Pipeline",
      value: stats.active,
      description: "Applied or under review",
      icon: Clock,
    },
    {
      id: "interview",
      title: "Interviewing",
      value: stats.interviewing,
      description: "Active interview loops",
      icon: Users,
    },
    {
      id: "accepted",
      title: "Offers & Hired",
      value: stats.offers,
      description: "Secured job offers",
      icon: Award,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
      {cards.map((card) => {
        const IconComponent = card.icon;
        const isActive =
          card.id === null
            ? !statusFilter || statusFilter === "all"
            : statusFilter === card.id;

        return (
          <Card
            key={card.title}
            tabIndex={0}
            role="button"
            aria-pressed={isActive}
            onClick={() => {
              if (onStatusFilterChange) {
                if (card.id === null) {
                  onStatusFilterChange(null);
                } else {
                  onStatusFilterChange(isActive ? null : card.id);
                }
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (onStatusFilterChange) {
                  if (card.id === null) {
                    onStatusFilterChange(null);
                  } else {
                    onStatusFilterChange(isActive ? null : card.id);
                  }
                }
              }
            }}
            className={`cursor-pointer bg-card shadow-2xs border rounded-xl transition-all overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              isActive
                ? "border-primary/50 ring-1 ring-primary/20 bg-primary/5"
                : "border-border/30 hover:border-primary/30 hover:shadow-xs"
            }`}
          >
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between pb-1 sm:pb-2 gap-1">
                <p
                  className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider truncate ${
                    isActive ? "text-primary font-bold" : "text-muted-foreground"
                  }`}
                >
                  {card.title}
                </p>
                <IconComponent
                  className={`h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 ${
                    isActive ? "text-primary" : "text-muted-foreground/70"
                  }`}
                />
              </div>
              <div className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                {card.value}
              </div>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 line-clamp-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

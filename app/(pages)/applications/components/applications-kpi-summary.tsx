'use client';

import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Briefcase, Clock, Users, Award } from 'lucide-react';
import { getStatusKind } from '@/lib/utils';

interface ApplicationItem {
  id?: string;
  status: string;
  statusCategory?: string | null;
  [key: string]: unknown;
}

interface ApplicationsKpiSummaryProps {
  data: ApplicationItem[];
}

export function ApplicationsKpiSummary({ data }: ApplicationsKpiSummaryProps) {
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
      if (kind === 'applied' || kind === 'review') {
        active++;
      }
      if (kind === 'interview') {
        interviewing++;
      }
      if (kind === 'accepted') {
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
      title: 'Total Applications',
      value: stats.total,
      description: 'All tracked job leads',
      icon: Briefcase,
    },
    {
      title: 'Active Pipeline',
      value: stats.active,
      description: 'Applied or under review',
      icon: Clock,
    },
    {
      title: 'Interviewing',
      value: stats.interviewing,
      description: 'Active interview loops',
      icon: Users,
    },
    {
      title: 'Offers & Hired',
      value: stats.offers,
      description: 'Secured job offers',
      icon: Award,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <Card
            key={card.title}
            className="bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow overflow-hidden"
          >
            <CardContent className="p-3 sm:p-5">
              <div className="flex items-center justify-between pb-1 sm:pb-2 gap-1">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate">
                  {card.title}
                </p>
                <IconComponent className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground/70 shrink-0" />
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

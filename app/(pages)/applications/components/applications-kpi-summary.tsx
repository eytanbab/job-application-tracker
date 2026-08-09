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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <Card
            key={card.title}
            className="bg-card shadow-2xs border border-border/30 rounded-xl hover:shadow-xs transition-shadow"
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-center justify-between pb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {card.title}
                </p>
                <IconComponent className="h-4 w-4 text-muted-foreground/70" />
              </div>
              <div className="text-3xl font-extrabold tracking-tight text-foreground">
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

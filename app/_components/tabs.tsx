'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export default function Tabs() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const month = searchParams.get('month');
  const year = searchParams.get('year');

  const tabs = [
    { url: '/analytics/overview', name: 'Overview' },
    { url: '/analytics/status-per-platform', name: 'Platform ROI' },
  ];

  return (
    <div className="inline-flex w-fit max-w-full overflow-x-auto flex-nowrap items-center gap-1 rounded-xl bg-muted/60 p-1 scrollbar-none">
      {tabs.map((item) => {
        const params = new URLSearchParams();
        if (month) params.set('month', month);
        if (year) params.set('year', year);
        const queryString = params.toString();
        const href = queryString ? `${item.url}?${queryString}` : item.url;
        const isActive = pathname === item.url;

        return (
          <Link
            key={item.url}
            href={href}
            className={cn(
              'inline-flex items-center shrink-0 whitespace-nowrap px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer capitalize',
              isActive
                ? 'bg-background text-foreground shadow-2xs font-semibold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {item.name}
          </Link>
        );
      })}
    </div>
  );
}

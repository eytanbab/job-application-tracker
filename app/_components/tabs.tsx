'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Tabs() {
  const pathname = usePathname();

  const tabs = [
    { url: '/analytics/overview', name: 'Overview' },
    { url: '/analytics/status-per-platform', name: 'Status per Platform' },
  ];

  return (
    <div className='flex w-full flex-row gap-2 rounded-lg border border-border/50 bg-background/60 p-1 backdrop-blur'>
      {tabs.map((item) => {
        return (
          <Link
            key={item.url}
            href={`${item.url}`}
            className={cn(
              'rounded-md px-4 py-2 capitalize text-muted-foreground transition-colors duration-300 hover:bg-accent/70 hover:text-foreground',
              pathname === `${item.url}`
                ? 'bg-primary/15 text-foreground'
                : ''
            )}
          >
            {item.name}
          </Link>
        );
      })}
    </div>
  );
}

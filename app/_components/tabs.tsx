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
    <div className='flex flex-row w-full gap-2'>
      {tabs.map((item) => {
        return (
          <Link
            key={item.url}
            href={`${item.url}`}
            className={cn(
              'rounded-sm px-4 py-2 hover:bg-indigo-500 hover:text-slate-100 capitalize transition-colors duration-300',
              pathname === `${item.url}` ? 'bg-indigo-600 text-slate-100' : ''
            )}
          >
            {item.name}
          </Link>
        );
      })}
    </div>
  );
}

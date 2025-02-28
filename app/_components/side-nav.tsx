'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

const SideNav = () => {
  const pathname = usePathname();

  const navItems = [
    {
      url: '/applications',
      name: 'applications',
    },
    {
      url: '/analytics/overview',
      name: 'analytics',
    },
  ];
  return (
    <div className='hidden border-r border-indigo-600/25 p-4 2xl:flex flex-col gap-2 text-xl w-96 sticky top-16 left-0 h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900 z-50'>
      {navItems.map((item) => {
        return (
          <Link
            key={item.url}
            href={`${item.url}`}
            className={cn(
              'rounded-sm w-full px-4 py-2 hover:bg-indigo-500 hover:text-slate-100 capitalize transition-colors duration-300',
              pathname.includes(item.name) ? 'bg-indigo-600 text-slate-100' : ''
            )}
          >
            {item.name}
          </Link>
        );
      })}
    </div>
  );
};

export default SideNav;

'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

const SideNav = () => {
  const pathname = usePathname();

  const navItems = ['applications', 'analytics'];
  return (
    <div className='border-r border-indigo-600/25 p-4 flex flex-col gap-2 text-xl w-96 sticky top-16 left-0 h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-900 z-50'>
      {navItems.map((item) => {
        return (
          <Link
            key={item}
            href={`/${item}`}
            className={cn(
              'rounded-sm w-full px-4 py-2 hover:bg-indigo-500 hover:text-slate-100 capitalize transition-colors duration-300',
              pathname === `/${item}` ? 'bg-indigo-600 text-slate-100' : ''
            )}
          >
            {item}
          </Link>
        );
      })}
    </div>
  );
};

export default SideNav;

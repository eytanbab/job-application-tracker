'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

const SideNav = () => {
  const pathname = usePathname();

  return (
    <div className='w-80 border-r-2 border-indigo-900 p-4 flex flex-col gap-2'>
      <Link
        href='/'
        className={cn(
          'rounded-sm px-4 py-2 hover:bg-indigo-800',
          pathname === '/' ? 'bg-indigo-900' : ''
        )}
      >
        Dashboard
      </Link>
      <Link
        href='/charts'
        className={cn(
          'rounded-sm px-4 py-2 hover:bg-indigo-800',
          pathname === '/charts' ? 'bg-indigo-900' : ''
        )}
      >
        Charts
      </Link>
    </div>
  );
};

export default SideNav;

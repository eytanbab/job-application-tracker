'use client';

import { cn, navItems } from '@/lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

const SideNav = () => {
  const pathname = usePathname();

  return (
    <div className='sticky left-0 top-14 z-40 hidden h-[calc(100vh-3.5rem)] w-72 flex-none flex-col gap-1 border-r border-border/50 bg-gradient-to-b from-background/85 to-accent/20 p-3 text-base backdrop-blur 2xl:flex'>
      {navItems.map((item) => {
        return (
          <Link
            key={item.url}
            href={`${item.url}`}
            className={cn(
              'w-full rounded-md px-3 py-2 capitalize text-muted-foreground transition-colors duration-200 hover:bg-accent/70 hover:text-foreground',
              pathname.includes(item.name)
                ? 'border border-border/60 bg-primary/15 text-foreground shadow-sm'
                : ''
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

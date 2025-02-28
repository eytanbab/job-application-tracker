'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

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

export function MobileSideNav() {
  const [open, setOpen] = useState(false);

  const pathname = usePathname();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className='2xl:hidden'>
        <Menu />
      </SheetTrigger>
      <SheetContent className='w-full flex flex-col gap-2 h-full items-center justify-center '>
        <SheetHeader>
          <SheetTitle></SheetTitle>
        </SheetHeader>
        {navItems.map((item) => {
          return (
            <Link
              key={item.url}
              href={`${item.url}`}
              onClick={() => setOpen(false)}
              className={cn(
                'rounded-sm w-full px-4 py-2 hover:bg-indigo-500 hover:text-slate-100 capitalize transition-colors duration-300 text-xl',
                pathname.includes(item.name)
                  ? 'bg-indigo-600 text-slate-100'
                  : ''
              )}
            >
              {item.name}
            </Link>
          );
        })}
      </SheetContent>
    </Sheet>
  );
}

'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn, navItems } from '@/lib/utils';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export function MobileSideNav() {
  const [open, setOpen] = useState(false);

  const pathname = usePathname();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className='2xl:hidden cursor-pointer'>
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
                'w-full rounded-md px-4 py-2 text-lg capitalize text-muted-foreground transition-colors duration-200 hover:bg-accent/70 hover:text-foreground',
                pathname.includes(item.name)
                  ? 'border border-border/60 bg-primary/15 text-foreground shadow-sm'
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

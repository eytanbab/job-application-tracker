import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import React from 'react';
import { ModeToggle } from './mode-toggle';
import { MobileSideNav } from './side-nav-mobile';

const Nav = () => {
  return (
    <div className='sticky top-0 z-50 flex h-14 w-full items-center justify-between border-b border-border/60 bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/80'>
      <Link href='/' className='text-2xl font-black tracking-tight text-foreground'>
        JAT
      </Link>
      <div className='flex gap-4 items-center'>
        <ModeToggle />
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
        <MobileSideNav />
      </div>
    </div>
  );
};

export default Nav;

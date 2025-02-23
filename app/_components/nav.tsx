import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import React from 'react';
import { ModeToggle } from './mode-toggle';

const Nav = () => {
  return (
    <div className='w-full px-6 flex items-center justify-between border-b border-indigo-600/25 h-16 sticky top-0 bg-slate-100 z-50'>
      <Link href='/' className='font-bold text-2xl'>
        JAT
      </Link>
      <div className='flex gap-4'>
        <ModeToggle />
        <SignedOut>
          <SignInButton />
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </div>
    </div>
  );
};

export default Nav;

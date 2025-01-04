import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import React from 'react';

const Nav = () => {
  return (
    <div className='w-full px-6 flex items-center justify-between border-b border-indigo-600/25 h-16'>
      <Link href='/' className='font-bold text-2xl'>
        JAT
      </Link>
      <div className=''>
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

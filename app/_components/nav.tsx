import Link from 'next/link';
import React from 'react';

const Nav = () => {
  return (
    <div className='w-full px-6 py-4 flex items-center justify-between border-b-2 border-indigo-900'>
      <Link href='/' className='font-bold'>
        Logo
      </Link>
      <div className='size-10 bg-gray-300 rounded-full'></div>
    </div>
  );
};

export default Nav;

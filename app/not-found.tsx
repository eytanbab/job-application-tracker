import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className='p-8 flex flex-col items-center justify-center w-full '>
      <h1 className='text-3xl font-black'>Not Found :(</h1>

      <Button variant='outline' className='self-center mt-4'>
        <Link href='/'>Return Home</Link>
      </Button>
    </div>
  );
}

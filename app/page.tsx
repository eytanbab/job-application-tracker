import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  return (
    <div className='p-6 flex flex-col items-center justify-center w-full gap-8'>
      <div className='flex flex-col gap-4'>
        <div>
          <h1 className='text-8xl font-black uppercase '>Your job hunt</h1>
          <h2 className='text-5xl font-black uppercase '>
            Organized and Effortless.
          </h2>
        </div>
        <p className='max-w-2xl text-indigo-400 text-xl font-light leading-7'>
          Say goodbye to scattered notes and missed deadlines. Job Application
          Tracker helps you manage your applications, interviews, and follow-ups
          in one place.
        </p>
      </div>
      <div className='flex items-center gap-4'>
        <Link href='/dashboard'>
          <Button className='text-xl font-normal'>Start Tracking Today</Button>
        </Link>

        <Button variant='outline' className='text-xl font-normal'>
          See How It Works
        </Button>
      </div>
    </div>
  );
}

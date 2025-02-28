import Link from 'next/link';

export default function Home() {
  return (
    <div className='p-6 flex flex-col items-center justify-center w-full gap-8'>
      <div className='flex flex-col gap-2'>
        <div className='bg-gradient-to-r to-[#E52E80] from-indigo-600 drop-shadow-xl bg-clip-text'>
          <h1 className='text-8xl font-black uppercase text-transparent'>
            Your job hunt
          </h1>
          <h2 className='text-5xl font-black uppercase text-transparent'>
            Organized and Effortless.
          </h2>
        </div>
        <p className='max-w-2xl text-indigo-500 text-xl font-light leading-6 dark:text-indigo-200'>
          Say goodbye to scattered notes and missed deadlines. Job Application
          Tracker helps you manage your applications, interviews, and follow-ups
          in one place.
        </p>
      </div>
      <div className='flex items-center gap-4'>
        <Link
          href='/applications'
          className='border-2 border-indigo-600 bg-indigo-600 text-slate-100 hover:bg-indigo-500 hover:border-indigo-500 py-2 px-4 rounded-md text-lg transition-colors duration-300'
        >
          Start Tracking Today
        </Link>
        <Link
          href='/placeholder'
          className='border-2 border-indigo-600 hover:bg-indigo-600 hover:text-slate-100 py-2 px-4 rounded-md text-lg transition-colors duration-300'
        >
          See How It Works
        </Link>
      </div>
    </div>
  );
}

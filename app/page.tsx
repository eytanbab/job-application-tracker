import Link from 'next/link';

export default function Home() {
  return (
    <div className='p-4 2xl:p-6 flex flex-col items-center justify-center w-full gap-8 my-auto'>
      <div className='flex flex-col gap-1  max-w-2xl 2xl:max-w-full'>
        <div>
          <h1 className='text-4xl md:text-6xl 2xl:text-8xl font-black uppercase'>
            Your job hunt
          </h1>
          <h2 className='text-xl md:text-3xl 2xl:text-5xl font-black uppercase text-muted-foreground'>
            Organized and Effortless.
          </h2>
        </div>
        <p className='max-w-2xl text-base font-light leading-6 text-muted-foreground 2xl:text-xl'>
          Say goodbye to scattered notes and missed deadlines. Job Application
          Tracker helps you manage your applications, interviews, and follow-ups
          in one place.
        </p>
      </div>
      <div className='flex flex-col 2xl:flex-row items-center gap-4 w-full max-w-2xl'>
        <Link
          href='/applications'
          className='w-full rounded-md bg-primary px-4 py-2 text-center text-normal text-primary-foreground transition-colors duration-300 hover:bg-primary/90 2xl:text-lg'
        >
          Start Tracking Today
        </Link>
        <Link
          href='https://github.com/eytanbab/job-application-tracker/blob/master/README.md'
          target='_blank'
          className='w-full rounded-md border border-input bg-background px-4 py-2 text-center text-normal transition-colors duration-300 hover:bg-accent hover:text-accent-foreground 2xl:text-lg'
        >
          See How It Works
        </Link>
      </div>
    </div>
  );
}

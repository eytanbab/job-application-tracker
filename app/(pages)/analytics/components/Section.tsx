type Props = {
  title: string;
  children: React.ReactNode;
};

export function Section({ title, children }: Props) {
  return (
    <>
      <div className='w-full'>
        <h1 className='text-2xl'>{title}</h1>
        <div className='w-full h-px bg-slate-300 dark:bg-indigo-900' />
      </div>
      <div className='w-full flex gap-4'>{children}</div>
    </>
  );
}

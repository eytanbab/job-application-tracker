type Props = {
  title: string;
  children: React.ReactNode;
};

export function Section({ title, children }: Props) {
  return (
    <>
      <div>
        <h1 className='text-2xl'>{title}</h1>
        <div className='w-full h-px bg-slate-300' />
      </div>
      <div className='w-full flex gap-4'>{children}</div>
    </>
  );
}
